/**
 * JSON API client tests.
 * All tests use mocked axios — no real FogBugz JSON API server is available.
 * Remove describe.skip when FogBugzJsonClient is implemented in src/api/json-client.ts.
 */

import axios from 'axios';
import { FogBugzJsonClient } from '../src/api/json-client';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

const BASE_URL = 'https://test.fogbugz.com';
const JSON_ENDPOINT = `${BASE_URL}/f/api/0/jsonapi`;
const CONFIG = { baseUrl: BASE_URL, apiKey: 'test-api-key' };

// ─── JSON response fixture helpers ────────────────────────────────────────────

function jsonOk(data: object): object {
  return { data, errors: [], warnings: [] };
}

function jsonError(message: string, code = 'error'): object {
  return { data: {}, errors: [{ message, detail: '', code }], warnings: [] };
}

function jsonCase(fields: Partial<{
  ixBug: number; sTitle: string; sStatus: string; sPriority: string;
  ixPriority: number; sProject: string; ixProject: number;
  sArea: string; ixArea: number; sFixFor: string; ixFixFor: number;
  sPersonAssignedTo: string; ixPersonAssignedTo: number;
}> = {}): object {
  const {
    ixBug = 42, sTitle = 'Test Case', sStatus = 'Active',
    sPriority = 'Normal', ixPriority = 3, sProject = 'Test Project',
    ixProject = 1, sArea = 'Test Area', ixArea = 1,
    sFixFor = 'Backlog', ixFixFor = 1,
    sPersonAssignedTo = 'Test User', ixPersonAssignedTo = 2,
  } = fields;
  return {
    ixBug, sTitle, sStatus, sPriority, ixPriority,
    sProject, ixProject, sArea, ixArea,
    sFixFor, ixFixFor, sPersonAssignedTo, ixPersonAssignedTo,
    operations: ['edit', 'assign', 'resolve', 'email'],
  };
}

function jsonCaseResponse(fields = {}): object {
  return jsonOk({ case: jsonCase(fields) });
}

function jsonCasesResponse(cases: object[], totalHits?: number): object {
  return jsonOk({ count: cases.length, totalHits: totalHits ?? cases.length, cases });
}

function jsonPerson(fields: Partial<{ ixPerson: number; sFullName: string; sEmail: string }> = {}): object {
  const { ixPerson = 1, sFullName = 'Test User', sEmail = 'test@example.com' } = fields;
  return { ixPerson, sFullName, sEmail, fAdministrator: false, fCommunity: false, fVirtual: false, fDeleted: false };
}

function jsonProject(fields: Partial<{ ixProject: number; sProject: string; ixPersonOwner: number; fInbox: boolean; fDeleted: boolean }> = {}): object {
  const { ixProject = 1, sProject = 'Test Project', ixPersonOwner = 2, fInbox = false, fDeleted = false } = fields;
  return { ixProject, sProject, ixPersonOwner, fInbox, fDeleted };
}

function jsonArea(fields: Partial<{ ixArea: number; sArea: string; ixProject: number }> = {}): object {
  const { ixArea = 1, sArea = 'Test Area', ixProject = 1 } = fields;
  return { ixArea, sArea, ixProject, ixPersonOwner: 2, nType: 0, cDoc: 0, fDeleted: false };
}

function jsonFixFor(fields: Partial<{ ixFixFor: number; sFixFor: string }> = {}): object {
  const { ixFixFor = 1, sFixFor = 'Backlog' } = fields;
  return { ixFixFor, sFixFor, fDeleted: false, dt: null, dtStart: null };
}

