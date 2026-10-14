import { Body, Controller, Get, Post, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CasosDeUso } from '../aplicacion/casos-de-uso.js';
import { Roles, Actor } from '../seguridad/acceso.js';
import type { Sesion } from '../dominio/entidades.js';
import { AlumnoDto } from '../modelos/entradas.js';
import { ApiRespuestas } from '../modelos/salidas.js';

@ApiTags('Alumnos') @ApiBearerAuth() @Controller('alumnos')
export class AlumnosController {
  constructor(@Inject(CasosDeUso) private readonly casos: CasosDeUso) {}
  @Roles('administrador') @Post() @ApiRespuestas(true)
  @ApiOperation({ summary: 'Registrar alumno y su cuenta (administrador)', description: 'Ambos registros se guardan en una transacción. No admite un rol enviado por el cliente.' })
  registrar(@Actor() actor: Sesion, @Body() dto: AlumnoDto) {
    return this.casos.ejecutar(true, s => s.administracion.registrarAlumno(actor, dto));
  }
  @Roles('administrador') @Get() @ApiRespuestas()
  @ApiOperation({ summary: 'Listar alumnos (administrador)' })
  listar() { return this.casos.ejecutar(false, s => s.repo.listarAlumnos()); }
  @Roles('alumno') @Get('me/materias') @ApiRespuestas()
  @ApiOperation({ summary: 'Consultar mis materias inscritas' })
  materias(@Actor() actor: Sesion) { return this.casos.ejecutar(false, s => s.alumnos.consultarMateriasInscritas(actor)); }
  @Roles('alumno') @Get('me/horario') @ApiRespuestas()
  @ApiOperation({ summary: 'Consultar mi horario ordenado por día y hora' })
  horario(@Actor() actor: Sesion) { return this.casos.ejecutar(false, s => s.alumnos.consultarHorarioSemanal(actor)); }
  @Roles('alumno') @Get('me/historial') @ApiRespuestas()
  @ApiOperation({ summary: 'Consultar mi historial con calificaciones y sin bajas' })
  historial(@Actor() actor: Sesion) { return this.casos.ejecutar(false, s => s.alumnos.consultarHistorial(actor)); }
  @Roles('alumno') @Get('me/pagos') @ApiRespuestas()
  @ApiOperation({ summary: 'Consultar mi estado de cuenta' })
  pagos(@Actor() actor: Sesion) { return this.casos.ejecutar(false, s => s.alumnos.consultarEstadoDeCuenta(actor)); }
}
