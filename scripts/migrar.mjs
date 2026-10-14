import 'dotenv/config';
import mariadb from 'mariadb';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const carpeta = fileURLToPath(new URL('../prisma/migrations/', import.meta.url));

/** Migraciones SQL ordenadas, con checksum e historial persistente en MySQL. */
export async function migrar(databaseUrl, carpetaMigraciones = carpeta) {
  if (!databaseUrl) throw new Error('Configura DATABASE_URL en .env.');
  const url = new URL(databaseUrl);
  const database = decodeURIComponent(url.pathname.slice(1));
  if (url.protocol !== 'mysql:' || !/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('DATABASE_URL requiere MySQL y un nombre de base válido.');
  const connection = await mariadb.createConnection({
    host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password), database, multipleStatements: true,
    timezone: '+00:00',
    allowPublicKeyRetrieval: ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname),
  });
  const lock = 'migraciones:' + database;
  try {
    const [locked] = await connection.query('SELECT GET_LOCK(?, 30) AS obtenido', [lock]);
    if (Number(locked.obtenido) !== 1) throw new Error('Otra ejecución está aplicando migraciones.');
    await connection.query(
      'CREATE TABLE IF NOT EXISTS _migraciones (' +
      'nombre VARCHAR(191) PRIMARY KEY, checksum CHAR(64) NOT NULL, estado VARCHAR(20) NOT NULL,' +
      ' iniciadoEn DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), aplicadoEn DATETIME(3) NULL' +
      ') ENGINE=InnoDB'
    );
    const entries = await readdir(carpetaMigraciones, { withFileTypes: true });
    const names = entries.filter(e => e.isDirectory()).map(e => e.name).sort();
    const history = await connection.query('SELECT nombre, checksum, estado FROM _migraciones ORDER BY nombre');
    // Verifica todo el historial antes de aplicar cambios nuevos.
    for (const item of history) {
      if (!names.includes(item.nombre)) throw new Error('Falta la migración aplicada: ' + item.nombre);
      const sql = await readFile(path.join(carpetaMigraciones, item.nombre, 'migration.sql'), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      if (checksum !== item.checksum) throw new Error('No edites migraciones aplicadas: ' + item.nombre);
      if (item.estado !== 'aplicada') throw new Error('La migración ' + item.nombre + ' quedó incompleta. Revisa el estado de la base antes de continuar.');
    }
    for (const name of names) {
      if (history.some(h => h.nombre === name)) continue;
      const sql = await readFile(path.join(carpetaMigraciones, name, 'migration.sql'), 'utf8');
      if (!sql.trim()) throw new Error('La migración está vacía: ' + name);
      const checksum = createHash('sha256').update(sql).digest('hex');
      await connection.query('INSERT INTO _migraciones(nombre, checksum, estado) VALUES (?, ?, ?)', [name, checksum, 'pendiente']);
      try {
        // Solo ejecuta archivos versionados, nunca SQL de una petición HTTP.
        await connection.query(sql);
        await connection.query('UPDATE _migraciones SET estado = ?, aplicadoEn = CURRENT_TIMESTAMP(3) WHERE nombre = ?', ['aplicada', name]);
        console.log('Migración aplicada: ' + name);
      } catch (error) {
        await connection.query('UPDATE _migraciones SET estado = ? WHERE nombre = ?', ['fallida', name]);
        throw new Error('Falló la migración ' + name + ' (' + (error.code ?? 'SQL_ERROR') + '). MySQL no revierte automáticamente el DDL; revisa la base.');
      }
    }
    console.log('Historial de migraciones actualizado.');
  } finally {
    await connection.query('SELECT RELEASE_LOCK(?)', [lock]).catch(() => {});
    await connection.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await migrar(process.env.DATABASE_URL); }
  catch (error) {
    console.error(error.code ? 'No se pudo conectar a MySQL (' + error.code + '). Revisa .env y MySQL Server.' : error.message);
    process.exitCode = 1;
  }
}
