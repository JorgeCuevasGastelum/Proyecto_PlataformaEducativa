import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// El adaptador oficial usa el protocolo MySQL; no requiere cambiar el servidor a MariaDB.
export function opcionesPrisma(databaseUrl: string) {
  const url = new URL(databaseUrl);
  if (url.protocol !== 'mysql:') throw new Error('Se requiere una URL MySQL.');
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: 5,
    timezone: '+00:00',
    allowPublicKeyRetrieval: ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname),
  });
  return { adapter };
}
export function crearClientePrisma(databaseUrl: string) {
  return new PrismaClient(opcionesPrisma(databaseUrl));
}
