import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioCatalogo } from '../dominio/servicio-catalogo';
import { ActualizarMateriaDto } from './dto/actualizar-materia.dto';
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

  @Get(':id')
  @Roles('administrador')
  obtener(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number) {
    return this.administracion.obtenerMateria(sesion, id);
  }

  @Patch(':id')
  @Roles('administrador')
  editar(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarMateriaDto) {
    return this.administracion.editarMateria(sesion, id, dto);
  }

  // RN-32: el servicio responde 409 si la materia tiene grupos, es prerrequisito o está en un plan.
  @Delete(':id')
  @Roles('administrador')
  eliminar(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number) {
    return this.administracion.eliminarMateria(sesion, id);
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
