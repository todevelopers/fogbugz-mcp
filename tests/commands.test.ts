import { FogBugzXmlClient as FogBugzApi } from '../src/api';
import * as commands from '../src/commands';

/**
 * Build a minimal FogBugzApi mock.
 * Each test overrides the methods it needs.
 */
function makeMockApi(overrides: Partial<Record<keyof FogBugzApi, jest.Mock>> = {}): jest.Mocked<FogBugzApi> {
  return {
    getCurrentUser: jest.fn(),
    listProjects: jest.fn(),
    listAreas: jest.fn(),
    listMilestones: jest.fn(),
    listPriorities: jest.fn(),
    listPeople: jest.fn(),
    createCase: jest.fn(),
    updateCase: jest.fn(),
    assignCase: jest.fn(),
    searchCases: jest.fn(),
    getCase: jest.fn(),
    rawRequest: jest.fn(),
    getCaseLink: jest.fn((id: number) => `https://test.fogbugz.com/default.asp?${id}`),
    createProject: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<FogBugzApi>;
}

const CASE_42 = {
  ixBug: 42,
  sTitle: 'Test Case',
  sStatus: 'Active',
  sPriority: 'Normal',
  sProject: 'Alpha',
  sArea: 'General',
  sFixFor: 'v1.0',
  sPersonAssignedTo: 'Alice',
};

// ─── createCase ──────────────────────────────────────────────────────────────

describe('createCase handler', () => {
  it('returns caseId, caseLink, and message on success', async () => {
    const api = makeMockApi({ createCase: jest.fn().mockResolvedValue(CASE_42) });
    const result = JSON.parse(await commands.createCase(api, { title: 'Test Case' }));
    expect(result.caseId).toBe(42);
    expect(result.caseLink).toContain('42');
    expect(result.message).toContain('42');
  });

  it('uses ixPriority for numeric priority', async () => {
    const api = makeMockApi({ createCase: jest.fn().mockResolvedValue(CASE_42) });
    await commands.createCase(api, { title: 'T', priority: 1 });
    const params = (api.createCase as jest.Mock).mock.calls[0][0];
    expect(params.ixPriority).toBe(1);
    expect(params.sPriority).toBeUndefined();
  });

  it('uses sPriority for string priority', async () => {
    const api = makeMockApi({ createCase: jest.fn().mockResolvedValue(CASE_42) });
    await commands.createCase(api, { title: 'T', priority: 'Critical' });
    const params = (api.createCase as jest.Mock).mock.calls[0][0];
    expect(params.sPriority).toBe('Critical');
    expect(params.ixPriority).toBeUndefined();
  });

  it('forwards optional fields', async () => {
    const api = makeMockApi({ createCase: jest.fn().mockResolvedValue(CASE_42) });
    await commands.createCase(api, {
      title: 'T', description: 'Desc', project: 'Alpha', area: 'UI',
      milestone: 'v2', assignee: 'Bob',
    });
    const params = (api.createCase as jest.Mock).mock.calls[0][0];
    expect(params.sEvent).toBe('Desc');
    expect(params.sProject).toBe('Alpha');
    expect(params.sArea).toBe('UI');
    expect(params.sFixFor).toBe('v2');
    expect(params.sPersonAssignedTo).toBe('Bob');
  });

  it('returns error JSON on API failure (never throws)', async () => {
    const api = makeMockApi({ createCase: jest.fn().mockRejectedValue(new Error('API down')) });
    const result = JSON.parse(await commands.createCase(api, { title: 'T' }));
    expect(result.error).toBe('API down');
  });

});

// ─── updateCase ──────────────────────────────────────────────────────────────

describe('updateCase handler', () => {
  it('returns caseId and caseLink on success', async () => {
    const api = makeMockApi({ updateCase: jest.fn().mockResolvedValue(CASE_42) });
    const result = JSON.parse(await commands.updateCase(api, { caseId: 42 }));
    expect(result.caseId).toBe(42);
    expect(result.caseLink).toContain('42');
  });

  it('forwards ixBug from caseId', async () => {
    const api = makeMockApi({ updateCase: jest.fn().mockResolvedValue(CASE_42) });
    await commands.updateCase(api, { caseId: 42 });
    const params = (api.updateCase as jest.Mock).mock.calls[0][0];
    expect(params.ixBug).toBe(42);
  });

  it('uses ixPriority for numeric priority', async () => {
    const api = makeMockApi({ updateCase: jest.fn().mockResolvedValue(CASE_42) });
    await commands.updateCase(api, { caseId: 42, priority: 2 });
    const params = (api.updateCase as jest.Mock).mock.calls[0][0];
    expect(params.ixPriority).toBe(2);
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ updateCase: jest.fn().mockRejectedValue(new Error('not found')) });
    const result = JSON.parse(await commands.updateCase(api, { caseId: 99 }));
    expect(result.error).toBe('not found');
  });
});

