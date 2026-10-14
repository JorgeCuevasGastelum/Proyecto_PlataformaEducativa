import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiConflictResponse } from '@nestjs/swagger';

export class MetaDto {
  @ApiProperty({ format: 'date-time' }) timestamp!: string;
}
export class RespuestaDto {
  @ApiProperty({ example: true }) ok!: boolean;
  @ApiProperty({ type: Object, nullable: true, description: 'Objeto o arreglo del recurso indicado en la operación.' }) data!: unknown;
  @ApiProperty({ type: MetaDto }) meta!: MetaDto;
}
export class ErrorDto {
  @ApiProperty({ example: 'CupoAgotadoError' }) codigo!: string;
  @ApiProperty({ example: 'El grupo ya no tiene lugares disponibles.' }) mensaje!: string;
  @ApiProperty({ type: [String], required: false }) detalles?: string[];
}
export class RespuestaErrorDto {
  @ApiProperty({ example: false }) ok!: boolean;
  @ApiProperty({ type: ErrorDto }) error!: ErrorDto;
  @ApiProperty({ type: MetaDto }) meta!: MetaDto;
}
export const ApiRespuestas = (creado = false) => applyDecorators(
  creado ? ApiCreatedResponse({ type: RespuestaDto }) : ApiOkResponse({ type: RespuestaDto }),
  ApiBadRequestResponse({ type: RespuestaErrorDto, description: 'Datos de entrada inválidos.' }),
  ApiUnauthorizedResponse({ type: RespuestaErrorDto, description: 'Sin token, vencido o alterado.' }),
  ApiForbiddenResponse({ type: RespuestaErrorDto, description: 'Rol o propiedad del recurso incorrectos.' }),
  ApiNotFoundResponse({ type: RespuestaErrorDto, description: 'Recurso inexistente.' }),
  ApiConflictResponse({ type: RespuestaErrorDto, description: 'Regla de negocio o unicidad.' }),
);
