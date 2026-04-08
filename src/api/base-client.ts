import {
  FogBugzCase,
  FogBugzProject,
  FogBugzArea,
  FogBugzFixFor,
  FogBugzPriority,
  FogBugzPerson,
  CreateCaseParams,
  EditCaseParams,
  SearchParams,
  CreateProjectParams,
} from './types';

export interface IFogBugzClient {
  getCurrentUser(): Promise<FogBugzPerson>;
  listProjects(): Promise<FogBugzProject[]>;
  listAreas(): Promise<FogBugzArea[]>;
  listMilestones(): Promise<FogBugzFixFor[]>;
  listPriorities(): Promise<FogBugzPriority[]>;
  listPeople(): Promise<FogBugzPerson[]>;
  createCase(params: CreateCaseParams): Promise<FogBugzCase>;
  updateCase(params: EditCaseParams): Promise<FogBugzCase>;
  assignCase(caseId: number, personName: string): Promise<FogBugzCase>;
  searchCases(params: SearchParams): Promise<FogBugzCase[]>;
  getCase(caseId: number, cols?: string): Promise<FogBugzCase>;
  rawRequest(cmd: string, params?: Record<string, any>): Promise<any>;
  getCaseLink(caseId: number): string;
  createProject(params: CreateProjectParams): Promise<FogBugzProject>;
}
