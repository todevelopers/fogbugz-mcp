import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { IFogBugzClient } from './base-client';
import { normalizeCaseFields, normalizeEvent, normalizeBaseUrl } from './utils';
import { logger } from '../logger';
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

export class FogBugzXmlClient implements IFogBugzClient {
  private baseUrl: string;
  private apiKey: string;
  private apiEndpoint: string;
  private xmlParser: XMLParser;

  constructor(config: FogBugzConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.apiKey = config.apiKey;
    this.apiEndpoint = `${this.baseUrl}/api.asp`;
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: true,
      isArray: (name) => {
        return ['case', 'project', 'area', 'fixfor', 'priority', 'person', 'event', 'status', 'category'].includes(name);
      },
    });
  }

  private async request(
    cmd: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    const start = Date.now();
    logger.debug('XML API request', { cmd, params });
    try {
      const flatParams: Record<string, string> = {
        cmd,
        token: this.apiKey,
      };

      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          flatParams[key] = value.join(',');
        } else if (typeof value === 'boolean') {
          flatParams[key] = value ? '1' : '0';
        } else {
          flatParams[key] = String(value);
        }
      }

      const response = await axios.post(this.apiEndpoint, new URLSearchParams(flatParams), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        responseType: 'text',
        timeout: 30000,
      });

      const parsed = this.xmlParser.parse(response.data);
      const root = parsed.response;

      if (!root) {
        throw new Error(`FogBugz API Error: unexpected XML response`);
      }

      if (root.error) {
        const errorMsg = typeof root.error === 'string'
          ? root.error
          : root.error['#text'] || JSON.stringify(root.error);
        throw new Error(`FogBugz API Error: ${errorMsg}`);
      }

      logger.debug('XML API response', { cmd, durationMs: Date.now() - start, status: response.status });
      return root;
    } catch (error: any) {
      logger.error('XML API error', { cmd, durationMs: Date.now() - start, error: error.message });
      if (error.response) {
        throw new Error(`FogBugz API Error: ${error.response.status} - ${error.response.data}`);
      }
      throw error;
    }
  }

  private normalizeCase(raw: any): FogBugzCase {
    const bugCase: FogBugzCase = {
      ixBug: Number(raw.ixBug || raw['@_ixBug']),
      sTitle: raw.sTitle || '',
    };

    normalizeCaseFields(raw, bugCase);

    if (raw.events?.event) {
      const events = Array.isArray(raw.events.event) ? raw.events.event : [raw.events.event];
      bugCase.events = events.map(normalizeEvent);
    }

    return bugCase;
  }

  async getCurrentUser(): Promise<FogBugzPerson> {
    const root = await this.request('viewPerson');
    const p = root.person?.[0] || root;
    return {
      ixPerson: Number(p.ixPerson || 0),
      sFullName: p.sFullName || '',
      sEmail: p.sEmail || '',
      sPerson: p.sFullName || '',
    };
  }

  async listProjects(): Promise<FogBugzProject[]> {
    const root = await this.request('listProjects');
    const projects = root.projects?.project || root.project || [];
    const list = Array.isArray(projects) ? projects : [projects];
    return list.map((p: any) => ({
      ...p,
      ixProject: Number(p.ixProject),
      sProject: p.sProject || '',
    }));
  }

  async listAreas(): Promise<FogBugzArea[]> {
    const root = await this.request('listAreas');
    const areas = root.areas?.area || root.area || [];
    const list = Array.isArray(areas) ? areas : [areas];
    return list.map((a: any) => ({
      ...a,
      ixArea: Number(a.ixArea),
      sArea: a.sArea || '',
      ixProject: Number(a.ixProject || 0),
    }));
  }

  async listMilestones(ixProject?: number): Promise<FogBugzFixFor[]> {
    const params: Record<string, any> = {};
    if (ixProject !== undefined) params.ixProject = ixProject;
    const root = await this.request('listFixFors', params);
    const fixfors = root.fixfors?.fixfor || root.fixfor || [];
    const list = Array.isArray(fixfors) ? fixfors : [fixfors];
    return list.map((f: any) => ({
      ...f,
      ixFixFor: Number(f.ixFixFor),
      sFixFor: f.sFixFor || '',
    }));
  }

  async listCategories(): Promise<FogBugzCategory[]> {
    const root = await this.request('listCategories');
    const categories = root.categories?.category || root.category || [];
    const list = Array.isArray(categories) ? categories : [categories];
    return list.map((c: any) => ({
      ...c,
      ixCategory: Number(c.ixCategory),
      sCategory: c.sCategory || '',
      sPlural: c.sPlural || '',
    }));
  }

  async listStatuses(ixCategory?: number): Promise<FogBugzStatus[]> {
    const params: Record<string, any> = {};
    if (ixCategory !== undefined) params.ixCategory = ixCategory;
    const root = await this.request('listStatuses', params);
    const statuses = root.statuses?.status || root.status || [];
    const list = Array.isArray(statuses) ? statuses : [statuses];
    return list.map((s: any) => ({
      ...s,
      ixStatus: Number(s.ixStatus),
      sStatus: s.sStatus || '',
      fResolved: s.fResolved === '1' || s.fResolved === true,
    }));
  }

  async listPriorities(): Promise<FogBugzPriority[]> {
    const root = await this.request('listPriorities');
    const priorities = root.priorities?.priority || root.priority || [];
    const list = Array.isArray(priorities) ? priorities : [priorities];
    return list.map((p: any) => ({
      ...p,
      ixPriority: Number(p.ixPriority),
      sPriority: p.sPriority || '',
    }));
  }

  async listPeople(): Promise<FogBugzPerson[]> {
    const root = await this.request('listPeople');
    const people = root.people?.person || root.person || [];
    const list = Array.isArray(people) ? people : [people];
    return list.map((p: any) => ({
      ...p,
      ixPerson: Number(p.ixPerson),
      sFullName: p.sFullName || '',
      sEmail: p.sEmail || '',
      sPerson: p.sFullName || '',
    }));
  }

  async createCase(params: CreateCaseParams): Promise<FogBugzCase> {
    const root = await this.request('new', params);
    const rawCase = root.case?.[0] || root.case || root.cases?.[0] || root;
    return this.normalizeCase(rawCase);
  }

  async updateCase(params: EditCaseParams): Promise<FogBugzCase> {
    const root = await this.request('edit', params);
    const rawCase = root.case?.[0] || root.case || root.cases?.[0] || root;
    return this.normalizeCase(rawCase);
  }

  async assignCase(caseId: number, personName: string): Promise<FogBugzCase> {
    const params = { ixBug: caseId, sPersonAssignedTo: personName };
    const root = await this.request('assign', params);
    const rawCase = root.case?.[0] || root.case || root.cases?.[0] || root;
    return this.normalizeCase(rawCase);
  }

  async resolveCase(caseId: number, comment?: string, ixStatus?: number): Promise<FogBugzCase> {
    const params: Record<string, any> = { ixBug: caseId };
    if (comment) params.sEvent = comment;
    if (ixStatus !== undefined) params.ixStatus = ixStatus;
    const root = await this.request('resolve', params);
    const rawCase = root.case?.[0] || root.case || root.cases?.[0] || root;
    return this.normalizeCase(rawCase);
  }

  async reopenCase(caseId: number, comment?: string): Promise<FogBugzCase> {
    const params: Record<string, any> = { ixBug: caseId };
    if (comment) params.sEvent = comment;
    const root = await this.request('reopen', params);
    const rawCase = root.case?.[0] || root.case || root.cases?.[0] || root;
    return this.normalizeCase(rawCase);
  }

  async closeCase(caseId: number, comment?: string): Promise<FogBugzCase> {
    const params: Record<string, any> = { ixBug: caseId };
    if (comment) params.sEvent = comment;
    const root = await this.request('close', params);
    const rawCase = root.case?.[0] || root.case || root.cases?.[0] || root;
    return this.normalizeCase(rawCase);
  }

  async searchCases(params: SearchParams): Promise<FogBugzCase[]> {
    const requestParams: Record<string, any> = {
      q: params.q,
    };
    if (params.cols) {
      requestParams.cols = Array.isArray(params.cols)
        ? params.cols.join(',')
        : params.cols;
    }
    if (params.max) {
      requestParams.max = params.max;
    }

    const root = await this.request('search', requestParams);
    const cases = root.cases?.case || [];
    const list = Array.isArray(cases) ? cases : [cases];

    return list
      .filter((c: any) => c && (c.ixBug || c['@_ixBug']))
      .map((c: any) => this.normalizeCase(c));
  }

  async getCase(caseId: number, cols?: string): Promise<FogBugzCase> {
    const defaultCols = 'sTitle,sStatus,sPriority,sProject,sArea,sFixFor,sPersonAssignedTo,events';
    const cases = await this.searchCases({
      q: String(caseId),
      cols: cols || defaultCols,
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
    const apiParams: Record<string, any> = {};
    apiParams.sProject = params.sProject;
    if (params.ixPersonPrimaryContact !== undefined) {
      apiParams.ixPersonPrimaryContact = params.ixPersonPrimaryContact;
    }
    if (params.fInbox !== undefined) {
      apiParams.fInbox = params.fInbox ? 1 : 0;
    }
    if (params.fAllowPublicSubmit !== undefined) {
      apiParams.fAllowPublicSubmit = params.fAllowPublicSubmit ? 1 : 0;
    }

    const root = await this.request('newProject', apiParams);
    const project = root.project?.[0] || root.project || root;
    return {
      ...project,
      ixProject: Number(project.ixProject),
      sProject: project.sProject || '',
    };
  }

  async viewProject(ixProject: number): Promise<FogBugzProject> {
    const root = await this.request('viewProject', { ixProject });
    const project = root.project?.[0] || root.project || root;
    return {
      ...project,
      ixProject: Number(project.ixProject),
      sProject: project.sProject || '',
    };
  }

  async viewArea(ixArea: number): Promise<FogBugzArea> {
    const root = await this.request('viewArea', { ixArea });
    const area = root.area?.[0] || root.area || root;
    return {
      ...area,
      ixArea: Number(area.ixArea),
      sArea: area.sArea || '',
      ixProject: Number(area.ixProject || 0),
    };
  }
}
