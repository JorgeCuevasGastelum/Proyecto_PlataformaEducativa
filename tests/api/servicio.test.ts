import 'dotenv/config';
import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { crearAplicacion } from '../../dist/app.js';
import { crearClientePrisma } from '../../dist/infra/cliente-prisma.js';
import { sembrar } from '../../prisma/seed.js';
import { RepositorioPrisma } from '../../dist/infra/repositorio-prisma.js';
import { ServicioAlumno } from '../../dist/dominio/servicio-alumno.js';
import { ServicioAdministracion } from '../../dist/dominio/servicio-administracion.js';
import { HashConScrypt } from '../../dist/infra/hash-scrypt.js';
import { migrar } from '../../scripts/migrar.mjs';
import { mkdtemp, cp, appendFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const url = new URL(process.env.DATABASE_URL!);
assert.match(url.pathname, /_test$/, 'Estas pruebas borran datos y requieren una base exclusiva _test.');
const db = crearClientePrisma(url.href);
const contrasena = randomBytes(16).toString('hex');
let app: Awaited<ReturnType<typeof crearAplicacion>>, api: ReturnType<typeof request>;
let admin: string, karla: string, sofia: string, ana: string, luis: string, mario: string, pedro: string;
const actorAdmin = { usuarioId: 1, rol: 'administrador' as const, personaId: 1 };

async function login(correoInstitucional: string) {
  const r = await api.post('/api/auth/sesiones').send({ correoInstitucional, contrasena });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body.data.accessToken as string;
}
async function reset() {
  // La base exclusiva está validada antes de cualquier borrado.
  await db.$transaction(async tx => {
    await tx.usuario.deleteMany(); await tx.aviso.deleteMany(); await tx.pago.deleteMany();
    await tx.inscripcion.deleteMany(); await tx.bloqueHorario.deleteMany(); await tx.grupo.deleteMany();
    await tx.alumno.deleteMany(); await tx.maestro.deleteMany(); await tx.administrador.deleteMany();
    await tx.materiaEnPlan.deleteMany(); await tx.prerrequisito.deleteMany(); await tx.planDeEstudios.deleteMany();
    await tx.materia.deleteMany(); await tx.carrera.deleteMany(); await tx.periodoEscolar.deleteMany();
  });
  await sembrar(db, 'diana@admin.edu.mx', contrasena);
}
before(async () => {
  await db.$connect();
  await reset();
  app = await crearAplicacion(true);
  api = request(app.getHttpServer());
});
after(async () => { if (app) await app.close(); await db.$disconnect(); });
beforeEach(async () => {
  await reset();
  [admin, karla, sofia, ana, luis, mario, pedro] = await Promise.all([
    login('diana@admin.edu.mx'), login('karla@alumnos.edu.mx'), login('sofia@alumnos.edu.mx'),
    login('ana@maestros.edu.mx'), login('luis@maestros.edu.mx'), login('mario@alumnos.edu.mx'), login('pedro@alumnos.edu.mx'),
  ]);
});

test('Dos migraciones están aplicadas y el servicio consulta MySQL real', async () => {
  const migrations = await db.$queryRawUnsafe<Array<{ nombre: string; aplicadoEn: Date }>>('SELECT nombre, aplicadoEn FROM _migraciones ORDER BY nombre');
  assert.equal(migrations.length, 2);
  assert.ok(migrations.every(m => m.aplicadoEn));
  const r = await api.get('/api/salud');
  assert.equal(r.status, 200); assert.equal(r.body.data.baseDeDatos, 'disponible');
  assert.equal(await db.usuario.count(), 8);
});

test('Sin credencial, con rol incorrecto y con administrador: 401, 403 y 201', async () => {
  const dto = { matricula: 'NUEVA', nombre: 'Andrea', planDeEstudiosId: 1, correoInstitucional: 'andrea@alumnos.edu.mx', contrasena };
  const sin = await api.post('/api/alumnos').send(dto);
  const rol = await api.post('/api/alumnos').auth(karla, { type: 'bearer' }).send(dto);
  const correcto = await api.post('/api/alumnos').auth(admin, { type: 'bearer' }).send(dto);
  assert.equal(sin.status, 401); assert.equal(rol.status, 403); assert.equal(correcto.status, 201);
  assert.equal(correcto.body.data.matricula, 'NUEVA');
  assert.ok(await login(dto.correoInstitucional));
  assert.equal(await db.alumno.count(), 6);
});

test('JWT alterado y JWT vencido se rechazan con 401', async () => {
  const parts = karla.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  parts[1] = Buffer.from(JSON.stringify({ ...payload, rol: 'administrador' })).toString('base64url');
  assert.equal((await api.get('/api/alumnos').auth(parts.join('.'), { type: 'bearer' })).status, 401);
  const vencido = new JwtService({ secret: process.env.JWT_SECRET }).sign({ sub: 1, rol: 'administrador', personaId: 1 }, { expiresIn: -1, issuer: 'plataforma-educativa', audience: 'plataforma-clientes' });
  assert.equal((await api.get('/api/alumnos').auth(vencido, { type: 'bearer' })).status, 401);
});

test('Inicio de sesión no revela si el correo existe y no expone secretos', async () => {
  const a = await api.post('/api/auth/sesiones').send({ correoInstitucional: 'karla@alumnos.edu.mx', contrasena: 'incorrecta' });
  const b = await api.post('/api/auth/sesiones').send({ correoInstitucional: 'noexiste@alumnos.edu.mx', contrasena: 'incorrecta' });
  assert.equal(a.status, 401); assert.equal(b.status, 401);
  assert.deepEqual(a.body.error, b.body.error);
  const cuenta = await db.usuario.findUniqueOrThrow({ where: { correoInstitucional: 'karla@alumnos.edu.mx' } });
  assert.notEqual(cuenta.contrasenaHash, contrasena);
  assert.ok(await new HashConScrypt().coincide(contrasena, cuenta.contrasenaHash));
  const r = await api.get('/api/auth/sesion').auth(karla, { type: 'bearer' });
  assert.equal(r.status, 200); assert.equal(r.body.data.rol, 'alumno');
  assert.ok(!JSON.stringify(r.body).includes(cuenta.contrasenaHash));
});

test('No existe autorregistro público y el cliente no puede elegir el rol', async () => {
  assert.equal((await api.post('/api/auth/registro').send({})).status, 404);
  const r = await api.post('/api/alumnos').auth(admin, { type: 'bearer' }).send({
    matricula: 'NUEVA', nombre: 'Andrea', planDeEstudiosId: 1, correoInstitucional: 'andrea@alumnos.edu.mx', contrasena, rol: 'administrador',
  });
  assert.equal(r.status, 400); assert.equal(await db.alumno.count(), 5);
});

test('Valida cuerpos, query, ids, arreglos anidados y atributos desconocidos', async () => {
  for (const body of [{ grupoId: '5' }, { grupoId: 5, alumnoId: 3 }, {}, { grupoId: 0 }]) {
    const r = await api.post('/api/inscripciones').auth(karla, { type: 'bearer' }).send(body);
    assert.equal(r.status, 400, JSON.stringify(r.body));
    assert.equal(r.body.ok, false); assert.ok(r.body.error.detalles.length);
  }
  assert.equal((await api.get('/api/grupos?periodoId=no').auth(karla, { type: 'bearer' })).status, 400);
  assert.equal((await api.get('/api/grupos?desconocido=1').auth(karla, { type: 'bearer' })).status, 400);
  assert.equal((await api.delete('/api/inscripciones/1abc').auth(karla, { type: 'bearer' })).status, 400);
  const r = await api.post('/api/grupos').auth(admin, { type: 'bearer' }).send({
    materiaId: 1, periodoId: 2, maestroId: 1, clave: '02', cupoMaximo: 20,
    horario: [{ diaSemana: 'domingo', horaInicio: '25:00', horaFin: '08:00' }],
  });
  assert.equal(r.status, 400);
});

test('CORS permite únicamente los orígenes configurados', async () => {
  const r = await api.get('/api/salud').set('Origin', 'http://localhost:5173');
  assert.equal(r.status, 200); assert.equal(r.headers['access-control-allow-origin'], 'http://localhost:5173');
  const denied = await api.get('/api/salud').set('Origin', 'https://otro.example');
  assert.equal(denied.status, 403); assert.equal(denied.body.error.codigo, 'ORIGEN_NO_PERMITIDO');
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
  const options = await api.options('/api/inscripciones').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'POST');
  assert.equal(options.status, 204);
});

