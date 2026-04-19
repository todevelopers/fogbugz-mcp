import axios from 'axios';
import { IFogBugzClient } from './base-client';
import { normalizeCaseFields, normalizeEvent, normalizeBaseUrl } from './utils';
import {
  FogBugzConfig,
  FogBugzCase,
  FogBugzProject,
  FogBugzArea,
  FogBugzFixFor,
  FogBugzPriority,
  FogBugzPerson,
  FogBugzCategory,
  FogBugzStatus,
  CreateCaseParams,
  EditCaseParams,
  SearchParams,
  CreateProjectParams,
} from './types';

export class FogBugzJsonClient implements IFogBugzClient {
  private baseUrl: string;
  private apiKey: string;
  private apiEndpoint: string;

  constructor(config: FogBugzConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.apiKey = config.apiKey;
    this.apiEndpoint = `${this.baseUrl}/f/api/0/jsonapi`;
  }

  private async request(cmd: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const body = { cmd, token: this.apiKey, ...params };
      const response = await axios.post(this.apiEndpoint, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      const json = response.data;
      if (json.errors && json.errors.length > 0) {
        throw new Error(`FogBugz API Error: ${json.errors[0].message}`);
      }
      return json.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`FogBugz API Error: ${error.response.status} - ${error.response.data}`);
      }
      throw error;
    }
  }

  private normalizeCase(raw: any): FogBugzCase {
    const bugCase: FogBugzCase = {
      ixBug: Number(raw.ixBug),
      sTitle: raw.sTitle || '',
    };

    normalizeCaseFields(raw, bugCase);

    // JSON API returns events as a flat array at case.events (XML nests them under case.events.event)
    if (Array.isArray(raw.events) && raw.events.length > 0) {
      bugCase.events = raw.events.map(normalizeEvent);
    }

    return bugCase;
  }

  async getCurrentUser(): Promise<FogBugzPerson> {
    const data = await this.request('viewPerson');
    const people = data.person || [];
    const p = Array.isArray(people) ? people[0] : people;
    return {
      ixPerson: Number(p?.ixPerson || 0),
      sFullName: p?.sFullName || '',
      sEmail: p?.sEmail || '',
      sPerson: p?.sFullName || '',
    };
  }

  async listProjects(): Promise<FogBugzProject[]> {
    const data = await this.request('listProjects');
    const projects: any[] = data.projects || [];
    return projects.map((p: any) => ({
      ...p,
      ixProject: Number(p.ixProject),
      sProject: p.sProject || '',
    }));
  }

  async listAreas(): Promise<FogBugzArea[]> {
    const data = await this.request('listAreas');
    const areas: any[] = data.areas || [];
    return areas.map((a: any) => ({
      ...a,
      ixArea: Number(a.ixArea),
      sArea: a.sArea || '',
      ixProject: Number(a.ixProject || 0),
    }));
  }

  async listMilestones(ixProject?: number): Promise<FogBugzFixFor[]> {
    const params: Record<string, any> = {};
    if (ixProject !== undefined) params.ixProject = ixProject;
    const data = await this.request('listFixFors', params);
    const fixfors: any[] = data.fixfors || [];
    return fixfors.map((f: any) => ({
      ...f,
      ixFixFor: Number(f.ixFixFor),
      sFixFor: f.sFixFor || '',
    }));
  }

  async listCategories(): Promise<FogBugzCategory[]> {
    const data = await this.request('listCategories');
    const categories: any[] = data.categories || [];
    return categories.map((c: any) => ({
      ...c,
      ixCategory: Number(c.ixCategory),
      sCategory: c.sCategory || '',
      sPlural: c.sPlural || '',
    }));
  }

  async listStatuses(ixCategory?: number): Promise<FogBugzStatus[]> {
    const params: Record<string, any> = {};
    if (ixCategory !== undefined) params.ixCategory = ixCategory;
    const data = await this.request('listStatuses', params);
    const statuses: any[] = data.statuses || [];
    return statuses.map((s: any) => ({
      ...s,
      ixStatus: Number(s.ixStatus),
      sStatus: s.sStatus || '',
      fResolved: s.fResolved === true || s.fResolved === 1,
    }));
  }

  async listPriorities(): Promise<FogBugzPriority[]> {
    const data = await this.request('listPriorities');
    const priorities: any[] = data.priorities || [];
    return priorities.map((p: any) => ({
      ...p,
      ixPriority: Number(p.ixPriority),
      sPriority: p.sPriority || '',
    }));
  }

  async listPeople(): Promise<FogBugzPerson[]> {
    const data = await this.request('listPeople');
    const people: any[] = data.people || [];
    return people.map((p: any) => ({
      ...p,
      ixPerson: Number(p.ixPerson),
      sFullName: p.sFullName || '',
      sEmail: p.sEmail || '',
      sPerson: p.sFullName || '',
    }));
  }

  async createCase(params: CreateCaseParams): Promise<FogBugzCase> {
    const data = await this.request('new', params);
    return this.normalizeCase(data.case);
  }

  async updateCase(params: EditCaseParams): Promise<FogBugzCase> {
    const data = await this.request('edit', params);
    return this.normalizeCase(data.case);
  }

  async assignCase(caseId: number, personName: string): Promise<FogBugzCase> {
    const data = await this.request('assign', { ixBug: caseId, sPersonAssignedTo: personName });
    return this.normalizeCase(data.case);
  }

  async resolveCase(caseId: number, comment?: string, ixStatus?: number): Promise<FogBugzCase> {
    const params: Record<string, any> = { ixBug: caseId };
    if (comment) params.sEvent = comment;
    if (ixStatus !== undefined) params.ixStatus = ixStatus;
    const data = await this.request('resolve', params);
    return this.normalizeCase(data.case);
  }

  async reopenCase(caseId: number, comment?: string): Promise<FogBugzCase> {
    const params: Record<string, any> = { ixBug: caseId };
    if (comment) params.sEvent = comment;
    const data = await this.request('reopen', params);
    return this.normalizeCase(data.case);
  }

  async closeCase(caseId: number, comment?: string): Promise<FogBugzCase> {
    const params: Record<string, any> = { ixBug: caseId };
    if (comment) params.sEvent = comment;
    const data = await this.request('close', params);
    return this.normalizeCase(data.case);
  }

  async searchCases(params: SearchParams): Promise<FogBugzCase[]> {
    const requestParams: Record<string, any> = { q: params.q };
    if (params.cols !== undefined) {
      // JSON API accepts cols as an array; if string was passed, keep as-is
      requestParams.cols = params.cols;
    }
    if (params.max !== undefined) {
      requestParams.max = params.max;
    }

    const data = await this.request('search', requestParams);
    const cases: any[] = data.cases || [];
    return cases
      .filter((c: any) => c && c.ixBug)
      .map((c: any) => this.normalizeCase(c));
  }

  async getCase(caseId: number, cols?: string): Promise<FogBugzCase> {
    const defaultCols = ['sTitle', 'sStatus', 'sPriority', 'sProject', 'sArea', 'sFixFor', 'sPersonAssignedTo', 'events'];
    const cases = await this.searchCases({
      q: String(caseId),
      cols: cols ? cols : defaultCols,
    });
    if (cases.length === 0) {
      throw new Error(`Case #${caseId} not found`);
    }
    return cases[0];
  }

  async rawRequest(cmd: string, params: Record<string, any> = {}): Promise<any> {
    return this.request(cmd, params);
  }

  getCaseLink(caseId: number): string {
    return `${this.baseUrl}/default.asp?${caseId}`;
  }

  async createProject(params: CreateProjectParams): Promise<FogBugzProject> {
    const apiParams: Record<string, any> = { sProject: params.sProject };
    if (params.ixPersonPrimaryContact !== undefined) {
      apiParams.ixPersonPrimaryContact = params.ixPersonPrimaryContact;
    }
    if (params.fInbox !== undefined) {
      apiParams.fInbox = params.fInbox;
    }
    if (params.fAllowPublicSubmit !== undefined) {
      apiParams.fAllowPublicSubmit = params.fAllowPublicSubmit;
    }

    const data = await this.request('newProject', apiParams);
    const project = data.project;
    return {
      ...project,
      ixProject: Number(project.ixProject),
      sProject: project.sProject || '',
    };
  }

  async viewProject(ixProject: number): Promise<FogBugzProject> {
    const data = await this.request('viewProject', { ixProject });
    const project = data.project;
    return {
      ...project,
      ixProject: Number(project.ixProject),
      sProject: project.sProject || '',
    };
  }

  async viewArea(ixArea: number): Promise<FogBugzArea> {
    const data = await this.request('viewArea', { ixArea });
    const area = data.area;
    return {
      ...area,
      ixArea: Number(area.ixArea),
      sArea: area.sArea || '',
      ixProject: Number(area.ixProject || 0),
    };
  }
}
