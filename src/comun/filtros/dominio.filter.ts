import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import {
  AlumnoNoEncontradoError,
  CredencialesInvalidasError,
  ErrorDeDominio,
  GrupoAjenoError,
  GrupoNoEncontradoError,
  InscripcionNoEncontradaError,
  MaestroNoEncontradoError,
  MateriaNoEncontradaError,
  OperacionNoAutorizadaError,
  PagoNoEncontradoError,
  PeriodoNoEncontradoError,
  PlanDeEstudiosNoEncontradoError,
} from '../../dominio/errores';
import { respuestaDeError } from './respuesta-error';

const NO_ENCONTRADOS = [
  AlumnoNoEncontradoError,
  MaestroNoEncontradoError,
  MateriaNoEncontradaError,
  PlanDeEstudiosNoEncontradoError,
  GrupoNoEncontradoError,
  PeriodoNoEncontradoError,
  InscripcionNoEncontradaError,
  PagoNoEncontradoError,
];

@Catch(ErrorDeDominio)
export class DominioExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Dominio');

  private codigoPara(error: ErrorDeDominio): number {
    if (error instanceof CredencialesInvalidasError) return HttpStatus.UNAUTHORIZED;
    if (error instanceof OperacionNoAutorizadaError || error instanceof GrupoAjenoError) return HttpStatus.FORBIDDEN;
    if (NO_ENCONTRADOS.some((tipo) => error instanceof tipo)) return HttpStatus.NOT_FOUND;
    return HttpStatus.CONFLICT;
  }

  catch(error: ErrorDeDominio, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<{ url: string; method: string }>();
    const estado = this.codigoPara(error);

    this.logger.warn(`${req.method} ${req.url} -> ${estado} ${error.name}`);
    res.status(estado).json(respuestaDeError(estado, error.name, error.message, req.url));
  }
}
