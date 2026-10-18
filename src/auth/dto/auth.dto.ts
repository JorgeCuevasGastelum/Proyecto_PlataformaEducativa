import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'el correo no tiene un formato valido' })
  correoInstitucional: string;

  @IsString()
  @MinLength(1, { message: 'la contrasena es obligatoria' })
  contrasena: string;
}

export class TokenDto {
  access_token: string;
  token_type: string;
  expires_in: number;
}
