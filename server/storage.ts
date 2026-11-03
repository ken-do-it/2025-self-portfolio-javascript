import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
export function cacheDirectory() { return process.env.HIKEN_CACHE_DIR || (process.env.VERCEL ? join(tmpdir(), 'hiken-cache') : resolve('.cache')); }
export async function readCache(name: string): Promise<unknown> {
  try { return JSON.parse(await readFile(join(cacheDirectory(), name + '.json'), 'utf8')); } catch { return undefined; }
}
export async function writeCache(name: string, value: unknown) {
  await mkdir(cacheDirectory(), { recursive: true });
  const file = join(cacheDirectory(), name + '.json');
  const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value), { mode: 0o600 }); await rename(temp, file);
}
