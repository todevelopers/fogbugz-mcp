# Project rules

## Versioning

Before creating a git tag, always update the version in **both** files to match the tag:
- `package.json` → `"version"`
- `manifest.json` → `"version"`

Example: tag `v0.0.3` → both files must have `"version": "0.0.3"`.

## Skills

Always use skills from the `mcp-server-dev` plugin when working on this project:
- `mcp-server-dev:build-mcp-server` — building/creating MCP servers
- `mcp-server-dev:build-mcp-app` — adding UI/widgets to MCP servers
- `mcp-server-dev:build-mcpb` — packaging and bundling MCPB
