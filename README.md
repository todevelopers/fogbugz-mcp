# FogBugz MCP Server (XML API)

A Model Context Protocol (MCP) server for interacting with FogBugz through Language Learning Models (LLMs) such as Claude. This fork uses the **XML API** (`/api.asp`) to support older FogBugz versions (8.x).

## Overview

This server allows LLMs to perform various operations on FogBugz including:

- Creating, updating, resolving, reopening, and closing cases
- Assigning cases to specific users
- Searching and listing cases with detailed event history
- Listing users, categories, projects, and areas
- Creating new projects
- Making generic API requests for advanced use cases

The server implements the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) specification, allowing it to be used by any MCP-compatible LLM client.

## XML API vs JSON API

The [original project](https://github.com/akari2600/fogbugz-mcp) uses the newer FogBugz JSON API (`/f/api/0/jsonapi`). This fork was modified to use the older **XML API** (`/api.asp`) for compatibility with FogBugz 8.x (tested on 8.8.53).

Key differences:
- **Endpoint**: `/api.asp` instead of `/f/api/0/jsonapi`
- **HTTP method**: GET with query parameters instead of POST with JSON body
- **Response format**: XML parsed via `fast-xml-parser` instead of JSON
- **Token**: Passed as a query parameter (`?token=XXX`) with each request

## Installation

```bash
# Clone the repository
git clone https://github.com/tommy-gun/fogbugz-xml-mcp.git
cd fogbugz-xml-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Basic Usage

```bash
# Run with command line arguments
fogbugz-mcp https://your-fogbugz-server.com your-api-token

# Or use environment variables
export FOGBUGZ_URL=https://your-fogbugz-server.com
export FOGBUGZ_API_KEY=your-api-token
npm start
```

### Development

```bash
# Create a .env file with your FogBugz credentials
echo "FOGBUGZ_URL=https://your-fogbugz-server.com" > .env
echo "FOGBUGZ_API_KEY=your-api-token" >> .env

# Run the development version of the server
npm run dev

# Run tests
npm test

# Build the project
npm run build
```

## MCP Tools

This server provides the following MCP tools for LLMs:

### Case Management
- `fogbugz_create_case` - Create a new FogBugz case
- `fogbugz_update_case` - Update an existing case's fields
- `fogbugz_assign_case` - Assign a case to a specific user
- `fogbugz_resolve_case` - Resolve (mark as fixed/completed) a case
- `fogbugz_reopen_case` - Reopen a previously closed case
- `fogbugz_close_case` - Close a case

### Search & View
- `fogbugz_search_cases` - Search for cases using a query string
- `fogbugz_list_my_cases` - List cases assigned to a specific user
- `fogbugz_get_case` - Get detailed case info including events/comments history
- `fogbugz_get_case_link` - Get a direct link to a specific case

### Reference Data
- `fogbugz_list_people` - List all users with IDs, names, and emails
- `fogbugz_list_categories` - List case categories (Bug, Feature Request, etc.)
- `fogbugz_view_project` - Get detailed project information
- `fogbugz_view_area` - Get detailed area information
- `fogbugz_create_project` - Create a new project

### Advanced
- `fogbugz_api_request` - Make a generic XML API request for experimental or advanced queries not covered by other tools

## Compatibility

Tested with FogBugz 8.8.53. Should work with any FogBugz version that supports the XML API at `/api.asp`.

## License

ISC
