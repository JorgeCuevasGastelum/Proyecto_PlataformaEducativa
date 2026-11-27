import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarMaestroDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre?: string;
}