// ─── assignCase ──────────────────────────────────────────────────────────────

describe('assignCase handler', () => {
  it('returns caseId and message on success', async () => {
    const api = makeMockApi({ assignCase: jest.fn().mockResolvedValue(CASE_42) });
    const result = JSON.parse(await commands.assignCase(api, { caseId: 42, assignee: 'Alice' }));
    expect(result.caseId).toBe(42);
    expect(result.message).toContain('Alice');
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ assignCase: jest.fn().mockRejectedValue(new Error('unknown person')) });
    const result = JSON.parse(await commands.assignCase(api, { caseId: 1, assignee: 'Nobody' }));
    expect(result.error).toBe('unknown person');
  });
});

// ─── listUserCases ────────────────────────────────────────────────────────────

describe('listUserCases handler', () => {
  const cases = [CASE_42];

  it('uses assignedto:me when no assignee given', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockResolvedValue(cases) });
    await commands.listUserCases(api, {});
    const params = (api.searchCases as jest.Mock).mock.calls[0][0];
    expect(params.q).toContain('assignedto:me');
  });

  it('quotes custom assignee in query', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockResolvedValue(cases) });
    await commands.listUserCases(api, { assignee: 'Bob Jones' });
    const params = (api.searchCases as jest.Mock).mock.calls[0][0];
    expect(params.q).toContain('assignedto:"Bob Jones"');
  });

  it('includes custom status in query', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockResolvedValue(cases) });
    await commands.listUserCases(api, { status: 'resolved' });
    const params = (api.searchCases as jest.Mock).mock.calls[0][0];
    expect(params.q).toContain('status:resolved');
  });

  it('defaults to status:active', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockResolvedValue(cases) });
    await commands.listUserCases(api, {});
    const params = (api.searchCases as jest.Mock).mock.calls[0][0];
    expect(params.q).toContain('status:active');
  });

  it('defaults limit to 20', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockResolvedValue(cases) });
    await commands.listUserCases(api, {});
    const params = (api.searchCases as jest.Mock).mock.calls[0][0];
    expect(params.max).toBe(20);
  });

  it('returns formatted cases in response', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockResolvedValue(cases) });
    const result = JSON.parse(await commands.listUserCases(api, {}));
    expect(result.count).toBe(1);
    expect(result.cases[0].id).toBe(42);
    expect(result.cases[0].link).toContain('42');
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockRejectedValue(new Error('oops')) });
    const result = JSON.parse(await commands.listUserCases(api, {}));
    expect(result.error).toBe('oops');
  });
});

// ─── searchCases ──────────────────────────────────────────────────────────────

describe('searchCases handler', () => {
  it('returns formatted cases', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockResolvedValue([CASE_42]) });
    const result = JSON.parse(await commands.searchCases(api, { query: 'bug' }));
    expect(result.query).toBe('bug');
    expect(result.count).toBe(1);
    expect(result.cases[0].assignee).toBe('Alice');
  });

  it('forwards custom limit', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockResolvedValue([]) });
    await commands.searchCases(api, { query: 'x', limit: 5 });
    expect((api.searchCases as jest.Mock).mock.calls[0][0].max).toBe(5);
  });

  it('defaults limit to 20', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockResolvedValue([]) });
    await commands.searchCases(api, { query: 'x' });
    expect((api.searchCases as jest.Mock).mock.calls[0][0].max).toBe(20);
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockRejectedValue(new Error('bad query')) });
    const result = JSON.parse(await commands.searchCases(api, { query: 'x' }));
    expect(result.error).toBe('bad query');
  });
});