test('OpenAPI describe todas las rutas, entradas y autorización Bearer', async () => {
  const r = await api.get('/docs-json');
  assert.equal(r.status, 200);
  assert.ok(r.body.components.securitySchemes.bearer);
  assert.ok(r.body.components.schemas.AlumnoDto.properties.contrasena.writeOnly);
  assert.ok(r.body.paths['/api/grupos/{id}/calificaciones'].put);
  assert.equal(Object.values(r.body.paths).reduce((n: number, path: any) => n + Object.keys(path).length, 0), 30);
});

test('Inscripción exitosa persiste; duplicado, baja repetida y recurso ajeno se distinguen', async () => {
  const r = await api.post('/api/inscripciones').auth(karla, { type: 'bearer' }).send({ grupoId: 5 });
  assert.equal(r.status, 201);
  const id = r.body.data.id;
  assert.equal((await db.inscripcion.findUniqueOrThrow({ where: { id } })).alumnoId, 1);
  assert.equal((await api.post('/api/inscripciones').auth(karla, { type: 'bearer' }).send({ grupoId: 5 })).body.error.codigo, 'MateriaYaInscritaError');
  assert.equal((await api.delete('/api/inscripciones/' + id).auth(sofia, { type: 'bearer' })).status, 404);
  assert.equal((await api.delete('/api/inscripciones/' + id).auth(karla, { type: 'bearer' })).status, 200);
  const repetida = await api.delete('/api/inscripciones/' + id).auth(karla, { type: 'bearer' });
  assert.equal(repetida.status, 409); assert.equal(repetida.body.error.codigo, 'InscripcionYaDadaDeBajaError');
  const historial = await api.get('/api/alumnos/me/historial').auth(karla, { type: 'bearer' });
  assert.ok(!JSON.stringify(historial.body.data).includes('Redes'));
});

