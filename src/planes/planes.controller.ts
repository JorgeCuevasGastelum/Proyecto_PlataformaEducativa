import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioCatalogo } from '../dominio/servicio-catalogo';
import { RegistrarCarreraDto } from './dto/registrar-carrera.dto';
import { RegistrarPlanDto } from './dto/registrar-plan.dto';

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

  @Post('carreras')
  @HttpCode(201)
  @Roles('administrador')
  registrarCarrera(@UsuarioActual() sesion: Sesion, @Body() dto: RegistrarCarreraDto) {
    return this.administracion.registrarCarrera(sesion, dto);
  }

  @Get('planes')
  listarPlanes() {
    return this.catalogo.listarPlanesDeEstudio();
  }

  @Post('planes')
  @HttpCode(201)
  @Roles('administrador')
  registrarPlan(@UsuarioActual() sesion: Sesion, @Body() dto: RegistrarPlanDto) {
    return this.administracion.registrarPlanDeEstudios(sesion, dto);
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
