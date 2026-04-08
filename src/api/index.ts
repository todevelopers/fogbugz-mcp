import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { FogBugzConfig } from './types';
import { IFogBugzClient } from './base-client';
import { FogBugzXmlClient } from './xml-client';
import { FogBugzJsonClient } from './json-client';

/**
 * Detect the FogBugz API version and return the appropriate client.
 *
 * Detection strategy:
 * 1. GET /api.xml — always available, returns <version> number.
 * 2. If version >= 9 (JSON API era), probe /f/api/0/jsonapi.
 *    - Probe success (response has an `errors` array) → FogBugzJsonClient.
 *    - Probe failure → FogBugzXmlClient (fallback).
 * 3. If version < 9 or /api.xml is unreachable → FogBugzXmlClient.
 */
export async function createFogBugzClient(config: FogBugzConfig): Promise<IFogBugzClient> {
  const baseUrl = config.baseUrl.endsWith('/')
    ? config.baseUrl.slice(0, -1)
    : config.baseUrl;

  try {
    const versionResponse = await axios.get(`${baseUrl}/api.xml`, {
      timeout: 5000,
      responseType: 'text',
    });

    const parser = new XMLParser({ parseTagValue: true });
    const parsed = parser.parse(versionResponse.data);
    const apiVersion = Number(parsed?.response?.version ?? 0);

    if (apiVersion >= 9) {
      try {
        const probe = await axios.post(
          `${baseUrl}/f/api/0/jsonapi`,
          { cmd: 'listProjects', token: config.apiKey },
          { headers: { 'Content-Type': 'application/json' }, timeout: 5000 },
        );
        if (probe.data && Array.isArray(probe.data.errors)) {
          return new FogBugzJsonClient(config);
        }
      } catch {
        // JSON API unreachable despite version >= 9 — fall back to XML
      }
    }
  } catch {
    // api.xml unreachable — fall back to XML
  }

  return new FogBugzXmlClient(config);
}

export { FogBugzXmlClient, FogBugzJsonClient };
export type { IFogBugzClient };
export * from './types';