for (const [nombre, usuario, grupoId, codigo] of [
  ['seriación', 'karla', 3, 'SeriacionNoCumplidaError'],
  ['cupo', 'sofia', 6, 'CupoAgotadoError'],
  ['plan', 'pedro', 4, 'MateriaFueraDelPlanError'],
  ['pago pendiente', 'mario', 5, 'PagoDeInscripcionPendienteError'],
  ['grupo de otro período', 'karla', 1, 'GrupoFueraDePeriodoError'],
] as const) {
  test('Regla de ' + nombre + ' responde conflicto 409', async () => {
    const token = { karla, sofia, pedro, mario }[usuario];
    const r = await api.post('/api/inscripciones').auth(token, { type: 'bearer' }).send({ grupoId });
    assert.equal(r.status, 409); assert.equal(r.body.error.codigo, codigo);
  });
}

test('Empalme y límite de créditos responden 409', async () => {
  await db.inscripcion.update({ where: { id: 1 }, data: { calificacion: 90 } });
  assert.equal((await api.post('/api/inscripciones').auth(karla, { type: 'bearer' }).send({ grupoId: 3 })).status, 201);
  const empalme = await api.post('/api/inscripciones').auth(karla, { type: 'bearer' }).send({ grupoId: 4 });
  assert.equal(empalme.status, 409); assert.equal(empalme.body.error.codigo, 'EmpalmeDeHorarioError');
  await db.periodoEscolar.update({ where: { id: 2 }, data: { creditosMaximos: 6 } });
  const limite = await api.post('/api/inscripciones').auth(karla, { type: 'bearer' }).send({ grupoId: 5 });
  assert.equal(limite.status, 409); assert.equal(limite.body.error.codigo, 'LimiteDeCreditosExcedidoError');
});

