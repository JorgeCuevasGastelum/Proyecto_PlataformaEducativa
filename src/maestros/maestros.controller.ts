import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioMaestro } from '../dominio/servicio-maestro';
import { ActualizarMaestroDto } from './dto/actualizar-maestro.dto';
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

  @Get(':id')
  @Roles('administrador')
  obtener(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number) {
    return this.administracion.obtenerMaestro(sesion, id);
  }

  @Get(':id/grupos')
  @Roles('administrador')
  gruposAsignados(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number) {
    return this.administracion.consultarGruposDeMaestro(sesion, id);
  }

  @Patch(':id')
  @Roles('administrador')
  actualizar(
    @UsuarioActual() sesion: Sesion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarMaestroDto,
  ) {
    return this.administracion.editarMaestro(sesion, id, dto);
  }

  @Delete(':id')
  @Roles('administrador')
  eliminar(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number) {
    return this.administracion.eliminarMaestro(sesion, id);
  }
}
