# Code Review Report: fogbugz-mcp

**Review Date:** 2026-04-14

**Files Reviewed:** 14

**Total Findings:** 14

## Table of Contents

- [Summary](#summary)
- [Statistics](#statistics)
- [Critical Priority](#🔴-critical-priority)
  - [1 - API key exposed in GET request query params](#1---api-key-exposed-in-get-request-query-params)
- [High Priority](#🟡-high-priority)
  - [2 - No input validation on args before use](#2---no-input-validation-on-args-before-use)
  - [3 - `api_request` tool allows arbitrary API command execution](#3---api_request-tool-allows-arbitrary-api-command-execution)
  - [4 - Hardcoded version string in server metadata](#4---hardcoded-version-string-in-server-metadata)
  - [5 - Custom `Tool` interface duplicates SDK type](#5---custom-tool-interface-duplicates-sdk-type)
- [Medium Priority](#🟢-medium-priority)
  - [6 - `optional` is not a valid JSON Schema keyword](#6---optional-is-not-a-valid-json-schema-keyword)
  - [7 - `resolveCase`/`reopenCase`/`closeCase` bypass the typed client interface](#7---resolvecaseopencaseclose-bypass-the-typed-client-interface)
  - [8 - `listCategories`/`listMilestones`/`listStatuses` bypass typed client](#8---listcategorieslistmilestonesliststatuses-bypass-typed-client)
  - [9 - Brittle XML response normalization with multiple fallback paths](#9---brittle-xml-response-normalization-with-multiple-fallback-paths)
  - [10 - `FileAttachment` type defined but never used](#10---fileattachment-type-defined-but-never-used)
  - [11 - MCP SDK type declarations are hand-rolled stubs](#11---mcp-sdk-type-declarations-are-hand-rolled-stubs)
  - [12 - `primaryContact` as string name silently dropped](#12---primarycontact-as-string-name-silently-dropped)
- [Nice to have](#💡-nice-to-have)
  - [13 - JSON probe during auto-detection leaks real API key](#13---json-probe-during-auto-detection-leaks-real-api-key)
  - [14 - No integration/E2E tests; only unit tests with mocked API](#14---no-integratione2e-tests-only-unit-tests-with-mocked-api)

## Summary

The `fogbugz-mcp` server is a well-structured, TypeScript-based MCP integration for FogBugz. It follows a clean layered architecture: typed API clients (XML and JSON), command handlers, and tool definitions. The dual-client auto-detection strategy is solid and has good test coverage. The code is readable, consistently formatted, and the tool definitions respect the project's naming conventions.

The main concern is a **security issue** in `xml-client.ts`: the API token is included in GET request query parameters, which can leak credentials into server access logs, browser history, and HTTP proxies. Several **high-priority** issues exist around missing runtime input validation (args are typed as `any` and used without checks), the `api_request` escape-hatch tool that passes arbitrary commands directly to the API, and a hardcoded version string that will drift from `package.json`/`manifest.json`. A number of **medium-priority** code quality issues include invalid JSON Schema properties, bypassing the typed interface for several commands, and an unused exported type. With these fixes—especially the GET token exposure and input validation—the server would be in solid shape for production use.

---

## Statistics

### By Priority

- 🔴 Critical: 1
- 🟡 High: 4
- 🟢 Medium: 6
- 💡 Nice to have: 2

### By Category

- Security: 3
- Performance: 0
- Bugs: 3
- Code Quality: 5
- Best Practices: 3

---

## 🔴 CRITICAL PRIORITY

### 1 - API key exposed in GET request query params

**Category:** *Security*

**File:** `src/api/xml-client.ts`

**Location:** `line:67-78`

**Problem:**
Read-only (non-write) commands are dispatched as HTTP GET requests with all parameters — including `token: this.apiKey` — appended as URL query string parameters.

```typescript
// Current problematic code
const isWrite = FogBugzXmlClient.WRITE_COMMANDS.has(cmd);
const response = isWrite
  ? await axios.post(this.apiEndpoint, new URLSearchParams(flatParams), { ... })
  : await axios.get(this.apiEndpoint, {
      params: flatParams,   // ← token sent as ?token=<apiKey> in the URL
      ...
    });
```

**Why this is bad:**
The full URL (including `?token=<apiKey>`) is written to:

- Web server access logs on the FogBugz host
- HTTP proxy logs on the network path
- Browser/shell history if any tooling inspects the requests

An attacker with access to any of these logs can obtain a valid API token and take over the FogBugz account.

**How to fix:**
Send all requests (both read and write) as POST with `application/x-www-form-urlencoded`, which keeps the token in the request body, not the URL.

```typescript
// Suggested fix — always POST, token stays in body
const response = await axios.post(
  this.apiEndpoint,
  new URLSearchParams(flatParams),
  {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'text',
    timeout: 30000,
  }
);
```

---

## 🟡 HIGH PRIORITY

### 2 - No input validation on args before use

**Category:** *Bugs*

**File:** `src/commands/index.ts`

**Location:** `line:11, 58, 105, 126, 186, 253, 289, 316, 340, 411, 432, 461, 489, 513, 536, 556`

**Problem:**
Every command handler receives `args: any` and immediately destructures required fields without any runtime validation. If an MCP client omits a required parameter (e.g., `caseId` for `updateCase`), the handler silently passes `undefined` to the API client, which either causes an unhandled error deep inside axios or produces a corrupt API call.

```typescript
// Current problematic code — no guard on caseId
export async function updateCase(api: IFogBugzClient, args: any): Promise<string> {
  const { caseId, ... } = args;
  const params: EditCaseParams = { ixBug: caseId }; // caseId could be undefined
  ...
}
```

**Why this is bad:**
Missing parameters are only caught at the FogBugz API level (or not at all), resulting in cryptic error messages propagated to the LLM. For write operations (`update_case`, `assign_case`, `create_case`), an undefined `caseId` could match unintended cases or silently no-op, making debugging extremely difficult.

**How to fix:**
Add a guard at the top of each handler for required parameters. Return a descriptive error JSON immediately rather than letting the call propagate.

```typescript
// Suggested fix
export async function updateCase(api: IFogBugzClient, args: any): Promise<string> {
  const { caseId, ... } = args;
  if (!caseId) {
    return JSON.stringify({ error: 'caseId is required' });
  }
  ...
}
```

---

### 3 - `api_request` tool allows arbitrary API command execution

**Category:** *Security*

**File:** `src/commands/index.ts`

**Location:** `line:536-551`

**Problem:**
The `api_request` tool passes the `cmd` and `params` arguments from the LLM directly to `api.rawRequest()` with no filtering or allowlist. Any FogBugz API command — including destructive ones like `deleteProject`, `deletePerson`, or `editPerson` — can be triggered by the LLM or a malicious tool call.

```typescript
export async function apiRequest(api: IFogBugzClient, args: any): Promise<string> {
  const { cmd, params } = args;
  // No allowlist, no blocklist — completely open
  const result = await api.rawRequest(cmd, params || {});
  ...
}
```

**Why this is bad:**
This is a prompt-injection vector. A crafted user message or a rogue MCP client can use `api_request` to perform any operation on the FogBugz instance that the API key permits, including deleting projects or modifying user accounts.

**How to fix:**
Define a blocklist (or preferably an allowlist) of safe commands. Return an error for dangerous or unknown commands. If the escape-hatch must remain fully open, document the risk explicitly and consider adding a separate `FOGBUGZ_ALLOW_RAW_API` environment variable guard.

```typescript
const BLOCKED_COMMANDS = new Set(['deletePerson', 'deleteProject', 'deleteArea']);

export async function apiRequest(api: IFogBugzClient, args: any): Promise<string> {
  const { cmd, params } = args;
  if (BLOCKED_COMMANDS.has(cmd)) {
    return JSON.stringify({ error: `Command '${cmd}' is not permitted via api_request.` });
  }
  ...
}
```

---

### 4 - Hardcoded version string in server metadata

**Category:** *Bugs*

**File:** `src/index.ts`

**Location:** `line:24`

**Problem:**
The MCP server is initialized with a hardcoded version string `'0.0.14'` that is independent of the versions declared in `package.json` and `manifest.json` (both currently `0.9.2`). These three version fields are already out of sync.

```typescript
const server = new Server(
  { name: 'fogbugz-mcp', version: '0.0.14' },  // ← stale, out of sync
  { capabilities: { tools: {} } }
);
```

**Why this is bad:**
MCP clients and tooling use the reported server version for diagnostics. With mismatched versions, any version-based features or bug reports will be misleading. The `CLAUDE.md` project rules explicitly require both `package.json` and `manifest.json` to be kept in sync before tagging, yet `src/index.ts` introduces a third undocumented version source.

**How to fix:**
Import the version from `package.json` at runtime:

```typescript
import { version } from '../../package.json';

const server = new Server(
  { name: 'fogbugz-mcp', version },
  { capabilities: { tools: {} } }
);
```

Also update `tsconfig.json` to ensure `resolveJsonModule: true` is set (it already is).

---

### 5 - Custom `Tool` interface duplicates SDK type

**Category:** *Best Practices*

**File:** `src/commands/tools.ts`

**Location:** `line:1-19`

**Problem:**
A local `Tool` interface is declared inside `tools.ts` because of a reported import difficulty. The comment says `"we're having trouble importing it"`. This means type-safety is provided by a manually maintained stub that may diverge from the actual SDK `Tool` type over time.

```typescript
// Define the Tool interface since we're having trouble importing it
interface Tool {
  name: string;
  title?: string;
  description: string;
  inputSchema: { type: string; properties: Record<string, any>; required: string[]; };
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; };
}
```

**Why this is bad:**
If the MCP SDK adds required fields or changes the shape of `Tool`, the project will compile successfully but produce invalid tool definitions at runtime. The stub already omits fields that the SDK may require, and the lack of a real import means no IDE or compiler check against the actual SDK contract.

**How to fix:**
Investigate the import failure (likely a `moduleResolution: NodeNext` path issue). Import the real type:

```typescript
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
```

If the SDK does not export `Tool` directly, extract it via `z.infer` from `ToolSchema` or cast with `as const satisfies Tool[]` once the correct shape is confirmed.

---

## 🟢 MEDIUM PRIORITY

### 6 - `optional` is not a valid JSON Schema keyword

**Category:** *Bugs*

**File:** `src/commands/tools.ts`

**Location:** `line:37, 43, 48, 53, 58, 85, 92, 97, 102, 107, 149, 154, 159, 228, 256, ...` (multiple properties across all tools)

**Problem:**
All optional parameters are annotated with `optional: true` directly on the property object. This is not part of the JSON Schema specification. The correct mechanism is to simply omit the field from the `required` array.

```typescript
// Current — invalid JSON Schema property
description: {
  type: 'string',
  description: '...',
  optional: true,   // ← not a JSON Schema keyword, ignored by validators
},
```

**Why this is bad:**
MCP clients that perform schema validation will either strip the unknown `optional` keyword or reject the schema entirely. At best it's silently ignored; at worst it causes compatibility issues with strict JSON Schema validators.

**How to fix:**
Remove all `optional: true` annotations. Optional fields are those not listed in `required`. No other change is needed.

```typescript
// Correct — simply not in required[]
description: {
  type: 'string',
  description: '...',
  // no optional key needed
},
```

---

### 7 - `resolveCase`/`reopenCase`/`closeCase` bypass the typed client interface

**Category:** *Best Practices*

**File:** `src/commands/index.ts`

**Location:** `line:289-360`

**Problem:**
`resolveCase`, `reopenCase`, and `closeCase` call `api.rawRequest()` directly instead of going through dedicated typed methods on `IFogBugzClient`. This means the XML and JSON clients' `WRITE_COMMANDS` set (which controls POST vs GET routing) is bypassed for `resolve`, `reopen`, and `close` — but only when called through these three handlers. The `rawRequest` path does route correctly through the private `request()` method, so the behaviour is currently correct, but the consistency is fragile.

**Why this is bad:**
The `IFogBugzClient` interface defines the contract between commands and clients. Using `rawRequest` for state-changing operations leaks implementation details into the command layer and makes it harder to swap or mock clients. If `resolve`/`reopen`/`close` are ever added to `WRITE_COMMANDS` with different handling, the `rawRequest` bypass will miss that logic.

**How to fix:**
Add `resolveCase`, `reopenCase`, and `closeCase` methods to `IFogBugzClient` and implement them in both `FogBugzXmlClient` and `FogBugzJsonClient`, following the same pattern as `createCase`/`updateCase`/`assignCase`.

---

### 8 - `listCategories`/`listMilestones`/`listStatuses` bypass typed client

**Category:** *Best Practices*

**File:** `src/commands/index.ts`

**Location:** `line:386, 432, 461`

**Problem:**
Same pattern as finding #7. `listCategories`, `listMilestones`, and `listStatuses` call `api.rawRequest()` and manually parse the response shape, while `listProjects`, `listPeople`, and `listMilestones` (via `api.listMilestones()`) already have typed methods. The two patterns coexist inconsistently.

**Why this is bad:**
Response parsing logic (e.g., `result.fixfors?.fixfor || result.fixfor || result.fixfors || []`) is duplicated in the command layer, diverging from the equivalent logic already in `xml-client.ts:listMilestones`. Any change to the API response format must be fixed in multiple places.

**How to fix:**
Move `listCategories` and `listStatuses` into the `IFogBugzClient` interface and implement them in both clients, as is done for `listMilestones` already.

---

### 9 - Brittle XML response normalization with multiple fallback paths

**Category:** *Code Quality*

**File:** `src/api/xml-client.ts`

**Location:** `line:148-203` (list methods) and `line:208-227` (createCase/updateCase/assignCase)

**Problem:**
Many response-parsing paths chain multiple fallbacks: `root.projects?.project || root.project || []`. The same pattern appears in `src/commands/index.ts` for `listCategories`, `listMilestones`, `listStatuses`, `resolveCase`, `reopenCase`, and `closeCase`. In total there are 6+ variations of this fallback chain pattern, some with 4-deep optional chains.

```typescript
// Example of defensive over-engineering with unclear semantics
const rawCase = result.case?.[0] || result.case || result.cases?.[0] || result;
```

**Why this is bad:**
When the last fallback is `|| result` (the entire response object), an API error response would be silently treated as a valid case object — masking the real error and producing `NaN`/empty values. The pattern is also a maintenance burden: there are currently minor inconsistencies between the XML and JSON client fallbacks for the same commands.

**How to fix:**
Centralise response extraction into a typed helper. Throw early if the expected key is absent instead of silently falling back to the root object.

---

### 10 - `FileAttachment` type defined but never used

**Category:** *Code Quality*

**File:** `src/api/types.ts`

**Location:** `line:118-121`

**Problem:**
The `FileAttachment` interface is exported but has no references anywhere in the codebase.

```typescript
export interface FileAttachment {
  path: string;
  fieldName?: string;
}
```

**Why this is bad:**
Dead exports inflate the public API surface of the module, increase cognitive overhead for readers, and may indicate an incomplete or abandoned feature (file attachment support).

**How to fix:**
Remove the `FileAttachment` interface. If file attachment support is planned, track it as a future feature rather than leaving a stub type.

---

### 11 - MCP SDK type declarations are hand-rolled stubs

**Category:** *Best Practices*

**File:** `src/typings/mcp.d.ts`

**Location:** `line:1-18`

**Problem:**
Three MCP SDK modules (`@modelcontextprotocol/sdk/server/index.js`, `.../stdio.js`, `.../types.js`) are re-declared as hand-rolled ambient modules with minimal stub types (`any` parameters everywhere). The SDK is already a dependency in `package.json` and provides its own `.d.ts` files.

**Why this is bad:**
These stubs override the SDK's real type definitions, eliminating TypeScript's ability to catch API misuse (e.g., wrong handler signatures, incorrect response shapes). Any SDK upgrade that changes these interfaces will silently compile without error.

**How to fix:**
Delete `src/typings/mcp.d.ts`. The `skipLibCheck: true` in `tsconfig.json` already suppresses issues in `node_modules`. If specific import paths fail, investigate the `moduleResolution: NodeNext` configuration — the SDK likely needs `.js` extension imports, which is already what the code uses.

---

### 12 - `primaryContact` as string name silently dropped

**Category:** *Bugs*

**File:** `src/commands/index.ts`

**Location:** `line:569`

**Problem:**
`createProject` accepts `primaryContact` as either a numeric ID or a name string. When a non-numeric string like `"Alice"` is passed, the handler silently discards it: `isNaN(Number("Alice"))` is `true`, so `ixPersonPrimaryContact` is never set and the project is created without a primary contact — with no warning to the caller.

```typescript
if (primaryContact !== undefined && !isNaN(Number(primaryContact))) {
  params.ixPersonPrimaryContact = Number(primaryContact);
}
// If primaryContact is "Alice", nothing happens here — silently ignored
```

**Why this is bad:**
The LLM (and the user) would reasonably expect passing `"Alice"` as `primaryContact` to result in Alice being set as the primary contact. The silent discard violates the principle of least surprise. The FogBugz API does support `ixPersonPrimaryContact` by ID; the correct resolution is to look up the person by name or return an error.

**How to fix:**
Return a descriptive error if a non-numeric string is provided as `primaryContact`, suggesting the caller use `list_people` to find the numeric ID first.

```typescript
if (primaryContact !== undefined) {
  const numId = Number(primaryContact);
  if (!isNaN(numId)) {
    params.ixPersonPrimaryContact = numId;
  } else {
    return JSON.stringify({
      error: `primaryContact "${primaryContact}" is not a numeric ID. Use list_people to find the person's numeric ID.`
    });
  }
}
```

---

## 💡 NICE TO HAVE

### 13 - JSON probe during auto-detection leaks real API key

**Category:** *Security*

**File:** `src/api/index.ts`

**Location:** `line:35-42`

**Problem:**
The JSON API probe during client auto-detection sends the real `config.apiKey` in the request body. This means a probe request is made to determine the API version — using the actual credentials — before the client type is even known.

```typescript
const probe = await axios.post(
  `${baseUrl}/f/api/0/jsonapi`,
  { cmd: 'listProjects', token: config.apiKey },  // real key used here
  { ... }
);
```

**Why this is bad:**
If the URL is wrong or the probe is sent to an unexpected endpoint, credentials are exposed. Using `listProjects` as the probe command also means a real read operation is performed as a side-effect of startup. A lighter probe would be preferable.

**How to fix:**
Use a no-auth or minimal probe. Check if `/f/api/0/jsonapi` is reachable by sending a request without a token (or with an empty token) and checking if the response shape matches the JSON API format (presence of `errors` array) rather than relying on a successful authenticated call.

---

### 14 - No integration/E2E tests; only unit tests with mocked API

**Category:** *Best Practices*

**File:** `tests/`

**Location:** All test files

**Problem:**
All tests mock the API clients or axios entirely. There are no integration tests that exercise the full stack against a real (or locally stubbed) FogBugz instance. The XML response parsing and JSON normalization code paths are only tested via unit tests with hand-crafted mock data, which may not reflect real API responses.

**Why this is bad:**
The FogBugz XML API has many quirks (attribute vs. element IDs, nullable fields, single-vs-array ambiguity). Unit tests with mocked data cannot catch regressions caused by real API responses that differ from the expected fixture format. The `auto-detection.test.ts` test correctly mocks axios, but doesn't exercise any real parsing paths.

**How to fix:**
Consider adding an integration test suite (opt-in, disabled in CI by default) that runs against a FogBugz sandbox instance using environment variables. Alternatively, add fixture-based XML parsing tests using real captured API responses to validate the `normalizeCase` and list-parsing logic.

---