test('Califica solo el maestro dueño; calificar habilita la seriación', async () => {
  const dto = { calificaciones: [{ inscripcionId: 1, calificacion: 90 }, { inscripcionId: 2, calificacion: 60 }] };
  assert.equal((await api.put('/api/grupos/1/calificaciones').auth(luis, { type: 'bearer' }).send(dto)).status, 403);
  assert.equal((await api.put('/api/grupos/1/calificaciones').auth(ana, { type: 'bearer' }).send(dto)).status, 200);
  assert.equal((await api.post('/api/inscripciones').auth(karla, { type: 'bearer' }).send({ grupoId: 3 })).status, 201);
  const history = await api.get('/api/alumnos/me/historial').auth(karla, { type: 'bearer' });
  assert.ok(history.body.data.some((p: any) => p.materias.some((m: any) => m.calificacion === 90 && m.aprobada === true)));
});

test('Calificación inválida no guarda parcialmente el lote y carga abierta rechaza captura', async () => {
  const r = await api.put('/api/grupos/1/calificaciones').auth(ana, { type: 'bearer' }).send({
    calificaciones: [{ inscripcionId: 1, calificacion: 90 }, { inscripcionId: 2, calificacion: 101 }],
  });
  assert.equal(r.status, 409); assert.equal(r.body.error.codigo, 'CalificacionInvalidaError');
  assert.equal((await db.inscripcion.findUniqueOrThrow({ where: { id: 1 } })).calificacion, null);
  const abierta = await api.put('/api/grupos/3/calificaciones').auth(ana, { type: 'bearer' }).send({ calificaciones: [{ inscripcionId: 5, calificacion: 70 }] });
  assert.equal(abierta.status, 409); assert.equal(abierta.body.error.codigo, 'CargaAunAbiertaError');
});

test('Materias inválidas, claves duplicadas, grupos duplicados y rangos de horario: 409', async () => {
  const materia = { clave: 'NUEVA', nombre: 'Nueva', descripcion: '', creditos: 0, prerrequisitoIds: [] };
  const invalid = await api.post('/api/materias').auth(admin, { type: 'bearer' }).send(materia);
  assert.equal(invalid.status, 409); assert.equal(invalid.body.error.codigo, 'MateriaInvalidaError');
  const duplicate = await api.post('/api/materias').auth(admin, { type: 'bearer' }).send({ ...materia, clave: 'PROG1', creditos: 5 });
  assert.equal(duplicate.status, 409);
  const group = { materiaId: 2, periodoId: 2, clave: '01', maestroId: 1, cupoMaximo: 20, horario: [{ diaSemana: 'sabado', horaInicio: '08:00', horaFin: '09:00' }] };
  assert.equal((await api.post('/api/grupos').auth(admin, { type: 'bearer' }).send(group)).body.error.codigo, 'GrupoDuplicadoError');
  const horario = await api.post('/api/grupos').auth(admin, { type: 'bearer' }).send({ ...group, clave: '02', horario: [{ diaSemana: 'sabado', horaInicio: '09:00', horaFin: '08:00' }] });
  assert.equal(horario.status, 409); assert.equal(horario.body.error.codigo, 'RangoHorarioInvalidoError');
});

test('Pagos administrados eliminan el bloqueo; adeudo vencido lo impide y pago repetido da 409', async () => {
  assert.equal((await api.patch('/api/pagos/5/liquidacion').auth(admin, { type: 'bearer' }).send({})).status, 200);
  assert.equal((await api.post('/api/inscripciones').auth(mario, { type: 'bearer' }).send({ grupoId: 5 })).status, 201);
  assert.equal((await api.patch('/api/pagos/5/liquidacion').auth(admin, { type: 'bearer' }).send({})).body.error.codigo, 'PagoYaRegistradoError');
  assert.equal((await api.post('/api/pagos').auth(admin, { type: 'bearer' }).send({ alumnoId: 4, periodoId: 1, concepto: 'colegiatura', monto: 100, fechaLimite: new Date(Date.now() - 86400000).toISOString() })).status, 201);
  const adeudo = await api.post('/api/inscripciones').auth(pedro, { type: 'bearer' }).send({ grupoId: 8 });
  assert.equal(adeudo.status, 409); assert.equal(adeudo.body.error.codigo, 'AdeudoVencidoError');
});

