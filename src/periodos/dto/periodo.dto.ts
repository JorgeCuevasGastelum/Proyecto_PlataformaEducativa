import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CrearPeriodoDto {
  @IsString()
  @IsNotEmpty()
  clave: string;

  @IsDateString({}, { message: 'fechaAperturaCarga debe ser una fecha, por ejemplo 2026-08-01' })
  fechaAperturaCarga: string;

  @IsDateString({}, { message: 'fechaCierreCarga debe ser una fecha, por ejemplo 2026-08-15' })
  fechaCierreCarga: string;

  @IsInt()
  creditosMaximos: number;
}

export class CambiarCargaDto {
  @IsBoolean()
  cargaAbierta: boolean;
}
