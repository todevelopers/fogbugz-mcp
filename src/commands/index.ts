import { IFogBugzClient } from '../api';
import { CreateCaseParams, EditCaseParams, CreateProjectParams } from '../api/types';

/**
 * MCP command implementations for FogBugz operations
 */

/**
 * Creates a new FogBugz case
 */
export async function createCase(api: IFogBugzClient, args: any): Promise<string> {
  const {
    title,
    description,
    project,
    area,
    milestone,
    priority,
    assignee,
  } = args;

  const params: CreateCaseParams = {
    sTitle: title,
  };

  if (description) params.sEvent = description;
  if (project) params.sProject = project;
  if (area) params.sArea = area;
  if (milestone) params.sFixFor = milestone;
  if (assignee) params.sPersonAssignedTo = assignee;

  if (priority !== undefined) {
    if (typeof priority === 'number') {
      params.ixPriority = priority;
    } else {
      params.sPriority = priority;
    }
  }

  try {
    const newCase = await api.createCase(params);
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
export async function updateCase(api: IFogBugzClient, args: any): Promise<string> {
  const {
    caseId,
    title,
    description,
    project,
    area,
    milestone,
    priority,
  } = args;

  const params: EditCaseParams = {
    ixBug: caseId,
  };

  if (title) params.sTitle = title;
  if (description) params.sEvent = description;
  if (project) params.sProject = project;
  if (area) params.sArea = area;
  if (milestone) params.sFixFor = milestone;

  if (priority !== undefined) {
    if (typeof priority === 'number') {
      params.ixPriority = priority;
    } else {
      params.sPriority = priority;
    }
  }

  try {
    const updatedCase = await api.updateCase(params);
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
export async function assignCase(api: IFogBugzClient, args: any): Promise<string> {
  const { caseId, assignee } = args;

  try {
    const updatedCase = await api.assignCase(caseId, assignee);
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
export async function listUserCases(api: IFogBugzClient, args: any): Promise<string> {
  const { assignee, status, limit } = args;

  try {
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
export async function searchCases(api: IFogBugzClient, args: any): Promise<string> {
  const { query, limit } = args;

  try {
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
export async function getCaseLink(api: IFogBugzClient, args: any): Promise<string> {
  const { caseId } = args;

  try {
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
export async function getCase(api: IFogBugzClient, args: any): Promise<string> {
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
export async function resolveCase(api: IFogBugzClient, args: any): Promise<string> {
  const { caseId, comment, ixStatus } = args;

  try {
    const params: Record<string, any> = { ixBug: caseId };
    if (comment) params.sEvent = comment;
    if (ixStatus) params.ixStatus = ixStatus;

    const result = await api.rawRequest('resolve', params);
    // XML client returns the root element; JSON client returns data directly.
    // Both may carry case info at result.case (object or array).
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
export async function reopenCase(api: IFogBugzClient, args: any): Promise<string> {
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
export async function closeCase(api: IFogBugzClient, args: any): Promise<string> {
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
export async function listPeople(api: IFogBugzClient, _args: any): Promise<string> {
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
export async function listCategories(api: IFogBugzClient, _args: any): Promise<string> {
  try {
    const result = await api.rawRequest('listCategories');
    const categories = result.categories?.category || result.category || result.categories || [];
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
 * Lists all active projects
 */
export async function listProjects(api: IFogBugzClient, _args: any): Promise<string> {
  try {
    const projects = await api.listProjects();
    const formatted = projects.map(p => ({
      id: p.ixProject,
      name: p.sProject,
    }));

    return JSON.stringify({
      count: formatted.length,
      projects: formatted,
      message: `Found ${formatted.length} projects.`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Lists milestones (fix-fors), optionally filtered by project
 */
export async function listMilestones(api: IFogBugzClient, args: any): Promise<string> {
  try {
    const params: Record<string, any> = {};
    if (args?.ixProject) params.ixProject = args.ixProject;

    const result = await api.rawRequest('listFixFors', params);
    const fixfors = result.fixfors?.fixfor || result.fixfor || result.fixfors || [];
    const list = Array.isArray(fixfors) ? fixfors : [fixfors];

    const formatted = list.map((f: any) => ({
      id: Number(f.ixFixFor),
      name: f.sFixFor || '',
      projectId: Number(f.ixProject || 0),
      date: f.dt || '',
    }));

    return JSON.stringify({
      count: formatted.length,
      milestones: formatted,
      message: `Found ${formatted.length} milestones.`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Lists all case statuses, optionally filtered by category
 */
export async function listStatuses(api: IFogBugzClient, args: any): Promise<string> {
  try {
    const params: Record<string, any> = {};
    if (args?.ixCategory) params.ixCategory = args.ixCategory;

    const result = await api.rawRequest('listStatuses', params);
    const statuses = result.statuses?.status || result.status || result.statuses || [];
    const list = Array.isArray(statuses) ? statuses : [statuses];

    const formatted = list.map((s: any) => ({
      id: Number(s.ixStatus),
      name: s.sStatus || '',
      resolved: s.fResolved === '1' || s.fResolved === true,
    }));

    return JSON.stringify({
      count: formatted.length,
      statuses: formatted,
      message: `Found ${formatted.length} statuses.`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Views detailed project information
 */
export async function viewProject(api: IFogBugzClient, args: any): Promise<string> {
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
export async function viewArea(api: IFogBugzClient, args: any): Promise<string> {
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
export async function apiRequest(api: IFogBugzClient, args: any): Promise<string> {
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
export async function createProject(api: IFogBugzClient, args: any): Promise<string> {
  const {
    name,
    primaryContact,
    isInbox,
    allowPublicSubmit,
  } = args;

  try {
    const params: CreateProjectParams = {
      sProject: name,
    };

    if (primaryContact !== undefined && !isNaN(Number(primaryContact))) {
      params.ixPersonPrimaryContact = Number(primaryContact);
    }

    if (isInbox !== undefined) params.fInbox = isInbox;
    if (allowPublicSubmit !== undefined) params.fAllowPublicSubmit = allowPublicSubmit;

    const newProject = await api.createProject(params);

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
