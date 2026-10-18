import { Body, Controller, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decoradores/roles.decorator';
import { UsuarioActual } from '../auth/decoradores/usuario-actual.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Sesion } from '../dominio/entidades';
import { ServicioAdministracion } from '../dominio/servicio-administracion';
import { RegistrarCargoDto, RegistrarPagoDto } from './dto/pago.dto';

@Controller('pagos')
@UseGuards(RolesGuard)
@Roles('administrador')
export class PagosController {
  constructor(private readonly administracion: ServicioAdministracion) {}

  @Post()
  @HttpCode(201)
  registrarCargo(@UsuarioActual() sesion: Sesion, @Body() dto: RegistrarCargoDto) {
    return this.administracion.registrarCargo(sesion, { ...dto, fechaLimite: new Date(dto.fechaLimite) });
  }

  @Patch(':id')
  registrarPago(@UsuarioActual() sesion: Sesion, @Param('id', ParseIntPipe) id: number, @Body() _dto: RegistrarPagoDto) {
    return this.administracion.registrarPago(sesion, id);
  }
}
