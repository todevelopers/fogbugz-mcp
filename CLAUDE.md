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

## Tools manifest sync

Any time a tool is **added, renamed, or removed** in `src/commands/tools.ts`, the `"tools"` array in `manifest.json` must be updated to match — same name, same description. These two files must always be in sync.

## Skills

Always use skills from the `mcp-server-dev` plugin when working on this project:
- `mcp-server-dev:build-mcp-server` — building/creating MCP servers
- `mcp-server-dev:build-mcp-app` — adding UI/widgets to MCP servers
- `mcp-server-dev:build-mcpb` — packaging and bundling MCPB
