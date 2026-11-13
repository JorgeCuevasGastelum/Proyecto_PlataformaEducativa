import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioCatalogo } from '../dominio/servicio-catalogo';
import { RegistrarMateriaDto } from './dto/registrar-materia.dto';

@Controller('materias')
@UseGuards(RolesGuard)
export class MateriasController {
  constructor(
    private readonly administracion: ServicioAdministracion,
    private readonly catalogo: ServicioCatalogo,
  ) {}

  @Get()
  listar() {
    return this.catalogo.listarMaterias();
  }

  @Post()
  @HttpCode(201)
  @Roles('administrador')
  registrar(@UsuarioActual() sesion: Sesion, @Body() dto: RegistrarMateriaDto) {
    return this.administracion.registrarMateria(sesion, dto);
  }

  @Put(':id/prerrequisitos/:prerrequisitoId')
  @Roles('administrador')
  agregarPrerrequisito(
    @UsuarioActual() sesion: Sesion,
    @Param('id', ParseIntPipe) id: number,
    @Param('prerrequisitoId', ParseIntPipe) prerrequisitoId: number,
  ) {
    return this.administracion.agregarPrerrequisito(sesion, id, prerrequisitoId);
  }

  @Delete(':id/prerrequisitos/:prerrequisitoId')
  @Roles('administrador')
  quitarPrerrequisito(
    @UsuarioActual() sesion: Sesion,
    @Param('id', ParseIntPipe) id: number,
    @Param('prerrequisitoId', ParseIntPipe) prerrequisitoId: number,
  ) {
    return this.administracion.quitarPrerrequisito(sesion, id, prerrequisitoId);
  }
}
