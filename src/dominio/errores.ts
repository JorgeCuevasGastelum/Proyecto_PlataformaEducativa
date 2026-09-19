export class PeriodoDeCargaCerradoError extends Error {
  constructor() {
    super('El proceso de carga académica no está abierto.');
  }
}

export class CupoAgotadoError extends Error {
  constructor(materiaId: string) {
    super(`La materia ${materiaId} ya no tiene lugares disponibles.`);
  }
}

export class EmpalmeDeHorarioError extends Error {
  constructor(materiaId: string, materiaEnConflictoId: string) {
    super(`La materia ${materiaId} se empalma en horario con la materia inscrita ${materiaEnConflictoId}`);
  }
}

export class MateriaYaInscritaError extends Error {
  constructor(materiaId: string) {
    super(`Ya estás inscrito en la materia ${materiaId} este periodo.`);
  }
}

export class LimiteDeCreditosExcedidoError extends Error {
  constructor(creditosMaximos: number) {
    super(`Esta inscripción rebasa el tope de ${creditosMaximos} creditos del periodo.`);
  }
}

export class MateriaInvalidaError extends Error {
  constructor(motivo: string) {
    super(`Materia invalida: ${motivo}`);
  }
}

export class MaestroNoEncontradoError extends Error {
  constructor(maestroId: string) {
    super(`No existe el maestro ${maestroId}.`);
  }
}

export class YaExistePeriodoAbiertoError extends Error {
  constructor(periodoId: string) {
    super(`Ya hay un periodo abierto (${periodoId}), hay que cerrarlo antes de abrir otro.`);
  }
}

export class OperacionNoAutorizadaError extends Error {
  constructor() {
    super('Esta operación solo la puede realizar una persona autorizada.');
  }
}

export class RangoHorarioInvalidoError extends Error {
  constructor(horaInicio: string, horaFin: string) {
    super(`El bloque de horario ${horaInicio}-${horaFin} no es válido.`);
  }
}

export class AlumnoInvalidoError extends Error {
  constructor(motivo: string) {
    super(`Alumno no válido: ${motivo}`);
  }
}

export class MatriculaDuplicadaError extends Error {
  constructor(matricula: string) {
    super(`Ya existe un alumno con la matrícula ${matricula}.`);
  }
}

export class MaestroInvalidoError extends Error {
  constructor(motivo: string) {
    super(`Maestro no válido: ${motivo}`);
  }
}

export class NumeroEmpleadoDuplicadoError extends Error {
  constructor(numeroEmpleado: string) {
    super(`Ya existe un maestro con el número de empleado ${numeroEmpleado}.`);
  }
}

export class AlumnoNoEncontradoError extends Error {
  constructor(alumnoId: string) {
    super(`No existe el alumno ${alumnoId}.`);
  }
}

export class PeriodoNoEncontradoError extends Error {
  constructor(periodoId: string) {
    super(`No existe el periodo ${periodoId}.`);
  }
}
