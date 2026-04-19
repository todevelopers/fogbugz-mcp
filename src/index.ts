#!/usr/bin/env node
import dotenv from 'dotenv';
import { createFogBugzClient, IFogBugzClient } from './api';
import { fogbugzTools } from './commands/tools';
import * as handlers from './commands';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { version } from '../package.json';
import { logger } from './logger';

dotenv.config();

async function main() {
  const fogbugzUrl = process.env.FOGBUGZ_URL || '';
  const fogbugzApiKey = process.env.FOGBUGZ_API_KEY || '';

  if (!fogbugzUrl || !fogbugzApiKey) {
    logger.error('FOGBUGZ_URL and FOGBUGZ_API_KEY environment variables are required');
    process.exit(1);
  }

  logger.info('Starting fogbugz-mcp', { version });
  const api: IFogBugzClient = await createFogBugzClient({ baseUrl: fogbugzUrl, apiKey: fogbugzApiKey });

  const server = new Server(
    { name: 'fogbugz-mcp', version },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: fogbugzTools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    // args arrives from the MCP framework as Record<string,unknown>|undefined;
    // each handler validates required fields at runtime.
    const typedArgs = args as any;
    let content: string;
    const start = Date.now();

    logger.info('Tool called', { tool: name });
    logger.debug('Tool args', { tool: name, args: typedArgs });

    switch (name) {
      case 'create_case':     content = await handlers.createCase(api, typedArgs); break;
      case 'update_case':     content = await handlers.updateCase(api, typedArgs); break;
      case 'assign_case':     content = await handlers.assignCase(api, typedArgs); break;
      case 'list_my_cases':   content = await handlers.listUserCases(api, typedArgs); break;
      case 'search_cases':    content = await handlers.searchCases(api, typedArgs); break;
      case 'get_case_link':   content = await handlers.getCaseLink(api, typedArgs); break;
      case 'get_case':        content = await handlers.getCase(api, typedArgs); break;
      case 'resolve_case':    content = await handlers.resolveCase(api, typedArgs); break;
      case 'reopen_case':     content = await handlers.reopenCase(api, typedArgs); break;
      case 'close_case':      content = await handlers.closeCase(api, typedArgs); break;
      case 'list_people':     content = await handlers.listPeople(api, typedArgs); break;
      case 'list_categories': content = await handlers.listCategories(api, typedArgs); break;
      case 'list_projects':   content = await handlers.listProjects(api, typedArgs); break;
      case 'list_milestones': content = await handlers.listMilestones(api, typedArgs); break;
      case 'list_statuses':   content = await handlers.listStatuses(api, typedArgs); break;
      case 'view_project':    content = await handlers.viewProject(api, typedArgs); break;
      case 'view_area':       content = await handlers.viewArea(api, typedArgs); break;
      case 'create_project':  content = await handlers.createProject(api, typedArgs); break;
      case 'api_request':     content = await handlers.apiRequest(api, typedArgs); break;
      default:
        logger.warn('Unknown tool called', { tool: name });
        return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Unknown tool: ${name}` }) }], isError: true };
    }

    const durationMs = Date.now() - start;
    const isError = content.includes('"error"');
    if (isError) {
      logger.warn('Tool returned error', { tool: name, durationMs });
    } else {
      logger.info('Tool completed', { tool: name, durationMs });
    }

    return { content: [{ type: 'text' as const, text: content }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(error => {
  logger.error('Fatal error', { error: error?.message ?? String(error) });
  process.exit(1);
});
