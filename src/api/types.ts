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
  [key: string]: any;
}

export interface FogBugzEvent {
  ixBugEvent: number;
  sVerb: string;
  sText?: string;
  dt: string;
  sPerson: string;
  ixPerson: number;
  [key: string]: any;
}

export interface FogBugzProject {
  ixProject: number;
  sProject: string;
  [key: string]: any;
}

export interface FogBugzArea {
  ixArea: number;
  sArea: string;
  ixProject: number;
  [key: string]: any;
}

export interface FogBugzFixFor {
  ixFixFor: number;
  sFixFor: string;
  [key: string]: any;
}

export interface FogBugzPriority {
  ixPriority: number;
  sPriority: string;
  [key: string]: any;
}

export interface FogBugzPerson {
  ixPerson: number;
  sPerson?: string;
  sFullName?: string;
  sEmail: string;
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
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

export interface FileAttachment {
  path: string;
  fieldName?: string;
} 