import { IsNotEmpty, IsString } from 'class-validator';

export class RegistrarCarreraDto {
  @IsString()
  @IsNotEmpty()
  clave: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;
}
