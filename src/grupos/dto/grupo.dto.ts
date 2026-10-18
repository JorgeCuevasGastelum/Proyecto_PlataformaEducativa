import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DIAS_DE_LA_SEMANA } from '../../dominio/entidades';
import type { DiaSemana } from '../../dominio/entidades';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export class BloqueHorarioDto {
  @IsIn(DIAS_DE_LA_SEMANA, { message: 'diaSemana debe ser lunes, martes, miercoles, jueves, viernes o sabado' })
  diaSemana: DiaSemana;

  @Matches(HORA, { message: 'horaInicio debe tener formato HH:MM' })
  horaInicio: string;

  @Matches(HORA, { message: 'horaFin debe tener formato HH:MM' })
  horaFin: string;
}

export class AbrirGrupoDto {
  @IsInt()
  @IsPositive()
  materiaId: number;

  @IsInt()
  @IsPositive()
  periodoId: number;

  @IsString()
  @IsNotEmpty()
  clave: string;

  @IsInt()
  @IsPositive()
  maestroId: number;

  @IsInt()
  cupoMaximo: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BloqueHorarioDto)
  horario: BloqueHorarioDto[];
}

export class CalificacionDto {
  @IsInt()
  @IsPositive()
  inscripcionId: number;

  @IsInt()
  @Min(0)
  @Max(100)
  calificacion: number;
}

export class CapturarCalificacionesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CalificacionDto)
  calificaciones: CalificacionDto[];
}

export class ConsultarGruposDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  periodoId?: number;
}
