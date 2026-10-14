import { CanActivate, ExecutionContext, Injectable, Inject, SetMetadata, UnauthorizedException, ForbiddenException, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Rol, Sesion } from '../dominio/entidades.js';

const PUBLICO = 'ruta-publica';
const ROLES = 'roles-permitidos';
export const Publico = () => SetMetadata(PUBLICO, true);
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES, roles);
export type PeticionAutenticada = Request & { sesion: Sesion };
export const Actor = createParamDecorator((_data: unknown, ctx: ExecutionContext): Sesion => ctx.switchToHttp().getRequest<PeticionAutenticada>().sesion);

@Injectable()
export class AccesoGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector, @Inject(JwtService) private readonly jwt: JwtService) {}
  async canActivate(ctx: ExecutionContext) {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLICO, targets)) return true;
    const req = ctx.switchToHttp().getRequest<PeticionAutenticada>();
    const auth = req.headers.authorization;
    if (!auth || !/^Bearer \S+$/.test(auth)) throw new UnauthorizedException('Se requiere una credencial Bearer válida.');
    try {
      const claims = await this.jwt.verifyAsync<Record<string, unknown>>(auth.slice(7), {
        algorithms: ['HS256'], issuer: 'plataforma-educativa', audience: 'plataforma-clientes',
      });
      if (!Number.isInteger(claims.sub) || Number(claims.sub) <= 0 ||
          !Number.isInteger(claims.personaId) || Number(claims.personaId) <= 0 ||
          !['alumno', 'maestro', 'administrador'].includes(String(claims.rol)) ||
          typeof claims.exp !== 'number') throw new Error('Payload inválido');
      req.sesion = { usuarioId: Number(claims.sub), personaId: Number(claims.personaId), rol: claims.rol as Rol };
    } catch {
      throw new UnauthorizedException('Credencial inválida o vencida.');
    }
    const roles = this.reflector.getAllAndOverride<Rol[]>(ROLES, targets);
    if (roles && !roles.includes(req.sesion.rol)) throw new ForbiddenException('Tu rol no puede realizar esta operación.');
    return true;
  }
}
