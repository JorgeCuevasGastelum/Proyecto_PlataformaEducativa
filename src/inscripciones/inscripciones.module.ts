import { Module } from '@nestjs/common';
import { InscripcionesController } from './inscripciones.controller';

@Module({
  controllers: [InscripcionesController],
})
export class InscripcionesModule {}