// ─── getCaseLink ─────────────────────────────────────────────────────────────

describe('getCaseLink handler', () => {
  it('returns caseId and caseLink', async () => {
    const api = makeMockApi();
    const result = JSON.parse(await commands.getCaseLink(api, { caseId: 7 }));
    expect(result.caseId).toBe(7);
    expect(result.caseLink).toContain('7');
  });
});

// ─── getCase ─────────────────────────────────────────────────────────────────

describe('getCase handler', () => {
  it('returns full case details', async () => {
    const caseWithEvents = {
      ...CASE_42,
      events: [
        { ixBugEvent: 1, sVerb: 'Opened', sText: 'Hello', dt: '2024-01-01', sPerson: 'Alice', ixPerson: 2 },
      ],
    };
    const api = makeMockApi({ getCase: jest.fn().mockResolvedValue(caseWithEvents) });
    const result = JSON.parse(await commands.getCase(api, { caseId: 42 }));
    expect(result.caseId).toBe(42);
    expect(result.title).toBe('Test Case');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].verb).toBe('Opened');
    expect(result.events[0].text).toBe('Hello');
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ getCase: jest.fn().mockRejectedValue(new Error('Case #999 not found')) });
    const result = JSON.parse(await commands.getCase(api, { caseId: 999 }));
    expect(result.error).toContain('999');
  });
});

// ─── resolveCase ─────────────────────────────────────────────────────────────

describe('resolveCase handler', () => {
  it('returns caseId and message on success', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({ case: [{ ixBug: 42 }] }) });
    const result = JSON.parse(await commands.resolveCase(api, { caseId: 42 }));
    expect(result.caseId).toBe(42);
    expect(result.message).toContain('42');
  });

  it('falls back to input caseId when XML has no ixBug', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({}) });
    const result = JSON.parse(await commands.resolveCase(api, { caseId: 55 }));
    expect(result.caseId).toBe(55);
  });

  it('forwards comment as sEvent', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({ case: [{ ixBug: 1 }] }) });
    await commands.resolveCase(api, { caseId: 1, comment: 'Fixed in v2' });
    const params = (api.rawRequest as jest.Mock).mock.calls[0][1];
    expect(params.sEvent).toBe('Fixed in v2');
  });

  it('does not send sEvent when comment absent', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({ case: [{ ixBug: 1 }] }) });
    await commands.resolveCase(api, { caseId: 1 });
    const params = (api.rawRequest as jest.Mock).mock.calls[0][1];
    expect(params.sEvent).toBeUndefined();
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockRejectedValue(new Error('cannot resolve')) });
    const result = JSON.parse(await commands.resolveCase(api, { caseId: 1 }));
    expect(result.error).toBe('cannot resolve');
  });
});

// ─── reopenCase ──────────────────────────────────────────────────────────────

describe('reopenCase handler', () => {
  it('returns caseId and message', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({ case: [{ ixBug: 10 }] }) });
    const result = JSON.parse(await commands.reopenCase(api, { caseId: 10 }));
    expect(result.caseId).toBe(10);
    expect(result.message).toContain('10');
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockRejectedValue(new Error('fail')) });
    const result = JSON.parse(await commands.reopenCase(api, { caseId: 1 }));
    expect(result.error).toBe('fail');
  });
});

// ─── closeCase ───────────────────────────────────────────────────────────────

