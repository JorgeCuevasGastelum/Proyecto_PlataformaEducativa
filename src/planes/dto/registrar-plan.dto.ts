import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class RegistrarPlanDto {
  @IsString()
  @IsNotEmpty()
  clave: string;

  @IsInt()
  @IsPositive()
  carreraId: number;
}
