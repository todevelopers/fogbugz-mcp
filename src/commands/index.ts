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
  } = args || {};

  if (!title) return JSON.stringify({ error: 'title is required' });

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
  } = args || {};

  if (!caseId) return JSON.stringify({ error: 'caseId is required' });

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
  const { caseId, assignee } = args || {};

  if (!caseId) return JSON.stringify({ error: 'caseId is required' });
  if (!assignee) return JSON.stringify({ error: 'assignee is required' });

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
  const { assignee, status, limit } = args || {};

  try {
    let query = '';

    if (assignee) {
      const safeAssignee = assignee.replace(/"/g, '');
      query = `assignedto:"${safeAssignee}"`;
    } else {
      query = 'assignedto:me';
    }

    if (status) {
      const safeStatus = status.replace(/\s+/g, '');
      query += ` status:${safeStatus}`;
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
  const { query, limit } = args || {};

  if (!query) return JSON.stringify({ error: 'query is required' });

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
  const { caseId } = args || {};

  if (!caseId) return JSON.stringify({ error: 'caseId is required' });

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
  const { caseId, cols } = args || {};

  if (!caseId) return JSON.stringify({ error: 'caseId is required' });

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
  const { caseId, comment, ixStatus } = args || {};

  if (!caseId) return JSON.stringify({ error: 'caseId is required' });

  try {
    const bugCase = await api.resolveCase(Number(caseId), comment, ixStatus);

    return JSON.stringify({
      caseId: bugCase.ixBug,
      caseLink: api.getCaseLink(bugCase.ixBug),
      message: `Resolved case #${bugCase.ixBug}.`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Reopens a FogBugz case
 */
export async function reopenCase(api: IFogBugzClient, args: any): Promise<string> {
  const { caseId, comment } = args || {};

  if (!caseId) return JSON.stringify({ error: 'caseId is required' });

  try {
    const bugCase = await api.reopenCase(Number(caseId), comment);

    return JSON.stringify({
      caseId: bugCase.ixBug,
      caseLink: api.getCaseLink(bugCase.ixBug),
      message: `Reopened case #${bugCase.ixBug}.`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Closes a FogBugz case
 */
export async function closeCase(api: IFogBugzClient, args: any): Promise<string> {
  const { caseId, comment } = args || {};

  if (!caseId) return JSON.stringify({ error: 'caseId is required' });

  try {
    const bugCase = await api.closeCase(Number(caseId), comment);

    return JSON.stringify({
      caseId: bugCase.ixBug,
      caseLink: api.getCaseLink(bugCase.ixBug),
      message: `Closed case #${bugCase.ixBug}.`,
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
    const categories = await api.listCategories();

    const formatted = categories.map(c => ({
      id: c.ixCategory,
      name: c.sCategory,
      pluralName: c.sPlural,
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
    const milestones = await api.listMilestones(args?.ixProject);

    const formatted = milestones.map(f => ({
      id: f.ixFixFor,
      name: f.sFixFor,
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
    const statuses = await api.listStatuses(args?.ixCategory);

    const formatted = statuses.map(s => ({
      id: s.ixStatus,
      name: s.sStatus,
      resolved: s.fResolved,
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
  const { ixProject } = args || {};

  if (!ixProject) return JSON.stringify({ error: 'ixProject is required' });

  try {
    const project = await api.viewProject(ixProject);

    return JSON.stringify({
      projectId: project.ixProject,
      name: project.sProject,
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
  const { ixArea } = args || {};

  if (!ixArea) return JSON.stringify({ error: 'ixArea is required' });

  try {
    const area = await api.viewArea(ixArea);

    return JSON.stringify({
      areaId: area.ixArea,
      name: area.sArea,
      projectId: area.ixProject,
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
  const { cmd, params } = args || {};

  if (!cmd) return JSON.stringify({ error: 'cmd is required' });

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
  } = args || {};

  if (!name) return JSON.stringify({ error: 'name is required' });

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
