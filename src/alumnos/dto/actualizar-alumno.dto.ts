import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class ActualizarAlumnoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  planDeEstudiosId?: number;
}
