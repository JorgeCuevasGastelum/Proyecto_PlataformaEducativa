import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { ServicioAlumno } from '../dominio/servicio-alumno';
import { RegistrarPagoDto } from '../pagos/dto/pago.dto';
import { RegistrarAlumnoDto } from './dto/registrar-alumno.dto';

@Controller('alumnos')
@UseGuards(RolesGuard)
export class AlumnosController {
  constructor(
    private readonly administracion: ServicioAdministracion,
    private readonly alumnos: ServicioAlumno,
  ) {}

  @Post()
  @HttpCode(201)
  @Roles('administrador')
  registrar(@UsuarioActual() sesion: Sesion, @Body() dto: RegistrarAlumnoDto) {
    return this.administracion.registrarAlumno(sesion, dto);
  }

  @Get()
  @Roles('administrador')
  listar(@UsuarioActual() sesion: Sesion) {
    return this.administracion.listarAlumnos(sesion);
  }

  @Get('yo/materias')
  @Roles('alumno')
  materiasInscritas(@UsuarioActual() sesion: Sesion) {
    return this.alumnos.consultarMateriasInscritas(sesion);
  }

  @Get('yo/horario')
  @Roles('alumno')
  horario(@UsuarioActual() sesion: Sesion) {
    return this.alumnos.consultarHorarioSemanal(sesion);
  }

  @Get('yo/historial')
  @Roles('alumno')
  historial(@UsuarioActual() sesion: Sesion) {
    return this.alumnos.consultarHistorial(sesion);
  }

  @Get('yo/pagos')
  @Roles('alumno')
  estadoDeCuenta(@UsuarioActual() sesion: Sesion) {
    return this.alumnos.consultarEstadoDeCuenta(sesion);
  }

  @Patch('yo/pagos/:id')
  @Roles('alumno')
  pagarCargo(
    @UsuarioActual() sesion: Sesion,
    @Param('id', ParseIntPipe) id: number,
    @Body() _dto: RegistrarPagoDto,
  ) {
    return this.alumnos.pagarCargo(sesion, id);
  }
}
