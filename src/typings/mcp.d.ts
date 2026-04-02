declare module '@modelcontextprotocol/sdk/server/mcp' {
  export class McpServer {
    constructor(info: { name: string; version: string });
    tool(name: string, description: string, schema: Record<string, any>, handler: (args: any) => Promise<any>): void;
    connect(transport: any): Promise<void>;
  }
}

declare module '@modelcontextprotocol/sdk/server/stdio' {
  export class StdioServerTransport {
    constructor();
  }
}
