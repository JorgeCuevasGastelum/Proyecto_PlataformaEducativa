import { Body, Controller, Get, Post, Patch, Delete, Param, Query, Inject, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CasosDeUso } from '../aplicacion/casos-de-uso.js';
import { Roles, Actor } from '../seguridad/acceso.js';
import type { Sesion } from '../dominio/entidades.js';
import { InscripcionDto, CargoDto, AvisoDto, AvisosQuery } from '../modelos/entradas.js';
import { ApiRespuestas } from '../modelos/salidas.js';
import { IdPipe } from '../http/id.pipe.js';

@ApiTags('Inscripciones, pagos y avisos') @ApiBearerAuth() @Controller()
export class OperacionesController {
  constructor(@Inject(CasosDeUso) private readonly casos: CasosDeUso) {}
  @Roles('alumno') @Post('inscripciones') @ApiRespuestas(true) @ApiOperation({ summary: 'Inscribirme a un grupo', description: 'La identidad del alumno se obtiene del JWT, nunca del cuerpo.' })
  inscribir(@Actor() actor: Sesion, @Body() dto: InscripcionDto) { return this.casos.ejecutar(true, s => s.alumnos.realizarCargaAcademica(actor, dto.grupoId)); }
  @Roles('alumno') @Delete('inscripciones/:id') @ApiRespuestas() @ApiOperation({ summary: 'Dar de baja una inscripción propia', description: 'Baja lógica: libera cupo y excluye la inscripción del horario e historial. Una baja repetida responde 409.' })
  baja(@Actor() actor: Sesion, @Param('id', IdPipe) id: number) { return this.casos.ejecutar(true, s => s.alumnos.darDeBajaInscripcion(actor, id)); }
  @Roles('administrador') @Post('pagos') @ApiRespuestas(true) @ApiOperation({ summary: 'Registrar un cargo del período' })
  cargo(@Actor() actor: Sesion, @Body() dto: CargoDto) { return this.casos.ejecutar(true, s => s.administracion.registrarCargo(actor, { ...dto, fechaLimite: new Date(dto.fechaLimite) })); }
  @Roles('administrador') @Patch('pagos/:id/liquidacion') @ApiRespuestas() @ApiOperation({ summary: 'Registrar la liquidación de un cargo', description: 'Registro administrativo; no integra una pasarela de pagos.' })
  pagar(@Actor() actor: Sesion, @Param('id', IdPipe) id: number) { return this.casos.ejecutar(true, s => s.administracion.registrarPago(actor, id)); }
  @Get('avisos') @ApiRespuestas() @ApiOperation({ summary: 'Consultar avisos de un período' })
  avisos(@Query() q: AvisosQuery) {
    return this.casos.ejecutar(false, async s => {
      if (!await s.repo.buscarPeriodoPorId(q.periodoId)) throw new NotFoundException('No existe el período.');
      return s.alumnos.consultarAvisos(q.periodoId);
    });
  }
  @Roles('administrador') @Post('avisos') @ApiRespuestas(true) @ApiOperation({ summary: 'Publicar aviso en un período' })
  publicar(@Actor() actor: Sesion, @Body() dto: AvisoDto) { return this.casos.ejecutar(true, s => s.administracion.publicarAviso(actor, dto.periodoId, dto.titulo, dto.contenido)); }
}
