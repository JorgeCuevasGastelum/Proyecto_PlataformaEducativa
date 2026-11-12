import type { BloqueHorario, ConceptoDePago, DiaSemana, Pago } from './tipos';

export const DIAS_DE_LA_SEMANA: DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export const NOMBRE_DEL_DIA: Record<DiaSemana, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};

const ABREVIATURA_DEL_DIA: Record<DiaSemana, string> = {
  lunes: 'lun',
  martes: 'mar',
  miercoles: 'mié',
  jueves: 'jue',
  viernes: 'vie',
  sabado: 'sáb',
};

const NOMBRE_DEL_CONCEPTO: Record<ConceptoDePago, string> = {
  inscripcion: 'Inscripción',
  colegiatura: 'Colegiatura',
};

export function nombreDelConcepto(concepto: ConceptoDePago): string {
  return NOMBRE_DEL_CONCEPTO[concepto];
}

export function horaDesdeMinutos(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

export function rangoDeHoras(minutoInicio: number, minutoFin: number): string {
  return `${horaDesdeMinutos(minutoInicio)} a ${horaDesdeMinutos(minutoFin)}`;
}

function unirConY(palabras: string[]): string {
  if (palabras.length <= 1) return palabras.join('');
  const ultima = palabras[palabras.length - 1];
  const anteriores = palabras.slice(0, palabras.length - 1);
  return `${anteriores.join(', ')} y ${ultima}`;
}

export function resumenDeHorario(bloques: BloqueHorario[]): string {
  const ordenados = [...bloques].sort((a, b) => {
    const dia = DIAS_DE_LA_SEMANA.indexOf(a.diaSemana) - DIAS_DE_LA_SEMANA.indexOf(b.diaSemana);
    return dia !== 0 ? dia : a.minutoInicio - b.minutoInicio;
  });

  const grupos: { hora: string; dias: string[] }[] = [];
  for (const bloque of ordenados) {
    const hora = rangoDeHoras(bloque.minutoInicio, bloque.minutoFin);
    let grupo = grupos.find((g) => g.hora === hora);
    if (!grupo) {
      grupo = { hora, dias: [] };
      grupos.push(grupo);
    }
    grupo.dias.push(ABREVIATURA_DEL_DIA[bloque.diaSemana]);
  }

  const partes: string[] = [];
  for (const grupo of grupos) {
    partes.push(`${unirConY(grupo.dias)}, ${grupo.hora}`);
  }
  const texto = partes.join('; ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function dinero(monto: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
}

export function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function estaVencido(pago: Pago): boolean {
  return pago.estado === 'pendiente' && new Date(pago.fechaLimite) < new Date();
}

export function pluralizar(cantidad: number, singular: string, plural: string): string {
  return cantidad === 1 ? `${cantidad} ${singular}` : `${cantidad} ${plural}`;
}