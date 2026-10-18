// Base de todos los errores del dominio, para poder distinguirlos de errores inesperados.
export class ErrorDeDominio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

// Acceso

export class CredencialesInvalidasError extends ErrorDeDominio {
  constructor() {
    super('Correo o contraseña incorrectos.');
  }
}

export class OperacionNoAutorizadaError extends ErrorDeDominio {
  constructor() {
    super('Esta operación solo la puede realizar una persona autorizada.');
  }
}

export class ContrasenaDebilError extends ErrorDeDominio {
  constructor(longitudMinima: number) {
    super(`La contraseña debe tener al menos ${longitudMinima} caracteres.`);
  }
}

export class CorreoDuplicadoError extends ErrorDeDominio {
  constructor(correo: string) {
    super(`Ya existe una cuenta con el correo ${correo}.`);
  }
}

// Personas

export class AlumnoInvalidoError extends ErrorDeDominio {
  constructor(motivo: string) {
    super(`Alumno no válido: ${motivo}`);
  }
}

export class MatriculaDuplicadaError extends ErrorDeDominio {
  constructor(matricula: string) {
    super(`Ya existe un alumno con la matrícula ${matricula}.`);
  }
}

export class AlumnoNoEncontradoError extends ErrorDeDominio {
  constructor(alumnoId: string) {
    super(`No existe el alumno ${alumnoId}.`);
  }
}

export class MaestroInvalidoError extends ErrorDeDominio {
  constructor(motivo: string) {
    super(`Maestro no válido: ${motivo}`);
  }
}

export class NumeroEmpleadoDuplicadoError extends ErrorDeDominio {
  constructor(numeroEmpleado: string) {
    super(`Ya existe un maestro con el número de empleado ${numeroEmpleado}.`);
  }
}

export class MaestroNoEncontradoError extends ErrorDeDominio {
  constructor(maestroId: string) {
    super(`No existe el maestro ${maestroId}.`);
  }
}

// Catálogo

export class MateriaInvalidaError extends ErrorDeDominio {
  constructor(motivo: string) {
    super(`Materia invalida: ${motivo}`);
  }
}

export class MateriaNoEncontradaError extends ErrorDeDominio {
  constructor(materiaId: string) {
    super(`No existe la materia ${materiaId}.`);
  }
}

export class ClaveDeMateriaDuplicadaError extends ErrorDeDominio {
  constructor(clave: string) {
    super(`Ya existe una materia con la clave ${clave}.`);
  }
}

export class PlanDeEstudiosNoEncontradoError extends ErrorDeDominio {
  constructor(planId: string) {
    super(`No existe el plan de estudios ${planId}.`);
  }
}

export class MateriaFueraDelPlanError extends ErrorDeDominio {
  constructor(materia: string, plan: string) {
    super(`La materia ${materia} no forma parte de tu plan de estudios (${plan}).`);
  }
}

export class GrupoInvalidoError extends ErrorDeDominio {
  constructor(motivo: string) {
    super(`Grupo no válido: ${motivo}`);
  }
}

export class GrupoNoEncontradoError extends ErrorDeDominio {
  constructor(grupoId: string) {
    super(`No existe el grupo ${grupoId}.`);
  }
}

export class GrupoDuplicadoError extends ErrorDeDominio {
  constructor(grupo: string, periodo: string) {
    super(`Ya existe el grupo ${grupo} en el periodo ${periodo}.`);
  }
}

export class EmpalmeDeMaestroError extends ErrorDeDominio {
  constructor(maestro: string, grupoEnConflicto: string) {
    super(`El maestro ${maestro} ya imparte ${grupoEnConflicto} en ese horario.`);
  }
}

export class RangoHorarioInvalidoError extends ErrorDeDominio {
  constructor(horaInicio: string, horaFin: string) {
    super(`El bloque de horario ${horaInicio}-${horaFin} no es válido.`);
  }
}

// Periodos

export class PeriodoDeCargaCerradoError extends ErrorDeDominio {
  constructor() {
    super('El proceso de carga académica no está abierto.');
  }
}

export class PeriodoNoEncontradoError extends ErrorDeDominio {
  constructor(periodoId: string) {
    super(`No existe el periodo ${periodoId}.`);
  }
}

