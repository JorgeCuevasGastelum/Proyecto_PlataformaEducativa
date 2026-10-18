import { ServicioAdministracion } from './dominio/servicio-administracion.js';
import { ServicioAlumno } from './dominio/servicio-alumno.js';
import { ServicioAutenticacion } from './dominio/servicio-autenticacion.js';
import { ServicioMaestro } from './dominio/servicio-maestro.js';
import { crearBloqueHorario } from './dominio/entidades.js';
import { HashConScrypt } from './infra/hash-scrypt.js';
import { CONTRASENA_DE_PRUEBA, RepositorioEnMemoria } from './infra/repositorio-en-memoria.js';

const repositorio = new RepositorioEnMemoria();
const hash = new HashConScrypt();
const autenticacion = new ServicioAutenticacion(repositorio, hash);
const alumnos = new ServicioAlumno(repositorio);
const maestros = new ServicioMaestro(repositorio);
const administracion = new ServicioAdministracion(repositorio, hash);

// Ids de los grupos sembrados en el repositorio en memoria.
const GRUPO_PROG1_ANA_2026_1 = 1;
const GRUPO_PROG2 = 3;
const GRUPO_BASES_DE_DATOS = 4;
const GRUPO_REDES = 5;
const GRUPO_ESTRUCTURAS = 6;
const GRUPO_INGLES = 7;
const GRUPO_ESTADISTICA = 8;

async function escenario(
  titulo: string,
  descripcion: string,
  accion: () => Promise<string>,
  esperado: 'exito' | 'rechazo',
): Promise<void> {
  console.log(`\n--- ${titulo} ---`);
  console.log(descripcion);
  try {
    const resultado = await accion();
    console.log(esperado === 'exito' ? `OK: ${resultado}` : `No se esperaba que esto funcionara: ${resultado}`);
  } catch (error) {
    const mensaje = (error as Error).message;
    console.log(esperado === 'rechazo' ? `Rechazado como se esperaba: ${mensaje}` : `No se esperaba error: ${mensaje}`);
  }
}

