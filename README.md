# <img src="icon.png" width="64" alt="FogBugz MCP Server icon" /> FogBugz MCP Server

<p align="center">
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/tommy-gun/6c206a2756e6294e7f635c9b89a7d20f/raw/fogbugz-mcp-tests.json&cacheSeconds=0" alt="Test count" />
  <img src="https://img.shields.io/github/package-json/v/todevelopers/fogbugz-mcp" alt="Version" />
  <img src="https://img.shields.io/github/license/todevelopers/fogbugz-mcp" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" alt="Node" />
  <img src="https://img.shields.io/badge/MCP-compatible-blue" alt="MCP" />
</p>

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that connects AI assistants to a live [FogBugz](https://www.fogbugz.com/) instance. Search and manage cases, track history, assign and resolve — all from a natural language conversation. Works with on-premise and on-demand FogBugz installations.

## Features

- **Search and list cases** using FogBugz query syntax (e.g. `project:Website status:Active`)
- **Read case details** including full event and comment history
- **Create and update cases** — set title, project, area, milestone, priority, and comments
- **Full lifecycle management** — assign, resolve, reopen, and close cases
- **User, project, and area discovery** — list people, categories, projects, milestones, and statuses
- **Create new projects** directly from the conversation
- **Automatic API selection** — detects your FogBugz version and switches between XML and JSON API automatically

## Requirements

- FogBugz (on-premise or on-demand)
- Node.js 20 or later
- A FogBugz API token

## Getting a FogBugz API Token

You need an API token to authenticate the MCP server with FogBugz. There are two ways to obtain one:

### Via the web UI

Go to **Account & Settings → User Options** and click the **Create API Token** link.

See the official guide: [Create API Token using the FogBugz UI](https://support.fogbugz.com/article/52425-create-api-token-using-the-fogbugz-ui)

### Via API request

Send the following request (replace placeholders with your values):

```
https://[your-fogbugz-server]/api.asp?cmd=logon&email=[your-email]&password=[your-password]
```

The response will contain your API token.

See the official guide: [Get an API Token using FogBugz API commands](https://support.fogbugz.com/article/55717-get-an-api-token-using-fogbugz-api-commands)

---

## AI Client Setup

MCP is an open standard — this server works with any MCP-compatible AI client. Configuration varies by client.

### Claude Desktop ✓ (tested)

**One-click install:** Download the latest `.mcpb` package from the [Releases](https://github.com/todevelopers/fogbugz-mcp/releases) page and open it — Claude Desktop will install and configure the server automatically, prompting you for your FogBugz URL and API token.

**Manual configuration:** Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "fogbugz": {
      "command": "npx",
      "args": ["-y", "@todevs/fogbugz-mcp"],
      "env": {
        "FOGBUGZ_URL": "https://your-fogbugz-server.com",
        "FOGBUGZ_API_KEY": "your-api-token"
      }
    }
  }
}
```

### Claude Code ✓ (tested)

Add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "fogbugz": {
      "command": "npx",
      "args": ["-y", "@todevs/fogbugz-mcp"],
      "env": {
        "FOGBUGZ_URL": "https://your-fogbugz-server.com",
        "FOGBUGZ_API_KEY": "your-api-token"
      }
    }
  }
}
```

### Other MCP-compatible clients

Any client that supports MCP stdio servers should work. Consult your client's documentation for how to register a stdio MCP server with environment variables. The server entry point is `npx @todevs/fogbugz-mcp` (or `node /path/to/dist/index.js` for a local build).

---

## Tools

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

| Tool              | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `list_people`     | List all users with IDs, names, and emails                     |
| `list_categories` | List case categories (Bug, Feature Request, etc.)              |
| `list_projects`   | List all active projects with IDs and names                    |
| `list_milestones` | List milestones/fix-fors, optionally by project                |
| `list_statuses`   | List case statuses with resolved flags, optionally by category |
| `view_project`    | Get detailed project information                               |
| `view_area`       | Get detailed area information                                  |
| `create_project`  | Create a new project                                           |

### Advanced

| Tool          | Description                                                                                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api_request` | Generic XML API escape-hatch for commands not covered by dedicated tools.<br/>⚠️ WARNING: can execute any API command the configured key permits, including destructive operations (delete, edit users, bulk modify). |

---

## Usage Examples

### Example 1: Finding open bugs in a project

**You:** "Show me all open bugs in the Website project assigned to nobody."

**Claude calls:** `search_cases` with query `project:Website status:Active assignedTo:nobody category:Bug`.

**Result:** A list of unassigned bugs with their IDs, titles, and creation dates — ready to triage or assign.

---

### Example 2: Creating a case from a bug report

**You:** "Create a bug in the Mobile project titled 'Login button unresponsive on iOS 17', assign it to alice, and set priority to 2."

**Claude calls:** `create_case` with project, title, assignee, and priority set in a single call, then `get_case_link` to return a direct URL.

**Result:** New case created. Claude confirms the case number and provides a link.

---

### Example 3: Resolving a case with a closing comment

**You:** "Resolve case 1042 and add a comment saying the fix was deployed in v3.5.1."

**Claude calls:** `resolve_case` with the case ID and a comment describing the fix.

**Result:** Case resolved. Claude confirms the status change and the comment was saved.

---

### Example 4: Reviewing your team's workload

**You:** "What open cases does bob have right now?"

**Claude calls:** `list_people` to find Bob's user ID, then `list_my_cases` filtered to that user.

**Result:** A summary of Bob's active cases grouped by project, with priorities and due dates.

---

### Example 5: Updating a case after a code review

**You:** "Move case 987 to the Backend project, change the milestone to v4.0, and leave a comment saying it was re-scoped after the architecture review."

**Claude calls:** `update_case` with the new project, milestone, and comment all set in one call.

**Result:** Case updated. Claude confirms each field change.

---

## How It Works

This server implements the [Model Context Protocol](https://modelcontextprotocol.io/) over stdio. The AI client translates natural language requests into FogBugz queries or API calls, invokes the appropriate tool, and presents the results. The server is a thin proxy — it passes requests directly to your FogBugz instance and returns the response.

### API Auto-Detection

At startup the server automatically selects the right API client for your FogBugz instance:

1. Probes `/api.xml` to read the FogBugz version number.
2. If version ≥ 9, attempts to reach the JSON API (`/f/api/0/jsonapi`) — uses `FogBugzJsonClient` on success.
3. Falls back to `FogBugzXmlClient` (XML API via `/api.asp`) for version < 9 or if the JSON endpoint is unreachable.

| FogBugz version             | API used                      |
| --------------------------- | ----------------------------- |
| ≥ 9 (JSON API available)    | JSON API (`/f/api/0/jsonapi`) |
| < 9 or JSON API unreachable | XML API (`/api.asp`)          |

> **Note on text formatting:** Plain text only is supported in descriptions and comments when connected to FogBugz 8.x via the XML API. HTML and Markdown are stored and displayed literally.

---

## Configuration Reference

| Variable          | Required | Description                                                             |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `FOGBUGZ_URL`     | Yes      | Base URL of your FogBugz instance (e.g. `https://company.fogbugz.com`) |
| `FOGBUGZ_API_KEY` | Yes      | FogBugz API token                                                       |

## Installation

### Via npx (no install needed)

```bash
# Latest stable release
npx @todevs/fogbugz-mcp

# Latest dev build (pre-release)
npx @todevs/fogbugz-mcp@dev
```

### From source

```bash
git clone https://github.com/todevelopers/fogbugz-mcp.git
cd fogbugz-mcp
npm install
npm run build
node dist/index.js https://your-fogbugz-server.com your-api-token
```

## Development

```bash
npm run dev    # run via ts-node (no build needed)
npm run build  # compile TypeScript to dist/
npm test       # run all Jest tests
```

## Compatibility

- FogBugz on-premise and on-demand (tested with FogBugz 8.8.53 via XML API)
- Node.js 20+

## Privacy

This server does not collect, store, or transmit any data to ToDevelopers or any third party. All communication is directly between your AI client and your own FogBugz instance using the URL and credentials you provide. No usage data, case content, or credentials are sent anywhere other than your configured FogBugz server.

## Acknowledgements

This project is based on the original work by [Sarasvati Akari Lara-Almeida](https://github.com/akari2600/fogbugz-mcp) — thank you for the foundation.

## License

[MIT](LICENSE) © Tomáš Gažovič, ToDevelopers s.r.o.
