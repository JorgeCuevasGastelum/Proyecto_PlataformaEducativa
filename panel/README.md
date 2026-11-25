# Panel administrativo · Plataforma Educativa

Tercera aplicación del proyecto (avance 4). La usa el personal de control escolar para
administrar materias, planes, alumnos, maestros, pagos, períodos, grupos y avisos.
Está hecha en Angular, con la misma estructura que el panel de gimnasio-admin de clase,
y consume el mismo servicio del avance 2.

## Cómo levantarlo

1. Levantar el servicio del avance 2 (en la raíz del repo): `npm run start:dev`.
2. En el `.env` de la raíz, `ORIGENES_PERMITIDOS` tiene que incluir `http://localhost:4200`
   (ya viene así en `.env.ejemplo`). Si no, el navegador bloquea las peticiones por CORS.
3. En esta carpeta:

   ```bash
   npm install
   npm start
   ```

4. Abrir http://localhost:4200 y entrar con la cuenta de administrador
   `diana@admin.edu.mx` / `Potros2026` (viene en la semilla: `npm run prisma:seed`).

## Cómo apuntarlo a otro servicio

La dirección del servicio está en un solo lugar: `src/app/config.ts` (`API_URL`).
Solo se cambia ahí.

## Cómo está organizado

| Carpeta | Qué tiene |
|---|---|
| `src/app/sesion/` | La sesión, los interceptores (token en cada petición y 401 → login) y el guardia `soloAdmin`. |
| `src/app/servicios/` | Un archivo `*-api.ts` por recurso para crear, editar y borrar, y un `lista-*.ts` con el listado, la búsqueda y `recargar()`. |
| `src/app/modelos/tipos.ts` | Los tipos, importados de `src/dominio/entidades.ts` del servicio. |
| `src/app/paginas/` | Una carpeta por sección. Cada sección registra sus rutas en su propio `rutas.ts`. |

Solo entran las cuentas de administrador. Ocultar el menú no es la seguridad: lo que
protege de verdad es el `@Roles('administrador')` del servicio, que responde 403.
