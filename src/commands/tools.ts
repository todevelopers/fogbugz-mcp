/**
 * MCP Tool definitions for FogBugz operations
 */

// Define the Tool interface since we're having trouble importing it
interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
  };
}

// Tool: Create a new FogBugz case
export const createCaseTool: Tool = {
  name: 'create_case',
  annotations: { readOnlyHint: false },
  description: 'Creates a new FogBugz case.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title or summary of the issue',
      },
      description: {
        type: 'string',
        description: 'Detailed description of the issue. Plain text only – HTML and Markdown are not supported by the FogBugz 8.x API.',
        optional: true,
      },
      project: {
        type: 'string',
        description: 'Project name where the case should be created',
        optional: true,
      },
      area: {
        type: 'string',
        description: 'Area name within the project',
        optional: true,
      },
      milestone: {
        type: 'string',
        description: 'Milestone (FixFor) name',
        optional: true,
      },
      priority: {
        type: ['number', 'string'],
        description: 'Priority level (number 1-7) or name',
        optional: true,
      },
      assignee: {
        type: 'string',
        description: 'Person to assign the case to',
        optional: true,
      },
    },
    required: ['title'],
  },
};

// Tool: Update an existing FogBugz case
export const updateCaseTool: Tool = {
  name: 'update_case',
  annotations: { readOnlyHint: false },
  description: 'Updates an existing FogBugz case with new field values.',
  inputSchema: {
    type: 'object',
    properties: {
      caseId: {
        type: 'number',
        description: 'The ID of the case to update',
      },
      title: {
        type: 'string',
        description: 'New title for the case',
        optional: true,
      },
      description: {
        type: 'string',
        description: 'Additional comment to add to the case. Plain text only – HTML and Markdown are not supported by the FogBugz 8.x API.',
        optional: true,
      },
      project: {
        type: 'string',
        description: 'Project to move the case to',
        optional: true,
      },
      area: {
        type: 'string',
        description: 'Area within the project',
        optional: true,
      },
      milestone: {
        type: 'string',
        description: 'Milestone (FixFor) name',
        optional: true,
      },
      priority: {
        type: ['number', 'string'],
        description: 'Priority level (number 1-7) or name',
        optional: true,
      },
    },
    required: ['caseId'],
  },
};

// Tool: Assign a FogBugz case to a user
export const assignCaseTool: Tool = {
  name: 'assign_case',
  annotations: { readOnlyHint: false },
  description: 'Assigns a FogBugz case to a specific user.',
  inputSchema: {
    type: 'object',
    properties: {
      caseId: {
        type: 'number',
        description: 'The ID of the case to assign',
      },
      assignee: {
        type: 'string',
        description: 'Name or email of the person to assign the case to',
      },
    },
    required: ['caseId', 'assignee'],
  },
};

// Tool: List cases assigned to a user
export const listUserCasesTool: Tool = {
  name: 'list_my_cases',
  annotations: { readOnlyHint: true },
  description: 'Lists FogBugz cases assigned to a specific user.',
  inputSchema: {
    type: 'object',
    properties: {
      assignee: {
        type: 'string',
        description: 'Name or email of the person whose cases to list (defaults to current user if empty)',
        optional: true,
      },
      status: {
        type: 'string',
        description: 'Filter by status (e.g., "active", "closed")',
        optional: true,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of cases to return',
        optional: true,
      },
    },
    required: [],
  },
};

// Tool: Search for cases in FogBugz
export const searchCasesTool: Tool = {
  name: 'search_cases',
  annotations: { readOnlyHint: true },
  description: 'Searches for FogBugz cases based on a query string. Supports FogBugz search syntax.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query string. Supports FogBugz search syntax (e.g., "project:Website status:Active")',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of cases to return',
        optional: true,
      },
    },
    required: ['query'],
  },
};

// Tool: Get a direct link to a FogBugz case
export const getCaseLinkTool: Tool = {
  name: 'get_case_link',
  annotations: { readOnlyHint: true },
  description: 'Gets a direct URL link to a FogBugz case.',
  inputSchema: {
    type: 'object',
    properties: {
      caseId: {
        type: 'number',
        description: 'The ID of the case to get a link for',
      },
    },
    required: ['caseId'],
  },
};

// Tool: Create a new FogBugz project
export const createProjectTool: Tool = {
  name: 'create_project',
  annotations: { readOnlyHint: false },
  description: 'Creates a new project in FogBugz.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the project to create',
      },
      primaryContact: {
        type: ['string', 'number'],
        description: 'User ID or name of the primary contact for the project',
        optional: true,
      },
      isInbox: {
        type: 'boolean',
        description: 'Whether this is an inbox project (default: false)',
        optional: true,
      },
      allowPublicSubmit: {
        type: 'boolean',
        description: 'Whether to allow public submissions to this project',
        optional: true,
      }
    },
    required: ['name'],
  },
};

