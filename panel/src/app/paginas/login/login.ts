import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Sesion } from '../../sesion/sesion';
import { mensajeDeApi } from '../../servicios/errores';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="login">
      <div class="tarjeta">
        <div class="login__marca">
          <img src="/logo.svg" alt="" />
          <div>
            <h1 style="margin: 0">Plataforma Educativa</h1>
            <span class="dato__clave">Panel administrativo</span>
          </div>
        </div>

        @if (vencio) {
          <div class="aviso aviso--atencion">Tu sesión venció. Vuelve a entrar.</div>
        }
        @if (problema(); as p) {
          <div class="aviso aviso--error">{{ p }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          <div class="campo">
            <label for="correo">Correo institucional</label>
            <input id="correo" type="email" formControlName="correo" autocomplete="username" />
            @if (f.correo.touched && f.correo.hasError('required')) {
              <span class="error">Escribe tu correo.</span>
            }
            @if (f.correo.touched && f.correo.hasError('email')) {
              <span class="error">El correo debe llevar &#64;, por ejemplo nombre&#64;admin.edu.mx.</span>
            }
          </div>
          <div class="campo">
            <label for="password">Contraseña</label>
            <input id="password" type="password" formControlName="password"
                   autocomplete="current-password" />
            @if (f.password.touched && f.password.hasError('required')) {
              <span class="error">Escribe tu contraseña.</span>
            }
          </div>
          <button class="boton" type="submit" [disabled]="enviando()">
            {{ enviando() ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>

        <p class="dato__clave" style="margin-top: 1rem; font-size: 0.86rem">
          Cuenta de prueba: <code>diana&#64;admin.edu.mx</code> / <code>Potros2026</code>
        </p>
      </div>
    </div>
  `,
})
export class Login {
  private readonly sesion = inject(Sesion);
  private readonly router = inject(Router);

  protected readonly vencio =
    inject(ActivatedRoute).snapshot.queryParamMap.get('motivo') === 'vencio';

  protected readonly enviando = signal(false);
  protected readonly problema = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected get f() {
    return this.form.controls;
  }

  protected async enviar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.problema.set(null);
    try {
      const { correo, password } = this.form.getRawValue();
      await this.sesion.entrar(correo, password);
      this.router.navigate(['/tablero']);
    } catch (error) {
      this.problema.set(
        error instanceof HttpErrorResponse ? mensajeDeApi(error) : (error as Error).message,
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
