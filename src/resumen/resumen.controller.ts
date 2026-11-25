import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';

@Controller('resumen')
@UseGuards(RolesGuard)
export class ResumenController {
  constructor(private readonly administracion: ServicioAdministracion) {}

  @Get()
  @Roles('administrador')
  obtener(@UsuarioActual() sesion: Sesion) {
    return this.administracion.resumen(sesion);
  }
}
