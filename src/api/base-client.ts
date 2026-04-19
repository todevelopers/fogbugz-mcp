import {
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

export interface IFogBugzClient {
  getCurrentUser(): Promise<FogBugzPerson>;
  listProjects(): Promise<FogBugzProject[]>;
  listAreas(): Promise<FogBugzArea[]>;
  listMilestones(ixProject?: number): Promise<FogBugzFixFor[]>;
  listPriorities(): Promise<FogBugzPriority[]>;
  listPeople(): Promise<FogBugzPerson[]>;
  listCategories(): Promise<FogBugzCategory[]>;
  listStatuses(ixCategory?: number): Promise<FogBugzStatus[]>;
  createCase(params: CreateCaseParams): Promise<FogBugzCase>;
  updateCase(params: EditCaseParams): Promise<FogBugzCase>;
  assignCase(caseId: number, personName: string): Promise<FogBugzCase>;
  resolveCase(caseId: number, comment?: string, ixStatus?: number): Promise<FogBugzCase>;
  reopenCase(caseId: number, comment?: string): Promise<FogBugzCase>;
  closeCase(caseId: number, comment?: string): Promise<FogBugzCase>;
  searchCases(params: SearchParams): Promise<FogBugzCase[]>;
  getCase(caseId: number, cols?: string): Promise<FogBugzCase>;
  rawRequest(cmd: string, params?: Record<string, any>): Promise<any>;
  getCaseLink(caseId: number): string;
  createProject(params: CreateProjectParams): Promise<FogBugzProject>;
  viewProject(ixProject: number): Promise<FogBugzProject>;
  viewArea(ixArea: number): Promise<FogBugzArea>;
}
