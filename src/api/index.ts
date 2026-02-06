import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import {
  FogBugzConfig,
  FogBugzCase,
  FogBugzProject,
  FogBugzArea,
  FogBugzFixFor,
  FogBugzPriority,
  FogBugzPerson,
  CreateCaseParams,
  EditCaseParams,
  SearchParams,
  FileAttachment,
  CreateProjectParams
} from './types';

export class FogBugzApi {
  private baseUrl: string;
  private apiKey: string;
  private apiEndpoint: string;
  private xmlParser: XMLParser;

  constructor(config: FogBugzConfig) {
    this.baseUrl = config.baseUrl.endsWith('/')
      ? config.baseUrl.slice(0, -1)
      : config.baseUrl;
    this.apiKey = config.apiKey;
    this.apiEndpoint = `${this.baseUrl}/api.asp`;
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      // Parse numeric-looking values as numbers
      parseTagValue: true,
      // Ensure arrays for elements that may have 0-N items
      isArray: (name) => {
        return ['case', 'project', 'area', 'fixfor', 'priority', 'person', 'event'].includes(name);
      },
    });
  }

  /**
   * Make a GET request to the FogBugz XML API
   */
  private async request(
    cmd: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    try {
      // Build query parameters
      const queryParams: Record<string, string> = {
        cmd,
        token: this.apiKey,
      };

      // Flatten params into query string values
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          queryParams[key] = value.join(',');
        } else {
          queryParams[key] = String(value);
        }
      }

      const response = await axios.get(this.apiEndpoint, {
        params: queryParams,
        responseType: 'text',
      });

      const parsed = this.xmlParser.parse(response.data);
      const root = parsed.response;

      if (!root) {
        throw new Error(`FogBugz API Error: unexpected XML response`);
      }

      // Check for errors in XML response: <error code="X">message</error>
      if (root.error) {
        const errorMsg = typeof root.error === 'string'
          ? root.error
          : root.error['#text'] || JSON.stringify(root.error);
        throw new Error(`FogBugz API Error: ${errorMsg}`);
      }

      return root;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`FogBugz API Error: ${error.response.status} - ${error.response.data}`);
      }
      throw error;
    }
  }

  /**
   * Normalize a single case element from XML into a FogBugzCase object.
   * XML returns fields as child elements, and ixBug may also appear as an attribute.
   */
  private normalizeCase(raw: any): FogBugzCase {
    const bugCase: FogBugzCase = {
      ixBug: Number(raw.ixBug || raw['@_ixBug']),
      sTitle: raw.sTitle || '',
    };

    // Copy all known fields
    const fields = [
      'sStatus', 'ixStatus', 'sPriority', 'ixPriority',
      'sProject', 'ixProject', 'sArea', 'ixArea',
      'sFixFor', 'ixFixFor', 'sPersonAssignedTo', 'ixPersonAssignedTo',
    ];
    for (const field of fields) {
      if (raw[field] !== undefined) {
        bugCase[field] = raw[field];
      }
    }

    // Handle events if present
    if (raw.events && raw.events.event) {
      const events = Array.isArray(raw.events.event)
        ? raw.events.event
        : [raw.events.event];
      bugCase.events = events.map((e: any) => ({
        ixBugEvent: Number(e.ixBugEvent),
        sVerb: e.sVerb || '',
        sText: e.s || e.sText || '',
        dt: e.dt || '',
        sPerson: e.sPerson || '',
        ixPerson: Number(e.ixPerson || 0),
      }));
    }

    return bugCase;
  }

  /**
   * Get information about the current user associated with the API key
   */
  async getCurrentUser(): Promise<FogBugzPerson> {
    const root = await this.request('viewPerson');
    const p = root.person || root;
    return {
      ixPerson: Number(p.ixPerson || 0),
      sFullName: p.sFullName || '',
      sEmail: p.sEmail || '',
      sPerson: p.sFullName || '',
    };
  }

  /**
   * Get a list of all projects
   */
  async listProjects(): Promise<FogBugzProject[]> {
    const root = await this.request('listProjects');
    const projects = root.projects?.project || root.project || [];
    const list = Array.isArray(projects) ? projects : [projects];
    return list.map((p: any) => ({
      ixProject: Number(p.ixProject),
      sProject: p.sProject || '',
      ...p,
    }));
  }

  /**
   * Get a list of all areas
   */
  async listAreas(): Promise<FogBugzArea[]> {
    const root = await this.request('listAreas');
    const areas = root.areas?.area || root.area || [];
    const list = Array.isArray(areas) ? areas : [areas];
    return list.map((a: any) => ({
      ixArea: Number(a.ixArea),
      sArea: a.sArea || '',
      ixProject: Number(a.ixProject || 0),
      ...a,
    }));
  }

  /**
   * Get a list of all milestones (FixFors)
   */
  async listMilestones(): Promise<FogBugzFixFor[]> {
    const root = await this.request('listFixFors');
    const fixfors = root.fixfors?.fixfor || root.fixfor || [];
    const list = Array.isArray(fixfors) ? fixfors : [fixfors];
    return list.map((f: any) => ({
      ixFixFor: Number(f.ixFixFor),
      sFixFor: f.sFixFor || '',
      ...f,
    }));
  }

  /**
   * Get a list of all priorities
   */
  async listPriorities(): Promise<FogBugzPriority[]> {
    const root = await this.request('listPriorities');
    const priorities = root.priorities?.priority || root.priority || [];
    const list = Array.isArray(priorities) ? priorities : [priorities];
    return list.map((p: any) => ({
      ixPriority: Number(p.ixPriority),
      sPriority: p.sPriority || '',
      ...p,
    }));
  }

  /**
   * Get a list of all people (users)
   */
  async listPeople(): Promise<FogBugzPerson[]> {
    const root = await this.request('listPeople');
    const people = root.people?.person || root.person || [];
    const list = Array.isArray(people) ? people : [people];
    return list.map((p: any) => ({
      ixPerson: Number(p.ixPerson),
      sFullName: p.sFullName || '',
      sEmail: p.sEmail || '',
      sPerson: p.sFullName || '',
      ...p,
    }));
  }

  /**
   * Create a new case
   */
  async createCase(
    params: CreateCaseParams,
    _attachments: FileAttachment[] = []
  ): Promise<FogBugzCase> {
    // XML API: cmd=new&sTitle=...&sEvent=...&token=XXX
    const root = await this.request('new', params);
    const rawCase = root.case?.[0] || root.case || root;
    return this.normalizeCase(rawCase);
  }

  /**
   * Update an existing case
   */
  async updateCase(
    params: EditCaseParams,
    _attachments: FileAttachment[] = []
  ): Promise<FogBugzCase> {
    const root = await this.request('edit', params);
    const rawCase = root.case?.[0] || root.case || root;
    return this.normalizeCase(rawCase);
  }

  /**
   * Assign a case to a person
   */
  async assignCase(
    caseId: number,
    personName: string
  ): Promise<FogBugzCase> {
    const params = {
      ixBug: caseId,
      sPersonAssignedTo: personName,
    };
    const root = await this.request('assign', params);
    const rawCase = root.case?.[0] || root.case || root;
    return this.normalizeCase(rawCase);
  }

  /**
   * Search for cases
   */
  async searchCases(params: SearchParams): Promise<FogBugzCase[]> {
    // XML API expects cols as comma-separated string
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

    // XML response: <cases count="N"><case>...</case></cases>
    const cases = root.cases?.case || [];
    const list = Array.isArray(cases) ? cases : [cases];

    // Filter out empty entries (when count=0, parser might give empty)
    return list
      .filter((c: any) => c && (c.ixBug || c['@_ixBug']))
      .map((c: any) => this.normalizeCase(c));
  }

  /**
   * Get a direct link to a case
   */
  getCaseLink(caseId: number): string {
    return `${this.baseUrl}/default.asp?${caseId}`;
  }

  /**
   * Create a new project
   */
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
      ixProject: Number(project.ixProject),
      sProject: project.sProject || '',
      ...project,
    };
  }
}

export * from './types';