test('Período cerrado rechaza inscripción; abrir dos períodos rechaza y avisos persisten', async () => {
  const dos = await api.patch('/api/periodos/1/carga').auth(admin, { type: 'bearer' }).send({ habilitado: true });
  assert.equal(dos.status, 409); assert.equal(dos.body.error.codigo, 'YaExistePeriodoAbiertoError');
  assert.equal((await api.patch('/api/periodos/2/carga').auth(admin, { type: 'bearer' }).send({ habilitado: false })).status, 200);
  const cerrado = await api.post('/api/inscripciones').auth(karla, { type: 'bearer' }).send({ grupoId: 5 });
  assert.equal(cerrado.status, 409); assert.equal(cerrado.body.error.codigo, 'PeriodoDeCargaCerradoError');
  const aviso = await api.post('/api/avisos').auth(admin, { type: 'bearer' }).send({ periodoId: 2, titulo: 'Nuevo aviso', contenido: 'Información' });
  assert.equal(aviso.status, 201);
  assert.equal((await api.get('/api/avisos?periodoId=2').auth(karla, { type: 'bearer' })).body.data.length, 2);
});

test('Catálogos, listas, horario, cuenta, grupo propio y ocupación funcionan', async () => {
  for (const path of ['/carreras', '/planes', '/materias', '/periodos', '/grupos?periodoId=2', '/alumnos/me/materias', '/alumnos/me/horario', '/alumnos/me/pagos']) {
    const r = await api.get('/api' + path).auth(karla, { type: 'bearer' });
    assert.equal(r.status, 200, path); assert.equal(r.body.ok, true); assert.ok(Array.isArray(r.body.data));
  }
  for (const path of ['/alumnos', '/maestros', '/grupos/6/ocupacion']) assert.equal((await api.get('/api' + path).auth(admin, { type: 'bearer' })).status, 200);
  for (const path of ['/maestros/me/grupos', '/grupos/1/alumnos']) assert.equal((await api.get('/api' + path).auth(ana, { type: 'bearer' })).status, 200);
  assert.equal((await api.get('/api/grupos/1/alumnos').auth(luis, { type: 'bearer' })).status, 403);
});

test('Registra maestro, materia, relación en plan y grupo sin filtrar contraseñas', async () => {
  const teacher = await api.post('/api/maestros').auth(admin, { type: 'bearer' }).send({ nombre: 'Claudia', numeroEmpleado: 'NUEVO', correoInstitucional: 'claudia@maestros.edu.mx', contrasena });
  assert.equal(teacher.status, 201); assert.equal(teacher.body.data.contrasenaHash, undefined);
  const m = await api.post('/api/materias').auth(admin, { type: 'bearer' }).send({ clave: 'NUEVA', nombre: 'Nueva', descripcion: '', creditos: 5, prerrequisitoIds: [1] });
  assert.equal(m.status, 201); assert.deepEqual(m.body.data.prerrequisitoIds, [1]);
  for (let i = 0; i < 2; i++) assert.equal((await api.put('/api/planes/1/materias/' + m.body.data.id).auth(admin, { type: 'bearer' })).status, 200);
  assert.equal(await db.materiaEnPlan.count({ where: { planId: 1, materiaId: m.body.data.id } }), 1);
  const g = await api.post('/api/grupos').auth(admin, { type: 'bearer' }).send({ materiaId: m.body.data.id, periodoId: 2, clave: '01', maestroId: teacher.body.data.id, cupoMaximo: 20, horario: [{ diaSemana: 'sabado', horaInicio: '08:00', horaFin: '09:00' }] });
  assert.equal(g.status, 201); assert.equal(g.body.data.horario[0].minutoInicio, 480);
});

