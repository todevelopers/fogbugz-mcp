# <img src="icon.png" width="64" alt="FogBugz MCP Server icon" /> FogBugz MCP Server

![Tests](https://github.com/todevelopers/fogbugz-mcp/actions/workflows/test.yml/badge.svg)
![Test count](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/tommy-gun/6c206a2756e6294e7f635c9b89a7d20f/raw/fogbugz-mcp-tests.json&cacheSeconds=0)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for interacting with FogBugz through LLMs such as Claude. Supports both the **XML API** (`/api.asp`) and the **JSON API** (`/f/api/0/jsonapi`) with automatic version detection at startup. Works with on-premise and on-demand FogBugz installations.

## Overview

Allows LLMs to perform FogBugz operations:

- Creating, updating, resolving, reopening, and closing cases
- Assigning cases to specific users
- Searching and listing cases with full event/comment history
- Listing users, categories, projects, and areas
- Creating new projects
- Generic API requests for advanced use cases

## API Auto-Detection

At startup the server automatically selects the right API client for your FogBugz instance:

1. Probes `/api.xml` to read the FogBugz version number.
2. If version ≥ 9, attempts to reach the JSON API (`/f/api/0/jsonapi`) — uses `FogBugzJsonClient` on success.
3. Falls back to `FogBugzXmlClient` (XML API via `/api.asp`) for version < 9 or if the JSON endpoint is unreachable.

No configuration is needed — the correct client is selected automatically.

| FogBugz version             | API used                      |
| --------------------------- | ----------------------------- |
| ≥ 9 (JSON API available)    | JSON API (`/f/api/0/jsonapi`) |
| < 9 or JSON API unreachable | XML API (`/api.asp`)          |

> **Note on text formatting:** Plain text only is supported in descriptions and comments when connected to FogBugz 8.x via the XML API. HTML and Markdown are stored and displayed literally.

## Getting a FogBugz API Token

You need an API token to authenticate the MCP server with FogBugz. There are two ways to obtain one:

### 1. Via the web UI

Go to **Account & Settings → User Options** and click the **Create API Token** link.

See the official guide: [Create API Token using the FogBugz UI](https://support.fogbugz.com/article/52425-create-api-token-using-the-fogbugz-ui)

### 2. Via API request

Send the following request (replace placeholders with your values):

```
https://[your-fogbugz-server]/api.asp?cmd=logon&email=[your-email]&password=[your-password]
```

The response will contain your API token.

See the official guide: [Get an API Token using FogBugz API commands](https://support.fogbugz.com/article/55717-get-an-api-token-using-fogbugz-api-commands)

## Installation

### One-click install (Claude Desktop)

Download the latest `.mcpb` package from the [Releases](https://github.com/todevelopers/fogbugz-mcp/releases) page and open it — Claude Desktop will install and configure the server automatically, prompting you for your FogBugz URL and API key.

### Manual install

```bash
git clone https://github.com/todevelopers/fogbugz-mcp.git
cd fogbugz-mcp
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
      "args": ["/absolute/path/to/fogbugz-mcp/dist/index.js"],
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
        "/absolute/path/to/fogbugz-mcp/dist/index.js",
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
npm test       # run all Jest tests
```

## MCP Tools

### Case Management

| Tool           | Description                                                                  |
| -------------- | ---------------------------------------------------------------------------- |
| `create_case`  | Create a new case                                                            |
| `update_case`  | Update an existing case (title, comment, project, area, milestone, priority) |
| `assign_case`  | Assign a case to a user                                                      |
| `resolve_case` | Resolve (mark as fixed/completed) a case                                     |
| `reopen_case`  | Reopen a resolved or closed case                                             |
| `close_case`   | Close a case                                                                 |

### Search & View

| Tool            | Description                                                              |
| --------------- | ------------------------------------------------------------------------ |
| `search_cases`  | Search using FogBugz query syntax (e.g. `project:Website status:Active`) |
| `list_my_cases` | List cases assigned to a user (defaults to current user)                 |
| `get_case`      | Get detailed case info including full event/comment history              |
| `get_case_link` | Get a direct URL to a case                                               |

### Reference Data

| Tool              | Description                                       |
| ----------------- | ------------------------------------------------- |
| `list_people`     | List all users with IDs, names, and emails        |
| `list_categories` | List case categories (Bug, Feature Request, etc.) |
| `view_project`    | Get detailed project information                  |
| `view_area`       | Get detailed area information                     |
| `create_project`  | Create a new project                              |

### Advanced

| Tool          | Description                                                           |
| ------------- | --------------------------------------------------------------------- |
| `api_request` | Make a generic XML API request for queries not covered by other tools |

## Environment Variables

| Variable          | Required | Description                                                            |
| ----------------- | -------- | ---------------------------------------------------------------------- |
| `FOGBUGZ_URL`     | Yes      | Base URL of your FogBugz instance (e.g. `https://company.fogbugz.com`) |
| `FOGBUGZ_API_KEY` | Yes      | FogBugz API token                                                      |

## Compatibility

Tested with FogBugz 8.8.53 (XML API). JSON API support is implemented by specification. The server auto-detects which API to use at startup.

## Acknowledgements

This project is based on the original work by [Sarasvati Akari Lara-Almeida](https://github.com/akari2600/fogbugz-mcp) — thank you for the foundation.

## License

[MIT](LICENSE) © Tomáš Gažovič, ToDevelopers s.r.o.
