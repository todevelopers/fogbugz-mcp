# FogBugz MCP Server (XML API)

A Model Context Protocol (MCP) server for interacting with FogBugz through Language Learning Models (LLMs) such as Claude. This fork uses the **XML API** (`/api.asp`) to support older FogBugz versions (8.x).

## Overview

This server allows LLMs to perform various operations on FogBugz including:

- Creating new issues/cases
- Updating existing cases (changing project, area, milestone, priority)
- Assigning cases to specific users
- Listing a user's open cases
- Getting direct links to specific cases
- Searching for cases by various criteria
- Creating new projects

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

- `fogbugz_create_case` - Create a new FogBugz case
- `fogbugz_update_case` - Update an existing case's fields
- `fogbugz_assign_case` - Assign a case to a specific user
- `fogbugz_list_my_cases` - List cases assigned to a specific user
- `fogbugz_search_cases` - Search for cases using a query string
- `fogbugz_get_case_link` - Get a direct link to a specific case
- `fogbugz_create_project` - Create a new project

## Compatibility

Tested with FogBugz 8.8.53. Should work with any FogBugz version that supports the XML API at `/api.asp`.

## License

ISC
