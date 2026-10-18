import { IsArray, IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class RegistrarMateriaDto {
  @IsString()
  @IsNotEmpty()
  clave: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  descripcion: string;

  @IsInt()
  creditos: number;

  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  prerrequisitoIds: number[];
}
