import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Sesion } from '../dominio/entidades';
import { ServicioAutenticacion } from '../dominio/servicio-autenticacion';
import { Publico } from './decoradores/publico.decorator';
import { UsuarioActual } from './decoradores/usuario-actual.decorator';
import { LoginDto, TokenDto } from './dto/auth.dto';
import type { PayloadJwt } from './jwt.strategy';

const UNA_HORA = 3600;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly autenticacion: ServicioAutenticacion,
    private readonly jwt: JwtService,
  ) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<TokenDto> {
    const sesion = await this.autenticacion.iniciarSesion(dto.correoInstitucional, dto.contrasena);
    const payload: PayloadJwt = { sub: sesion.usuarioId, rol: sesion.rol, personaId: sesion.personaId };
    return {
      access_token: await this.jwt.signAsync(payload),
      token_type: 'Bearer',
      expires_in: UNA_HORA,
    };
  }

  @Get('yo')
  yo(@UsuarioActual() sesion: Sesion): Sesion {
    return sesion;
  }
}
