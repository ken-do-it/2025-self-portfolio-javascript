import { runTranslationWorker } from '../server/translation-worker.ts';
import { databaseConfigured } from '../server/database.ts';
try { process.loadEnvFile('.env.local'); } catch { /* Explicit environment is also supported. */ }
if (!databaseConfigured()) throw new Error('Configure the Hiken SUPABASE_URL and server-only SUPABASE_SECRET_KEY first.');
console.log(await runTranslationWorker());
