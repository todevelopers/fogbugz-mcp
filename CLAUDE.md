# Project rules

## Versioning

Before creating a git tag, always update the version in **both** files to match the tag:
- `package.json` → `"version"`
- `manifest.json` → `"version"`

Example: tag `v0.0.3` → both files must have `"version": "0.0.3"`.

**Version increment rules:**
- Always increment the **PATCH** version (third number) by default: `0.0.9` → `0.0.10`.
- Only increment **MINOR** (second number) or **MAJOR** (first number) when explicitly instructed by the user.

## Language

All content in this repository must be written in **English** — code, comments, commit messages, documentation, and planning files. No other language is permitted.

## Company name

The correct legal name of the company is **ToDevelopers s.r.o.** — always use this full name in legal or formal contexts (LICENSE, package.json author, manifest author). The short form **ToDevelopers** is acceptable in UI-facing fields such as `display_name` and `author.name` in the manifest.

## Tool naming

Tool names must **never** use a `fogbugz_` prefix. Use plain descriptive names only (e.g. `create_case`, `search_cases`). This applies to all new tools added to `src/commands/tools.ts`.

## Tool definition checklist (QA)

Every tool added to `src/commands/tools.ts` must satisfy all of the following:

### Required fields
- `name` — plain snake_case, no `fogbugz_` prefix
- `title` — short human-readable label shown in Claude's tool picker (e.g. `'Create Case'`)
- `description` — one sentence explaining what the tool does **plus** 1–2 concrete usage examples inline
- `inputSchema` — valid JSON Schema object with `type`, `properties`, and `required`
- `annotations` — always present, never omitted

### Annotations rules

| Tool type | `readOnlyHint` | `destructiveHint` |
|---|---|---|
| Read-only (list, get, search, view) | `true` | omit or `false` |
| Write / mutating (create, update, assign, resolve, reopen, close) | `false` | `true` |
| Generic / raw API pass-through | `false` | `true` |

```ts
// Read-only example
annotations: { readOnlyHint: true }

// Mutating example
annotations: { readOnlyHint: false, destructiveHint: true }
```

### Description format
1. One sentence: what the tool does.
2. Example(s): `Example: <concrete scenario with realistic values>.`

Bad: `'Gets a FogBugz case.'`
Good: `'Gets detailed information about a specific FogBugz case, including its full event/comment history. Example: fetch all details and comments for case 42.'`

### Parameter descriptions
- Every parameter must have a non-empty `description`.
- Include allowed values or format where relevant (e.g. `'Priority level (number 1-7) or name'`).

## Command handler input validation

Every handler added to `src/commands/index.ts` must:

1. Destructure `args` with a fallback: `const { ... } = args || {};`
2. Guard every required parameter before use and return a descriptive error JSON immediately:

```typescript
if (!caseId) return JSON.stringify({ error: 'caseId is required' });
```

Never let a missing parameter propagate to the API client — it produces cryptic errors or silent no-ops.

## Tools manifest sync

Any time a tool is **added, renamed, or removed** in `src/commands/tools.ts`, the `"tools"` array in `manifest.json` must be updated to match — same name, same description. These two files must always be in sync.

## Skills

Always use skills from the `mcp-server-dev` plugin when working on this project:
- `mcp-server-dev:build-mcp-server` — building/creating MCP servers
- `mcp-server-dev:build-mcp-app` — adding UI/widgets to MCP servers
- `mcp-server-dev:build-mcpb` — packaging and bundling MCPB
