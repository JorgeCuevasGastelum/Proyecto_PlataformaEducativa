import { Module } from '@nestjs/common';
import { PagosController } from './pagos.controller';

@Module({
  controllers: [PagosController],
})
export class PagosModule {}
