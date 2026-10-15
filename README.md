# Plataforma Educativa — Avance 2

API REST del portal de carga académica: dominio del avance 1, MySQL, JWT, roles de alumno/maestro/administrador, validación y Swagger. No incluye pantallas ni pasarela de pagos.

Rama de trabajo: **2do-Avance**, por acuerdo del equipo. Git no admite espacios; la consigna original propone feat-servicio.

## Requisitos

- Node.js **22 o posterior**, npm.
- **MySQL Server 8.0.16 o posterior**, recomendado 8.4, instalado y activo. MySQL Workbench es el cliente, no sustituye al servidor.
- Usuario MySQL con permisos para crear/modificar tablas y leer/escribir en la base elegida.

Versiones fijadas en package-lock.json: TypeScript 5.9 para los metadatos de decoradores de NestJS, Prisma 6.19 con cliente JavaScript y adaptador oficial para MySQL.

## Levantar desde cero en cada laptop

1. Comprueba node --version y npm --version.
2. En MySQL Workbench, conecta a tu servidor y ejecuta:

   ```sql
   CREATE DATABASE IF NOT EXISTS plataforma_educativa
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Copia .env.example a .env. Linux/macOS: cp .env.example .env. PowerShell: Copy-Item .env.example .env.
4. Edita .env con **tus propias credenciales**:

   ```dotenv
   DATABASE_URL="mysql://TU_USUARIO:TU_PASSWORD@127.0.0.1:3306/plataforma_educativa"
   PORT=3000
   CORS_ORIGINS="http://localhost:5173,http://localhost:5174"
   JWT_TTL_SECONDS=3600
   SEED_ADMIN_EMAIL="diana@admin.edu.mx"
   ```

   Codifica los caracteres reservados de tu contraseña en la URL: @ como %40, # como %23, / como %2F, : como %3A y % como %25.
   Genera un secreto con el siguiente comando y colócalo en JWT_SECRET:

   ```sh
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Elige SEED_PASSWORD entre 8 y 128 caracteres para las cuentas de demostración. No publiques .env.
5. Instala, prepara la base y compila:

   ```sh
   npm ci
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run typecheck
   npm run build
   npm start
   ```

En tu laptop, abre la documentación en el servidor, puerto 3000, ruta **/docs**. La API usa **/api**. **GET /api/salud** consulta MySQL; **/docs-json** entrega OpenAPI.

Para desarrollar con recompilación y reinicio automáticos usa **npm run dev**.

## Probar desde Swagger

POST /api/auth/sesiones recibe correoInstitucional y contrasena. Usa la contraseña que elegiste en SEED_PASSWORD. Copia accessToken al botón **Authorize** como token Bearer. El alumno se identifica a partir del token, nunca por un alumnoId enviado por el cliente.

| Cuenta inicial | Rol | Situación |
|---|---|---|
| Valor de SEED_ADMIN_EMAIL | Administrador | Registro, catálogo, grupos, carga, pagos y avisos |
| ana@maestros.edu.mx | Maestro | Puede calificar el grupo 1 del período cerrado |
| luis@maestros.edu.mx | Maestro | Sus propios grupos y listas |
| karla@alumnos.edu.mx | Alumno | Puede inscribir grupo 5; falta calificación para grupo 3 |
| juan@alumnos.edu.mx | Alumno | Aprobó Programación I; ocupa el único lugar del grupo 6 |
| sofia@alumnos.edu.mx | Alumno | Aprobó Programación I; demuestra cupo agotado |
| pedro@alumnos.edu.mx | Alumno | Plan IIS; Inglés I es compartida con ISW |
| mario@alumnos.edu.mx | Alumno | Inscripción del período pendiente de pago |

Las fechas del seed se calculan en su primera ejecución: un período cerrado y otro abierto durante 30 días. Repetirlo conserva datos y contraseñas. Después de esa ventana prepara otra base de demostración o ajusta las fechas en tu base de desarrollo.

## Pruebas

Sin MySQL, ejecuta **npm test** y **npm run demo**. demo conserva los 23 escenarios originales: revisa su salida porque puede terminar con código cero aun ante un resultado inesperado.

Las pruebas de API usan MySQL real y **borran los datos de una base exclusiva de pruebas**. Créala en Workbench:

```sql
CREATE DATABASE IF NOT EXISTS plataforma_educativa_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Agrega TEST_DATABASE_URL a .env con tus credenciales y ese nombre. Ejecuta **npm run test:api**. El ejecutor exige un nombre terminado en _test y aplica las migraciones. No uses una base con datos que quieras conservar.

## Organización

```text
src/
  dominio/        Entidades, contrato, reglas y servicios independientes del framework
  aplicacion/     Composición y transacciones
  infra/          Repositorios, cliente Prisma y hash scrypt
  controladores/  REST por recursos
  modelos/        DTO de entrada, salida y OpenAPI
  seguridad/      JWT, roles e identidad
  http/           Ids, errores y respuestas
  config/         Configuración local
prisma/           Esquema, migraciones SQL y seed
scripts/          Migraciones y ejecución aislada de pruebas
tests/            Pruebas de dominio y API
```

Las migraciones son SQL versionado aplicado con db:migrate: nombre, checksum, estado y fecha en _migraciones. **No se usa Prisma Migrate ni db push**; Prisma modela y consulta los datos. Para agregar cambios, crea una carpeta nueva en prisma/migrations con su migration.sql incremental y actualiza schema.prisma. No edites migraciones ya aplicadas.

.env está ignorado por Git. .env.example contiene relleno. La API no devuelve hashes ni contraseñas; el registro HTTP no imprime cuerpos ni tokens. La contraseña ficticia del antiguo demo en memoria no se usa para sembrar el servicio real.

Para ECONNREFUSED verifica MySQL Server y host/puerto; para ER_ACCESS_DENIED_ERROR revisa usuario/contraseña; para ER_BAD_DB_ERROR crea la base. Si faltan migraciones, ejecuta db:migrate.

La documentación académica y los diagramas se entregan por separado en Google Docs, conforme a la indicación del profesor. Este README conserva las instrucciones para instalar y ejecutar el servicio. Swagger continúa disponible en la ruta /docs de la API; esa ruta no requiere una carpeta docs en el repositorio.
