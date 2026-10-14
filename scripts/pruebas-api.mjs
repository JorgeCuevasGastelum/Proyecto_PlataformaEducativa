import 'dotenv/config';
import { spawnSync } from 'node:child_process';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('Configura TEST_DATABASE_URL para una base separada terminada en _test. Nunca uses tu base de trabajo.');
const parsed = new URL(url);
if (parsed.protocol !== 'mysql:' || !/^\/[a-zA-Z0-9_]+_test$/.test(parsed.pathname)) {
  throw new Error('La base de pruebas debe ser MySQL y su nombre debe terminar en _test.');
}
const env = { ...process.env, DATABASE_URL: url };
for (const args of [
  ['scripts/migrar.mjs'],
  ['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/api/servicio.test.ts'],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
