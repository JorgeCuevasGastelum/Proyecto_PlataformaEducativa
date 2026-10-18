import 'dotenv/config';
import { RepositorioEnMemoria } from '../src/infra/repositorio-en-memoria';
import { PrismaService } from '../src/prisma/prisma.service';

const CORREOS = [
  'diana@admin.edu.mx',
  'ana@maestros.edu.mx',
  'luis@maestros.edu.mx',
  'karla@alumnos.edu.mx',
  'juan@alumnos.edu.mx',
  'sofia@alumnos.edu.mx',
  'pedro@alumnos.edu.mx',
  'mario@alumnos.edu.mx',
];

async function main() {
  const prisma = new PrismaService();
  const memoria = new RepositorioEnMemoria();

  await prisma.$transaction([
    prisma.usuario.deleteMany(),
    prisma.aviso.deleteMany(),
    prisma.pago.deleteMany(),
    prisma.inscripcion.deleteMany(),
    prisma.bloqueHorario.deleteMany(),
    prisma.grupo.deleteMany(),
    prisma.alumno.deleteMany(),
    prisma.maestro.deleteMany(),
    prisma.administrador.deleteMany(),
    prisma.periodoEscolar.deleteMany(),
    prisma.materiaEnPlan.deleteMany(),
    prisma.prerrequisito.deleteMany(),
    prisma.planDeEstudios.deleteMany(),
    prisma.materia.deleteMany(),
    prisma.carrera.deleteMany(),
  ]);

  await prisma.carrera.createMany({ data: await memoria.listarCarreras() });

  const materias = await memoria.listarMaterias();
  await prisma.materia.createMany({ data: materias.map(({ prerrequisitoIds, ...m }) => m) });
  await prisma.prerrequisito.createMany({
    data: materias.flatMap((m) => m.prerrequisitoIds.map((prerrequisitoId) => ({ materiaId: m.id, prerrequisitoId }))),
  });

  const planes = await memoria.listarPlanesDeEstudio();
  await prisma.planDeEstudios.createMany({ data: planes.map(({ materiaIds, ...p }) => p) });
  await prisma.materiaEnPlan.createMany({
    data: planes.flatMap((p) => p.materiaIds.map((materiaId) => ({ planId: p.id, materiaId }))),
  });

  await prisma.periodoEscolar.createMany({ data: await memoria.listarPeriodos() });

  const alumnos = await memoria.listarAlumnos();
  await prisma.administrador.create({ data: (await memoria.buscarAdministradorPorId(1))! });
  await prisma.maestro.createMany({ data: await memoria.listarMaestros() });
  await prisma.alumno.createMany({ data: alumnos });

  for (const correo of CORREOS) {
    const u = (await memoria.buscarUsuarioPorCorreo(correo))!;
    await prisma.usuario.create({
      data: {
        id: u.id,
        correoInstitucional: u.correoInstitucional,
        contrasenaHash: u.contrasenaHash,
        rol: u.rol,
        alumnoId: u.rol === 'alumno' ? u.personaId : null,
        maestroId: u.rol === 'maestro' ? u.personaId : null,
        administradorId: u.rol === 'administrador' ? u.personaId : null,
      },
    });
  }

  for (const periodo of await memoria.listarPeriodos()) {
    for (const { horario, ...grupo } of await memoria.listarGruposDePeriodo(periodo.id)) {
      await prisma.grupo.create({ data: { ...grupo, horario: { create: horario } } });
    }
  }

  for (const alumno of alumnos) {
    await prisma.inscripcion.createMany({ data: await memoria.listarInscripcionesDeAlumno(alumno.id) });
    await prisma.pago.createMany({ data: await memoria.listarPagosDeAlumno(alumno.id) });
  }

  console.log('Datos de prueba cargados. Todas las cuentas usan la contrasena Potros2026.');
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
