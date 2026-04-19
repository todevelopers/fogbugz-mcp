import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { FogBugzConfig } from './types';
import { IFogBugzClient } from './base-client';
import { FogBugzXmlClient } from './xml-client';
import { FogBugzJsonClient } from './json-client';
import { normalizeBaseUrl } from './utils';

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
  const baseUrl = normalizeBaseUrl(config.baseUrl);

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
        // Probe without a token intentionally. We only need to confirm that
        // the JSON API endpoint exists and speaks the expected protocol — we
        // do NOT need a successful authenticated response for that.
        //
        // Sending the real API key here would be a security risk: if the URL
        // is mis-configured or the request is intercepted, credentials are
        // exposed before the client type is even known. A token-free request
        // eliminates that risk entirely.
        //
        // We use 'logon' as the command because it is the lightest possible
        // call — it requires no server-side read and has no side-effects,
        // unlike 'listProjects' which would perform a real read operation on
        // every startup.
        const probe = await axios.post(
          `${baseUrl}/f/api/0/jsonapi`,
          { cmd: 'logon' },
          { headers: { 'Content-Type': 'application/json' }, timeout: 5000 },
        );

        // The FogBugz JSON API always wraps its response in an envelope that
        // contains an 'errors' array — even for unauthenticated or failed
        // requests (e.g. { "errors": ["Not logged in"] }).  Checking for this
        // array confirms that we are talking to the JSON API and not some
        // proxy, redirect page, or XML fallback endpoint that happens to
        // return HTTP 200.
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
