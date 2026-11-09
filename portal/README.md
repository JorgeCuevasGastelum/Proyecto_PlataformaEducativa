# Plataforma Educativa — El Portal del Cliente

Proyecto 4 — Portal universitario de carga académica. Este avance es el portal para alumnos y maestros: una aplicación aparte, hecha con React, React Router, Axios y Zustand sobre Vite y TypeScript, que consume por la red el servicio del avance 2. No incluye panel administrativo.

## Requisitos

- Node.js 20 o más reciente, y npm
- El servicio del avance 2 corriendo en `http://localhost:3000`, con MySQL y los datos de prueba cargados. Debe ser el de **esta misma rama** (`feat-storefront`): aquí el servicio ya trae los endpoints que usa el portal (`GET /alumnos/yo/plan` y `PATCH /alumnos/yo/pagos/:id`) y los datos de prueba nuevos.

## Levantar el servicio

Desde la raíz del repositorio (una carpeta arriba de `portal/`), con el `.env` del servicio ya configurado (ver el `README.md` de la raíz):

```
npm install
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

El seed borra y vuelve a cargar todos los datos de prueba.

## Levantar el portal desde cero

1. Instalar las dependencias:

   ```
   npm install
   ```

2. Copiar `.env.ejemplo` a `.env`:

   ```
   cp .env.ejemplo .env
   ```

   En CMD: `copy .env.ejemplo .env`. En PowerShell: `Copy-Item .env.ejemplo .env`

   - `VITE_API_URL`: dirección del servicio. Por defecto `http://localhost:3000`.

   El archivo `.env` no se sube al repositorio.

3. Levantar el portal:

   ```
   npm run dev
   ```

   El portal queda en `http://localhost:5173`.

Otros comandos: `npm run build` para compilar y `npm run lint` para revisar el código.

Si el servicio está en otra dirección, se cambia `VITE_API_URL` y se reinicia `npm run dev`. El origen del portal (`http://localhost:5173`) tiene que estar en `ORIGENES_PERMITIDOS` del `.env` del servicio.

## Probar el portal

Todas las cuentas de prueba usan la contraseña `Potros2026`:

| Rol | Correo | Para qué sirve |
|---|---|---|
| Alumno | lucia@alumnos.edu.mx | Carga hecha, historial de dos períodos y pagos pendientes |
| Alumno | mario@alumnos.edu.mx | No ha pagado la inscripción: no puede inscribir y su horario sale vacío |
| Alumno | diego@alumnos.edu.mx | Tiene una colegiatura vencida |
| Maestro | ana@maestros.edu.mx | Grupos para calificar |
| Administrador | diana@admin.edu.mx | El portal le avisa que no tiene pantallas |

## Pantallas y quién las ve

- **Alumno**: oferta de grupos y detalle de cada grupo, materias inscritas, horario, historial, avisos y pagos.
- **Maestro**: sus grupos y la captura de calificaciones de cada uno.
- **Sin sesión**: inicio y pantalla para entrar. Cualquier otra ruta protegida lleva a entrar y regresa a la pantalla pedida al iniciar sesión.

## Estructura del proyecto

Dentro de `src/`:

- `compartido`: cliente del servicio, tipos, formato y componentes comunes
- `sesion`: inicio de sesión y contexto de la sesión
- `oferta`, `materias`, `horario`, `historial`, `avisos`, `pagos`: una carpeta por pantalla del alumno
- `maestro`: pantallas del maestro

Todo lo que se comunica con el servicio pasa por `compartido/servicios/api.ts`.

### Tipos compartidos con el servicio

Los tipos de los datos que viajan por la red no se copian: `compartido/tipos.ts` los importa con `import type` desde `src/dominio/entidades.ts` del servicio (alias `@servicio`, definido en `tsconfig.app.json`). Solo se adaptan las fechas, que en JSON llegan como texto. Si el servicio cambia un campo, el portal deja de compilar hasta que se ajuste. Como son importaciones de tipo, el portal no incluye código del servicio y sigue siendo una aplicación independiente.