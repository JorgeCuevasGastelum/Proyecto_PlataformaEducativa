import { IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';

export class PublicarAvisoDto {
  @IsInt()
  @IsPositive()
  periodoId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  titulo: string;

  @IsString()
  @IsNotEmpty()
  contenido: string;
}

export class ConsultarAvisosDto {
  @IsInt()
  @IsPositive()
  periodoId: number;
}
