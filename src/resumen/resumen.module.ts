import { Module } from '@nestjs/common';
import { ResumenController } from './resumen.controller';

@Module({
  controllers: [ResumenController],
})
export class ResumenModule {}
