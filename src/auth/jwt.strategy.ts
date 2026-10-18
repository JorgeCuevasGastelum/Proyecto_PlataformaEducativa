import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Rol, Sesion } from '../dominio/entidades';

export interface PayloadJwt {
  sub: number;
  rol: Rol;
  personaId: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  validate(payload: PayloadJwt): Sesion {
    return { usuarioId: payload.sub, rol: payload.rol, personaId: payload.personaId };
  }
}
