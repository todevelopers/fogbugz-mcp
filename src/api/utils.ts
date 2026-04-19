import { FogBugzCase, FogBugzEvent } from './types';

const CASE_FIELDS = [
  'sStatus', 'ixStatus', 'sPriority', 'ixPriority',
  'sProject', 'ixProject', 'sArea', 'ixArea',
  'sFixFor', 'ixFixFor', 'sPersonAssignedTo', 'ixPersonAssignedTo',
] as const;

export function normalizeCaseFields(raw: any, bugCase: FogBugzCase): void {
  for (const field of CASE_FIELDS) {
    if (raw[field] !== undefined) {
      bugCase[field] = raw[field];
    }
  }
}

export function normalizeEvent(e: any): FogBugzEvent {
  return {
    ixBugEvent: Number(e.ixBugEvent),
    sVerb: e.sVerb || '',
    sText: e.s || e.sText || '',
    dt: e.dt || '',
    sPerson: e.sPerson || '',
    ixPerson: Number(e.ixPerson || 0),
  };
}