// Tool: Get detailed information about a specific case
export const getCaseTool: Tool = {
  name: 'get_case',
  annotations: { readOnlyHint: true },
  description: 'Gets detailed information about a specific FogBugz case, including events/comments history.',
  inputSchema: {
    type: 'object',
    properties: {
      caseId: {
        type: 'number',
        description: 'The ID of the case to fetch',
      },
      cols: {
        type: 'string',
        description: 'Comma-separated list of columns to return (default: sTitle,sStatus,sPriority,sProject,sArea,sFixFor,sPersonAssignedTo,events)',
        optional: true,
      },
    },
    required: ['caseId'],
  },
};

// Tool: Generic FogBugz API request for experimental queries
export const apiRequestTool: Tool = {
  name: 'api_request',
  description: 'Makes a generic FogBugz API request (XML or JSON, selected automatically). Use this for experimental or advanced queries not covered by other tools. The token is added automatically. Example: cmd=listProjects, cmd=listCategories, cmd=search&q=project:"MyProject"&cols=sTitle,sStatus',
  inputSchema: {
    type: 'object',
    properties: {
      cmd: {
        type: 'string',
        description: 'The FogBugz API command (e.g., listProjects, listCategories, search, listStatuses, listPeople)',
      },
      params: {
        type: 'object',
        description: 'Additional parameters as key-value pairs (e.g., {"q": "project:Website", "cols": "sTitle,sStatus", "max": "10"})',
        optional: true,
      },
    },
    required: ['cmd'],
  },
};

// Tool: Resolve a FogBugz case
export const resolveCaseTool: Tool = {
  name: 'resolve_case',
  annotations: { readOnlyHint: false },
  description: 'Resolves (marks as fixed/completed) a FogBugz case.',
  inputSchema: {
    type: 'object',
    properties: {
      caseId: {
        type: 'number',
        description: 'The ID of the case to resolve',
      },
      comment: {
        type: 'string',
        description: 'Comment to add when resolving. Plain text only.',
        optional: true,
      },
      ixStatus: {
        type: 'number',
        description: 'Status ID to resolve with (use api_request with cmd=listStatuses to find valid IDs)',
        optional: true,
      },
    },
    required: ['caseId'],
  },
};

// Tool: Reopen a FogBugz case
export const reopenCaseTool: Tool = {
  name: 'reopen_case',
  annotations: { readOnlyHint: false },
  description: 'Reopens a previously closed or resolved FogBugz case.',
  inputSchema: {
    type: 'object',
    properties: {
      caseId: {
        type: 'number',
        description: 'The ID of the case to reopen',
      },
      comment: {
        type: 'string',
        description: 'Comment to add when reopening. Plain text only.',
        optional: true,
      },
    },
    required: ['caseId'],
  },
};

// Tool: Close a FogBugz case
export const closeCaseTool: Tool = {
  name: 'close_case',
  annotations: { readOnlyHint: false },
  description: 'Closes a FogBugz case.',
  inputSchema: {
    type: 'object',
    properties: {
      caseId: {
        type: 'number',
        description: 'The ID of the case to close',
      },
      comment: {
        type: 'string',
        description: 'Comment to add when closing. Plain text only.',
        optional: true,
      },
    },
    required: ['caseId'],
  },
};

// Tool: List all people/users in FogBugz
export const listPeopleTool: Tool = {
  name: 'list_people',
  annotations: { readOnlyHint: true },
  description: 'Lists all people (users) in FogBugz with their IDs, names, and emails.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// Tool: List all case categories
export const listCategoriesTool: Tool = {
  name: 'list_categories',
  annotations: { readOnlyHint: true },
  description: 'Lists all case categories in FogBugz (e.g., Bug, Feature Request, Inquiry).',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// Tool: View project details
export const viewProjectTool: Tool = {
  name: 'view_project',
  annotations: { readOnlyHint: true },
  description: 'Gets detailed information about a specific FogBugz project.',
  inputSchema: {
    type: 'object',
    properties: {
      ixProject: {
        type: 'number',
        description: 'The project ID to view',
      },
    },
    required: ['ixProject'],
  },
};

// Tool: View area details
export const viewAreaTool: Tool = {
  name: 'view_area',
  annotations: { readOnlyHint: true },
  description: 'Gets detailed information about a specific FogBugz area.',
  inputSchema: {
    type: 'object',
    properties: {
      ixArea: {
        type: 'number',
        description: 'The area ID to view',
      },
    },
    required: ['ixArea'],
  },
};

// All tools
export const fogbugzTools = [
  createCaseTool,
  updateCaseTool,
  assignCaseTool,
  resolveCaseTool,
  reopenCaseTool,
  closeCaseTool,
  listUserCasesTool,
  searchCasesTool,
  getCaseLinkTool,
  getCaseTool,
  listPeopleTool,
  listCategoriesTool,
  viewProjectTool,
  viewAreaTool,
  createProjectTool,
  apiRequestTool,
]; 