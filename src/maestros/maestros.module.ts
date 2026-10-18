import { Module } from '@nestjs/common';
import { MaestrosController } from './maestros.controller';

@Module({
  controllers: [MaestrosController],
})
export class MaestrosModule {}
