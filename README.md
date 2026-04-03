# FogBugz MCP Server (XML API)

![Tests](https://github.com/tommy-gun/fogbugz-xmlapi-mcp/actions/workflows/test.yml/badge.svg)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for interacting with FogBugz through LLMs such as Claude. Uses the **XML API** (`/api.asp`) to support older FogBugz versions (8.x).

## Overview

Allows LLMs to perform FogBugz operations:

- Creating, updating, resolving, reopening, and closing cases
- Assigning cases to specific users
- Searching and listing cases with full event/comment history
- Listing users, categories, projects, and areas
- Creating new projects
- Generic API requests for advanced use cases

> **Note:** All text fields (descriptions, comments) support **plain text only**. HTML and Markdown formatting are not rendered by the FogBugz 8.x XML API.

## XML API vs JSON API

The [original project](https://github.com/akari2600/fogbugz-mcp) uses the newer FogBugz JSON API (`/f/api/0/jsonapi`). This fork uses the older **XML API** (`/api.asp`) for compatibility with FogBugz 8.x (tested on 8.8.53).

Key differences:
- **Endpoint**: `/api.asp` instead of `/f/api/0/jsonapi`
- **HTTP method**: GET with query parameters instead of POST with JSON body
- **Response format**: XML parsed via `fast-xml-parser` instead of JSON
- **Token**: Passed as a query parameter (`?token=XXX`) with each request

## Installation

```bash
git clone https://github.com/tommy-gun/fogbugz-xmlapi-mcp.git
cd fogbugz-xmlapi-mcp
npm install
npm run build
```

## MCP Client Configuration

Add to your MCP client config (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "fogbugz": {
      "command": "node",
      "args": ["/absolute/path/to/fogbugz-xmlapi-mcp/dist/index.js"],
      "env": {
        "FOGBUGZ_URL": "https://your-fogbugz-server.com",
        "FOGBUGZ_API_KEY": "your-api-token"
      }
    }
  }
}
```

Alternatively, pass credentials as command-line arguments:

```json
{
  "mcpServers": {
    "fogbugz": {
      "command": "node",
      "args": [
        "/absolute/path/to/fogbugz-xmlapi-mcp/dist/index.js",
        "https://your-fogbugz-server.com",
        "your-api-token"
      ]
    }
  }
}
```

## Running Manually

```bash
# With command-line arguments
node dist/index.js https://your-fogbugz-server.com your-api-token

# With environment variables
FOGBUGZ_URL=https://your-fogbugz-server.com FOGBUGZ_API_KEY=your-api-token npm start

# With a .env file
cp .env.example .env   # fill in FOGBUGZ_URL and FOGBUGZ_API_KEY
npm start
```

## Development

```bash
npm run dev    # run via ts-node (no build needed)
npm run build  # compile TypeScript to dist/
npm test       # run Jest tests
```

## MCP Tools

### Case Management

| Tool | Description |
|------|-------------|
| `fogbugz_create_case` | Create a new case |
| `fogbugz_update_case` | Update an existing case (title, comment, project, area, milestone, priority) |
| `fogbugz_assign_case` | Assign a case to a user |
| `fogbugz_resolve_case` | Resolve (mark as fixed/completed) a case |
| `fogbugz_reopen_case` | Reopen a resolved or closed case |
| `fogbugz_close_case` | Close a case |

### Search & View

| Tool | Description |
|------|-------------|
| `fogbugz_search_cases` | Search using FogBugz query syntax (e.g. `project:Website status:Active`) |
| `fogbugz_list_my_cases` | List cases assigned to a user (defaults to current user) |
| `fogbugz_get_case` | Get detailed case info including full event/comment history |
| `fogbugz_get_case_link` | Get a direct URL to a case |

### Reference Data

| Tool | Description |
|------|-------------|
| `fogbugz_list_people` | List all users with IDs, names, and emails |
| `fogbugz_list_categories` | List case categories (Bug, Feature Request, etc.) |
| `fogbugz_view_project` | Get detailed project information |
| `fogbugz_view_area` | Get detailed area information |
| `fogbugz_create_project` | Create a new project |

### Advanced

| Tool | Description |
|------|-------------|
| `fogbugz_api_request` | Make a generic XML API request for queries not covered by other tools |

## Text Formatting

All text fields (`description`, `comment`) accept **plain text only**.

The FogBugz 8.x XML API (`/api.asp`) does not support rich text formatting via the API – HTML tags and Markdown are stored and displayed literally as plain text. Do not include HTML or Markdown markup in descriptions or comments.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FOGBUGZ_URL` | Yes | Base URL of your FogBugz instance (e.g. `https://company.fogbugz.com`) |
| `FOGBUGZ_API_KEY` | Yes | FogBugz API token |

## Compatibility

Tested with FogBugz 8.8.53. Should work with any FogBugz version that supports the XML API at `/api.asp`.

## License

ISC
