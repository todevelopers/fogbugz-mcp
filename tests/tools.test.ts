import { fogbugzTools } from '../src/commands/tools';

// The set of tool names that the dispatch switch in src/index.ts handles
const DISPATCH_TOOL_NAMES = new Set([
  'create_case',
  'update_case',
  'assign_case',
  'list_my_cases',
  'search_cases',
  'get_case_link',
  'get_case',
  'resolve_case',
  'reopen_case',
  'close_case',
  'list_people',
  'list_categories',
  'list_projects',
  'list_milestones',
  'list_statuses',
  'view_project',
  'view_area',
  'create_project',
  'api_request',
]);

// Tools that should be read-only
const READ_ONLY_TOOL_NAMES = new Set([
  'list_my_cases',
  'search_cases',
  'get_case_link',
  'get_case',
  'list_people',
  'list_categories',
  'list_projects',
  'list_milestones',
  'list_statuses',
  'view_project',
  'view_area',
]);

// Tools that mutate data
const WRITE_TOOL_NAMES = new Set([
  'create_case',
  'update_case',
  'assign_case',
  'resolve_case',
  'reopen_case',
  'close_case',
  'create_project',
]);

describe('fogbugzTools schema validation', () => {
  it('exports an array of 19 tools', () => {
    expect(fogbugzTools).toHaveLength(19);
  });

  it('has no duplicate tool names', () => {
    const names = fogbugzTools.map(t => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('every tool name matches a dispatch switch case', () => {
    for (const tool of fogbugzTools) {
      expect(DISPATCH_TOOL_NAMES).toContain(tool.name);
    }
  });

  it('every dispatch switch case has a corresponding tool', () => {
    const toolNames = new Set(fogbugzTools.map(t => t.name));
    for (const name of DISPATCH_TOOL_NAMES) {
      expect(toolNames).toContain(name);
    }
  });

  it('every required field exists in properties', () => {
    for (const tool of fogbugzTools) {
      const { required, properties } = tool.inputSchema;
      for (const field of (required as string[])) {
        expect(Object.keys(properties!)).toContain(field);
      }
    }
  });

  it('inputSchema.type is "object" for every tool', () => {
    for (const tool of fogbugzTools) {
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('read-only tools have readOnlyHint: true', () => {
    for (const tool of fogbugzTools) {
      if (READ_ONLY_TOOL_NAMES.has(tool.name)) {
        expect((tool.annotations as any)?.readOnlyHint).toBe(true);
      }
    }
  });

  it('write tools have readOnlyHint: false', () => {
    for (const tool of fogbugzTools) {
      if (WRITE_TOOL_NAMES.has(tool.name)) {
        expect((tool.annotations as any)?.readOnlyHint).toBe(false);
      }
    }
  });

  it('every tool has a non-empty description', () => {
    for (const tool of fogbugzTools) {
      expect(tool.description!.length).toBeGreaterThan(0);
    }
  });

  it('every tool has a non-empty name', () => {
    for (const tool of fogbugzTools) {
      expect(tool.name.length).toBeGreaterThan(0);
    }
  });
});
