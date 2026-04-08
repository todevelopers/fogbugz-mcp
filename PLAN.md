# Plan: fogbugz-mcp → Official Anthropic Extension

## Context

The project is a mature FogBugz MCP server (v0.0.6) that wraps the XML API for LLM interaction. The goal is to prepare it for submission as an official Anthropic extension with high approval probability. This means: dual-API support (XML + JSON auto-detection), attribution cleanup, repository hygiene, quality improvements for review criteria, and proper submission packaging.

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

## Phase 7: Version Bump & Submission

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

| File | Change |
|------|--------|
| `src/api/base-client.ts` | New — abstract interface |
| `src/api/xml-client.ts` | New — extracted from current `src/api/index.ts` |
| `src/api/json-client.ts` | New — JSON API implementation |
| `src/api/index.ts` | Rewrite — factory with auto-detection |
| `src/api/types.ts` | Minor — ensure types work for both clients |
| `src/commands/tools.ts` | Improve descriptions, remove attachment params |
| `src/commands/index.ts` | Remove attachment handling code |
| `manifest.json` | Add homepage, keywords; bump to 1.0.0 |
| `package.json` | author, license MIT, contributors, bump to 1.0.0 |
| `README.md` | Major update |
| `LICENSE` | New — MIT |
| `tests/json-client.test.ts` | New — JSON client tests |
| Remove: `DEVELOPMENT-PLAN.md`, `scripts/`, `mcp.json`, `fogbugz-mcp.code-workspace` | Cleanup |

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
- [ ] **2.2** Remove `scripts/api-explorer.ts` and `scripts/api-explorer.js`
- [x] **2.3** Remove `mcp.json` and `fogbugz-mcp.code-workspace`
- [ ] **2.4** Update `package.json` — author, license MIT, contributors, keywords, remove unused `@anthropic-ai/sdk`
- [x] **2.5** Remove `fogbugz_` prefix from all tool names in `src/commands/tools.ts`, `src/index.ts`, `manifest.json`, `tests/tools.test.ts`, and `README.md` (e.g. `fogbugz_create_case` → `create_case`)

### Phase 3 — Attribution

- [x] **3.1** Update `manifest.json` — set `"author": { "name": "ToDevelopers s.r.o." }`
- [ ] **3.2** Add "Based on / inspired by" section to `README.md` crediting [akari2600/fogbugz-mcp](https://github.com/akari2600/fogbugz-mcp)

### Phase 4 — Quality

- [ ] **4.1** Improve tool descriptions in `src/commands/tools.ts` — examples, `title` fields, `readOnlyHint`
- [ ] **4.2** Remove unimplemented `attachmentPath` parameter from tool schemas
- [ ] **4.3** Write `tests/json-client.test.ts` — auto-detection fallback, serialization, error handling
- [ ] **4.4** Overhaul `README.md` — description, installation, tool catalog, config params, compatibility, license
- [x] **4.5** Add `LICENSE` file (MIT, 2024–2025, Tomas Gazovic)

### Phase 5 — Manifest Quality

- [x] **5.1** Update `manifest.json` — `description`, `homepage`, `keywords`
- [x] **5.2** Run `npx @anthropic-ai/mcpb validate` and fix any reported issues

### Phase 6 — Time Management Tools

- [ ] **6.1** Add `TimeInterval` type to `src/api/types.ts`
- [ ] **6.2** Add `startWork`, `stopWork`, `newInterval`, `listIntervals` to `IFogBugzClient` interface
- [ ] **6.3** Implement the four commands in `src/api/xml-client.ts` (parse `<interval>` XML elements)
- [ ] **6.4** Implement the four commands in `src/api/json-client.ts` (`data.interval` / `data.intervals`)
- [ ] **6.5** Define `start_work`, `stop_work`, `log_interval`, `list_intervals` tool schemas in `src/commands/tools.ts`
- [ ] **6.6** Wire handlers for all four tools in `src/commands/index.ts`
- [ ] **6.7** Write `tests/time-tracking.test.ts` — startWork, stopWork, newInterval, listIntervals with mocked client

### Phase 7 — Release

- [x] **7.0** Migrate repository: transfer `tommy-gun/fogbugz-xmlapi-mcp` to the `ToDevelopers s.r.o.` organization and rename it to `fogbugz-mcp`. After migration update: `repository.url` and `support` in `manifest.json`, install URL in `README.md`, and git remote origin.
- [ ] **7.1** Bump version to `1.0.0` in both `package.json` and `manifest.json`
- [ ] **7.2** `npm run build` — no TypeScript errors
- [ ] **7.3** `npm test` — all tests pass
- [ ] **7.4** `npx @anthropic-ai/mcpb pack` — produces `fogbugz-mcp.mcpb`
- [ ] **7.5** Set up GitHub Actions workflow to produce a release artifact on `v1.0.0` tag
- [ ] **7.6** Create git tag `v1.0.0` and push

---

## Phase 6: Time Management Tools

Expose FogBugz time tracking via dedicated MCP tools so users can start/stop the stopwatch, log manual intervals, and query time spent — all from Claude.

### 6.1 New MCP tools in `src/commands/tools.ts`

| Tool | FogBugz cmd | Description |
|------|-------------|-------------|
| `start_work` | `startWork` | Start the stopwatch on a case (stops any currently active interval first) |
| `stop_work` | `stopWork` | Stop the currently active interval without starting a new one |
| `log_interval` | `newInterval` | Import a manually tracked time interval (dtStart + dtEnd, ISO 8601 UTC) |
| `list_intervals` | `listIntervals` | List time intervals filtered by case, person, and/or date range |

All four tools must be marked `readOnlyHint: false` except `list_intervals` (`readOnlyHint: true`).

### 6.2 API client implementations

Add the four commands to both `IFogBugzClient` (base interface), `FogBugzXmlClient`, and `FogBugzJsonClient`:
- XML client: parse `<interval>` elements from responses
- JSON client: use `data.interval` / `data.intervals` fields
- Shared types: add `TimeInterval` type to `src/api/types.ts`

### 6.3 Handler wiring in `src/commands/index.ts`

Route all four new tool names to their respective client methods.

### 6.4 Tests

`tests/time-tracking.test.ts` — unit tests with mocked client:
- `startWork` returns the targeted case ID
- `stopWork` succeeds with empty data
- `newInterval` returns an interval with `ixInterval`, `dtStart`, `dtEnd`
- `listIntervals` filters correctly by case and date range; respects admin-only `ixPerson` param

---

## Verification

1. `npm run build` — TypeScript compiles with no errors
2. `npm test` — all tests pass
3. `npx @anthropic-ai/mcpb validate` — manifest valid
4. `npx @anthropic-ai/mcpb pack` — produces `fogbugz-mcp.mcpb`
5. Manual test: install `.mcpb` in Claude Desktop, connect to FogBugz 8.x — verify XML auto-detection and read-only tools work (search, get, list). JSON API auto-detection verified only via mocked tests.
6. GitHub Actions workflow produces release artifact on `v1.0.0` tag
