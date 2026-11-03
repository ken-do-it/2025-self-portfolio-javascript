import { mkdir, writeFile } from 'node:fs/promises';
import { getEvents } from '../server/events.ts';
const data = await getEvents();
if (data.stale) throw new Error('Cannot create release snapshot from stale data');
await mkdir('data', { recursive: true });
await writeFile('data/events.snapshot.json', JSON.stringify(data));
console.log(JSON.stringify({ count: data.events.length, updatedAt: data.updatedAt, source: data.source }));
