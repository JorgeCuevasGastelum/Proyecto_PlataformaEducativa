import { Body, Controller, Get, Post, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CasosDeUso } from '../aplicacion/casos-de-uso.js';
import { Roles, Actor } from '../seguridad/acceso.js';
import type { Sesion } from '../dominio/entidades.js';
import { MaestroDto } from '../modelos/entradas.js';
import { ApiRespuestas } from '../modelos/salidas.js';

@ApiTags('Maestros') @ApiBearerAuth() @Controller('maestros')
export class MaestrosController {
  constructor(@Inject(CasosDeUso) private readonly casos: CasosDeUso) {}
  @Roles('administrador') @Post() @ApiRespuestas(true)
  @ApiOperation({ summary: 'Registrar maestro y su cuenta (administrador)' })
  registrar(@Actor() actor: Sesion, @Body() dto: MaestroDto) { return this.casos.ejecutar(true, s => s.administracion.registrarMaestro(actor, dto)); }
  @Roles('administrador') @Get() @ApiRespuestas()
  @ApiOperation({ summary: 'Listar maestros (administrador)' })
  listar() { return this.casos.ejecutar(false, s => s.repo.listarMaestros()); }
  @Roles('maestro') @Get('me/grupos') @ApiRespuestas()
  @ApiOperation({ summary: 'Consultar mis grupos y su ocupación' })
  grupos(@Actor() actor: Sesion) { return this.casos.ejecutar(false, s => s.maestros.consultarMisGrupos(actor)); }
}
