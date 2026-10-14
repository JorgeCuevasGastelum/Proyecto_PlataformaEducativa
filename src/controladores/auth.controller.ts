import { Body, Controller, Get, Post, HttpCode, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CasosDeUso } from '../aplicacion/casos-de-uso.js';
import { Publico, Actor } from '../seguridad/acceso.js';
import type { Sesion } from '../dominio/entidades.js';
import { LoginDto } from '../modelos/entradas.js';
import { ApiRespuestas } from '../modelos/salidas.js';
import { leerConfiguracion } from '../config/configuracion.js';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(@Inject(CasosDeUso) private readonly casos: CasosDeUso, @Inject(JwtService) private readonly jwt: JwtService) {}
  @Publico() @Post('sesiones') @HttpCode(200) @ApiRespuestas()
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Devuelve token Bearer firmado con expiración. Usa tu contraseña configurada en SEED_PASSWORD o la del registro administrado.' })
  async login(@Body() datos: LoginDto) {
    const sesion = await this.casos.ejecutar(false, s => s.autenticacion.iniciarSesion(datos.correoInstitucional, datos.contrasena));
    const accessToken = await this.jwt.signAsync({ sub: sesion.usuarioId, rol: sesion.rol, personaId: sesion.personaId });
    return { accessToken, tokenType: 'Bearer', expiresIn: leerConfiguracion().ttl };
  }
  @Get('sesion') @ApiBearerAuth() @ApiRespuestas()
  @ApiOperation({ summary: 'Consultar la identidad autenticada' })
  perfil(@Actor() sesion: Sesion) { return sesion; }
}
