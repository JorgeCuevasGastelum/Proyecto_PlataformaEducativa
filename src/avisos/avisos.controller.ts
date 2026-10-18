import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioAlumno } from '../dominio/servicio-alumno';
import { ConsultarAvisosDto, PublicarAvisoDto } from './dto/aviso.dto';

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
}
