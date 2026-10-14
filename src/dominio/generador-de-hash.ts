// El dominio no sabe como se calcula el hash de una contraseña; solo necesita generarlo y compararlo.
// La implementacion concreta vive en infra.
export interface GeneradorDeHash {
  generar(texto: string): Promise<string>;

  coincide(texto: string, hash: string): Promise<boolean>;
}
