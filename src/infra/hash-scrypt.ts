import { randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { GeneradorDeHash } from '../dominio/generador-de-hash.js';

const scryptAsync = promisify(scrypt) as (texto: string, sal: Buffer, longitud: number) => Promise<Buffer>;
const LONGITUD_DEL_HASH = 64;

// El hash se guarda como "sal:hash", ambos en hexadecimal; cada contraseña lleva su propia sal aleatoria.

// Version sincrona, solo para sembrar los datos de prueba del repositorio en memoria.
export function generarHashSincrono(texto: string): string {
  const sal = randomBytes(16);
  return `${sal.toString('hex')}:${scryptSync(texto, sal, LONGITUD_DEL_HASH).toString('hex')}`;
}

export class HashConScrypt implements GeneradorDeHash {
  async generar(texto: string): Promise<string> {
    const sal = randomBytes(16);
    const hash = await scryptAsync(texto, sal, LONGITUD_DEL_HASH);
    return `${sal.toString('hex')}:${hash.toString('hex')}`;
  }

  async coincide(texto: string, hashGuardado: string): Promise<boolean> {
    const [salHex, hashHex] = hashGuardado.split(':');
    if (!salHex || !hashHex) return false;

    const esperado = Buffer.from(hashHex, 'hex');
    const calculado = await scryptAsync(texto, Buffer.from(salHex, 'hex'), esperado.length);
    return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
  }
}
