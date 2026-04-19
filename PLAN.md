# Plan: fogbugz-mcp → Official Anthropic Extension

## Context

The project is a mature FogBugz MCP server that supports both the XML API and the JSON API with automatic version-based detection at startup. The goal is to prepare it for submission as an official Anthropic extension with high approval probability. This means: attribution cleanup, repository hygiene, quality improvements for review criteria, and proper submission packaging.

---

## Phase 1: JSON API Implementation + Auto-Detection

### 1.1 Refactor API layer into dual-client architecture

**Files to create/modify:**

- `src/api/base-client.ts` — abstract interface `IFogBugzClient` listing all operations both clients must implement
- `src/api/xml-client.ts` — extract current `FogBugzApi` class from `src/api/index.ts`
- `src/api/json-client.ts` — new JSON API client (`POST /f/api/0/jsonapi`)
- `src/api/index.ts` — factory with auto-detection logic; exports `createFogBugzClient(url, token)`

**Auto-detection logic in `createFogBugzClient()`:**

1. `GET {url}/api.xml` → parse XML version info (always works on both old and new servers)
2. Attempt `POST {url}/f/api/0/jsonapi` with `{ cmd: "listProjects", token }` — if JSON response with no errors → use JSON client
3. Fall back to XML client if JSON API not available or returns non-JSON

**JSON API client differences vs XML:**

- All requests: `POST /f/api/0/jsonapi` with `Content-Type: application/json`
- Request body: `{ cmd: "...", token: "...", ...params }` with native booleans and arrays
- Response: `{ data: {...}, errors: [], warnings: [], meta: {} }`
- Error check: `response.errors.length > 0`

### 1.2 Implement full FogBugzJsonClient

Implement all same operations as XML client using JSON API format:

- `getCurrentUser()`, `listProjects()`, `listAreas()`, `listMilestones()`, `listPriorities()`, `listPeople()`, `listCategories()`, `listStatuses()`
- `createCase()`, `updateCase()`, `assignCase()`, `resolveCase()`, `reopenCase()`, `closeCase()`
- `searchCases()`, `getCase()`
- `createProject()`
- `rawRequest()` — pass-through

Note: Response normalization (`normalizeCase()`) should work for both clients via shared `src/api/types.ts` types.

**Testing constraint:** JSON API client is implemented per the official FogBugz API spec but **not tested against a real newer FogBugz server** (only XML API on 8.x available). All JSON client tests use mocked axios responses. README must transparently state this — see Phase 4.4.

---

## Phase 2: Repository Cleanup

**Remove dev artifacts** (not needed in published extension):

- `DEVELOPMENT-PLAN.md` — internal implementation notes
- `scripts/api-explorer.ts` and `scripts/api-explorer.js` — dev tooling
- `mcp.json` — legacy config superseded by manifest.json
- `fogbugz-mcp.code-workspace` — IDE workspace file

**Update `package.json`:**

- `"author": { "name": "ToDevelopers s.r.o.", "url": "https://github.com/ToDevelopers s.r.o." }` (organization as author)
- `"license": "MIT"` (change from ISC — MIT is standard for Anthropic extensions)
- Add `"contributors": [{ "name": "akari2600", "url": "https://github.com/akari2600/fogbugz-mcp" }]`
- Improve keywords: `["mcp", "fogbugz", "issue-tracking", "project-management", "anthropic", "claude"]`
- Remove unused `@anthropic-ai/sdk` dependency (only MCP SDK needed)

**Add `LICENSE` file** (MIT, year 2024–2025, Tomas Gazovic)

---

## Phase 3: Attribution (Co-author)

**`manifest.json`:**

```json
"author": { "name": "ToDevelopers s.r.o." }
```

Manifest schema only supports one `author`. Put co-author credit in README and package.json contributors.

