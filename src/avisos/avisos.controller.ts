import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioAlumno } from '../dominio/servicio-alumno';
import { ConsultarAvisosDto, EditarAvisoDto, PublicarAvisoDto } from './dto/aviso.dto';

@Controller('avisos')
@UseGuards(RolesGuard)
export class AvisosController {
  constructor(
    private readonly administracion: ServicioAdministracion,
    private readonly alumnos: ServicioAlumno,
  ) {}

  @Get()
  listar(@Query() filtro: ConsultarAvisosDto) {
    return this.alumnos.consultarAvisos(filtro.periodoId);
  }

  @Post()
  @HttpCode(201)
  @Roles('administrador')
  publicar(@UsuarioActual() sesion: Sesion, @Body() dto: PublicarAvisoDto) {
    return this.administracion.publicarAviso(sesion, dto.periodoId, dto.titulo, dto.contenido);
  }

  @Get(':id')
  @Roles('administrador')
  obtener(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number) {
    return this.administracion.obtenerAviso(sesion, id);
  }

  @Patch(':id')
  @Roles('administrador')
  editar(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number, @Body() dto: EditarAvisoDto) {
    return this.administracion.editarAviso(sesion, id, dto.titulo, dto.contenido);
  }

  @Delete(':id')
  @Roles('administrador')
  eliminar(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number) {
    return this.administracion.eliminarAviso(sesion, id);
  }
}
