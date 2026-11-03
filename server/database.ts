import { ApiError, limitedJson } from './http.ts';

export function databaseConfigured(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SECRET_KEY;
}
export async function databaseRpc(name: 'hiken_sync' | 'hiken_read' | 'hiken_snapshot' | 'hiken_claim' | 'hiken_finish', args: Record<string, unknown> = {}): Promise<unknown> {
  const base = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!base || !key) throw new ApiError(503, 'TRANSLATION_STORE_UNAVAILABLE');
  const url = new URL(base);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co') || url.username || url.password || url.port) throw new ApiError(503, 'TRANSLATION_STORE_UNAVAILABLE');
  url.pathname = `/rest/v1/rpc/${name}`; url.search = ''; url.hash = '';
  const response = await fetch(url, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
    headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify(args)
  });
  // Never return database errors or credentials to clients.
  if (!response.ok) throw new ApiError(503, 'TRANSLATION_STORE_UNAVAILABLE');
  return limitedJson(response, 15_000_000);
}
