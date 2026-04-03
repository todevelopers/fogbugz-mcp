/**
 * JSON API tests — skipped until the JSON API is implemented.
 * To enable: add "test:json" to the test script in package.json.
 */

// TODO: remove describe.skip when JSON API is implemented
describe.skip('JSON API', () => {
  it.todo('GET /api/cases returns array of cases');
  it.todo('GET /api/cases/:id returns single case');
  it.todo('POST /api/cases creates a new case');
  it.todo('PATCH /api/cases/:id updates an existing case');
  it.todo('DELETE /api/cases/:id closes a case');
  it.todo('returns 401 for missing or invalid auth token');
  it.todo('returns 404 for unknown case ID');
  it.todo('paginates results with limit and offset parameters');
});