test('Dos solicitudes por el último lugar producen exactamente una inscripción', async () => {
  await db.grupo.update({ where: { id: 5 }, data: { cupoMaximo: 1 } });
  const results = await Promise.all([karla, sofia].map(token => api.post('/api/inscripciones').auth(token, { type: 'bearer' }).send({ grupoId: 5 })));
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal(results.find(r => r.status === 409)!.body.error.codigo, 'CupoAgotadoError');
  assert.equal(await db.inscripcion.count({ where: { grupoId: 5, estadoActual: 'activa' } }), 1);
});

test('Registro concurrente con el mismo correo no deja personas huérfanas', async () => {
  const dto = { nombre: 'Andrea', planDeEstudiosId: 1, correoInstitucional: 'nuevo@alumnos.edu.mx', contrasena };
  const results = await Promise.all(['NUEVA1', 'NUEVA2'].map(matricula => api.post('/api/alumnos').auth(admin, { type: 'bearer' }).send({ ...dto, matricula })));
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal(await db.alumno.count(), 6); assert.equal(await db.usuario.count(), 9);
});

test('Un fallo de almacenamiento después de crear una persona revierte toda la operación', async () => {
  const casos = app.get((await import('../../dist/aplicacion/casos-de-uso.js')).CasosDeUso);
  await assert.rejects(casos.ejecutar(true, async s => {
    await s.repo.crearAlumno({ matricula: 'FALLO', nombre: 'Fallará', planDeEstudiosId: 1 });
    await s.repo.crearUsuario({ correoInstitucional: 'karla@alumnos.edu.mx', contrasenaHash: 'no-se-guardara', rol: 'alumno', personaId: 1 });
  }));
  assert.equal(await db.alumno.findUnique({ where: { matricula: 'FALLO' } }), null);
});

test('Repetir el seed conserva cambios y contraseñas', async () => {
  await db.periodoEscolar.update({ where: { id: 2 }, data: { habilitado: false } });
  const cuenta = await db.usuario.findUniqueOrThrow({ where: { correoInstitucional: 'diana@admin.edu.mx' } });
  assert.deepEqual(await sembrar(db, 'diana@admin.edu.mx', randomBytes(16).toString('hex')), { creado: false });
  assert.equal((await db.periodoEscolar.findUniqueOrThrow({ where: { id: 2 } })).habilitado, false);
  assert.equal((await db.usuario.findUniqueOrThrow({ where: { id: cuenta.id } })).contrasenaHash, cuenta.contrasenaHash);
});

test('Los servicios existentes funcionan con el contrato real sin reescribir reglas', async () => {
  const repo = new RepositorioPrisma(db);
  const alumno = new ServicioAlumno(repo);
  const administrador = new ServicioAdministracion(repo, new HashConScrypt());
  const ocupacion = await administrador.consultarOcupacionDeGrupo(actorAdmin, 6);
  assert.deepEqual(ocupacion, { ocupados: 1, disponibles: 0 });
  const historial = await alumno.consultarHistorial({ usuarioId: 5, rol: 'alumno', personaId: 2 });
  assert.ok(historial.some(p => p.materias.some(m => m.calificacion === 85 && m.aprobada)));
});

test('El historial se puede repetir y rechaza migraciones modificadas o incompletas', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'migraciones-prueba-'));
  try {
    await cp('prisma/migrations', fixture, { recursive: true });
    await migrar(url.href, fixture);
    assert.equal(await db.alumno.count(), 5);
    await appendFile(path.join(fixture, '202610140001_catalogo_academico', 'migration.sql'), '\n-- cambio prohibido\n');
    await assert.rejects(migrar(url.href, fixture), /No edites migraciones aplicadas/);
    await cp('prisma/migrations', fixture, { recursive: true });
    await db.$executeRawUnsafe("UPDATE _migraciones SET estado = 'fallida' WHERE nombre = '202610140002_acceso_e_integridad'");
    try {
      await assert.rejects(migrar(url.href, fixture), /quedó incompleta/);
    } finally {
      await db.$executeRawUnsafe("UPDATE _migraciones SET estado = 'aplicada' WHERE nombre = '202610140002_acceso_e_integridad'");
    }
  } finally { await rm(fixture, { recursive: true, force: true }); }
});