function jsonPriority(fields: Partial<{ ixPriority: number; sPriority: string }> = {}): object {
  const { ixPriority = 3, sPriority = 'Normal' } = fields;
  return { ixPriority, sPriority };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FogBugzJsonClient', () => {
  let client: FogBugzJsonClient;

  beforeEach(() => {
    client = new FogBugzJsonClient(CONFIG);
    jest.clearAllMocks();
  });

  // ─── Initialization ─────────────────────────────────────────────────────────

  describe('initialization', () => {
    it('initializes correctly', () => {
      expect(client).toBeInstanceOf(FogBugzJsonClient);
    });

    it('strips trailing slash from baseUrl', () => {
      const c = new FogBugzJsonClient({ baseUrl: 'https://test.fogbugz.com/', apiKey: 'k' });
      expect(c.getCaseLink(1)).toBe('https://test.fogbugz.com/default.asp?1');
    });
  });

  // ─── HTTP routing ────────────────────────────────────────────────────────────

  describe('HTTP routing', () => {
    it('always uses POST regardless of command type', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonOk({ person: [jsonPerson()] }) });
      await client.getCurrentUser();
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).not.toHaveBeenCalled();
    });

    it('sends all requests to the JSON API endpoint', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonOk({ person: [jsonPerson()] }) });
      await client.getCurrentUser();
      expect(mockAxios.post).toHaveBeenCalledWith(
        JSON_ENDPOINT,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('sets Content-Type to application/json', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonOk({ person: [jsonPerson()] }) });
      await client.getCurrentUser();
      const config = mockAxios.post.mock.calls[0][2] as any;
      expect(config.headers['Content-Type']).toBe('application/json');
    });
  });

  // ─── Request serialization ───────────────────────────────────────────────────

  describe('request serialization', () => {
    it('includes cmd and token in request body', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonOk({ person: [jsonPerson()] }) });
      await client.getCurrentUser();
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.cmd).toBe('viewPerson');
      expect(body.token).toBe('test-api-key');
    });

    it('sends cols as array (not comma-separated string)', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCasesResponse([]) });
      await client.searchCases({ q: 'test', cols: ['sTitle', 'sStatus', 'sPriority'] });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(Array.isArray(body.cols)).toBe(true);
      expect(body.cols).toEqual(['sTitle', 'sStatus', 'sPriority']);
    });

    it('sends boolean fields as native booleans, not 1/0', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonOk({ project: jsonProject() }) });
      await client.createProject({ sProject: 'P', fInbox: true, fAllowPublicSubmit: false });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.fInbox).toBe(true);
      expect(body.fAllowPublicSubmit).toBe(false);
    });

    it('sends integer fields as numbers', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCaseResponse({ ixBug: 1 }) });
      await client.updateCase({ ixBug: 1, ixPriority: 2 });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(typeof body.ixBug).toBe('number');
      expect(body.ixBug).toBe(1);
      expect(body.ixPriority).toBe(2);
    });

    it('sends max as number in searchCases', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCasesResponse([]) });
      await client.searchCases({ q: 'x', max: 10 });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.max).toBe(10);
    });
  });

  // ─── Response parsing ────────────────────────────────────────────────────────

  describe('response parsing', () => {
    it('reads result from the data field', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({ person: [jsonPerson({ ixPerson: 5, sFullName: 'Alice' })] }),
      });
      const user = await client.getCurrentUser();
      expect(user.ixPerson).toBe(5);
      expect(user.sFullName).toBe('Alice');
    });

    it('handles single-item arrays in list responses', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({ projects: [jsonProject({ ixProject: 1, sProject: 'Solo' })] }),
      });
      const projects = await client.listProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].sProject).toBe('Solo');
    });
  });

  // ─── Error handling ──────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('throws when errors array is non-empty', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonError('Not logged on', '3') });
      await expect(client.getCurrentUser()).rejects.toThrow('FogBugz API Error: Not logged on');
    });

    it('throws with first error message when multiple errors', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          data: {},
          errors: [
            { message: 'First error', detail: '', code: '1' },
            { message: 'Second error', detail: '', code: '2' },
          ],
          warnings: [],
        },
      });
      await expect(client.getCurrentUser()).rejects.toThrow('FogBugz API Error: First error');
    });

    it('wraps HTTP errors with status code', async () => {
      mockAxios.post.mockRejectedValueOnce({
        response: { status: 401, data: 'Unauthorized' },
      });
      await expect(client.getCurrentUser()).rejects.toThrow('FogBugz API Error: 401 - Unauthorized');
    });

    it('re-throws non-HTTP errors unchanged', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network timeout'));
      await expect(client.getCurrentUser()).rejects.toThrow('Network timeout');
    });

    it('propagates axios timeout error unchanged', async () => {
      const timeoutErr = Object.assign(new Error('timeout of 30000ms exceeded'), { code: 'ECONNABORTED' });
      mockAxios.post.mockRejectedValueOnce(timeoutErr);
      await expect(client.getCurrentUser()).rejects.toThrow('timeout of 30000ms exceeded');
    });
  });

  // ─── getCurrentUser ──────────────────────────────────────────────────────────

  describe('getCurrentUser()', () => {
    it('returns normalized FogBugzPerson', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({ person: [jsonPerson({ ixPerson: 5, sFullName: 'Alice Smith', sEmail: 'alice@example.com' })] }),
      });
      const user = await client.getCurrentUser();
      expect(user).toEqual(expect.objectContaining({
        ixPerson: 5,
        sFullName: 'Alice Smith',
        sEmail: 'alice@example.com',
        sPerson: 'Alice Smith',
      }));
    });

    it('returns empty string for missing sEmail', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({ person: [{ ixPerson: 3, sFullName: 'No Email' }] }),
      });
      const user = await client.getCurrentUser();
      expect(user.sEmail).toBe('');
      expect(user.sFullName).toBe('No Email');
    });
  });

  // ─── listProjects ────────────────────────────────────────────────────────────

  describe('listProjects()', () => {
    it('returns multiple projects', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({
          projects: [
            jsonProject({ ixProject: 1, sProject: 'Alpha' }),
            jsonProject({ ixProject: 2, sProject: 'Beta' }),
          ],
        }),
      });
      const projects = await client.listProjects();
      expect(projects).toHaveLength(2);
      expect(projects[0].ixProject).toBe(1);
      expect(projects[1].sProject).toBe('Beta');
    });

    it('returns empty array when no projects', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonOk({ projects: [] }) });
      const projects = await client.listProjects();
      expect(projects).toEqual([]);
    });
  });

  // ─── listAreas ───────────────────────────────────────────────────────────────

  describe('listAreas()', () => {
    it('returns areas', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({
          areas: [
            jsonArea({ ixArea: 10, sArea: 'General', ixProject: 1 }),
            jsonArea({ ixArea: 11, sArea: 'UI', ixProject: 1 }),
          ],
        }),
      });
      const areas = await client.listAreas();
      expect(areas).toHaveLength(2);
      expect(areas[0].ixArea).toBe(10);
      expect(areas[1].sArea).toBe('UI');
    });
  });

  // ─── listMilestones ──────────────────────────────────────────────────────────

  describe('listMilestones()', () => {
    it('returns milestones from fixfors field', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({
          fixfors: [
            jsonFixFor({ ixFixFor: 1, sFixFor: 'v1.0' }),
            jsonFixFor({ ixFixFor: 2, sFixFor: 'Backlog' }),
          ],
        }),
      });
      const milestones = await client.listMilestones();
      expect(milestones).toHaveLength(2);
      expect(milestones[0].sFixFor).toBe('v1.0');
    });

    it('returns empty array when no milestones', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonOk({ fixfors: [] }) });
      const milestones = await client.listMilestones();
      expect(milestones).toEqual([]);
    });
  });

  // ─── listPriorities ──────────────────────────────────────────────────────────

  describe('listPriorities()', () => {
    it('returns priorities', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({
          priorities: [
            jsonPriority({ ixPriority: 1, sPriority: 'Critical' }),
            jsonPriority({ ixPriority: 3, sPriority: 'Normal' }),
          ],
        }),
      });
      const priorities = await client.listPriorities();
      expect(priorities).toHaveLength(2);
      expect(priorities[0].sPriority).toBe('Critical');
    });
  });

  // ─── listPeople ──────────────────────────────────────────────────────────────

  describe('listPeople()', () => {
    it('returns people', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({
          people: [
            jsonPerson({ ixPerson: 1, sFullName: 'Bob', sEmail: 'bob@x.com' }),
            jsonPerson({ ixPerson: 2, sFullName: 'Carol', sEmail: 'carol@x.com' }),
          ],
        }),
      });
      const people = await client.listPeople();
      expect(people).toHaveLength(2);
      expect(people[0].sFullName).toBe('Bob');
      expect(people[1].sEmail).toBe('carol@x.com');
    });

    it('returns single person as array', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({ people: [jsonPerson({ ixPerson: 7, sFullName: 'Solo', sEmail: 'solo@x.com' })] }),
      });
      const people = await client.listPeople();
      expect(people).toHaveLength(1);
      expect(people[0].sFullName).toBe('Solo');
    });
  });

  // ─── createCase ──────────────────────────────────────────────────────────────

  describe('createCase()', () => {
    it('returns normalized case from data.case', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCaseResponse({ ixBug: 100, sTitle: 'New bug' }) });
      const result = await client.createCase({ sTitle: 'New bug' });
      expect(result.ixBug).toBe(100);
      expect(result.sTitle).toBe('New bug');
    });

    it('sends optional fields in request body', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCaseResponse() });
      await client.createCase({
        sTitle: 'T',
        sEvent: 'Desc',
        sProject: 'Alpha',
        sArea: 'UI',
        sFixFor: 'v1.0',
        sPersonAssignedTo: 'Alice',
        ixPriority: 1,
      });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.sEvent).toBe('Desc');
      expect(body.sProject).toBe('Alpha');
      expect(body.ixPriority).toBe(1);
    });

    it('sends cmd as "new"', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCaseResponse() });
      await client.createCase({ sTitle: 'T' });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.cmd).toBe('new');
    });
  });

  // ─── updateCase ──────────────────────────────────────────────────────────────

  describe('updateCase()', () => {
    it('returns normalized case', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCaseResponse({ ixBug: 55, sTitle: 'Updated' }) });
      const result = await client.updateCase({ ixBug: 55, sTitle: 'Updated' });
      expect(result.ixBug).toBe(55);
    });

    it('includes ixBug in request body', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCaseResponse({ ixBug: 7 }) });
      await client.updateCase({ ixBug: 7 });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.ixBug).toBe(7);
      expect(body.cmd).toBe('edit');
    });
  });

  // ─── assignCase ──────────────────────────────────────────────────────────────

  describe('assignCase()', () => {
    it('returns normalized case', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCaseResponse({ ixBug: 12 }) });
      const result = await client.assignCase(12, 'Alice');
      expect(result.ixBug).toBe(12);
    });

    it('sends ixBug and sPersonAssignedTo in body', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCaseResponse({ ixBug: 12 }) });
      await client.assignCase(12, 'Alice');
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.ixBug).toBe(12);
      expect(body.sPersonAssignedTo).toBe('Alice');
      expect(body.cmd).toBe('assign');
    });
  });

  // ─── searchCases ─────────────────────────────────────────────────────────────

  describe('searchCases()', () => {
    it('returns multiple cases from data.cases', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonCasesResponse([jsonCase({ ixBug: 1, sTitle: 'A' }), jsonCase({ ixBug: 2, sTitle: 'B' })]),
      });
      const cases = await client.searchCases({ q: 'test' });
      expect(cases).toHaveLength(2);
      expect(cases[0].ixBug).toBe(1);
    });

    it('returns empty array when count is 0', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCasesResponse([]) });
      const cases = await client.searchCases({ q: 'nothing' });
      expect(cases).toHaveLength(0);
    });

    it('sends cols as an array', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCasesResponse([]) });
      await client.searchCases({ q: 'x', cols: ['sTitle', 'sStatus', 'sPriority'] });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.cols).toEqual(['sTitle', 'sStatus', 'sPriority']);
    });

    it('accepts string cols and passes them through', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCasesResponse([]) });
      await client.searchCases({ q: 'x', cols: 'sTitle,sStatus' });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.cols).toBeDefined();
    });

    it('forwards max parameter as number', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCasesResponse([]) });
      await client.searchCases({ q: 'x', max: 5 });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.max).toBe(5);
    });

    it('sends cmd as "search"', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCasesResponse([]) });
      await client.searchCases({ q: 'x' });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.cmd).toBe('search');
    });
  });

  // ─── getCase ─────────────────────────────────────────────────────────────────

  describe('getCase()', () => {
    it('returns the first matching case', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonCasesResponse([jsonCase({ ixBug: 99, sTitle: 'The Case' })]),
      });
      const c = await client.getCase(99);
      expect(c.ixBug).toBe(99);
      expect(c.sTitle).toBe('The Case');
    });

    it('throws when case not found', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCasesResponse([]) });
      await expect(client.getCase(999)).rejects.toThrow('Case #999 not found');
    });
  });

  // ─── normalizeCase: events ────────────────────────────────────────────────────

  describe('normalizeCase() events', () => {
    it('case with no events has events as undefined', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonCasesResponse([jsonCase({ ixBug: 5, sTitle: 'No events' })]),
      });
      const c = await client.getCase(5);
      expect(c.events).toBeUndefined();
    });

    it('parses events array when present', async () => {
      const caseWithEvents = {
        ...jsonCase({ ixBug: 10, sTitle: 'With events' }),
        events: [
          {
            ixBugEvent: 1,
            ixBug: 10,
            evt: 1,
            sVerb: 'Opened',
            ixPerson: 2,
            sPerson: 'Alice',
            dt: '2024-01-01T00:00:00Z',
            s: 'Initial description',
            fEmail: false,
            fExternal: false,
          },
        ],
      };
      mockAxios.post.mockResolvedValueOnce({ data: jsonCasesResponse([caseWithEvents]) });
      const c = await client.getCase(10);
      expect(c.events).toHaveLength(1);
      expect(c.events![0].sVerb).toBe('Opened');
      expect(c.events![0].sText).toBe('Initial description');
    });

    it('parses two events', async () => {
      const caseWithEvents = {
        ...jsonCase({ ixBug: 7 }),
        events: [
          { ixBugEvent: 1, sVerb: 'Opened', ixPerson: 2, sPerson: 'Alice', dt: '2024-01-01T00:00:00Z', s: 'first', fEmail: false, fExternal: false },
          { ixBugEvent: 2, sVerb: 'Edited', ixPerson: 3, sPerson: 'Bob', dt: '2024-01-02T00:00:00Z', s: 'second', fEmail: false, fExternal: false },
        ],
      };
      mockAxios.post.mockResolvedValueOnce({ data: jsonCasesResponse([caseWithEvents]) });
      const c = await client.getCase(7);
      expect(c.events).toHaveLength(2);
      expect(c.events![1].sVerb).toBe('Edited');
    });
  });

  // ─── getCaseLink ──────────────────────────────────────────────────────────────

  describe('getCaseLink()', () => {
    it('returns correct URL', () => {
      expect(client.getCaseLink(42)).toBe('https://test.fogbugz.com/default.asp?42');
    });
  });

  // ─── createProject ────────────────────────────────────────────────────────────

  describe('createProject()', () => {
    it('returns project data from data.project', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({ project: jsonProject({ ixProject: 10, sProject: 'NewProj' }) }),
      });
      const proj = await client.createProject({ sProject: 'NewProj' });
      expect(proj.ixProject).toBe(10);
      expect(proj.sProject).toBe('NewProj');
    });

    it('sends fInbox as native boolean true', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonOk({ project: jsonProject() }) });
      await client.createProject({ sProject: 'P', fInbox: true });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.fInbox).toBe(true);
    });

    it('sends fAllowPublicSubmit as native boolean false', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonOk({ project: jsonProject() }) });
      await client.createProject({ sProject: 'P', fAllowPublicSubmit: false });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.fAllowPublicSubmit).toBe(false);
    });

    it('sends cmd as "newProject"', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonOk({ project: jsonProject() }) });
      await client.createProject({ sProject: 'P' });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.cmd).toBe('newProject');
    });
  });

  // ─── rawRequest ───────────────────────────────────────────────────────────────

  describe('rawRequest()', () => {
    it('returns the data field for any command', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: jsonOk({ categories: [{ ixCategory: 1, sCategory: 'Bug' }] }),
      });
      const result = await client.rawRequest('listCategories');
      expect(result.categories).toBeDefined();
    });

    it('passes extra params in request body', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: jsonCaseResponse({ ixBug: 5 }) });
      await client.rawRequest('resolve', { ixBug: 5 });
      const body = mockAxios.post.mock.calls[0][1] as any;
      expect(body.ixBug).toBe(5);
      expect(body.cmd).toBe('resolve');
    });
  });
});