describe('closeCase handler', () => {
  it('returns caseId and message', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({ case: [{ ixBug: 20 }] }) });
    const result = JSON.parse(await commands.closeCase(api, { caseId: 20 }));
    expect(result.caseId).toBe(20);
    expect(result.message).toContain('20');
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockRejectedValue(new Error('fail')) });
    const result = JSON.parse(await commands.closeCase(api, { caseId: 1 }));
    expect(result.error).toBe('fail');
  });
});

// ─── listPeople ──────────────────────────────────────────────────────────────

describe('listPeople handler', () => {
  it('returns formatted people list', async () => {
    const api = makeMockApi({
      listPeople: jest.fn().mockResolvedValue([
        { ixPerson: 1, sFullName: 'Alice', sEmail: 'alice@x.com' },
        { ixPerson: 2, sFullName: 'Bob', sEmail: 'bob@x.com' },
      ]),
    });
    const result = JSON.parse(await commands.listPeople(api, {}));
    expect(result.count).toBe(2);
    expect(result.people[0].name).toBe('Alice');
    expect(result.people[1].email).toBe('bob@x.com');
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ listPeople: jest.fn().mockRejectedValue(new Error('fail')) });
    const result = JSON.parse(await commands.listPeople(api, {}));
    expect(result.error).toBe('fail');
  });
});

// ─── listCategories ──────────────────────────────────────────────────────────

describe('listCategories handler', () => {
  it('returns formatted categories', async () => {
    const api = makeMockApi({
      rawRequest: jest.fn().mockResolvedValue({
        categories: {
          category: [
            { ixCategory: 1, sCategory: 'Bug', sPlural: 'Bugs' },
            { ixCategory: 2, sCategory: 'Feature', sPlural: 'Features' },
          ],
        },
      }),
    });
    const result = JSON.parse(await commands.listCategories(api, {}));
    expect(result.count).toBe(2);
    expect(result.categories[0].name).toBe('Bug');
    expect(result.categories[1].pluralName).toBe('Features');
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockRejectedValue(new Error('fail')) });
    const result = JSON.parse(await commands.listCategories(api, {}));
    expect(result.error).toBe('fail');
  });
});

// ─── listProjects ────────────────────────────────────────────────────────────

describe('listProjects handler', () => {
  it('returns formatted projects list', async () => {
    const api = makeMockApi({
      listProjects: jest.fn().mockResolvedValue([
        { ixProject: 1, sProject: 'Alpha' },
        { ixProject: 2, sProject: 'Beta' },
      ]),
    });
    const result = JSON.parse(await commands.listProjects(api, {}));
    expect(result.count).toBe(2);
    expect(result.projects[0].id).toBe(1);
    expect(result.projects[0].name).toBe('Alpha');
    expect(result.projects[1].id).toBe(2);
    expect(result.projects[1].name).toBe('Beta');
    expect(result.message).toContain('2');
  });

  it('returns count 0 and empty array when no projects', async () => {
    const api = makeMockApi({ listProjects: jest.fn().mockResolvedValue([]) });
    const result = JSON.parse(await commands.listProjects(api, {}));
    expect(result.count).toBe(0);
    expect(result.projects).toEqual([]);
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ listProjects: jest.fn().mockRejectedValue(new Error('API down')) });
    const result = JSON.parse(await commands.listProjects(api, {}));
    expect(result.error).toBe('API down');
  });
});

// ─── listMilestones ───────────────────────────────────────────────────────────

