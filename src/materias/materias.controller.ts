import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioCatalogo } from '../dominio/servicio-catalogo';
import { RegistrarMateriaDto } from './dto/registrar-materia.dto';

@Controller('materias')
@UseGuards(RolesGuard)
export class MateriasController {
  constructor(
    private readonly administracion: ServicioAdministracion,
    private readonly catalogo: ServicioCatalogo,
  ) {}

  @Get()
  listar() {
    return this.catalogo.listarMaterias();
  }

  @Post()
  @HttpCode(201)
  @Roles('administrador')
  registrar(@UsuarioActual() sesion: Sesion, @Body() dto: RegistrarMateriaDto) {
    return this.administracion.registrarMateria(sesion, dto);
  }
}
