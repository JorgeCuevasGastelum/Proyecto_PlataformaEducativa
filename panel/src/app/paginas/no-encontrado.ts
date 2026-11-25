import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink],
  template: `
    <div class="tarjeta vacio">
      <h1>No encontramos lo que buscas</h1>
      <p>La dirección no existe o el registro ya se borró.</p>
      <a class="boton" routerLink="/tablero">Ir al tablero</a>
    </div>
  `,
})
export class NoEncontrado {}
