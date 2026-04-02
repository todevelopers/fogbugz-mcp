#!/usr/bin/env node
import dotenv from 'dotenv';
import { FogBugzApi } from './api';
import { fogbugzTools } from './commands/tools';
import * as handlers from './commands';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

dotenv.config();

const SERVER_NAME = 'fogbugz-mcp';
const SERVER_VERSION = '0.0.9';

async function main() {
  const fogbugzUrl = process.env.FOGBUGZ_URL || '';
  const fogbugzApiKey = process.env.FOGBUGZ_API_KEY || '';

  if (!fogbugzUrl || !fogbugzApiKey) {
    console.error('[ERROR] FOGBUGZ_URL and FOGBUGZ_API_KEY environment variables are required');
    process.exit(1);
  }

  const api = new FogBugzApi({ baseUrl: fogbugzUrl, apiKey: fogbugzApiKey });

  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  // Register all tools
  for (const tool of fogbugzTools) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema.properties,
      async (args: any) => {
        let content: string;
        switch (tool.name) {
          case 'fogbugz_create_case':     content = await handlers.createCase(api, args); break;
          case 'fogbugz_update_case':     content = await handlers.updateCase(api, args); break;
          case 'fogbugz_assign_case':     content = await handlers.assignCase(api, args); break;
          case 'fogbugz_list_my_cases':   content = await handlers.listUserCases(api, args); break;
          case 'fogbugz_search_cases':    content = await handlers.searchCases(api, args); break;
          case 'fogbugz_get_case_link':   content = await handlers.getCaseLink(api, args); break;
          case 'fogbugz_get_case':        content = await handlers.getCase(api, args); break;
          case 'fogbugz_resolve_case':    content = await handlers.resolveCase(api, args); break;
          case 'fogbugz_reopen_case':     content = await handlers.reopenCase(api, args); break;
          case 'fogbugz_close_case':      content = await handlers.closeCase(api, args); break;
          case 'fogbugz_list_people':     content = await handlers.listPeople(api, args); break;
          case 'fogbugz_list_categories': content = await handlers.listCategories(api, args); break;
          case 'fogbugz_view_project':    content = await handlers.viewProject(api, args); break;
          case 'fogbugz_view_area':       content = await handlers.viewArea(api, args); break;
          case 'fogbugz_create_project':  content = await handlers.createProject(api, args); break;
          case 'fogbugz_api_request':     content = await handlers.apiRequest(api, args); break;
          default: content = JSON.stringify({ error: `Unknown tool: ${tool.name}` });
        }
        return { content: [{ type: 'text' as const, text: content }] };
      }
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(error => {
  console.error('[ERROR] Fatal error:', error);
  process.exit(1);
});
