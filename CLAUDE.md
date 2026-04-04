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

## Tools manifest sync

Any time a tool is **added, renamed, or removed** in `src/commands/tools.ts`, the `"tools"` array in `manifest.json` must be updated to match — same name, same description. These two files must always be in sync.

## Skills

Always use skills from the `mcp-server-dev` plugin when working on this project:
- `mcp-server-dev:build-mcp-server` — building/creating MCP servers
- `mcp-server-dev:build-mcp-app` — adding UI/widgets to MCP servers
- `mcp-server-dev:build-mcpb` — packaging and bundling MCPB
