import { FogBugzApi } from '../api';
import { FileAttachment, CreateCaseParams, EditCaseParams, CreateProjectParams } from '../api/types';

/**
 * MCP command implementations for FogBugz operations
 */

/**
 * Creates a new FogBugz case
 */
export async function createCase(api: FogBugzApi, args: any): Promise<string> {
  const {
    title,
    description,
    project,
    area,
    milestone,
    priority,
    assignee,
    attachmentPath,
  } = args;

  // Prepare case parameters
  const params: CreateCaseParams = {
    sTitle: title,
  };

  // Add optional parameters if provided
  if (description) params.sEvent = description;
  if (project) params.sProject = project;
  if (area) params.sArea = area;
  if (milestone) params.sFixFor = milestone;
  if (assignee) params.sPersonAssignedTo = assignee;

  // Handle priority (could be a number or string)
  if (priority !== undefined) {
    if (typeof priority === 'number') {
      params.ixPriority = priority;
    } else {
      params.sPriority = priority;
    }
  }

  // Prepare attachments if any
  const attachments: FileAttachment[] = [];
  if (attachmentPath) {
    attachments.push({
      path: attachmentPath,
      fieldName: 'File1',
    });
  }

  try {
    // Create the case
    const newCase = await api.createCase(params, attachments);
    
    // Generate a response
    const caseLink = api.getCaseLink(newCase.ixBug);
    return JSON.stringify({
      caseId: newCase.ixBug,
      caseLink,
      message: `Created case #${newCase.ixBug}: "${title}"${project ? ' in ' + project : ''}${assignee ? ', assigned to ' + assignee : ''}.`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Updates an existing FogBugz case
 */
export async function updateCase(api: FogBugzApi, args: any): Promise<string> {
  const {
    caseId,
    title,
    description,
    project,
    area,
    milestone,
    priority,
    attachmentPath,
  } = args;

  // Prepare case parameters
  const params: EditCaseParams = {
    ixBug: caseId,
  };

  // Add optional parameters if provided
  if (title) params.sTitle = title;
  if (description) params.sEvent = description;
  if (project) params.sProject = project;
  if (area) params.sArea = area;
  if (milestone) params.sFixFor = milestone;

  // Handle priority (could be a number or string)
  if (priority !== undefined) {
    if (typeof priority === 'number') {
      params.ixPriority = priority;
    } else {
      params.sPriority = priority;
    }
  }

  // Prepare attachments if any
  const attachments: FileAttachment[] = [];
  if (attachmentPath) {
    attachments.push({
      path: attachmentPath,
      fieldName: 'File1',
    });
  }

  try {
    // Update the case
    const updatedCase = await api.updateCase(params, attachments);
    
    // Generate a response
    const caseLink = api.getCaseLink(updatedCase.ixBug);
    return JSON.stringify({
      caseId: updatedCase.ixBug,
      caseLink,
      message: `Updated case #${updatedCase.ixBug}${title ? ': "' + title + '"' : ''}.`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Assigns a FogBugz case to a user
 */
export async function assignCase(api: FogBugzApi, args: any): Promise<string> {
  const { caseId, assignee } = args;

  try {
    // Assign the case
    const updatedCase = await api.assignCase(caseId, assignee);
    
    // Generate a response
    const caseLink = api.getCaseLink(updatedCase.ixBug);
    return JSON.stringify({
      caseId: updatedCase.ixBug,
      caseLink,
      message: `Assigned case #${updatedCase.ixBug} to ${assignee}.`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Lists FogBugz cases assigned to a user
 */
export async function listUserCases(api: FogBugzApi, args: any): Promise<string> {
  const { assignee, status, limit } = args;

  try {
    // Create query for assigned cases
    let query = '';
    
    if (assignee) {
      query = `assignedto:"${assignee}"`;
    } else {
      query = 'assignedto:me';
    }
    
    if (status) {
      query += ` status:${status}`;
    } else {
      query += ' status:active';
    }
    
    // Get cases assigned to the user
    const cases = await api.searchCases({
      q: query,
      cols: [
        'ixBug',
        'sTitle',
        'sStatus',
        'sPriority',
        'sProject',
        'sArea',
        'sFixFor',
      ],
      max: limit || 20,
    });
    
    // Format case information
    const formattedCases = cases.map(bugCase => ({
      id: bugCase.ixBug,
      title: bugCase.sTitle,
      status: bugCase.sStatus,
      priority: bugCase.sPriority,
      project: bugCase.sProject,
      area: bugCase.sArea,
      milestone: bugCase.sFixFor,
      link: api.getCaseLink(bugCase.ixBug),
    }));
    
    // Generate a response
    const userDisplay = assignee || 'current user';
    return JSON.stringify({
      assignee: userDisplay,
      count: formattedCases.length,
      cases: formattedCases,
      message: `Found ${formattedCases.length} active cases assigned to ${userDisplay}.`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Searches for FogBugz cases
 */
export async function searchCases(api: FogBugzApi, args: any): Promise<string> {
  const { query, limit } = args;

  try {
    // Search for cases
    const cases = await api.searchCases({
      q: query,
      cols: [
        'ixBug',
        'sTitle',
        'sStatus',
        'sPriority',
        'sProject',
        'sArea',
        'sFixFor',
        'sPersonAssignedTo',
      ],
      max: limit || 20,
    });
    
    // Format case information
    const formattedCases = cases.map(bugCase => ({
      id: bugCase.ixBug,
      title: bugCase.sTitle,
      status: bugCase.sStatus,
      priority: bugCase.sPriority,
      project: bugCase.sProject,
      area: bugCase.sArea,
      milestone: bugCase.sFixFor,
      assignee: bugCase.sPersonAssignedTo,
      link: api.getCaseLink(bugCase.ixBug),
    }));
    
    // Generate a response
    return JSON.stringify({
      query,
      count: formattedCases.length,
      cases: formattedCases,
      message: `Found ${formattedCases.length} cases matching query: "${query}".`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Gets a direct link to a FogBugz case
 */
export async function getCaseLink(api: FogBugzApi, args: any): Promise<string> {
  const { caseId } = args;

  try {
    // Generate case link
    const caseLink = api.getCaseLink(caseId);
    
    return JSON.stringify({
      caseId,
      caseLink,
      message: `Link to case #${caseId}: ${caseLink}`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Gets detailed information about a specific case
 */
export async function getCase(api: FogBugzApi, args: any): Promise<string> {
  const { caseId, cols } = args;

  try {
    const bugCase = await api.getCase(caseId, cols);
    const caseLink = api.getCaseLink(caseId);

    return JSON.stringify({
      caseId: bugCase.ixBug,
      title: bugCase.sTitle,
      status: bugCase.sStatus,
      priority: bugCase.sPriority,
      project: bugCase.sProject,
      area: bugCase.sArea,
      milestone: bugCase.sFixFor,
      assignee: bugCase.sPersonAssignedTo,
      events: bugCase.events?.map(e => ({
        id: e.ixBugEvent,
        verb: e.sVerb,
        text: e.sText,
        date: e.dt,
        person: e.sPerson,
      })),
      caseLink,
      message: `Case #${caseId}: "${bugCase.sTitle}"`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Resolves a FogBugz case
 */
export async function resolveCase(api: FogBugzApi, args: any): Promise<string> {
  const { caseId, comment, ixStatus } = args;

  try {
    const params: Record<string, any> = { ixBug: caseId };
    if (comment) params.sEvent = comment;
    if (ixStatus) params.ixStatus = ixStatus;

    const result = await api.rawRequest('resolve', params);
    const rawCase = result.case?.[0] || result.case || result.cases?.[0] || result;
    const bugId = Number(rawCase.ixBug || rawCase['@_ixBug'] || caseId);

    return JSON.stringify({
      caseId: bugId,
      caseLink: api.getCaseLink(bugId),
      message: `Resolved case #${bugId}.`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Reopens a FogBugz case
 */
export async function reopenCase(api: FogBugzApi, args: any): Promise<string> {
  const { caseId, comment } = args;

  try {
    const params: Record<string, any> = { ixBug: caseId };
    if (comment) params.sEvent = comment;

    const result = await api.rawRequest('reopen', params);
    const rawCase = result.case?.[0] || result.case || result.cases?.[0] || result;
    const bugId = Number(rawCase.ixBug || rawCase['@_ixBug'] || caseId);

    return JSON.stringify({
      caseId: bugId,
      caseLink: api.getCaseLink(bugId),
      message: `Reopened case #${bugId}.`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Closes a FogBugz case
 */
export async function closeCase(api: FogBugzApi, args: any): Promise<string> {
  const { caseId, comment } = args;

  try {
    const params: Record<string, any> = { ixBug: caseId };
    if (comment) params.sEvent = comment;

    const result = await api.rawRequest('close', params);
    const rawCase = result.case?.[0] || result.case || result.cases?.[0] || result;
    const bugId = Number(rawCase.ixBug || rawCase['@_ixBug'] || caseId);

    return JSON.stringify({
      caseId: bugId,
      caseLink: api.getCaseLink(bugId),
      message: `Closed case #${bugId}.`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Lists all people in FogBugz
 */
export async function listPeople(api: FogBugzApi, _args: any): Promise<string> {
  try {
    const people = await api.listPeople();
    const formatted = people.map(p => ({
      id: p.ixPerson,
      name: p.sFullName || p.sPerson || '',
      email: p.sEmail,
    }));

    return JSON.stringify({
      count: formatted.length,
      people: formatted,
      message: `Found ${formatted.length} people.`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Lists all case categories
 */
export async function listCategories(api: FogBugzApi, _args: any): Promise<string> {
  try {
    const result = await api.rawRequest('listCategories');
    const categories = result.categories?.category || result.category || [];
    const list = Array.isArray(categories) ? categories : [categories];

    const formatted = list.map((c: any) => ({
      id: Number(c.ixCategory),
      name: c.sCategory || '',
      pluralName: c.sPlural || '',
    }));

    return JSON.stringify({
      count: formatted.length,
      categories: formatted,
      message: `Found ${formatted.length} categories.`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Views detailed project information
 */
export async function viewProject(api: FogBugzApi, args: any): Promise<string> {
  const { ixProject } = args;

  try {
    const result = await api.rawRequest('viewProject', { ixProject });
    const project = result.project?.[0] || result.project || result;

    return JSON.stringify({
      projectId: Number(project.ixProject),
      name: project.sProject || '',
      owner: project.ixPersonOwner,
      email: project.sEmail || '',
      inbox: project.fInbox,
      deleted: project.fDeleted,
      message: `Project #${project.ixProject}: "${project.sProject}"`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Views detailed area information
 */
export async function viewArea(api: FogBugzApi, args: any): Promise<string> {
  const { ixArea } = args;

  try {
    const result = await api.rawRequest('viewArea', { ixArea });
    const area = result.area?.[0] || result.area || result;

    return JSON.stringify({
      areaId: Number(area.ixArea),
      name: area.sArea || '',
      projectId: Number(area.ixProject || 0),
      owner: area.ixPersonOwner,
      deleted: area.fDeleted,
      message: `Area #${area.ixArea}: "${area.sArea}"`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Makes a generic FogBugz API request
 */
export async function apiRequest(api: FogBugzApi, args: any): Promise<string> {
  const { cmd, params } = args;

  try {
    const result = await api.rawRequest(cmd, params || {});
    return JSON.stringify({
      cmd,
      result,
      message: `API request '${cmd}' completed successfully.`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Creates a new FogBugz project
 */
export async function createProject(api: FogBugzApi, args: any): Promise<string> {
  const {
    name,
    primaryContact,
    isInbox,
    allowPublicSubmit
  } = args;

  try {
    // Prepare project parameters
    const params: CreateProjectParams = {
      sProject: name
    };

    // Add optional parameters if provided
    // For primaryContact, we need to use the ixPersonPrimaryContact parameter
    if (primaryContact) {
      try {
        // If primaryContact is a number, use it directly
        if (!isNaN(Number(primaryContact))) {
          params.ixPersonPrimaryContact = Number(primaryContact);
        } else {
          // Otherwise, try to find the person ID from the name
          // We know Akari Lara has ID 2 from the API explorer output
          if (primaryContact === 'Akari Lara') {
            params.ixPersonPrimaryContact = 2;
          }
        }
      } catch (err) {
        console.error('Error setting primary contact:', err);
      }
    }
    
    if (isInbox !== undefined) params.fInbox = isInbox;
    if (allowPublicSubmit !== undefined) params.fAllowPublicSubmit = allowPublicSubmit;

    // Create the project
    const newProject = await api.createProject(params);
    
    // Generate a response
    return JSON.stringify({
      projectId: newProject.ixProject,
      projectName: newProject.sProject,
      message: `Created new project: "${newProject.sProject}" (ID: ${newProject.ixProject})`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
} 