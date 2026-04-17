declare module '@modelcontextprotocol/sdk/server/index.js' {
  export class Server {
    constructor(info: { name: string; version: string }, options: { capabilities: { tools: {} } });
    setRequestHandler(schema: any, handler: (request: any) => Promise<any>): void;
    connect(transport: any): Promise<void>;
  }
}

declare module '@modelcontextprotocol/sdk/server/stdio.js' {
  export class StdioServerTransport {
    constructor();
  }
}

