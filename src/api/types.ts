/**
 * FogBugz API Types
 */

export interface FogBugzConfig {
  baseUrl: string;
  apiKey: string;
}

export interface FogBugzCase {
  ixBug: number;
  sTitle: string;
  sStatus?: string;
  ixStatus?: number;
  sPriority?: string;
  ixPriority?: number;
  sProject?: string;
  ixProject?: number;
  sArea?: string;
  ixArea?: number;
  sFixFor?: string;
  ixFixFor?: number;
  sPersonAssignedTo?: string;
  ixPersonAssignedTo?: number;
  events?: FogBugzEvent[];
}

export interface FogBugzEvent {
  ixBugEvent: number;
  sVerb: string;
  sText?: string;
  dt: string;
  sPerson: string;
  ixPerson: number;
}

export interface FogBugzProject {
  ixProject: number;
  sProject: string;
  ixPersonOwner?: number;
  sEmail?: string;
  fInbox?: number | boolean;
  fDeleted?: number | boolean;
}

export interface FogBugzArea {
  ixArea: number;
  sArea: string;
  ixProject: number;
  ixPersonOwner?: number;
  fDeleted?: number | boolean;
}

export interface FogBugzFixFor {
  ixFixFor: number;
  sFixFor: string;
  ixProject?: number;
  dt?: string;
}

export interface FogBugzPriority {
  ixPriority: number;
  sPriority: string;
}

export interface FogBugzPerson {
  ixPerson: number;
  sPerson?: string;
  sFullName?: string;
  sEmail: string;
}

export interface CreateCaseParams {
  sTitle: string;
  sEvent?: string;
  sProject?: string;
  ixProject?: number;
  sArea?: string;
  ixArea?: number;
  sFixFor?: string;
  ixFixFor?: number;
  sPriority?: string;
  ixPriority?: number;
  sPersonAssignedTo?: string;
  ixPersonAssignedTo?: number;
}

export interface EditCaseParams {
  ixBug: number;
  sTitle?: string;
  sEvent?: string;
  sProject?: string;
  ixProject?: number;
  sArea?: string;
  ixArea?: number;
  sFixFor?: string;
  ixFixFor?: number;
  sPriority?: string;
  ixPriority?: number;
  sPersonAssignedTo?: string;
  ixPersonAssignedTo?: number;
}

export interface SearchParams {
  q: string;
  cols?: string[] | string;
  max?: number;
}

export interface CreateProjectParams {
  sProject: string;
  ixPersonPrimaryContact?: number;
  fAllowPublicSubmit?: boolean;
  fInbox?: boolean;
}

export interface FogBugzCategory {
  ixCategory: number;
  sCategory: string;
  sPlural: string;
}

export interface FogBugzStatus {
  ixStatus: number;
  sStatus: string;
  fResolved: boolean;
}
