#!/usr/bin/env node

// Catch uncaught exceptions as early as possible (before imports execute)
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
  process.exit(1);
});

console.error('[DEBUG] Starting module imports...');

import dotenv from 'dotenv';
console.error('[DEBUG] dotenv imported');

import { FogBugzApi } from './api';
console.error('[DEBUG] FogBugzApi imported');

import { fogbugzTools } from './commands/tools';
console.error('[DEBUG] fogbugzTools imported');

import * as handlers from './commands';
console.error('[DEBUG] handlers imported');

// Load environment variables
dotenv.config();
console.error('[DEBUG] dotenv.config() done');
console.error('[DEBUG] Node version:', process.version);
console.error('[DEBUG] CWD:', process.cwd());
console.error('[DEBUG] FOGBUGZ_URL set:', !!process.env.FOGBUGZ_URL);
console.error('[DEBUG] FOGBUGZ_API_KEY set:', !!process.env.FOGBUGZ_API_KEY);

// Logger that writes to stderr instead of stdout
const log = {
  info: (...args: any[]) => console.error('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.error('[DEBUG]', ...args),
};

// Simple implementation of an MCP server that reads from stdin and writes to stdout
async function startMcpServer(api: FogBugzApi) {
  log.info('MCP Server started, waiting for requests...');

  // Create a readline interface to read from stdin
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  // Current protocol version we support
  const SERVER_PROTOCOL_VERSION = "2024-11-05";
  const SERVER_NAME = "FogBugz MCP Server";
  const SERVER_VERSION = "1.0.0";

  // Listen for JSON-RPC requests on stdin
  rl.on('line', async (line: string) => {
    try {
      // Parse the JSON-RPC request
      const request = JSON.parse(line);
      const { id, method, params } = request;

      log.info(`Received request: ${method}`);

      // Handle the request based on the method
      if (method === 'initialize') {
        // Handle the initialize method - this is a required lifecycle method
        // Client is initializing connection and negotiating capabilities
        const clientVersion = params.protocolVersion || "2024-11-05";
        const clientCapabilities = params.capabilities || {};
        const clientInfo = params.clientInfo || { name: "Unknown Client", version: "Unknown" };
        
        log.info(`Client ${clientInfo.name} v${clientInfo.version} requested initialization`);
        log.info(`Client protocol version: ${clientVersion}`);
        
        // Respond with our capabilities and version
        const response = {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: SERVER_PROTOCOL_VERSION,
            capabilities: {
              tools: {
                // We support tools, but not dynamic tool lists
                listChanged: false
              }
            },
            serverInfo: {
              name: SERVER_NAME,
              version: SERVER_VERSION
            }
          }
        };
        console.log(JSON.stringify(response));
      } else if (method === 'shutdown') {
        // Shutdown request - client is requesting to end the session
        log.info('Client requested shutdown');
        const response = {
          jsonrpc: "2.0",
          id,
          result: null
        };
        console.log(JSON.stringify(response));
      } else if (method === 'notifications/initialized') {
        // Client has completed initialization
        log.info('Client sent initialized notification');
        // This is a notification, no response needed
      } else if (method === 'ping' || method === 'mcp.ping') {
        // Handle ping/keepalive requests (MCP spec uses 'ping', respond with empty result)
        const response = {
          jsonrpc: "2.0",
          id,
          result: {}
        };
        console.log(JSON.stringify(response));
      } else if (method === 'mcp.listTools' || method === 'tools/list') {
        // Return the list of available tools
        const response = {
          jsonrpc: "2.0",
          id,
          result: {
            tools: fogbugzTools
          }
        };
        console.log(JSON.stringify(response));
      } else if (method === 'mcp.callTool' || method === 'tools/call') {
        // Handle tool calls
        const { name, arguments: args } = params;
        log.info(`Tool call: ${name}`);

        let content;
        
        // Call the appropriate handler based on the tool name
        switch (name) {
          case 'fogbugz_create_case':
            content = await handlers.createCase(api, args);
            break;
          case 'fogbugz_update_case':
            content = await handlers.updateCase(api, args);
            break;
          case 'fogbugz_assign_case':
            content = await handlers.assignCase(api, args);
            break;
          case 'fogbugz_list_my_cases':
            content = await handlers.listUserCases(api, args);
            break;
          case 'fogbugz_search_cases':
            content = await handlers.searchCases(api, args);
            break;
          case 'fogbugz_get_case_link':
            content = await handlers.getCaseLink(api, args);
            break;
          case 'fogbugz_get_case':
            content = await handlers.getCase(api, args);
            break;
          case 'fogbugz_resolve_case':
            content = await handlers.resolveCase(api, args);
            break;
          case 'fogbugz_reopen_case':
            content = await handlers.reopenCase(api, args);
            break;
          case 'fogbugz_close_case':
            content = await handlers.closeCase(api, args);
            break;
          case 'fogbugz_list_people':
            content = await handlers.listPeople(api, args);
            break;
          case 'fogbugz_list_categories':
            content = await handlers.listCategories(api, args);
            break;
          case 'fogbugz_view_project':
            content = await handlers.viewProject(api, args);
            break;
          case 'fogbugz_view_area':
            content = await handlers.viewArea(api, args);
            break;
          case 'fogbugz_create_project':
            content = await handlers.createProject(api, args);
            break;
          case 'fogbugz_api_request':
            content = await handlers.apiRequest(api, args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Return the response
        const response = {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: 'text', text: content }]
          }
        };
        console.log(JSON.stringify(response));
      } else {
        // Unknown method
        const response = {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        };
        console.log(JSON.stringify(response));
      }
    } catch (error: any) {
      // Handle errors
      log.error('Error handling request:', error);
      
      try {
        const request = JSON.parse(line);
        const response = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32000,
            message: error.message || 'Internal server error'
          }
        };
        console.log(JSON.stringify(response));
      } catch (parseError) {
        // If we can't parse the original request, return a generic error
        log.error('Error parsing request:', parseError);
        const response = {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: 'Parse error'
          }
        };
        console.log(JSON.stringify(response));
      }
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    log.info('Received SIGINT, shutting down...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log.info('Received SIGTERM, shutting down...');
    process.exit(0);
  });
}

