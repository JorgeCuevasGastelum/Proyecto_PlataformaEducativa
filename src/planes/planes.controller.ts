import { Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioCatalogo } from '../dominio/servicio-catalogo';

@Controller()
@UseGuards(RolesGuard)
export class PlanesController {
  constructor(
    private readonly administracion: ServicioAdministracion,
    private readonly catalogo: ServicioCatalogo,
  ) {}

  @Get('carreras')
  listarCarreras() {
    return this.catalogo.listarCarreras();
  }

  @Get('planes')
  listarPlanes() {
    return this.catalogo.listarPlanesDeEstudio();
  }

  @Put('planes/:id/materias/:materiaId')
  @Roles('administrador')
  agregarMateria(
    @UsuarioActual() sesion: Sesion,
    @Param('id', ParseIntPipe) id: number,
    @Param('materiaId', ParseIntPipe) materiaId: number,
  ) {
    return this.administracion.agregarMateriaAPlan(sesion, id, materiaId);
  }
}
