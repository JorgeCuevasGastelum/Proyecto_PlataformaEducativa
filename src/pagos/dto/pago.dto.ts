import { IsDateString, IsIn, IsInt, IsNumber, IsPositive } from 'class-validator';
import type { ConceptoDePago } from '../../dominio/entidades';

export class RegistrarCargoDto {
  @IsInt()
  @IsPositive()
  alumnoId: number;

  @IsInt()
  @IsPositive()
  periodoId: number;

  @IsIn(['inscripcion', 'colegiatura'], { message: 'concepto debe ser inscripcion o colegiatura' })
  concepto: ConceptoDePago;

  @IsNumber()
  monto: number;

  @IsDateString({}, { message: 'fechaLimite debe ser una fecha, por ejemplo 2026-09-30' })
  fechaLimite: string;
}

export class RegistrarPagoDto {
  @IsIn(['pagado'], { message: 'el unico cambio permitido es estado: pagado' })
  estado: 'pagado';
}