async function main() {
  log.debug('main() started');

  // Parse command line arguments
  const args = process.argv.slice(2);
  log.debug('argv:', process.argv);

  // Get API configuration from environment or command line
  const fogbugzUrl = args[0] || process.env.FOGBUGZ_URL || '';
  const fogbugzApiKey = args[1] || process.env.FOGBUGZ_API_KEY || '';

  log.debug('FOGBUGZ_URL resolved:', fogbugzUrl ? `"${fogbugzUrl}"` : '(empty)');
  log.debug('FOGBUGZ_API_KEY resolved:', fogbugzApiKey ? '(set)' : '(empty)');

  if (!fogbugzUrl || !fogbugzApiKey) {
    log.error('Error: FogBugz URL and API key are required');
    log.error('Usage: fogbugz-mcp <fogbugz-url> <api-key>');
    log.error('       or set FOGBUGZ_URL and FOGBUGZ_API_KEY environment variables');
    process.exit(1);
  }

  log.info(`Starting FogBugz MCP server for ${fogbugzUrl}`);

  // Initialize the FogBugz API client
  const api = new FogBugzApi({
    baseUrl: fogbugzUrl,
    apiKey: fogbugzApiKey
  });

  try {
    // Test connection by getting current user
    log.debug('Calling getCurrentUser()...');
    const user = await api.getCurrentUser();
    log.info(`Connected to FogBugz as ${user.sPerson || user.sFullName} (${user.sEmail})`);

    // Start the MCP server
    log.debug('Starting MCP server...');
    await startMcpServer(api);
  } catch (error: any) {
    log.error('Error initializing FogBugz API:', error?.message || error);
    log.error('Error details:', JSON.stringify({
      code: error?.code,
      status: error?.response?.status,
      data: error?.response?.data,
      stack: error?.stack,
    }));
    process.exit(1);
  }
}

// Start the application
main().catch(error => {
  log.error('Unhandled error:', error);
  process.exit(1);
}); 