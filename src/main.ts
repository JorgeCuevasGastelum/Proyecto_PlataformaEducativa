import { ServicioAcademico } from './dominio/servicio-academico.js';
import { RepositorioEnMemoria } from './infra/repositorio-en-memoria.js';

const repositorio = new RepositorioEnMemoria();
const servicio = new ServicioAcademico(repositorio);

console.log('--- Carga academica exitosa ---');
console.log('Karla se inscribe a Redes, que tiene cupo disponible y no se empalma con ninguna otra.');
try {
  const inscripcion = await servicio.realizarCargaAcademica(1, 3);
  console.log(`OK: inscripcion ${inscripcion.id} registrada, estado ${inscripcion.estadoActual}.`);
} catch (error) {
  console.log(`No se esperaba error: ${(error as Error).message}`);
}

console.log('\nRechazado por cupo agotado');
console.log('Sofiaintenta inscribirse a Estructuras de Datos, que ya tiene su unico lugar ocupado por Juan.');
try {
  await servicio.realizarCargaAcademica(3, 4);
  console.log('No se esperaba que esto funcionara.');
} catch (error) {
  console.log(`Rechazado como se esperaba: ${(error as Error).message}`);
}

console.log('\nRechazado por empalme de horario');
console.log('Karla ya tine Programacion I los lunes 07:00-08:30 e intenta inscribirse a Bases de Datos (tambien lunes 07:00-08:30).');
try {
  await servicio.realizarCargaAcademica(1, 2);
  console.log('No se esperaba que esto funcionara.');
} catch (error) {
  console.log(`Rechazado como se esperaba: ${(error as Error).message}`);
}
