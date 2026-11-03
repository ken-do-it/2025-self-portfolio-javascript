export class ApiError extends Error {
  status: number; code: string;
  constructor(status: number, code: string) { super(code); this.status = status; this.code = code; }
}
export async function limitedJson(response: Response, maxBytes: number): Promise<unknown> {
  if (!response.ok) throw new ApiError(502, 'UPSTREAM_ERROR');
  if (Number(response.headers.get('content-length')) > maxBytes) { await response.body?.cancel(); throw new ApiError(502, 'INVALID_DATA'); }
  const reader = response.body?.getReader();
  if (!reader) throw new ApiError(502, 'INVALID_DATA');
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new ApiError(502, 'INVALID_DATA'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(502, 'INVALID_DATA'); }
}
