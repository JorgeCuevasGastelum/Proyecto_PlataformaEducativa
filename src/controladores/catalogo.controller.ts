import { Body, Controller, Get, Post, Put, Patch, Param, Query, Inject, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CasosDeUso } from '../aplicacion/casos-de-uso.js';
import { Roles, Actor } from '../seguridad/acceso.js';
import type { Sesion } from '../dominio/entidades.js';
import { crearBloqueHorario } from '../dominio/entidades.js';
import { MateriaDto, GrupoDto, CargaDto, CalificacionesDto, PeriodoQuery } from '../modelos/entradas.js';
import { ApiRespuestas } from '../modelos/salidas.js';
import { IdPipe } from '../http/id.pipe.js';

@ApiTags('Catálogo') @ApiBearerAuth() @Controller()
export class CatalogoController {
  constructor(@Inject(CasosDeUso) private readonly casos: CasosDeUso) {}
  @Get('carreras') @ApiRespuestas() @ApiOperation({ summary: 'Listar carreras' })
  carreras() { return this.casos.ejecutar(false, s => s.repo.listarCarreras()); }
  @Get('planes') @ApiRespuestas() @ApiOperation({ summary: 'Listar planes con materias compartidas' })
  planes() { return this.casos.ejecutar(false, s => s.repo.listarPlanes()); }
  @Roles('administrador') @Put('planes/:id/materias/:materiaId') @ApiRespuestas()
  @ApiOperation({ summary: 'Incluir una materia en un plan (idempotente)' })
  agregarMateria(@Actor() actor: Sesion, @Param('id', IdPipe) id: number, @Param('materiaId', IdPipe) materiaId: number) {
    return this.casos.ejecutar(true, s => s.administracion.agregarMateriaAPlan(actor, id, materiaId));
  }
  @Get('materias') @ApiRespuestas() @ApiOperation({ summary: 'Listar materias y prerrequisitos' })
  materias() { return this.casos.ejecutar(false, s => s.repo.listarMaterias()); }
  @Roles('administrador') @Post('materias') @ApiRespuestas(true) @ApiOperation({ summary: 'Registrar materia' })
  registrarMateria(@Actor() actor: Sesion, @Body() dto: MateriaDto) { return this.casos.ejecutar(true, s => s.administracion.registrarMateria(actor, dto)); }
  @Get('periodos') @ApiRespuestas() @ApiOperation({ summary: 'Listar períodos escolares' })
  periodos() { return this.casos.ejecutar(false, s => s.repo.listarPeriodos()); }
  @Roles('administrador') @Patch('periodos/:id/carga') @ApiRespuestas() @ApiOperation({ summary: 'Abrir o cerrar la carga académica' })
  carga(@Actor() actor: Sesion, @Param('id', IdPipe) id: number, @Body() dto: CargaDto) {
    return this.casos.ejecutar(true, s => dto.habilitado ? s.administracion.abrirCargaAcademica(actor, id) : s.administracion.cerrarCargaAcademica(actor, id));
  }
  @Get('grupos') @ApiRespuestas() @ApiOperation({ summary: 'Listar grupos; filtro opcional por período' })
  grupos(@Query() q: PeriodoQuery) {
    return this.casos.ejecutar(false, async s => {
      if (q.periodoId && !await s.repo.buscarPeriodoPorId(q.periodoId)) throw new NotFoundException('No existe el período.');
      return s.repo.listarGrupos(q.periodoId);
    });
  }
  @Roles('administrador') @Post('grupos') @ApiRespuestas(true) @ApiOperation({ summary: 'Abrir grupo con maestro, cupo y horario' })
  registrarGrupo(@Actor() actor: Sesion, @Body() dto: GrupoDto) {
    return this.casos.ejecutar(true, s => s.administracion.abrirGrupo(actor, {
      ...dto, horario: dto.horario.map(h => crearBloqueHorario(h.diaSemana, h.horaInicio, h.horaFin)),
    }));
  }
  @Roles('administrador') @Get('grupos/:id/ocupacion') @ApiRespuestas() @ApiOperation({ summary: 'Consultar lugares ocupados y disponibles' })
  ocupacion(@Actor() actor: Sesion, @Param('id', IdPipe) id: number) { return this.casos.ejecutar(false, s => s.administracion.consultarOcupacionDeGrupo(actor, id)); }
  @Roles('maestro') @Get('grupos/:id/alumnos') @ApiRespuestas() @ApiOperation({ summary: 'Consultar alumnos de uno de mis grupos' })
  lista(@Actor() actor: Sesion, @Param('id', IdPipe) id: number) { return this.casos.ejecutar(false, s => s.maestros.consultarListaDeGrupo(actor, id)); }
  @Roles('maestro') @Put('grupos/:id/calificaciones') @ApiRespuestas() @ApiOperation({ summary: 'Capturar calificaciones de mi grupo de forma atómica' })
  calificar(@Actor() actor: Sesion, @Param('id', IdPipe) id: number, @Body() dto: CalificacionesDto) {
    return this.casos.ejecutar(true, s => s.maestros.capturarCalificaciones(actor, id, dto.calificaciones));
  }
}
