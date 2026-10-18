import { IsEmail, IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class RegistrarAlumnoDto {
  @IsString()
  @IsNotEmpty()
  matricula: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail({}, { message: 'el correo no tiene un formato valido' })
  correoInstitucional: string;

  @IsString()
  contrasena: string;

  @IsInt()
  @IsPositive()
  planDeEstudiosId: number;
}