describe('listMilestones handler', () => {
  it('returns formatted milestones from nested fixfors.fixfor structure', async () => {
    const api = makeMockApi({
      rawRequest: jest.fn().mockResolvedValue({
        fixfors: {
          fixfor: [
            { ixFixFor: 10, sFixFor: 'v1.0', ixProject: 1, dt: '2024-06-01' },
            { ixFixFor: 11, sFixFor: 'v2.0', ixProject: 1, dt: '2024-12-01' },
          ],
        },
      }),
    });
    const result = JSON.parse(await commands.listMilestones(api, {}));
    expect(result.count).toBe(2);
    expect(result.milestones[0].id).toBe(10);
    expect(result.milestones[0].name).toBe('v1.0');
    expect(result.milestones[0].projectId).toBe(1);
    expect(result.milestones[0].date).toBe('2024-06-01');
    expect(result.milestones[1].name).toBe('v2.0');
  });

  it('handles flat fixfor structure (no wrapper)', async () => {
    const api = makeMockApi({
      rawRequest: jest.fn().mockResolvedValue({
        fixfor: [{ ixFixFor: 5, sFixFor: 'Milestone A', ixProject: 2, dt: '' }],
      }),
    });
    const result = JSON.parse(await commands.listMilestones(api, {}));
    expect(result.count).toBe(1);
    expect(result.milestones[0].name).toBe('Milestone A');
  });

  it('wraps a single object into an array', async () => {
    const api = makeMockApi({
      rawRequest: jest.fn().mockResolvedValue({
        fixfors: { fixfor: { ixFixFor: 7, sFixFor: 'Solo', ixProject: 3, dt: '' } },
      }),
    });
    const result = JSON.parse(await commands.listMilestones(api, {}));
    expect(result.count).toBe(1);
    expect(result.milestones[0].name).toBe('Solo');
  });

  it('calls rawRequest with listFixFors and no ixProject when no filter given', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({ fixfors: { fixfor: [] } }) });
    await commands.listMilestones(api, {});
    const [cmd, params] = (api.rawRequest as jest.Mock).mock.calls[0];
    expect(cmd).toBe('listFixFors');
    expect(params).not.toHaveProperty('ixProject');
  });

  it('passes ixProject filter to rawRequest when provided', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({ fixfors: { fixfor: [] } }) });
    await commands.listMilestones(api, { ixProject: 5 });
    const [cmd, params] = (api.rawRequest as jest.Mock).mock.calls[0];
    expect(cmd).toBe('listFixFors');
    expect(params.ixProject).toBe(5);
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockRejectedValue(new Error('fail')) });
    const result = JSON.parse(await commands.listMilestones(api, {}));
    expect(result.error).toBe('fail');
  });
});

// ─── listStatuses ─────────────────────────────────────────────────────────────

describe('listStatuses handler', () => {
  it('returns formatted statuses from nested statuses.status structure', async () => {
    const api = makeMockApi({
      rawRequest: jest.fn().mockResolvedValue({
        statuses: {
          status: [
            { ixStatus: 1, sStatus: 'Active', fResolved: '0' },
            { ixStatus: 2, sStatus: 'Resolved', fResolved: '1' },
          ],
        },
      }),
    });
    const result = JSON.parse(await commands.listStatuses(api, {}));
    expect(result.count).toBe(2);
    expect(result.statuses[0].id).toBe(1);
    expect(result.statuses[0].name).toBe('Active');
    expect(result.statuses[0].resolved).toBe(false);
    expect(result.statuses[1].name).toBe('Resolved');
    expect(result.statuses[1].resolved).toBe(true);
  });

  it('handles flat status structure (no wrapper)', async () => {
    const api = makeMockApi({
      rawRequest: jest.fn().mockResolvedValue({
        status: [{ ixStatus: 3, sStatus: 'Closed', fResolved: '1' }],
      }),
    });
    const result = JSON.parse(await commands.listStatuses(api, {}));
    expect(result.count).toBe(1);
    expect(result.statuses[0].resolved).toBe(true);
  });

  it('treats boolean true fResolved as resolved', async () => {
    const api = makeMockApi({
      rawRequest: jest.fn().mockResolvedValue({
        statuses: { status: [{ ixStatus: 4, sStatus: 'Done', fResolved: true }] },
      }),
    });
    const result = JSON.parse(await commands.listStatuses(api, {}));
    expect(result.statuses[0].resolved).toBe(true);
  });

  it('wraps a single status object into an array', async () => {
    const api = makeMockApi({
      rawRequest: jest.fn().mockResolvedValue({
        statuses: { status: { ixStatus: 9, sStatus: 'Solo', fResolved: '0' } },
      }),
    });
    const result = JSON.parse(await commands.listStatuses(api, {}));
    expect(result.count).toBe(1);
    expect(result.statuses[0].name).toBe('Solo');
  });

  it('calls rawRequest with listStatuses and no ixCategory when no filter given', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({ statuses: { status: [] } }) });
    await commands.listStatuses(api, {});
    const [cmd, params] = (api.rawRequest as jest.Mock).mock.calls[0];
    expect(cmd).toBe('listStatuses');
    expect(params).not.toHaveProperty('ixCategory');
  });

  it('passes ixCategory filter to rawRequest when provided', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({ statuses: { status: [] } }) });
    await commands.listStatuses(api, { ixCategory: 2 });
    const [cmd, params] = (api.rawRequest as jest.Mock).mock.calls[0];
    expect(cmd).toBe('listStatuses');
    expect(params.ixCategory).toBe(2);
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockRejectedValue(new Error('fail')) });
    const result = JSON.parse(await commands.listStatuses(api, {}));
    expect(result.error).toBe('fail');
  });
});

