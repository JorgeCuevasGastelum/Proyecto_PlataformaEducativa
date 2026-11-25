// La sesión del administrador. Igual que en gimnasio-admin: guarda el token y
// quién entró, con signals para que la barra y el guardia se enteren solos.

import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../config';
import type { Sobre } from '../modelos/tipos';

const LLAVE = 'plataforma-admin.sesion';

interface Usuario {
  correo: string;
  rol: string;
}

interface DatosSesion {
  token: string;
  usuario: Usuario;
}

interface RespuestaLogin {
  access_token: string;
}

interface Yo {
  usuarioId: number;
  rol: string;
  personaId: number;
}

@Service()
export class Sesion {
  private readonly http = inject(HttpClient);

  private readonly datos = signal<DatosSesion | null>(leerGuardada());

  readonly token = computed(() => this.datos()?.token ?? null);
  readonly usuario = computed(() => this.datos()?.usuario ?? null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'administrador');

  async entrar(correo: string, contrasena: string): Promise<void> {
    const login = await firstValueFrom(
      this.http.post<Sobre<RespuestaLogin>>(`${API_URL}/auth/login`, {
        correoInstitucional: correo,
        contrasena,
      }),
    );
    const token = login.data.access_token;

    // El login no dice el rol; se le pregunta a /auth/yo con el token que acaba de llegar.
    const yo = await firstValueFrom(
      this.http.get<Sobre<Yo>>(`${API_URL}/auth/yo`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    if (yo.data.rol !== 'administrador') {
      throw new Error('Esta cuenta no es de administrador.');
    }

    const datos = { token, usuario: { correo, rol: yo.data.rol } };
    localStorage.setItem(LLAVE, JSON.stringify(datos));
    this.datos.set(datos);
  }

  salir(): void {
    localStorage.removeItem(LLAVE);
    this.datos.set(null);
  }
}

function leerGuardada(): DatosSesion | null {
  try {
    const crudo = localStorage.getItem(LLAVE);
    return crudo ? (JSON.parse(crudo) as DatosSesion) : null;
  } catch {
    return null;
  }
}
