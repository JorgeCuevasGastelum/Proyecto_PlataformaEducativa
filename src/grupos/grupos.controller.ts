import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { crearBloqueHorario } from '../dominio/entidades';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioCatalogo } from '../dominio/servicio-catalogo';
import { ServicioMaestro } from '../dominio/servicio-maestro';
import { AbrirGrupoDto, CapturarCalificacionesDto, ConsultarGruposDto } from './dto/grupo.dto';

@Controller('grupos')
@UseGuards(RolesGuard)
export class GruposController {
  constructor(
    private readonly administracion: ServicioAdministracion,
    private readonly catalogo: ServicioCatalogo,
    private readonly maestros: ServicioMaestro,
  ) {}

  @Get()
  listar(@Query() filtro: ConsultarGruposDto) {
    return this.catalogo.consultarGrupos(filtro.periodoId);
  }

  @Post()
  @HttpCode(201)
  @Roles('administrador')
  abrir(@UsuarioActual() sesion: Sesion, @Body() dto: AbrirGrupoDto) {
    return this.administracion.abrirGrupo(sesion, {
      ...dto,
      horario: dto.horario.map((b) => crearBloqueHorario(b.diaSemana, b.horaInicio, b.horaFin)),
    });
  }

  @Get(':id/ocupacion')
  @Roles('administrador')
  ocupacion(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number) {
    return this.administracion.consultarOcupacionDeGrupo(sesion, id);
  }

  @Get(':id/alumnos')
  @Roles('administrador', 'maestro')
  alumnos(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number) {
    return sesion.rol === 'administrador'
      ? this.administracion.consultarInscritosDeGrupo(sesion, id)
      : this.maestros.consultarListaDeGrupo(sesion, id);
  }

  @Put(':id/calificaciones')
  @Roles('maestro')
  capturarCalificaciones(
    @UsuarioActual() sesion: Sesion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CapturarCalificacionesDto,
  ) {
    return this.maestros.capturarCalificaciones(sesion, id, dto.calificaciones);
  }
}
