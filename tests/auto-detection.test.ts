/**
 * Auto-detection tests for createFogBugzClient().
 * Mocks axios.get (for /api.xml) and axios.post (for JSON probe).
 */

import axios from 'axios';
import { createFogBugzClient, FogBugzXmlClient, FogBugzJsonClient } from '../src/api';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

const CONFIG = { baseUrl: 'https://test.fogbugz.com', apiKey: 'test-key' };

function apiXmlResponse(version: number): string {
  return `<?xml version="1.0"?><response><version>${version}</version><minversion>1</minversion><url>api.asp</url></response>`;
}

function jsonProbeSuccess(): object {
  return { data: { errors: [], warnings: [], data: {} } };
}

describe('createFogBugzClient() auto-detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns FogBugzXmlClient when api.xml reports version 8 (no JSON probe)', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: apiXmlResponse(8) });

    const client = await createFogBugzClient(CONFIG);

    expect(client).toBeInstanceOf(FogBugzXmlClient);
    expect(mockAxios.post).not.toHaveBeenCalled();
  });

  it('returns FogBugzXmlClient when api.xml reports version 1 (old server)', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: apiXmlResponse(1) });

    const client = await createFogBugzClient(CONFIG);

    expect(client).toBeInstanceOf(FogBugzXmlClient);
    expect(mockAxios.post).not.toHaveBeenCalled();
  });

  it('returns FogBugzJsonClient when api.xml reports version 9 and JSON probe succeeds', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: apiXmlResponse(9) });
    mockAxios.post.mockResolvedValueOnce(jsonProbeSuccess());

    const client = await createFogBugzClient(CONFIG);

    expect(client).toBeInstanceOf(FogBugzJsonClient);
  });

  it('returns FogBugzJsonClient when api.xml reports version 10 and JSON probe succeeds', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: apiXmlResponse(10) });
    mockAxios.post.mockResolvedValueOnce(jsonProbeSuccess());

    const client = await createFogBugzClient(CONFIG);

    expect(client).toBeInstanceOf(FogBugzJsonClient);
  });

  it('falls back to FogBugzXmlClient when version >= 9 but JSON probe throws', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: apiXmlResponse(9) });
    mockAxios.post.mockRejectedValueOnce(new Error('Network error'));

    const client = await createFogBugzClient(CONFIG);

    expect(client).toBeInstanceOf(FogBugzXmlClient);
  });

  it('falls back to FogBugzXmlClient when version >= 9 but JSON probe returns no errors array', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: apiXmlResponse(10) });
    // Unexpected response format — no `errors` field
    mockAxios.post.mockResolvedValueOnce({ data: '<html>Not Found</html>' });

    const client = await createFogBugzClient(CONFIG);

    expect(client).toBeInstanceOf(FogBugzXmlClient);
  });

  it('falls back to FogBugzXmlClient when api.xml request fails', async () => {
    mockAxios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const client = await createFogBugzClient(CONFIG);

    expect(client).toBeInstanceOf(FogBugzXmlClient);
    expect(mockAxios.post).not.toHaveBeenCalled();
  });

  it('probes the correct JSON endpoint', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: apiXmlResponse(9) });
    mockAxios.post.mockResolvedValueOnce(jsonProbeSuccess());

    await createFogBugzClient(CONFIG);

    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://test.fogbugz.com/f/api/0/jsonapi',
      expect.objectContaining({ cmd: 'logon' }),
      expect.any(Object),
    );
  });

  it('strips trailing slash from baseUrl before probing', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: apiXmlResponse(9) });
    mockAxios.post.mockResolvedValueOnce(jsonProbeSuccess());

    await createFogBugzClient({ baseUrl: 'https://test.fogbugz.com/', apiKey: 'k' });

    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://test.fogbugz.com/f/api/0/jsonapi',
      expect.any(Object),
      expect.any(Object),
    );
  });
});
