import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class IdPipe implements PipeTransform<string, number> {
  transform(value: string) {
    if (!/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) {
      throw new BadRequestException('El identificador debe ser un entero positivo válido.');
    }
    return Number(value);
  }
}
