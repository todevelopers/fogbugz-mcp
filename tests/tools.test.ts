import { fogbugzTools } from '../src/commands/tools';

// The set of tool names that the dispatch switch in src/index.ts handles
const DISPATCH_TOOL_NAMES = new Set([
  'fogbugz_create_case',
  'fogbugz_update_case',
  'fogbugz_assign_case',
  'fogbugz_list_my_cases',
  'fogbugz_search_cases',
  'fogbugz_get_case_link',
  'fogbugz_get_case',
  'fogbugz_resolve_case',
  'fogbugz_reopen_case',
  'fogbugz_close_case',
  'fogbugz_list_people',
  'fogbugz_list_categories',
  'fogbugz_view_project',
  'fogbugz_view_area',
  'fogbugz_create_project',
  'fogbugz_api_request',
]);

// Tools that should be read-only
const READ_ONLY_TOOL_NAMES = new Set([
  'fogbugz_list_my_cases',
  'fogbugz_search_cases',
  'fogbugz_get_case_link',
  'fogbugz_get_case',
  'fogbugz_list_people',
  'fogbugz_list_categories',
  'fogbugz_view_project',
  'fogbugz_view_area',
]);

// Tools that mutate data
const WRITE_TOOL_NAMES = new Set([
  'fogbugz_create_case',
  'fogbugz_update_case',
  'fogbugz_assign_case',
  'fogbugz_resolve_case',
  'fogbugz_reopen_case',
  'fogbugz_close_case',
  'fogbugz_create_project',
]);

describe('fogbugzTools schema validation', () => {
  it('exports an array of 16 tools', () => {
    expect(fogbugzTools).toHaveLength(16);
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
      for (const field of required) {
        expect(Object.keys(properties)).toContain(field);
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
        expect(tool.annotations?.readOnlyHint).toBe(true);
      }
    }
  });

  it('write tools have readOnlyHint: false', () => {
    for (const tool of fogbugzTools) {
      if (WRITE_TOOL_NAMES.has(tool.name)) {
        expect(tool.annotations?.readOnlyHint).toBe(false);
      }
    }
  });

  it('every tool has a non-empty description', () => {
    for (const tool of fogbugzTools) {
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  it('every tool has a non-empty name', () => {
    for (const tool of fogbugzTools) {
      expect(tool.name.length).toBeGreaterThan(0);
    }
  });
});
