/**
 * XML response fixture helpers for FogBugz API tests.
 * All helpers return valid XML strings that the FogBugzApi XML parser can consume.
 */

/** Wrap inner XML in the standard FogBugz response envelope */
export function xmlResponse(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><response>${inner}</response>`;
}

/** A response containing an error element */
export function xmlError(message: string): string {
  return xmlResponse(`<error code="3">${message}</error>`);
}

export interface CaseFields {
  ixBug?: number;
  sTitle?: string;
  sStatus?: string;
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
}

/** A single <case> element (no wrapping <cases>) */
export function xmlCase(fields: CaseFields = {}): string {
  const {
    ixBug = 42,
    sTitle = 'Test Case',
    sStatus = 'Active',
    sPriority = 'Normal',
    ixPriority = 3,
    sProject = 'Test Project',
    ixProject = 1,
    sArea = 'Test Area',
    ixArea = 1,
    sFixFor = 'Backlog',
    ixFixFor = 1,
    sPersonAssignedTo = 'Test User',
    ixPersonAssignedTo = 2,
  } = fields;

  return `<case ixBug="${ixBug}">
    <ixBug>${ixBug}</ixBug>
    <sTitle>${sTitle}</sTitle>
    <sStatus>${sStatus}</sStatus>
    <sPriority>${sPriority}</sPriority>
    <ixPriority>${ixPriority}</ixPriority>
    <sProject>${sProject}</sProject>
    <ixProject>${ixProject}</ixProject>
    <sArea>${sArea}</sArea>
    <ixArea>${ixArea}</ixArea>
    <sFixFor>${sFixFor}</sFixFor>
    <ixFixFor>${ixFixFor}</ixFixFor>
    <sPersonAssignedTo>${sPersonAssignedTo}</sPersonAssignedTo>
    <ixPersonAssignedTo>${ixPersonAssignedTo}</ixPersonAssignedTo>
  </case>`;
}

/** A <cases> wrapper containing one or more <case> elements */
export function xmlCases(cases: CaseFields[], count?: number): string {
  const n = count !== undefined ? count : cases.length;
  const inner = cases.map(xmlCase).join('');
  return `<cases count="${n}">${inner}</cases>`;
}

/** A response with a single case (write commands: new / edit / assign) */
export function xmlCaseResponse(fields: CaseFields = {}): string {
  return xmlResponse(xmlCase(fields));
}

/** A response with a <cases> list */
export function xmlCasesResponse(cases: CaseFields[], count?: number): string {
  return xmlResponse(xmlCases(cases, count));
}

export interface PersonFields {
  ixPerson?: number;
  sFullName?: string;
  sEmail?: string;
}

export function xmlPerson(fields: PersonFields = {}): string {
  const { ixPerson = 1, sFullName = 'Test User', sEmail = 'test@example.com' } = fields;
  return `<person>
    <ixPerson>${ixPerson}</ixPerson>
    <sFullName>${sFullName}</sFullName>
    <sEmail>${sEmail}</sEmail>
  </person>`;
}

export function xmlPersonResponse(fields: PersonFields = {}): string {
  return xmlResponse(xmlPerson(fields));
}

export function xmlPeopleResponse(people: PersonFields[]): string {
  return xmlResponse(`<people>${people.map(xmlPerson).join('')}</people>`);
}

export interface ProjectFields {
  ixProject?: number;
  sProject?: string;
  ixPersonOwner?: number;
  sEmail?: string;
  fInbox?: 0 | 1;
  fDeleted?: 0 | 1;
}

export function xmlProject(fields: ProjectFields = {}): string {
  const {
    ixProject = 1,
    sProject = 'Test Project',
    ixPersonOwner = 2,
    sEmail = 'proj@example.com',
    fInbox = 0,
    fDeleted = 0,
  } = fields;
  return `<project>
    <ixProject>${ixProject}</ixProject>
    <sProject>${sProject}</sProject>
    <ixPersonOwner>${ixPersonOwner}</ixPersonOwner>
    <sEmail>${sEmail}</sEmail>
    <fInbox>${fInbox}</fInbox>
    <fDeleted>${fDeleted}</fDeleted>
  </project>`;
}

export function xmlProjectResponse(fields: ProjectFields = {}): string {
  return xmlResponse(xmlProject(fields));
}

export function xmlProjectsResponse(projects: ProjectFields[]): string {
  return xmlResponse(`<projects>${projects.map(xmlProject).join('')}</projects>`);
}

export interface AreaFields {
  ixArea?: number;
  sArea?: string;
  ixProject?: number;
  ixPersonOwner?: number;
  fDeleted?: 0 | 1;
}

export function xmlArea(fields: AreaFields = {}): string {
  const {
    ixArea = 1,
    sArea = 'Test Area',
    ixProject = 1,
    ixPersonOwner = 2,
    fDeleted = 0,
  } = fields;
  return `<area>
    <ixArea>${ixArea}</ixArea>
    <sArea>${sArea}</sArea>
    <ixProject>${ixProject}</ixProject>
    <ixPersonOwner>${ixPersonOwner}</ixPersonOwner>
    <fDeleted>${fDeleted}</fDeleted>
  </area>`;
}

export function xmlAreasResponse(areas: AreaFields[]): string {
  return xmlResponse(`<areas>${areas.map(xmlArea).join('')}</areas>`);
}

export interface FixForFields {
  ixFixFor?: number;
  sFixFor?: string;
}

export function xmlFixFor(fields: FixForFields = {}): string {
  const { ixFixFor = 1, sFixFor = 'Backlog' } = fields;
  return `<fixfor>
    <ixFixFor>${ixFixFor}</ixFixFor>
    <sFixFor>${sFixFor}</sFixFor>
  </fixfor>`;
}

export function xmlFixForsResponse(fixfors: FixForFields[]): string {
  return xmlResponse(`<fixfors>${fixfors.map(xmlFixFor).join('')}</fixfors>`);
}

export interface PriorityFields {
  ixPriority?: number;
  sPriority?: string;
}

export function xmlPriority(fields: PriorityFields = {}): string {
  const { ixPriority = 3, sPriority = 'Normal' } = fields;
  return `<priority>
    <ixPriority>${ixPriority}</ixPriority>
    <sPriority>${sPriority}</sPriority>
  </priority>`;
}

export function xmlPrioritiesResponse(priorities: PriorityFields[]): string {
  return xmlResponse(`<priorities>${priorities.map(xmlPriority).join('')}</priorities>`);
}

export interface StatusFields {
  ixStatus?: number;
  sStatus?: string;
  fResolved?: 0 | 1;
}

export function xmlStatusesResponse(statuses: StatusFields[]): string {
  const inner = statuses
    .map(
      ({ ixStatus = 1, sStatus = 'Active', fResolved = 0 }) =>
        `<status><ixStatus>${ixStatus}</ixStatus><sStatus>${sStatus}</sStatus><fResolved>${fResolved}</fResolved></status>`
    )
    .join('');
  return xmlResponse(`<statuses>${inner}</statuses>`);
}

export interface CategoryFields {
  ixCategory?: number;
  sCategory?: string;
  sPlural?: string;
}

export function xmlCategoriesResponse(categories: CategoryFields[]): string {
  const inner = categories
    .map(
      ({ ixCategory = 1, sCategory = 'Bug', sPlural = 'Bugs' }) =>
        `<category><ixCategory>${ixCategory}</ixCategory><sCategory>${sCategory}</sCategory><sPlural>${sPlural}</sPlural></category>`
    )
    .join('');
  return xmlResponse(`<categories>${inner}</categories>`);
}
