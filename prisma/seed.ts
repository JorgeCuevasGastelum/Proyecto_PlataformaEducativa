import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';
import { RepositorioEnMemoria } from '../src/infra/repositorio-en-memoria.js';
import { RepositorioPrisma } from '../src/infra/repositorio-prisma.js';
import { HashConScrypt } from '../src/infra/hash-scrypt.js';
import { crearClientePrisma } from '../src/infra/cliente-prisma.js';

export async function sembrar(db: PrismaClient, correoAdmin: string, contrasena: string) {
  if (!contrasena || contrasena.length < 8 || contrasena.length > 128 || contrasena.startsWith('REEMPLAZA_')) {
    throw new Error('Configura SEED_PASSWORD (8 a 128 caracteres) en tu archivo .env.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoAdmin)) throw new Error('SEED_ADMIN_EMAIL no es válido.');
  const correo = correoAdmin.trim().toLowerCase();
  if (await db.usuario.findUnique({ where: { correoInstitucional: correo } })) {
    return { creado: false }; // Repetir no borra datos, reabre períodos ni cambia contraseñas.
  }
  const memoria = new RepositorioEnMemoria();
  const hash = new HashConScrypt();
  await db.$transaction(async tx => {
    if (await tx.carrera.count() || await tx.usuario.count()) {
      throw new Error('El seed requiere una base vacía o el administrador de una ejecución anterior; no sobrescribe información.');
    }
    const repo = new RepositorioPrisma(tx);
    for (const id of [1, 2]) {
      const carrera = (await memoria.buscarCarreraPorId(id))!;
      await tx.carrera.create({ data: carrera });
    }
    for (const id of [1, 2, 3, 4, 5, 6, 7]) {
      const { prerrequisitoIds, ...m } = (await memoria.buscarMateriaPorId(id))!;
      await tx.materia.create({ data: m });
      for (const prerrequisitoId of prerrequisitoIds) await tx.prerrequisito.create({ data: { materiaId: id, prerrequisitoId } });
    }
    for (const id of [1, 2]) {
      const { materiaIds, ...p } = (await memoria.buscarPlanDeEstudiosPorId(id))!;
      await tx.planDeEstudios.create({ data: { ...p, materias: { create: materiaIds.map(materiaId => ({ materiaId })) } } });
      await tx.maestro.create({ data: (await memoria.buscarMaestroPorId(id))! });
      await tx.periodoEscolar.create({ data: (await memoria.buscarPeriodoPorId(id))! });
    }
    await tx.administrador.create({ data: (await memoria.buscarAdministradorPorId(1))! });
    for (const id of [1, 2, 3, 4, 5]) await tx.alumno.create({ data: (await memoria.buscarAlumnoPorId(id))! });
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const { horario, ...g } = (await memoria.buscarGrupoPorId(id))!;
      await tx.grupo.create({ data: { ...g, horario: { create: horario } } });
    }
    for (const id of [1, 2, 3, 4, 5]) await tx.inscripcion.create({ data: (await memoria.buscarInscripcionPorId(id))! });
    for (const alumnoId of [1, 2, 3, 4, 5]) {
      for (const pago of await memoria.listarPagosDeAlumno(alumnoId)) await tx.pago.create({ data: pago });
    }
    for (const mail of ['diana@admin.edu.mx', 'ana@maestros.edu.mx', 'luis@maestros.edu.mx', 'karla@alumnos.edu.mx', 'juan@alumnos.edu.mx', 'sofia@alumnos.edu.mx', 'pedro@alumnos.edu.mx', 'mario@alumnos.edu.mx']) {
      const { id: _id, ...u } = (await memoria.buscarUsuarioPorCorreo(mail))!;
      await repo.crearUsuario({ ...u, correoInstitucional: u.rol === 'administrador' ? correo : mail, contrasenaHash: await hash.generar(contrasena) });
    }
    await repo.crearAviso({ periodoId: 2, titulo: 'Carga académica abierta', contenido: 'Revisa tu plan, pagos y horario antes de inscribirte.', fechaPublicacion: new Date() });
  }, { timeout: 30000 });
  return { creado: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL.');
  const db = crearClientePrisma(process.env.DATABASE_URL);
  try {
    const result = await sembrar(db, process.env.SEED_ADMIN_EMAIL ?? '', process.env.SEED_PASSWORD ?? '');
    console.log(result.creado ? 'Datos de arranque creados. Usa las credenciales de tu .env.' : 'El seed ya estaba aplicado; se conservaron los datos.');
  } finally { await db.$disconnect(); }
}