// ─── viewProject ─────────────────────────────────────────────────────────────

describe('viewProject handler', () => {
  it('returns project details', async () => {
    const api = makeMockApi({
      rawRequest: jest.fn().mockResolvedValue({
        project: [{ ixProject: 3, sProject: 'Alpha', ixPersonOwner: 1, sEmail: 'a@x.com', fInbox: 0, fDeleted: 0 }],
      }),
    });
    const result = JSON.parse(await commands.viewProject(api, { ixProject: 3 }));
    expect(result.projectId).toBe(3);
    expect(result.name).toBe('Alpha');
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockRejectedValue(new Error('not found')) });
    const result = JSON.parse(await commands.viewProject(api, { ixProject: 999 }));
    expect(result.error).toBe('not found');
  });
});

// ─── viewArea ────────────────────────────────────────────────────────────────

describe('viewArea handler', () => {
  it('returns area details', async () => {
    const api = makeMockApi({
      rawRequest: jest.fn().mockResolvedValue({
        area: [{ ixArea: 5, sArea: 'UI', ixProject: 1, ixPersonOwner: 2, fDeleted: 0 }],
      }),
    });
    const result = JSON.parse(await commands.viewArea(api, { ixArea: 5 }));
    expect(result.areaId).toBe(5);
    expect(result.name).toBe('UI');
    expect(result.projectId).toBe(1);
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockRejectedValue(new Error('bad')) });
    const result = JSON.parse(await commands.viewArea(api, { ixArea: 1 }));
    expect(result.error).toBe('bad');
  });
});

// ─── apiRequest ──────────────────────────────────────────────────────────────

describe('apiRequest handler', () => {
  it('returns cmd and result on success', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({ foo: 'bar' }) });
    const result = JSON.parse(await commands.apiRequest(api, { cmd: 'listStuff', params: { x: 1 } }));
    expect(result.cmd).toBe('listStuff');
    expect(result.result).toEqual({ foo: 'bar' });
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockRejectedValue(new Error('unknown cmd')) });
    const result = JSON.parse(await commands.apiRequest(api, { cmd: 'bad' }));
    expect(result.error).toBe('unknown cmd');
  });
});

// ─── createProject ────────────────────────────────────────────────────────────