export class YaExistePeriodoAbiertoError extends ErrorDeDominio {
  constructor(periodoId: string) {
    super(`Ya hay un periodo abierto (${periodoId}), hay que cerrarlo antes de abrir otro.`);
  }
}

export class PeriodoInvalidoError extends ErrorDeDominio {
  constructor(razon: string) {
    super(`El periodo no es válido: ${razon}.`);
  }
}

export class ClaveDePeriodoDuplicadaError extends ErrorDeDominio {
  constructor(clave: string) {
    super(`Ya existe un periodo con la clave ${clave}.`);
  }
}

export class GrupoFueraDePeriodoError extends ErrorDeDominio {
  constructor(grupo: string, periodo: string) {
    super(`El grupo ${grupo} no pertenece al periodo de carga abierto (${periodo}).`);
  }
}

// Carga académica

export class CupoAgotadoError extends ErrorDeDominio {
  constructor(grupo: string) {
    super(`El grupo ${grupo} ya no tiene lugares disponibles.`);
  }
}

export class EmpalmeDeHorarioError extends ErrorDeDominio {
  constructor(grupo: string, grupoEnConflicto: string) {
    super(`El grupo ${grupo} se empalma en horario con ${grupoEnConflicto}, que ya tienes inscrito.`);
  }
}

export class MateriaYaInscritaError extends ErrorDeDominio {
  constructor(materia: string) {
    super(`Ya estás inscrito en la materia ${materia} este periodo.`);
  }
}

export class LimiteDeCreditosExcedidoError extends ErrorDeDominio {
  constructor(creditosMaximos: number) {
    super(`Esta inscripción rebasa el tope de ${creditosMaximos} creditos del periodo.`);
  }
}

export class SeriacionNoCumplidaError extends ErrorDeDominio {
  constructor(materia: string, prerrequisito: string) {
    super(`No puedes inscribir ${materia} sin haber aprobado ${prerrequisito}.`);
  }
}

export class MateriaYaAprobadaError extends ErrorDeDominio {
  constructor(materia: string) {
    super(`Ya aprobaste la materia ${materia}.`);
  }
}

export class InscripcionNoEncontradaError extends ErrorDeDominio {
  constructor(inscripcionId: string) {
    super(`No existe la inscripción ${inscripcionId}.`);
  }
}

export class InscripcionYaDadaDeBajaError extends ErrorDeDominio {
  constructor(inscripcionId: string) {
    super(`La inscripción ${inscripcionId} ya está dada de baja.`);
  }
}

export class InscripcionYaCalificadaError extends ErrorDeDominio {
  constructor(inscripcionId: string) {
    super(`La inscripción ${inscripcionId} ya tiene calificación y no se puede dar de baja.`);
  }
}

// Calificaciones

export class CalificacionInvalidaError extends ErrorDeDominio {
  constructor(calificacion: number, minima: number, maxima: number) {
    super(`La calificación ${calificacion} no es válida; debe ser un entero entre ${minima} y ${maxima}.`);
  }
}

export class GrupoAjenoError extends ErrorDeDominio {
  constructor(grupo: string) {
    super(`El grupo ${grupo} no está asignado a este maestro.`);
  }
}

export class CargaAunAbiertaError extends ErrorDeDominio {
  constructor(periodo: string) {
    super(`No se pueden capturar calificaciones mientras la carga académica del periodo ${periodo} sigue abierta.`);
  }
}

// Pagos

export class PagoDeInscripcionPendienteError extends ErrorDeDominio {
  constructor(periodo: string) {
    super(`No has pagado la inscripción del periodo ${periodo}; no puedes realizar tu carga académica.`);
  }
}

export class AdeudoVencidoError extends ErrorDeDominio {
  constructor(concepto: string, fechaLimite: Date) {
    super(`Tienes un adeudo vencido de ${concepto} (vencía el ${fechaLimite.toISOString().slice(0, 10)}).`);
  }
}

export class PagoNoEncontradoError extends ErrorDeDominio {
  constructor(pagoId: string) {
    super(`No existe el pago ${pagoId}.`);
  }
}

export class PagoYaRegistradoError extends ErrorDeDominio {
  constructor(pagoId: string) {
    super(`El pago ${pagoId} ya estaba registrado como pagado.`);
  }
}

export class PagoInvalidoError extends ErrorDeDominio {
  constructor(motivo: string) {
    super(`Cargo no válido: ${motivo}`);
  }
}
