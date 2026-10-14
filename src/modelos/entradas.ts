import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsEmail, IsInt, Min, Max, IsArray, ArrayUnique, ArrayMaxSize, ArrayMinSize, ValidateNested, Matches, IsIn, IsNumber, IsISO8601, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { DIAS_DE_LA_SEMANA } from '../dominio/entidades.js';
import type { DiaSemana, ConceptoDePago } from '../dominio/entidades.js';

export class LoginDto {
  @ApiProperty({ example: 'diana@admin.edu.mx', maxLength: 254 })
  @IsEmail() @MaxLength(254) correoInstitucional!: string;
  @ApiProperty({ example: 'TU_CONTRASENA_LOCAL', maxLength: 128, writeOnly: true })
  @IsString() @IsNotEmpty() @MaxLength(128) contrasena!: string;
}
export class AlumnoDto extends LoginDto {
  @ApiProperty({ example: '00006' }) @IsString() @IsNotEmpty() @MaxLength(40) matricula!: string;
  @ApiProperty({ example: 'Andrea' }) @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(150) nombre!: string;
  @ApiProperty({ example: 1, minimum: 1 }) @IsInt() @Min(1) @Max(2147483647) planDeEstudiosId!: number;
}
export class MaestroDto extends LoginDto {
  @ApiProperty({ example: '20001' }) @IsString() @IsNotEmpty() @MaxLength(40) numeroEmpleado!: string;
  @ApiProperty({ example: 'Claudia' }) @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(150) nombre!: string;
}
export class MateriaDto {
  @ApiProperty({ example: 'ALG1' }) @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(40) clave!: string;
  @ApiProperty({ example: 'Álgebra' }) @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(150) nombre!: string;
  @ApiProperty({ example: 'Álgebra básica' }) @IsString() @MaxLength(2000) descripcion!: string;
  @ApiProperty({ example: 5, description: 'Un valor no positivo produce conflicto RN-06.' }) @IsInt() @Max(1000) creditos!: number;
  @ApiProperty({ type: [Number], example: [] }) @IsArray() @ArrayUnique() @ArrayMaxSize(100) @IsInt({ each: true }) @Min(1, { each: true }) @Max(2147483647, { each: true }) prerrequisitoIds!: number[];
}
export class HorarioDto {
  @ApiProperty({ enum: DIAS_DE_LA_SEMANA, example: 'lunes' }) @IsIn(DIAS_DE_LA_SEMANA) diaSemana!: DiaSemana;
  @ApiProperty({ example: '07:00', pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$' }) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) horaInicio!: string;
  @ApiProperty({ example: '08:30', pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$' }) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) horaFin!: string;
}
export class GrupoDto {
  @ApiProperty({ example: 1 }) @IsInt() @Min(1) @Max(2147483647) materiaId!: number;
  @ApiProperty({ example: 2 }) @IsInt() @Min(1) @Max(2147483647) periodoId!: number;
  @ApiProperty({ example: '02' }) @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(40) clave!: string;
  @ApiProperty({ example: 1 }) @IsInt() @Min(1) @Max(2147483647) maestroId!: number;
  @ApiProperty({ example: 30 }) @IsInt() @Max(100000) cupoMaximo!: number;
  @ApiProperty({ type: [HorarioDto] }) @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => HorarioDto) horario!: HorarioDto[];
}
export class CargaDto {
  @ApiProperty({ example: true }) @IsBoolean() habilitado!: boolean;
}
export class InscripcionDto {
  @ApiProperty({ example: 5 }) @IsInt() @Min(1) @Max(2147483647) grupoId!: number;
}
export class CalificacionDto {
  @ApiProperty({ example: 1 }) @IsInt() @Min(1) @Max(2147483647) inscripcionId!: number;
  @ApiProperty({ example: 90, description: 'RN-22 exige entero entre 0 y 100; fuera de rango responde 409.' }) @IsInt() calificacion!: number;
}
export class CalificacionesDto {
  @ApiProperty({ type: [CalificacionDto] }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(1000) @ValidateNested({ each: true }) @Type(() => CalificacionDto) calificaciones!: CalificacionDto[];
}
export class CargoDto {
  @ApiProperty({ example: 5 }) @IsInt() @Min(1) @Max(2147483647) alumnoId!: number;
  @ApiProperty({ example: 2 }) @IsInt() @Min(1) @Max(2147483647) periodoId!: number;
  @ApiProperty({ enum: ['inscripcion', 'colegiatura'], example: 'inscripcion' }) @IsIn(['inscripcion', 'colegiatura']) concepto!: ConceptoDePago;
  @ApiProperty({ example: 2500 }) @IsNumber({ maxDecimalPlaces: 2 }) @Max(9999999999.99) monto!: number;
  @ApiProperty({ example: '2027-01-31T23:59:59.000Z', format: 'date-time' }) @IsISO8601({ strict: true, strictSeparator: true }) fechaLimite!: string;
}
export class AvisoDto {
  @ApiProperty({ example: 2 }) @IsInt() @Min(1) @Max(2147483647) periodoId!: number;
  @ApiProperty({ example: 'Inicio de carga' }) @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(150) titulo!: string;
  @ApiProperty({ example: 'Revisa tu horario antes de inscribirte.' }) @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(4000) contenido!: string;
}
export class PeriodoQuery {
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(2147483647) periodoId?: number;
}
export class AvisosQuery {
  @ApiProperty({ example: 2 }) @Type(() => Number) @IsInt() @Min(1) @Max(2147483647) periodoId!: number;
}
