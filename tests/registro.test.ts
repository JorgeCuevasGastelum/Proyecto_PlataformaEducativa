import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { RepositorioEnMemoria } from '../src/infra/repositorio-en-memoria.js';
import { HashConScrypt } from '../src/infra/hash-scrypt.js';
import { ServicioRegistro } from '../src/dominio/servicio-registro.js';
import { ServicioAdministracion } from '../src/dominio/servicio-administracion.js';
import { ServicioAutenticacion } from '../src/dominio/servicio-autenticacion.js';
import { OperacionNoAutorizadaError, CorreoDuplicadoError } from '../src/dominio/errores.js';

test('El registro compartido crea una cuenta autenticable sin depender del rol del actor', async () => {
  const repo = new RepositorioEnMemoria(), hash = new HashConScrypt();
  const registro = new ServicioRegistro(repo, hash);
  const contrasena = randomBytes(16).toString('hex');
  const alumno = await registro.registrarAlumno({ nombre: 'Andrea', matricula: 'NUEVA', correoInstitucional: 'Andrea@Alumnos.edu.mx', planDeEstudiosId: 1, contrasena });
  const sesion = await new ServicioAutenticacion(repo, hash).iniciarSesion('andrea@alumnos.edu.mx', contrasena);
  assert.equal(sesion.personaId, alumno.id);
  assert.equal(sesion.rol, 'alumno');
  const cuenta = (await repo.buscarUsuarioPorCorreo('andrea@alumnos.edu.mx'))!;
  assert.notEqual(cuenta.contrasenaHash, contrasena);
});

test('El registro administrado sigue rechazando actores sin permiso', async () => {
  const repo = new RepositorioEnMemoria();
  const admin = new ServicioAdministracion(repo, new HashConScrypt());
  await assert.rejects(admin.registrarAlumno({ usuarioId: 4, personaId: 1, rol: 'alumno' }, {
    nombre: 'Andrea', matricula: 'NUEVA', correoInstitucional: 'andrea@alumnos.edu.mx', contrasena: randomBytes(16).toString('hex'), planDeEstudiosId: 1,
  }), OperacionNoAutorizadaError);
  assert.equal(await repo.buscarAlumnoPorMatricula('NUEVA'), null);
});

test('La misma validación impide cuentas duplicadas antes de crear la persona', async () => {
  const repo = new RepositorioEnMemoria();
  await assert.rejects(new ServicioRegistro(repo, new HashConScrypt()).registrarAlumno({
    nombre: 'Duplicado', matricula: 'NUEVA', correoInstitucional: 'KARLA@alumnos.edu.mx', contrasena: randomBytes(16).toString('hex'), planDeEstudiosId: 1,
  }), CorreoDuplicadoError);
  assert.equal(await repo.buscarAlumnoPorMatricula('NUEVA'), null);
});
