import axios from 'axios';
import { FogBugzXmlClient as FogBugzApi } from '../src/api';
import {
  xmlResponse,
  xmlError,
  xmlCaseResponse,
  xmlCasesResponse,
  xmlPersonResponse,
  xmlPeopleResponse,
  xmlProjectResponse,
  xmlProjectsResponse,
  xmlAreasResponse,
  xmlFixForsResponse,
  xmlPrioritiesResponse,
  xmlStatusesResponse,
  xmlCategoriesResponse,
} from './fixtures';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

const BASE_URL = 'https://test.fogbugz.com';
const API_ENDPOINT = `${BASE_URL}/api.asp`;
const CONFIG = { baseUrl: BASE_URL, apiKey: 'test-api-key' };

describe('FogBugzApi', () => {
  let api: FogBugzApi;

  beforeEach(() => {
    api = new FogBugzApi(CONFIG);
    jest.clearAllMocks();
  });

  // ─── Initialization ───────────────────────────────────────────────────────

  it('initializes correctly', () => {
    expect(api).toBeInstanceOf(FogBugzApi);
  });

  it('strips trailing slash from baseUrl', () => {
    const a = new FogBugzApi({ baseUrl: 'https://test.fogbugz.com/', apiKey: 'k' });
    expect(a.getCaseLink(1)).toBe('https://test.fogbugz.com/default.asp?1');
  });

  // ─── HTTP routing ─────────────────────────────────────────────────────────

  describe('HTTP method routing', () => {
    it('uses POST for read commands (viewPerson)', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlPersonResponse() });
      await api.getCurrentUser();
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).not.toHaveBeenCalled();
      const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(body.get('cmd')).toBe('viewPerson');
      expect(body.get('token')).toBe('test-api-key');
    });

    it('uses POST for write command (new)', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCaseResponse() });
      await api.createCase({ sTitle: 'Test' });
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).not.toHaveBeenCalled();
      expect(mockAxios.post).toHaveBeenCalledWith(
        API_ENDPOINT,
        expect.any(URLSearchParams),
        expect.any(Object)
      );
    });

    it('uses POST for write command (edit)', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCaseResponse() });
      await api.updateCase({ ixBug: 1 });
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
    });

    it('uses POST for write command (assign)', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCaseResponse() });
      await api.assignCase(1, 'Alice');
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
    });

    it('uses POST for write command (newProject)', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlProjectResponse() });
      await api.createProject({ sProject: 'P' });
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
    });

    it('uses POST for search (read command)', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCasesResponse([]) });
      await api.searchCases({ q: 'test' });
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).not.toHaveBeenCalled();
    });
  });

  // ─── Error handling ───────────────────────────────────────────────────────

  describe('error handling', () => {
    it('throws on XML <error> element', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlError('Invalid token') });
      await expect(api.getCurrentUser()).rejects.toThrow('FogBugz API Error: Invalid token');
    });

    it('throws on missing <response> root', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: '<garbage/>' });
      await expect(api.getCurrentUser()).rejects.toThrow('FogBugz API Error: unexpected XML response');
    });

    it('wraps HTTP errors', async () => {
      mockAxios.post.mockRejectedValueOnce({
        response: { status: 401, data: 'Unauthorized' },
      });
      await expect(api.getCurrentUser()).rejects.toThrow('FogBugz API Error: 401 - Unauthorized');
    });

    it('re-throws non-HTTP errors unchanged', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network timeout'));
      await expect(api.getCurrentUser()).rejects.toThrow('Network timeout');
    });
  });

  // ─── getCurrentUser ───────────────────────────────────────────────────────

  describe('getCurrentUser()', () => {
    it('returns normalized FogBugzPerson', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlPersonResponse({ ixPerson: 5, sFullName: 'Alice Smith', sEmail: 'alice@example.com' }),
      });
      const user = await api.getCurrentUser();
      expect(user).toEqual({
        ixPerson: 5,
        sFullName: 'Alice Smith',
        sEmail: 'alice@example.com',
        sPerson: 'Alice Smith',
      });
    });
  });

  // ─── listProjects ─────────────────────────────────────────────────────────

  describe('listProjects()', () => {
    it('returns multiple projects', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlProjectsResponse([
          { ixProject: 1, sProject: 'Alpha' },
          { ixProject: 2, sProject: 'Beta' },
        ]),
      });
      const projects = await api.listProjects();
      expect(projects).toHaveLength(2);
      expect(projects[0].ixProject).toBe(1);
      expect(projects[1].sProject).toBe('Beta');
    });

    it('returns single project', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlProjectsResponse([{ ixProject: 3, sProject: 'Solo' }]),
      });
      const projects = await api.listProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].sProject).toBe('Solo');
    });
  });

  // ─── listAreas ────────────────────────────────────────────────────────────

  describe('listAreas()', () => {
    it('returns areas', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlAreasResponse([
          { ixArea: 10, sArea: 'General', ixProject: 1 },
          { ixArea: 11, sArea: 'UI', ixProject: 1 },
        ]),
      });
      const areas = await api.listAreas();
      expect(areas).toHaveLength(2);
      expect(areas[0].ixArea).toBe(10);
      expect(areas[1].sArea).toBe('UI');
    });
  });

  // ─── listMilestones ───────────────────────────────────────────────────────

  describe('listMilestones()', () => {
    it('returns milestones', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlFixForsResponse([
          { ixFixFor: 1, sFixFor: 'v1.0' },
          { ixFixFor: 2, sFixFor: 'Backlog' },
        ]),
      });
      const milestones = await api.listMilestones();
      expect(milestones).toHaveLength(2);
      expect(milestones[0].sFixFor).toBe('v1.0');
    });
  });

  // ─── listPriorities ───────────────────────────────────────────────────────

  describe('listPriorities()', () => {
    it('returns priorities', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlPrioritiesResponse([
          { ixPriority: 1, sPriority: 'Critical' },
          { ixPriority: 3, sPriority: 'Normal' },
        ]),
      });
      const priorities = await api.listPriorities();
      expect(priorities).toHaveLength(2);
      expect(priorities[0].sPriority).toBe('Critical');
    });
  });

  // ─── listPeople ───────────────────────────────────────────────────────────

  describe('listPeople()', () => {
    it('returns people', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlPeopleResponse([
          { ixPerson: 1, sFullName: 'Bob', sEmail: 'bob@x.com' },
          { ixPerson: 2, sFullName: 'Carol', sEmail: 'carol@x.com' },
        ]),
      });
      const people = await api.listPeople();
      expect(people).toHaveLength(2);
      expect(people[0].sFullName).toBe('Bob');
      expect(people[1].sEmail).toBe('carol@x.com');
    });
  });

  // ─── createCase ───────────────────────────────────────────────────────────

  describe('createCase()', () => {
    it('returns normalized case from case[0] path', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlCaseResponse({ ixBug: 100, sTitle: 'New bug' }),
      });
      const result = await api.createCase({ sTitle: 'New bug' });
      expect(result.ixBug).toBe(100);
      expect(result.sTitle).toBe('New bug');
    });

    it('sends optional fields when provided', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCaseResponse() });
      await api.createCase({
        sTitle: 'T',
        sEvent: 'Desc',
        sProject: 'Alpha',
        sArea: 'UI',
        sFixFor: 'v1.0',
        sPersonAssignedTo: 'Alice',
        ixPriority: 1,
      });
      const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(body.get('sEvent')).toBe('Desc');
      expect(body.get('sProject')).toBe('Alpha');
      expect(body.get('ixPriority')).toBe('1');
    });
  });

  // ─── updateCase ───────────────────────────────────────────────────────────

  describe('updateCase()', () => {
    it('returns normalized case', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlCaseResponse({ ixBug: 55, sTitle: 'Updated' }),
      });
      const result = await api.updateCase({ ixBug: 55, sTitle: 'Updated' });
      expect(result.ixBug).toBe(55);
    });

    it('includes ixBug in POST body', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCaseResponse({ ixBug: 7 }) });
      await api.updateCase({ ixBug: 7 });
      const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(body.get('ixBug')).toBe('7');
    });
  });

  // ─── assignCase ───────────────────────────────────────────────────────────

  describe('assignCase()', () => {
    it('returns normalized case', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCaseResponse({ ixBug: 12 }) });
      const result = await api.assignCase(12, 'Alice');
      expect(result.ixBug).toBe(12);
    });

    it('sends ixBug and sPersonAssignedTo', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCaseResponse({ ixBug: 12 }) });
      await api.assignCase(12, 'Alice');
      const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(body.get('ixBug')).toBe('12');
      expect(body.get('sPersonAssignedTo')).toBe('Alice');
    });
  });

  // ─── searchCases ──────────────────────────────────────────────────────────

  describe('searchCases()', () => {
    it('returns multiple cases', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlCasesResponse([
          { ixBug: 1, sTitle: 'A' },
          { ixBug: 2, sTitle: 'B' },
        ]),
      });
      const cases = await api.searchCases({ q: 'test' });
      expect(cases).toHaveLength(2);
      expect(cases[0].ixBug).toBe(1);
    });

    it('returns empty array when count=0', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCasesResponse([], 0) });
      const cases = await api.searchCases({ q: 'nothing' });
      expect(cases).toHaveLength(0);
    });

    it('joins cols array as comma-separated string', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCasesResponse([]) });
      await api.searchCases({ q: 'x', cols: ['sTitle', 'sStatus', 'sPriority'] });
      const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(body.get('cols')).toBe('sTitle,sStatus,sPriority');
    });

    it('forwards max parameter', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCasesResponse([]) });
      await api.searchCases({ q: 'x', max: 5 });
      const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(body.get('max')).toBe('5');
    });
  });

  // ─── getCase ──────────────────────────────────────────────────────────────

  describe('getCase()', () => {
    it('returns the first matching case', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlCasesResponse([{ ixBug: 99, sTitle: 'The Case' }]),
      });
      const c = await api.getCase(99);
      expect(c.ixBug).toBe(99);
      expect(c.sTitle).toBe('The Case');
    });

    it('throws when case not found', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCasesResponse([], 0) });
      await expect(api.getCase(999)).rejects.toThrow('Case #999 not found');
    });
  });

  // ─── normalizeCase: ixBug from attribute ──────────────────────────────────

  describe('normalizeCase() via createCase()', () => {
    it('reads ixBug from @_ixBug attribute when element is absent', async () => {
      // Provide XML where ixBug only appears as an XML attribute
      const xml = xmlResponse(`<case ixBug="77"><sTitle>From attr</sTitle></case>`);
      mockAxios.post.mockResolvedValueOnce({ data: xml });
      const result = await api.createCase({ sTitle: 'From attr' });
      expect(result.ixBug).toBe(77);
    });

    it('parses events when present', async () => {
      const xml = xmlResponse(`
        <case ixBug="10">
          <ixBug>10</ixBug>
          <sTitle>With events</sTitle>
          <events>
            <event>
              <ixBugEvent>1</ixBugEvent>
              <sVerb>Opened</sVerb>
              <s>Initial description</s>
              <dt>2024-01-01T00:00:00Z</dt>
              <sPerson>Alice</sPerson>
              <ixPerson>2</ixPerson>
            </event>
          </events>
        </case>
      `);
      mockAxios.post.mockResolvedValueOnce({ data: xml });
      const result = await api.createCase({ sTitle: 'With events' });
      expect(result.events).toHaveLength(1);
      expect(result.events![0].sVerb).toBe('Opened');
      expect(result.events![0].sText).toBe('Initial description');
    });
  });

  // ─── getCaseLink ──────────────────────────────────────────────────────────

  describe('getCaseLink()', () => {
    it('returns correct URL', () => {
      expect(api.getCaseLink(42)).toBe('https://test.fogbugz.com/default.asp?42');
    });
  });

  // ─── createProject ────────────────────────────────────────────────────────

  describe('createProject()', () => {
    it('returns project data', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlProjectResponse({ ixProject: 10, sProject: 'NewProj' }),
      });
      const proj = await api.createProject({ sProject: 'NewProj' });
      expect(proj.ixProject).toBe(10);
      expect(proj.sProject).toBe('NewProj');
    });

    it('sends fInbox as 1/0', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlProjectResponse() });
      await api.createProject({ sProject: 'P', fInbox: true });
      const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(body.get('fInbox')).toBe('1');
    });

    it('sends fAllowPublicSubmit as 1/0', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlProjectResponse() });
      await api.createProject({ sProject: 'P', fAllowPublicSubmit: false });
      const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(body.get('fAllowPublicSubmit')).toBe('0');
    });
  });

  // ─── listMilestones edge cases ────────────────────────────────────────────

  describe('listMilestones() edge cases', () => {
    it('returns empty array when no milestones', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlResponse('<fixfors></fixfors>'),
      });
      const milestones = await api.listMilestones();
      expect(milestones).toEqual([]);
    });
  });

  // ─── listPeople edge cases ────────────────────────────────────────────────

  describe('listPeople() edge cases', () => {
    it('returns single person as array', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlPeopleResponse([{ ixPerson: 7, sFullName: 'Solo', sEmail: 'solo@x.com' }]),
      });
      const people = await api.listPeople();
      expect(people).toHaveLength(1);
      expect(people[0].sFullName).toBe('Solo');
    });
  });

  // ─── getCurrentUser edge cases ────────────────────────────────────────────

  describe('getCurrentUser() edge cases', () => {
    it('returns empty string for missing sEmail', async () => {
      // Use raw XML without <sEmail> to test the missing-field fallback
      mockAxios.post.mockResolvedValueOnce({
        data: xmlResponse(`<person><ixPerson>3</ixPerson><sFullName>No Email</sFullName></person>`),
      });
      const user = await api.getCurrentUser();
      expect(user.sEmail).toBe('');
      expect(user.sFullName).toBe('No Email');
    });
  });

  // ─── error handling edge cases ────────────────────────────────────────────

  describe('error handling edge cases', () => {
    it('propagates axios timeout error unchanged', async () => {
      const timeoutErr = Object.assign(new Error('timeout of 30000ms exceeded'), {
        code: 'ECONNABORTED',
      });
      mockAxios.post.mockRejectedValueOnce(timeoutErr);
      await expect(api.getCurrentUser()).rejects.toThrow('timeout of 30000ms exceeded');
    });

    it('includes HTTP status in error for 401', async () => {
      mockAxios.post.mockRejectedValueOnce({
        response: { status: 401, data: 'Unauthorized' },
      });
      await expect(api.getCurrentUser()).rejects.toThrow('401');
    });
  });

  // ─── normalizeCase: events edge cases ─────────────────────────────────────

  describe('normalizeCase() events edge cases', () => {
    it('case with no <events> element has events as undefined', async () => {
      // xmlCase fixture has no events element
      mockAxios.post.mockResolvedValueOnce({
        data: xmlCasesResponse([{ ixBug: 5, sTitle: 'No events' }]),
      });
      const c = await api.getCase(5);
      expect(c.events).toBeUndefined();
    });

    it('case with single event returns 1-element events array', async () => {
      const xml = xmlResponse(`
        <cases count="1">
          <case ixBug="6">
            <ixBug>6</ixBug>
            <sTitle>One event</sTitle>
            <events>
              <event>
                <ixBugEvent>10</ixBugEvent>
                <sVerb>Opened</sVerb>
                <s>text</s>
                <dt>2024-01-01T00:00:00Z</dt>
                <sPerson>Alice</sPerson>
                <ixPerson>2</ixPerson>
              </event>
            </events>
          </case>
        </cases>
      `);
      mockAxios.post.mockResolvedValueOnce({ data: xml });
      const c = await api.getCase(6);
      expect(c.events).toHaveLength(1);
      expect(c.events![0].sVerb).toBe('Opened');
    });

    it('case with two events returns 2-element events array', async () => {
      const xml = xmlResponse(`
        <cases count="1">
          <case ixBug="7">
            <ixBug>7</ixBug>
            <sTitle>Two events</sTitle>
            <events>
              <event>
                <ixBugEvent>1</ixBugEvent>
                <sVerb>Opened</sVerb>
                <s>first</s>
                <dt>2024-01-01T00:00:00Z</dt>
                <sPerson>Alice</sPerson>
                <ixPerson>2</ixPerson>
              </event>
              <event>
                <ixBugEvent>2</ixBugEvent>
                <sVerb>Edited</sVerb>
                <s>second</s>
                <dt>2024-01-02T00:00:00Z</dt>
                <sPerson>Bob</sPerson>
                <ixPerson>3</ixPerson>
              </event>
            </events>
          </case>
        </cases>
      `);
      mockAxios.post.mockResolvedValueOnce({ data: xml });
      const c = await api.getCase(7);
      expect(c.events).toHaveLength(2);
      expect(c.events![1].sVerb).toBe('Edited');
    });
  });

  // ─── rawRequest ───────────────────────────────────────────────────────────

  describe('rawRequest()', () => {
    it('returns parsed root for a read command', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlResponse('<categories><category><ixCategory>1</ixCategory></category></categories>'),
      });
      const result = await api.rawRequest('listCategories');
      expect(result.categories).toBeDefined();
    });

    it('uses POST for a write command via rawRequest', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlCaseResponse({ ixBug: 5 }) });
      await api.rawRequest('resolve', { ixBug: 5 });
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
    });

    // ── listStatuses (used by list_statuses tool handler) ──────────────────────

    it('listStatuses — returns parsed statuses', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlStatusesResponse([
          { ixStatus: 1, sStatus: 'Active', fResolved: 0 },
          { ixStatus: 2, sStatus: 'Resolved', fResolved: 1 },
        ]),
      });
      const result = await api.rawRequest('listStatuses');
      expect(result.statuses).toBeDefined();
    });

    it('listStatuses — sends cmd=listStatuses in POST body', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlStatusesResponse([]) });
      await api.rawRequest('listStatuses');
      const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(body.get('cmd')).toBe('listStatuses');
    });

    it('listStatuses — sends ixCategory filter when provided', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: xmlStatusesResponse([]) });
      await api.rawRequest('listStatuses', { ixCategory: 2 });
      const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(body.get('cmd')).toBe('listStatuses');
      expect(body.get('ixCategory')).toBe('2');
    });

    // ── listFixFors with ixProject filter (used by list_milestones tool handler) ─

    it('listFixFors — sends ixProject filter when provided', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlResponse('<fixfors></fixfors>'),
      });
      await api.rawRequest('listFixFors', { ixProject: 5 });
      const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(body.get('cmd')).toBe('listFixFors');
      expect(body.get('ixProject')).toBe('5');
    });
  });

  // ─── listStatuses single-item ─────────────────────────────────────────────

  describe('listStatuses() single-item response', () => {
    it('returns a 1-element array when only one status exists', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlStatusesResponse([{ ixStatus: 1, sStatus: 'Active', fResolved: 0 }]),
      });
      const statuses = await api.listStatuses();
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses).toHaveLength(1);
      expect(statuses[0].ixStatus).toBe(1);
      expect(statuses[0].sStatus).toBe('Active');
      expect(statuses[0].fResolved).toBe(false);
    });
  });

  // ─── listCategories single-item ───────────────────────────────────────────

  describe('listCategories() single-item response', () => {
    it('returns a 1-element array when only one category exists', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: xmlCategoriesResponse([{ ixCategory: 2, sCategory: 'Feature', sPlural: 'Features' }]),
      });
      const categories = await api.listCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories).toHaveLength(1);
      expect(categories[0].ixCategory).toBe(2);
      expect(categories[0].sCategory).toBe('Feature');
    });
  });
});
