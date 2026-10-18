import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioCatalogo } from '../dominio/servicio-catalogo';
import { CambiarCargaDto, CrearPeriodoDto } from './dto/periodo.dto';

@Controller('periodos')
@UseGuards(RolesGuard)
export class PeriodosController {
  constructor(
    private readonly administracion: ServicioAdministracion,
    private readonly catalogo: ServicioCatalogo,
  ) {}

  @Get()
  listar() {
    return this.catalogo.listarPeriodos();
  }

  @Post()
  @HttpCode(201)
  @Roles('administrador')
  crear(@UsuarioActual() sesion: Sesion, @Body() dto: CrearPeriodoDto) {
    return this.administracion.crearPeriodo(sesion, {
      clave: dto.clave,
      fechaAperturaCarga: new Date(dto.fechaAperturaCarga),
      fechaCierreCarga: new Date(dto.fechaCierreCarga),
      creditosMaximos: dto.creditosMaximos,
    });
  }

  @Patch(':id')
  @Roles('administrador')
  cambiarCarga(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number, @Body() dto: CambiarCargaDto) {
    return dto.cargaAbierta
      ? this.administracion.abrirCargaAcademica(sesion, id)
      : this.administracion.cerrarCargaAcademica(sesion, id);
  }
}
