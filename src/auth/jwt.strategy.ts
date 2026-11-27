import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Rol, Sesion } from '../dominio/entidades';
import { ServicioAutenticacion } from '../dominio/servicio-autenticacion';

export interface PayloadJwt {
  sub: number;
  rol: Rol;
  personaId: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly autenticacion: ServicioAutenticacion) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  validate(payload: PayloadJwt): Promise<Sesion> {
    return this.autenticacion.validarSesion({ usuarioId: payload.sub, rol: payload.rol, personaId: payload.personaId });
  }
}
