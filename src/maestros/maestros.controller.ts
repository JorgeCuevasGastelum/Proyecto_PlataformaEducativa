import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioMaestro } from '../dominio/servicio-maestro';
import { RegistrarMaestroDto } from './dto/registrar-maestro.dto';

@Controller('maestros')
@UseGuards(RolesGuard)
export class MaestrosController {
  constructor(
    private readonly administracion: ServicioAdministracion,
    private readonly maestros: ServicioMaestro,
  ) {}

  @Post()
  @HttpCode(201)
  @Roles('administrador')
  registrar(@UsuarioActual() sesion: Sesion, @Body() dto: RegistrarMaestroDto) {
    return this.administracion.registrarMaestro(sesion, dto);
  }

  @Get()
  @Roles('administrador')
  listar(@UsuarioActual() sesion: Sesion) {
    return this.administracion.listarMaestros(sesion);
  }

  @Get('yo/grupos')
  @Roles('maestro')
  misGrupos(@UsuarioActual() sesion: Sesion) {
    return this.maestros.consultarMisGrupos(sesion);
  }
}
