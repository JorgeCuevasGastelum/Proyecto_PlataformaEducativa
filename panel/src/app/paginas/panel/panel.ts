// El marco de todas las páginas, como en gimnasio-admin. Aquí el menú va a la
// izquierda porque son 9 secciones y en una barra arriba no caben en un renglón.

import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Sesion } from '../../sesion/sesion';

@Component({
  selector: 'app-panel',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="marco">
      <aside class="menu">
        <a class="menu__marca" routerLink="/tablero">
          <img src="/logo.svg" alt="" />
          <span>Plataforma Educativa <span class="barra__etiqueta">Admin</span></span>
        </a>

        <nav class="menu__enlaces" aria-label="Secciones del panel">
          <a class="menu__enlace" routerLink="/tablero" routerLinkActive="menu__enlace--activo">Tablero</a>

          <span class="menu__grupo">Catálogo</span>
          <a class="menu__enlace" routerLink="/materias" routerLinkActive="menu__enlace--activo">Materias</a>
          <a class="menu__enlace" routerLink="/planes" routerLinkActive="menu__enlace--activo">Carreras y planes</a>

          <span class="menu__grupo">Personas</span>
          <a class="menu__enlace" routerLink="/alumnos" routerLinkActive="menu__enlace--activo">Alumnos</a>
          <a class="menu__enlace" routerLink="/maestros" routerLinkActive="menu__enlace--activo">Maestros</a>
          <a class="menu__enlace" routerLink="/pagos" routerLinkActive="menu__enlace--activo">Pagos</a>

          <span class="menu__grupo">Operación</span>
          <a class="menu__enlace" routerLink="/periodos" routerLinkActive="menu__enlace--activo">Períodos</a>
          <a class="menu__enlace" routerLink="/grupos" routerLinkActive="menu__enlace--activo">Grupos</a>
          <a class="menu__enlace" routerLink="/avisos" routerLinkActive="menu__enlace--activo">Avisos</a>
        </nav>

        <div class="menu__sesion">
          <span class="menu__quien">{{ sesion.usuario()?.correo }}</span>
          <button class="boton boton--chico boton--secundario" (click)="salir()">Salir</button>
        </div>
      </aside>

      <main class="pagina">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Panel {
  protected readonly sesion = inject(Sesion);
  private readonly router = inject(Router);

  // Hay que navegar al salir: el guardia solo se revisa al entrar a una ruta,
  // así que si solo se borra la sesión, la pantalla se queda donde está.
  protected salir(): void {
    this.sesion.salir();
    this.router.navigate(['/login']);
  }
}
