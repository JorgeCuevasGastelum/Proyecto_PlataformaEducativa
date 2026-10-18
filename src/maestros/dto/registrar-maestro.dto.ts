import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegistrarMaestroDto {
  @IsString()
  @IsNotEmpty()
  numeroEmpleado: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail({}, { message: 'el correo no tiene un formato valido' })
  correoInstitucional: string;

  @IsString()
  contrasena: string;
}