describe('createProject handler', () => {
  it('returns projectId and name on success', async () => {
    const api = makeMockApi({
      createProject: jest.fn().mockResolvedValue({ ixProject: 99, sProject: 'NewProj' }),
    });
    const result = JSON.parse(await commands.createProject(api, { name: 'NewProj' }));
    expect(result.projectId).toBe(99);
    expect(result.projectName).toBe('NewProj');
  });

  it('uses ixPersonPrimaryContact for numeric primaryContact', async () => {
    const api = makeMockApi({ createProject: jest.fn().mockResolvedValue({ ixProject: 1, sProject: 'P' }) });
    await commands.createProject(api, { name: 'P', primaryContact: '5' });
    const params = (api.createProject as jest.Mock).mock.calls[0][0];
    expect(params.ixPersonPrimaryContact).toBe(5);
  });

  it('does not hardcode ixPersonPrimaryContact for unknown name', async () => {
    const api = makeMockApi({ createProject: jest.fn().mockResolvedValue({ ixProject: 1, sProject: 'P' }) });
    await commands.createProject(api, { name: 'P', primaryContact: 'Unknown Person' });
    const params = (api.createProject as jest.Mock).mock.calls[0][0];
    // Should not set ixPersonPrimaryContact for an unknown non-numeric name
    expect(params.ixPersonPrimaryContact).toBeUndefined();
  });

  it('forwards isInbox and allowPublicSubmit', async () => {
    const api = makeMockApi({ createProject: jest.fn().mockResolvedValue({ ixProject: 1, sProject: 'P' }) });
    await commands.createProject(api, { name: 'P', isInbox: true, allowPublicSubmit: false });
    const params = (api.createProject as jest.Mock).mock.calls[0][0];
    expect(params.fInbox).toBe(true);
    expect(params.fAllowPublicSubmit).toBe(false);
  });

  it('returns error JSON on failure', async () => {
    const api = makeMockApi({ createProject: jest.fn().mockRejectedValue(new Error('dup name')) });
    const result = JSON.parse(await commands.createProject(api, { name: 'P' }));
    expect(result.error).toBe('dup name');
  });
});

// ─── searchCases edge cases ───────────────────────────────────────────────────

describe('searchCases handler — edge cases', () => {
  it('returns count 0 and empty cases array when no results', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockResolvedValue([]) });
    const result = JSON.parse(await commands.searchCases(api, { query: 'nothing' }));
    expect(result.count).toBe(0);
    expect(result.cases).toEqual([]);
  });
});

// ─── listUserCases edge cases ─────────────────────────────────────────────────

describe('listUserCases handler — edge cases', () => {
  it('returns count 0 and empty cases array when no results', async () => {
    const api = makeMockApi({ searchCases: jest.fn().mockResolvedValue([]) });
    const result = JSON.parse(await commands.listUserCases(api, {}));
    expect(result.count).toBe(0);
    expect(result.cases).toEqual([]);
  });
});

// ─── getCase edge cases ───────────────────────────────────────────────────────

describe('getCase handler — edge cases', () => {
  it('returns events: undefined when case has no events', async () => {
    const api = makeMockApi({ getCase: jest.fn().mockResolvedValue({ ...CASE_42, events: undefined }) });
    const result = JSON.parse(await commands.getCase(api, { caseId: 42 }));
    expect(result.events).toBeUndefined();
  });

  it('returns all events when case has multiple events', async () => {
    const caseWithEvents = {
      ...CASE_42,
      events: [
        { ixBugEvent: 1, sVerb: 'Opened', sText: 'First', dt: '2024-01-01', sPerson: 'Alice', ixPerson: 2 },
        { ixBugEvent: 2, sVerb: 'Edited', sText: 'Second', dt: '2024-01-02', sPerson: 'Bob', ixPerson: 3 },
        { ixBugEvent: 3, sVerb: 'Resolved', sText: 'Done', dt: '2024-01-03', sPerson: 'Alice', ixPerson: 2 },
      ],
    };
    const api = makeMockApi({ getCase: jest.fn().mockResolvedValue(caseWithEvents) });
    const result = JSON.parse(await commands.getCase(api, { caseId: 42 }));
    expect(result.events).toHaveLength(3);
    expect(result.events[1].verb).toBe('Edited');
    expect(result.events[2].verb).toBe('Resolved');
  });
});

// ─── apiRequest edge cases ────────────────────────────────────────────────────

describe('apiRequest handler — edge cases', () => {
  it('handles empty object response without throwing', async () => {
    const api = makeMockApi({ rawRequest: jest.fn().mockResolvedValue({}) });
    const result = JSON.parse(await commands.apiRequest(api, { cmd: 'listStuff' }));
    expect(result.cmd).toBe('listStuff');
    expect(result.result).toEqual({});
  });
});
