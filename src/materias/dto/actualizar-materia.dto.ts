import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

// La clave no viene aquí: una vez creada, no se cambia.
export class ActualizarMateriaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  creditos?: number;
}
