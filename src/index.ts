#!/usr/bin/env node
import dotenv from 'dotenv';
import { FogBugzApi } from './api';
import { fogbugzTools } from './commands/tools';
import * as handlers from './commands';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

dotenv.config();

async function main() {
  const fogbugzUrl = process.env.FOGBUGZ_URL || '';
  const fogbugzApiKey = process.env.FOGBUGZ_API_KEY || '';

  if (!fogbugzUrl || !fogbugzApiKey) {
    console.error('[ERROR] FOGBUGZ_URL and FOGBUGZ_API_KEY environment variables are required');
    process.exit(1);
  }

  const api = new FogBugzApi({ baseUrl: fogbugzUrl, apiKey: fogbugzApiKey });

  const server = new Server(
    { name: 'fogbugz-mcp', version: '0.0.14' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: fogbugzTools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    let content: string;

    switch (name) {
      case 'create_case':     content = await handlers.createCase(api, args); break;
      case 'update_case':     content = await handlers.updateCase(api, args); break;
      case 'assign_case':     content = await handlers.assignCase(api, args); break;
      case 'list_my_cases':   content = await handlers.listUserCases(api, args); break;
      case 'search_cases':    content = await handlers.searchCases(api, args); break;
      case 'get_case_link':   content = await handlers.getCaseLink(api, args); break;
      case 'get_case':        content = await handlers.getCase(api, args); break;
      case 'resolve_case':    content = await handlers.resolveCase(api, args); break;
      case 'reopen_case':     content = await handlers.reopenCase(api, args); break;
      case 'close_case':      content = await handlers.closeCase(api, args); break;
      case 'list_people':     content = await handlers.listPeople(api, args); break;
      case 'list_categories': content = await handlers.listCategories(api, args); break;
      case 'view_project':    content = await handlers.viewProject(api, args); break;
      case 'view_area':       content = await handlers.viewArea(api, args); break;
      case 'create_project':  content = await handlers.createProject(api, args); break;
      case 'api_request':     content = await handlers.apiRequest(api, args); break;
      default:
        return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Unknown tool: ${name}` }) }], isError: true };
    }

    return { content: [{ type: 'text' as const, text: content }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(error => {
  console.error('[ERROR] Fatal error:', error);
  process.exit(1);
});
