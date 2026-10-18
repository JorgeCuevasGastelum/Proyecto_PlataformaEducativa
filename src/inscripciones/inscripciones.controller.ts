import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAlumno } from '../dominio/servicio-alumno';
import { CrearInscripcionDto } from './dto/crear-inscripcion.dto';

@Controller('inscripciones')
@UseGuards(RolesGuard)
@Roles('alumno')
export class InscripcionesController {
  constructor(private readonly alumnos: ServicioAlumno) {}

  @Post()
  @HttpCode(201)
  async crear(
    @UsuarioActual() sesion: Sesion,
    @Body() dto: CrearInscripcionDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const inscripcion = await this.alumnos.realizarCargaAcademica(sesion, dto.grupoId);
    res.setHeader('Location', `/inscripciones/${inscripcion.id}`);
    return inscripcion;
  }

  @Delete(':id')
  darDeBaja(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number) {
    return this.alumnos.darDeBajaInscripcion(sesion, id);
  }
}