function hora(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

async function main(): Promise<void> {
  // ACCESO

  console.log('=== Acceso ===');

  await escenario('Inicio de sesion', 'Karla entra con su correo y contraseña.', async () => {
    const sesion = await autenticacion.iniciarSesion('karla@alumnos.edu.mx', CONTRASENA_DE_PRUEBA);
    return `sesion iniciada con rol ${sesion.rol}.`;
  }, 'exito');

  await escenario('Contraseña incorrecta', 'Alguien intenta entrar como Karla con otra contraseña.', async () => {
    await autenticacion.iniciarSesion('karla@alumnos.edu.mx', 'adivinando');
    return 'entro';
  }, 'rechazo');

  const karla = await autenticacion.iniciarSesion('karla@alumnos.edu.mx', CONTRASENA_DE_PRUEBA);
  const sofia = await autenticacion.iniciarSesion('sofia@alumnos.edu.mx', CONTRASENA_DE_PRUEBA);
  const pedro = await autenticacion.iniciarSesion('pedro@alumnos.edu.mx', CONTRASENA_DE_PRUEBA);
  const mario = await autenticacion.iniciarSesion('mario@alumnos.edu.mx', CONTRASENA_DE_PRUEBA);
  const ana = await autenticacion.iniciarSesion('ana@maestros.edu.mx', CONTRASENA_DE_PRUEBA);
  const luis = await autenticacion.iniciarSesion('luis@maestros.edu.mx', CONTRASENA_DE_PRUEBA);
  const diana = await autenticacion.iniciarSesion('diana@admin.edu.mx', CONTRASENA_DE_PRUEBA);

  await escenario('Rol sin permiso', 'Karla (alumna) intenta abrir un grupo, que es tarea del administrador.', async () => {
    await administracion.abrirGrupo(karla, {
      materiaId: 4, periodoId: 2, clave: '02', maestroId: 1, cupoMaximo: 10,
      horario: [crearBloqueHorario('sabado', '08:00', '10:00')],
    });
    return 'grupo abierto';
  }, 'rechazo');

  // CARGA ACADÉMICA, SERIACIÓN Y CALIFICACIONES

  console.log('\n=== Carga academica ===');

  let inscripcionDeRedes = 0;
  await escenario('Carga academica exitosa', 'Karla se inscribe a Redes: tiene cupo, no se empalma y no tiene prerrequisitos.', async () => {
    const inscripcion = await alumnos.realizarCargaAcademica(karla, GRUPO_REDES);
    inscripcionDeRedes = inscripcion.id;
    return `inscripcion ${inscripcion.id} registrada, estado ${inscripcion.estadoActual}.`;
  }, 'exito');

  await escenario('Rechazado por seriacion', 'Karla intenta Programacion II, pero Ana aun no captura su calificacion de Programacion I.', async () => {
    await alumnos.realizarCargaAcademica(karla, GRUPO_PROG2);
    return 'inscrita';
  }, 'rechazo');

  await escenario('Maestro con grupo ajeno', 'Luis intenta capturar calificaciones en el grupo de Programacion I de Ana.', async () => {
    await maestros.capturarCalificaciones(luis, GRUPO_PROG1_ANA_2026_1, [{ inscripcionId: 1, calificacion: 100 }]);
    return 'capturado';
  }, 'rechazo');

  await escenario('Captura con la carga abierta', 'Ana intenta capturar calificaciones de su grupo del 2026-2, que sigue en carga.', async () => {
    await maestros.capturarCalificaciones(ana, GRUPO_PROG2, []);
    return 'capturado';
  }, 'rechazo');

  await escenario('Captura de calificaciones', 'Ana captura su grupo de Programacion I del 2026-1: Karla 90, Mario 60.', async () => {
    const lista = await maestros.consultarListaDeGrupo(ana, GRUPO_PROG1_ANA_2026_1);
    const calificaciones: Record<string, number> = { Karla: 90, Mario: 60 };
    const capturadas = await maestros.capturarCalificaciones(
      ana,
      GRUPO_PROG1_ANA_2026_1,
      lista.map((a) => ({ inscripcionId: a.inscripcionId, calificacion: calificaciones[a.nombre] })),
    );
    return `${capturadas.length} calificaciones capturadas.`;
  }, 'exito');

  await escenario('Seriacion cumplida', 'Ya con Programacion I aprobada, Karla se inscribe a Programacion II.', async () => {
    const inscripcion = await alumnos.realizarCargaAcademica(karla, GRUPO_PROG2);
    return `inscripcion ${inscripcion.id} registrada.`;
  }, 'exito');

  await escenario('Rechazado por empalme de horario', 'Karla tiene Programacion II lunes 07:00-08:30 e intenta Bases de Datos (lunes 07:00-08:30).', async () => {
    await alumnos.realizarCargaAcademica(karla, GRUPO_BASES_DE_DATOS);
    return 'inscrita';
  }, 'rechazo');

  await escenario('Rechazado por cupo agotado', 'Sofia intenta Estructuras de Datos, cuyo unico lugar ya ocupa Juan.', async () => {
    await alumnos.realizarCargaAcademica(sofia, GRUPO_ESTRUCTURAS);
    return 'inscrita';
  }, 'rechazo');

  // PLAN DE ESTUDIOS

  console.log('\n=== Plan de estudios ===');

  await escenario('Materia fuera del plan', 'Pedro (Ingeniería Industrial) intenta Bases de Datos, que es de Software.', async () => {
    await alumnos.realizarCargaAcademica(pedro, GRUPO_BASES_DE_DATOS);
    return 'inscrito';
  }, 'rechazo');

  await escenario('Materia común entre carreras', 'Pedro y Karla se inscriben a Inglés I, que está en los dos planes.', async () => {
    await alumnos.realizarCargaAcademica(pedro, GRUPO_INGLES);
    await alumnos.realizarCargaAcademica(karla, GRUPO_INGLES);
    return 'los dos quedaron inscritos.';
  }, 'exito');

  // PAGOS

  console.log('\n=== Pagos ===');

  await escenario('Sin pago de inscripcion', 'Mario no ha pagado la inscripción del 2026-2 e intenta Redes.', async () => {
    await alumnos.realizarCargaAcademica(mario, GRUPO_REDES);
    return 'inscrito';
  }, 'rechazo');

  await escenario('Pago registrado', 'Diana registra el pago de Mario, que vuelve a intentarlo.', async () => {
    const pendiente = (await alumnos.consultarEstadoDeCuenta(mario)).find((p) => p.estado === 'pendiente');
    if (pendiente) await administracion.registrarPago(diana, pendiente.id);
    const inscripcion = await alumnos.realizarCargaAcademica(mario, GRUPO_REDES);
    return `inscripcion ${inscripcion.id} registrada.`;
  }, 'exito');

  await escenario('Seriacion con materia reprobada', 'Ya al corriente, Mario intenta Programación II, pero reprobó Programación I (60).', async () => {
    await alumnos.realizarCargaAcademica(mario, GRUPO_PROG2);
    return 'inscrito';
  }, 'rechazo');

  await escenario('Adeudo vencido', 'Pedro tiene una colegiatura del 2026-1 que venció hace un mes e intenta Estadística.', async () => {
    const haceUnMes = new Date();
    haceUnMes.setMonth(haceUnMes.getMonth() - 1);
    await administracion.registrarCargo(diana, {
      alumnoId: pedro.personaId, periodoId: 1, concepto: 'colegiatura', monto: 8000, fechaLimite: haceUnMes,
    });
    await alumnos.realizarCargaAcademica(pedro, GRUPO_ESTADISTICA);
    return 'inscrito';
  }, 'rechazo');

  // HORARIO, BAJAS E HISTORIAL

  console.log('\n=== Horario, bajas e historial ===');

  await escenario('Horario semanal ordenado por día y hora', 'Horario de Karla.', async () => {
    const renglones = await alumnos.consultarHorarioSemanal(karla);
    return '\n' + renglones
      .map((r) => `  ${r.diaSemana.padEnd(10)} ${hora(r.minutoInicio)}-${hora(r.minutoFin)}  ${r.materiaNombre} (${r.maestroNombre})`)
      .join('\n');
  }, 'exito');

  await escenario('Baja de una materia', 'Karla da de baja Redes.', async () => {
    const inscripcion = await alumnos.darDeBajaInscripcion(karla, inscripcionDeRedes);
    return `inscripcion ${inscripcion.id} en estado ${inscripcion.estadoActual}.`;
  }, 'exito');

  await escenario('Baja repetida', 'Karla intenta dar de baja Redes otra vez.', async () => {
    await alumnos.darDeBajaInscripcion(karla, inscripcionDeRedes);
    return 'baja aplicada';
  }, 'rechazo');

  await escenario('Baja de una inscripción que no existe', 'Karla intenta dar de baja la inscripción 999.', async () => {
    await alumnos.darDeBajaInscripcion(karla, 999);
    return 'baja aplicada';
  }, 'rechazo');

  await escenario('Baja de una inscripción ajena', 'Karla intenta dar de baja la inscripción 5, que es de Juan.', async () => {
    await alumnos.darDeBajaInscripcion(karla, 5);
    return 'baja aplicada';
  }, 'rechazo');

  await escenario('Historial académico', 'Historial de Karla; Redes no aparece porque la dio de baja.', async () => {
    const historial = await alumnos.consultarHistorial(karla);
    const lineas = historial.flatMap((periodo) => [
      `  ${periodo.periodoClave}`,
      ...periodo.materias.map((m) => {
        const estado = m.aprobada === null ? 'en curso' : m.aprobada ? 'aprobada' : 'reprobada';
        return `    ${m.materiaNombre.padEnd(18)} ${String(m.calificacion ?? '-').padStart(3)}  ${estado}`;
      }),
    ]);
    return '\n' + lineas.join('\n');
  }, 'exito');
}

main();
