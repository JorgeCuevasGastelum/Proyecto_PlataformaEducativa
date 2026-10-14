import 'dotenv/config';

export function leerConfiguracion() {
  const databaseUrl = process.env.DATABASE_URL;
  const secret = process.env.JWT_SECRET;
  if (!databaseUrl || !databaseUrl.startsWith('mysql://') || databaseUrl.includes('CAMBIA_')) {
    throw new Error('Configura DATABASE_URL para tu servidor MySQL en .env.');
  }
  if (!secret || secret.length < 32 || secret.startsWith('REEMPLAZA_')) {
    throw new Error('Configura JWT_SECRET con al menos 32 caracteres aleatorios.');
  }
  const port = Number(process.env.PORT ?? 3000);
  const ttl = Number(process.env.JWT_TTL_SECONDS ?? 3600);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT no es válido.');
  if (!Number.isInteger(ttl) || ttl < 60 || ttl > 86400) throw new Error('JWT_TTL_SECONDS debe estar entre 60 y 86400.');
  const origins = (process.env.CORS_ORIGINS ?? '').split(',').map(o => o.trim()).filter(Boolean);
  if (!origins.length || origins.some(o => {
    try { const u = new URL(o); return !['http:', 'https:'].includes(u.protocol) || u.origin !== o; }
    catch { return true; }
  })) throw new Error('CORS_ORIGINS debe contener orígenes HTTP exactos, sin rutas ni comodines.');
  return { databaseUrl, secret, port, ttl, origins };
}
