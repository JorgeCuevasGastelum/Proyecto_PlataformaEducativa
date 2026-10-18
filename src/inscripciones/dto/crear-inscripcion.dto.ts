import { IsInt, IsPositive } from 'class-validator';

export class CrearInscripcionDto {
  @IsInt()
  @IsPositive()
  grupoId: number;
}