**`README.md`** — add "Based on / inspired by" section crediting [akari2600/fogbugz-mcp](https://github.com/akari2600/fogbugz-mcp)

---

## Phase 4: Quality Improvements for Anthropic Review

### 4.1 Tool quality (critical for approval)

**`src/commands/tools.ts`** — improve tool descriptions:

- Every tool: add 1–2 concrete examples in the description (e.g., query syntax examples for `fogbugz_search_cases`)
- `fogbugz_api_request`: add warning that it's for advanced/experimental use
- Ensure `readOnlyHint: true` on all read-only tools (already done in v0.0.6)
- Add `title` fields to all tool definitions (used in Claude's tool picker UI)

### 4.2 Fix attachment handling

`src/commands/index.ts` + `src/api/xml-client.ts`:

- Either implement file attachments properly (multipart/form-data upload) OR remove `attachmentPath` param from tool schemas entirely
- Recommended: remove for now (unimplemented code is a red flag for reviewers)

### 4.3 Add tests for JSON API client

`tests/json-client.test.ts` — all tests use **mocked axios** (no real JSON API server available):

- Auto-detection falls back to XML when JSON probe fails or returns non-JSON
- Auto-detection selects JSON client when probe succeeds
- JSON client correctly serializes request body (`cmd`, `token`, native booleans, arrays)
- JSON client correctly parses `data` field from response
- Error handling: throws when `errors` array is non-empty

### 4.4 README overhaul

Update `README.md`:

- **Demo GIF/screenshots at top** — read-only operations on real (anonymized) tracker: e.g. *"Summarize all open high-priority cases assigned to me"* showing `search_cases` + `get_case` + Claude reasoning. No create/edit in demo — avoids touching production data.
- Installation section: one-click MCPB install + manual npm config
- Tool catalog table with description of each tool
- Config parameters (URL + API key) with where to find them
- FogBugz version compatibility table:
  - XML API: tested on FogBugz 8.x
  - JSON API: implemented per official spec, **not yet verified on a live newer instance** — contributions welcome
- Co-author/attribution section
- License section (MIT)

---

## Phase 5: Manifest Quality

**`manifest.json`** improvements:

- `"description"` — make more specific: mention both XML and JSON API support
- Add `"homepage"` field with GitHub repo URL
- Add `"keywords"` array: `["fogbugz", "issue-tracking", "project-management"]`
- Verify schema compliance with `npx @anthropic-ai/mcpb validate`

---

## Phase 6: Version Bump & Submission

**Bump version to `1.0.0`** in both `package.json` and `manifest.json` (per CLAUDE.md project rules).

**Build & validate:**

```bash
npm run build
npx @anthropic-ai/mcpb validate
npx @anthropic-ai/mcpb pack
```

**Create git tag `v1.0.0`** after both files are updated.

**Submission checklist for Anthropic extension review:**

- [ ] `manifest.json` validates against mcpb schema v0.4
- [ ] `sensitive: true` on API key field (keychain storage)
- [ ] All tools have descriptions + readOnlyHint where applicable
- [ ] No hardcoded credentials or URLs in source
- [ ] MIT LICENSE file present
- [ ] README with clear setup instructions
- [ ] Tests passing in CI
- [ ] `.mcpb` artifact produced by GitHub Actions workflow

---

## Critical Files

| File                                                                                | Change                                           |
| ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| `src/api/base-client.ts`                                                            | New — abstract interface                         |
| `src/api/xml-client.ts`                                                             | New — extracted from current `src/api/index.ts`  |
| `src/api/json-client.ts`                                                            | New — JSON API implementation                    |
| `src/api/index.ts`                                                                  | Rewrite — factory with auto-detection            |
| `src/api/types.ts`                                                                  | Minor — ensure types work for both clients       |
| `src/commands/tools.ts`                                                             | Improve descriptions, remove attachment params   |
| `src/commands/index.ts`                                                             | Remove attachment handling code                  |
| `manifest.json`                                                                     | Add homepage, keywords; bump to 1.0.0            |
| `package.json`                                                                      | author, license MIT, contributors, bump to 1.0.0 |
| `README.md`                                                                         | Major update                                     |
| `LICENSE`                                                                           | New — MIT                                        |
| `tests/json-client.test.ts`                                                         | New — JSON client tests                          |
| Remove: `DEVELOPMENT-PLAN.md`, `scripts/`, `mcp.json`, `fogbugz-mcp.code-workspace` | Cleanup                                          |

---

## Tasks

Road map split by phase. Each task is independently actionable.

### Phase 1 — JSON API + Auto-Detection

- [x] **1.1** Create `src/api/base-client.ts` — abstract interface `IFogBugzClient`
- [x] **1.2** Extract `FogBugzApi` into `src/api/xml-client.ts`
- [x] **1.3** Implement `src/api/json-client.ts` — all operations via `POST /f/api/0/jsonapi`
- [x] **1.4** Rewrite `src/api/index.ts` — factory `createFogBugzClient()` with version-based auto-detection (GET /api.xml → version >= 9 → JSON probe)
- [x] **1.5** Verify `src/api/types.ts` types work for both clients without modification

### Phase 2 — Repository Cleanup

- [x] **2.1** Remove `DEVELOPMENT-PLAN.md`
- [x] **2.2** Remove `scripts/api-explorer.ts` and `scripts/api-explorer.js`
- [x] **2.3** Remove `mcp.json` and `fogbugz-mcp.code-workspace`
- [x] **2.4** Update `package.json` — author object format, contributors, remove unused `@anthropic-ai/sdk`
- [x] **2.5** Remove `fogbugz_` prefix from all tool names in `src/commands/tools.ts`, `src/index.ts`, `manifest.json`, `tests/tools.test.ts`, and `README.md` (e.g. `fogbugz_create_case` → `create_case`)

### Phase 3 — Attribution

- [x] **3.1** Update `manifest.json` — set `"author": { "name": "ToDevelopers s.r.o." }`
- [x] **3.2** Add "Based on / inspired by" section to `README.md` crediting [akari2600/fogbugz-mcp](https://github.com/akari2600/fogbugz-mcp)

### Phase 4 — Quality

- [x] **4.1** Improve tool descriptions in `src/commands/tools.ts` — examples, `title` fields, `readOnlyHint`
- [x] **4.2** Remove unimplemented `attachmentPath` parameter from tool schemas (`create_case`, `update_case` in `src/commands/tools.ts`)
- [x] **4.6** Add `list_projects` tool — `cmd=listProjects`, returns all undeleted projects with IDs and names
- [x] **4.7** Add `list_milestones` tool — `cmd=listFixFors`, optional `ixProject` filter, returns milestone names and dates
- [x] **4.8** Add `list_statuses` tool — `cmd=listStatuses` (plural, see Known Issues), optional `ixCategory` filter, returns status names and resolved flags
- [x] **4.3** Write JSON client tests — `tests/json-api.test.ts` (client operations) and `tests/auto-detection.test.ts` (factory fallback logic)
- [x] **4.4** Overhaul `README.md` — dual-API description, one-click MCPB install, tool catalog, config params, compatibility table
- [x] **4.5** Add `LICENSE` file (MIT, 2024–2025, Tomas Gazovic)

### Phase 5 — Manifest Quality

- [x] **5.1** Update `manifest.json` — `description`, `homepage`, `keywords`
- [x] **5.2** Run `npx @anthropic-ai/mcpb validate` and fix any reported issues

### Phase 6 — Release

- [x] **7.0** Migrate repository: transfer `tommy-gun/fogbugz-xmlapi-mcp` to the `ToDevelopers s.r.o.` organization and rename it to `fogbugz-mcp`. After migration update: `repository.url` and `support` in `manifest.json`, install URL in `README.md`, and git remote origin.
- [ ] **7.1** Bump version to `1.0.0` in both `package.json` and `manifest.json`
- [ ] **7.2** `npm run build` — no TypeScript errors
- [ ] **7.3** `npm test` — all tests pass
- [ ] **7.4** `npx @anthropic-ai/mcpb pack` — produces `fogbugz-mcp.mcpb`
- [x] **7.5** Set up GitHub Actions workflow to produce a release artifact on `v1.0.0` tag
- [x] **7.6** Review mcp server on security issues, code smells and clean design
- [x] **7.7** Review mcp server for trace logging useful information during production running 
- [ ] **7.8** Create git tag `v1.0.0` and push

### Phase 8 — Unit Tests (XML + JSON API per documentation)

- [ ] **8.1** Write fixture-based XML parsing tests using real captured API response shapes — validate `normalizeCase` and list-parsing logic in `src/api/xml-client.ts`
- [ ] **8.2** Write JSON client tests covering all operations per the official FogBugz JSON API spec — verify request serialization (`cmd`, `token`, booleans, arrays) and response parsing (`data` field)
- [ ] **8.3** Write auto-detection tests covering both probe-succeeds (→ JSON client) and probe-fails (→ XML fallback) paths in `src/api/index.ts`

## Verification

1. `npm run build` — TypeScript compiles with no errors
2. `npm test` — all tests pass
3. `npx @anthropic-ai/mcpb validate` — manifest valid
4. `npx @anthropic-ai/mcpb pack` — produces `fogbugz-mcp.mcpb`
5. Manual test: install `.mcpb` in Claude Desktop, connect to FogBugz 8.x — verify XML auto-detection and read-only tools work (search, get, list). JSON API auto-detection verified only via mocked tests.
6. GitHub Actions workflow produces release artifact on `v1.0.0` tag

---

## Known Issues

### `listStatuses` vs `listStatus` command name

The official FogBugz web documentation lists the command as `listStatus` (singular). However, `listStatus` does not work on FogBugz 8.x — only `listStatuses` (plural) returns results. Every other list command uses the plural form (`listProjects`, `listAreas`, `listCategories`, `listPriorities`, `listPeople`, `listFixFors`), so `listStatus` appears to be a documentation typo.

**Current implementation:** uses `listStatuses` (plural) — matches actual API behavior on FogBugz 8.x.

**Task 4.8 note in Tasks section** references `cmd=listStatus (singular)` — this is incorrect and reflects the documentation error, not the real behavior.

**Action needed:** Verify whether a specific FogBugz version introduced `listStatus` as an alias or whether the web documentation has always been wrong. If `listStatus` works on newer instances, a version-conditional fallback may be needed.

---

## Features plan after 1.0.0 release

Features planned after the initial Anthropic extension submission.

### Time Management Tools

Expose FogBugz time tracking via dedicated MCP tools so users can start/stop the stopwatch, log manual intervals, and query time spent — all from Claude.

| Tool             | FogBugz cmd     | Description                                                               |
| ---------------- | --------------- | ------------------------------------------------------------------------- |
| `start_work`     | `startWork`     | Start the stopwatch on a case (stops any currently active interval first) |
| `stop_work`      | `stopWork`      | Stop the currently active interval without starting a new one             |
| `log_interval`   | `newInterval`   | Import a manually tracked time interval (dtStart + dtEnd, ISO 8601 UTC)   |
| `list_intervals` | `listIntervals` | List time intervals filtered by case, person, and/or date range           |

Implementation notes:

- Add `TimeInterval` type to `src/api/types.ts`
- Add four methods to `IFogBugzClient`, `FogBugzXmlClient` (parse `<interval>` XML), and `FogBugzJsonClient` (`data.interval` / `data.intervals`)
- Write `tests/time-tracking.test.ts` with mocked client

### File Attachments

Allow attaching screenshots and files when creating or updating cases. The `attachmentPath` parameter already exists in the tool schemas but is currently unimplemented.

- XML client: multipart/form-data upload to `/api.asp` before the case command, then reference the token
- JSON client: equivalent multipart upload to the JSON API
- Affects `create_case` and `update_case`

### Formatted Messages (Rich Text)

Support rich text in case descriptions and comments for FogBugz instances that accept HTML.

- Auto-detect whether the connected instance supports HTML in `sEvent` / `sLatestTextSummary`
- Accept Markdown in tool inputs, convert to safe HTML subset before sending
- Fall back to plain text for XML API / FogBugz 8.x instances that strip HTML
