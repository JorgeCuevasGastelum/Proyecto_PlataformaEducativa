import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { map } from 'rxjs/operators';
import { ErrorDeDominio, CredencialesInvalidasError, OperacionNoAutorizadaError, GrupoAjenoError } from '../dominio/errores.js';

export const metadata = () => ({ timestamp: new Date().toISOString() });
export function respuestaError(codigo: string, mensaje: string, detalles?: string[]) {
  return { ok: false, error: { codigo, mensaje, ...(detalles ? { detalles } : {}) }, meta: metadata() };
}

@Injectable()
export class RespuestaInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map(data => ({ ok: true, data: data ?? null, meta: metadata() })));
  }
}

@Catch()
export class ErroresFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errores');
  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = 500, codigo = 'ERROR_INTERNO', mensaje = 'Ocurrió un error inesperado.', detalles: string[] | undefined;
    if (error instanceof ErrorDeDominio) {
      codigo = error.name; mensaje = error.message;
      status = error instanceof CredencialesInvalidasError ? 401 :
        error instanceof OperacionNoAutorizadaError || error instanceof GrupoAjenoError ? 403 :
        /NoEncontrad[oa]Error$/.test(error.name) ? 404 : 409;
    } else if (error instanceof HttpException) {
      status = error.getStatus();
      codigo = ({ 400: 'PETICION_INVALIDA', 401: 'NO_AUTENTICADO', 403: 'SIN_PERMISO', 404: 'NO_ENCONTRADO', 413: 'PETICION_DEMASIADO_GRANDE' } as Record<number, string>)[status] ?? 'ERROR_HTTP';
      const response = error.getResponse();
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const value = (response as { message: string | string[] }).message;
        if (Array.isArray(value)) { mensaje = 'La petición contiene datos inválidos.'; detalles = value; }
        else mensaje = value;
      } else mensaje = error.message;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { status = 409; codigo = 'DATO_DUPLICADO'; mensaje = 'Ya existe un registro con esos datos únicos.'; }
      if (error.code === 'P2003' || error.code === 'P2025') { status = 404; codigo = 'REFERENCIA_NO_ENCONTRADA'; mensaje = 'No existe el registro solicitado o relacionado.'; }
      if (error.code === 'P2034' || error.code === 'P2028') { status = 409; codigo = 'OPERACION_CONCURRENTE'; mensaje = 'No se pudo completar la operación concurrente; vuelve a intentarlo.'; }
    }
    // No imprime cuerpos, tokens, contraseñas, URL de conexión ni errores del driver.
    if (status === 500) this.logger.error('Fallo interno: ' + (error instanceof Error ? error.name : 'desconocido'));
    res.status(status).json(respuestaError(codigo, mensaje, detalles));
  }
}
