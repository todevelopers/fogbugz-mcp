/**
 * MCP Tool definitions for FogBugz operations
 */

// Define the Tool interface since we're having trouble importing it
interface Tool {
  name: string;
  title?: string;
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
  title: 'Create Case',
  annotations: { readOnlyHint: false, destructiveHint: true },
  description: 'Creates a new FogBugz case. Example: create a bug titled "Login fails on Safari" in project "Website", area "Auth", assigned to "john@example.com", priority 2.',
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
  title: 'Update Case',
  annotations: { readOnlyHint: false, destructiveHint: true },
  description: 'Updates an existing FogBugz case with new field values. Example: change the title of case 42 to "Improved error message", move it to milestone "v2.1", or add a comment explaining what changed.',
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
  title: 'Assign Case',
  annotations: { readOnlyHint: false, destructiveHint: true },
  description: 'Assigns a FogBugz case to a specific user. Example: assign case 42 to "jane@example.com" or to "Jane Smith".',
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
  title: 'List My Cases',
  annotations: { readOnlyHint: true },
  description: 'Lists FogBugz cases assigned to a specific user. Example: list all active cases assigned to "john@example.com", or list up to 20 cases for the current user.',
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
  title: 'Search Cases',
  annotations: { readOnlyHint: true },
  description: 'Searches for FogBugz cases using FogBugz search syntax. Examples: "project:Website status:Active" to find open Website cases; "assignedTo:jane priority:1" for Jane\'s urgent cases; "tag:regression milestone:v2.0" for regression bugs in a milestone.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query. Supports FogBugz search syntax, e.g. "project:Website status:Active", "assignedTo:jane priority:1", or a plain keyword like "crash".',
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
  title: 'Get Case Link',
  annotations: { readOnlyHint: true },
  description: 'Returns a direct URL to a FogBugz case that can be shared with teammates. Example: get the link for case 42.',
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
  title: 'Create Project',
  annotations: { readOnlyHint: false, destructiveHint: true },
  description: 'Creates a new project in FogBugz. Example: create project "Mobile App" with primary contact "alice@example.com".',
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
  title: 'Get Case',
  annotations: { readOnlyHint: true },
  description: 'Gets detailed information about a specific FogBugz case, including its full event/comment history. Example: fetch all details and comments for case 42.',
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
  title: 'Raw API Request',
  annotations: { readOnlyHint: false, destructiveHint: true },
  description: 'Generic XML API escape-hatch for FogBugz commands not covered by dedicated tools. WARNING: Can execute any API command the configured key permits, including destructive operations (delete, edit users, bulk modify). Prefer specific tools when available; use this only when no dedicated tool fits the need. Examples: cmd=listProjects; cmd=listCategories; cmd=search with params {"q": "project:Website", "cols": "sTitle,sStatus", "max": "10"}.',
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
  title: 'Resolve Case',
  annotations: { readOnlyHint: false, destructiveHint: true },
  description: 'Resolves (marks as fixed/completed) a FogBugz case. Example: resolve case 42 with comment "Fixed in commit abc123".',
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
  title: 'Reopen Case',
  annotations: { readOnlyHint: false, destructiveHint: true },
  description: 'Reopens a previously closed or resolved FogBugz case. Example: reopen case 42 with comment "Issue reproduced on v2.1".',
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
  title: 'Close Case',
  annotations: { readOnlyHint: false, destructiveHint: true },
  description: 'Closes a FogBugz case (marks it as will not fix / done). Example: close case 42 with comment "Closed — duplicate of case 10".',
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
  title: 'List People',
  annotations: { readOnlyHint: true },
  description: 'Lists all people (users) in FogBugz with their IDs, names, and email addresses. Useful for finding the correct assignee name or ID before creating or updating a case.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// Tool: List all case categories
export const listCategoriesTool: Tool = {
  name: 'list_categories',
  title: 'List Categories',
  annotations: { readOnlyHint: true },
  description: 'Lists all case categories defined in FogBugz (e.g., Bug, Feature Request, Inquiry). Returns category IDs and names.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// Tool: List all projects
export const listProjectsTool: Tool = {
  name: 'list_projects',
  title: 'List Projects',
  annotations: { readOnlyHint: true },
  description: 'Lists all active (non-deleted) projects in FogBugz with their IDs and names. Example: retrieve all projects to find the correct project ID before creating a case.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// Tool: List all milestones (fix-fors)
export const listMilestonesTool: Tool = {
  name: 'list_milestones',
  title: 'List Milestones',
  annotations: { readOnlyHint: true },
  description: 'Lists milestones (fix-for versions) in FogBugz. Optionally filter by project ID. Example: list all milestones for project 5 to find the right target release.',
  inputSchema: {
    type: 'object',
    properties: {
      ixProject: {
        type: 'number',
        description: 'Optional project ID to filter milestones.',
      },
    },
    required: [],
  },
};

// Tool: List all case statuses
export const listStatusesTool: Tool = {
  name: 'list_statuses',
  title: 'List Statuses',
  annotations: { readOnlyHint: true },
  description: 'Lists all case statuses defined in FogBugz. Optionally filter by category ID. Returns status names and whether each status counts as resolved. Example: list statuses for category 1 (Bug) to see available workflow states.',
  inputSchema: {
    type: 'object',
    properties: {
      ixCategory: {
        type: 'number',
        description: 'Optional category ID to filter statuses.',
      },
    },
    required: [],
  },
};

// Tool: View project details
export const viewProjectTool: Tool = {
  name: 'view_project',
  title: 'View Project',
  annotations: { readOnlyHint: true },
  description: 'Gets detailed information about a specific FogBugz project by its numeric ID. Example: view details for project with ID 3.',
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
  title: 'View Area',
  annotations: { readOnlyHint: true },
  description: 'Gets detailed information about a specific FogBugz area by its numeric ID. Example: view details for area with ID 7.',
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
  listProjectsTool,
  listMilestonesTool,
  listStatusesTool,
  viewProjectTool,
  viewAreaTool,
  createProjectTool,
  apiRequestTool,
];
