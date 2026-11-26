import type { BloqueHorario, DiaSemana } from '../modelos/tipos';

const DIAS: Record<DiaSemana, string> = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sáb',
};

function hora(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

export function textoDeHorario(horario: BloqueHorario[]): string {
  return horario.map((b) => `${DIAS[b.diaSemana]} ${hora(b.minutoInicio)}-${hora(b.minutoFin)}`).join(', ');
}
