# Plataforma Educativa — El Servicio Central y la Seguridad

Proyecto 4 — Portal universitario de carga académica. El dominio del avance 1 (entidades, reglas de negocio, servicios y errores) ahora se expone como un servicio REST hecho con NestJS, guarda la información en MySQL con Prisma y protege cada operación con inicio de sesión (JWT) y roles.

## Requisitos

- Node.js 20 o más reciente, y npm
- MySQL Server 8 instalado y corriendo (MySQL Workbench solo es el cliente, no sustituye al servidor)
- Un usuario de MySQL que pueda crear bases de datos (por ejemplo `root`)

## Levantar el servicio desde cero

1. Instalar las dependencias:

   ```
   npm install
   ```

2. Copiar `.env.ejemplo` a `.env` y poner tus datos:

   ```
   cp .env.ejemplo .env
   ```

   En PowerShell: `Copy-Item .env.ejemplo .env`

   - `DATABASE_URL`: tu usuario, contraseña y puerto de MySQL. La base `plataforma_educativa` no hace falta crearla, la crea el paso 3.
   - `JWT_SECRET`: cualquier texto de al menos 32 caracteres. Para generar uno:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `ORIGENES_PERMITIDOS`: de dónde se va a llamar el servicio desde el navegador (las aplicaciones de los avances 3 y 4).

   El archivo `.env` no se sube al repositorio.

3. Crear las tablas aplicando el historial de migraciones y generar el cliente de Prisma:

   ```
   npx prisma migrate dev
   npx prisma generate
   ```

4. Cargar los datos de prueba:

   ```
   npm run prisma:seed
   ```

   El seed borra todo y vuelve a cargar los datos, así que se puede correr las veces que haga falta.

5. Levantar el servicio:

   ```
   npm run start:dev
   ```

   El servicio queda en `http://localhost:3000` y la documentación en `http://localhost:3000/docs`.

## Probar desde la documentación (Swagger)

1. En `/docs`, abrir `POST /auth/login` y mandar:

   ```json
   { "correoInstitucional": "diana@admin.edu.mx", "contrasena": "Potros2026" }
   ```

2. Copiar el `access_token` de la respuesta, darle al botón **Authorize** de arriba y pegarlo.
3. Ya se puede probar cualquier punto de entrada con ese usuario. Para cambiar de usuario, se repite con otra cuenta.

Todas las cuentas de prueba usan la contraseña `Potros2026`:

| Rol | Correo | Para qué sirve |
|---|---|---|
| Administrador | diana@admin.edu.mx | Todo lo de control escolar |
| Maestro | ana@maestros.edu.mx | Programación I 01 (2026-1, sin calificar), Programación II, Estructuras de Datos |
| Maestro | luis@maestros.edu.mx | Programación I 02 (2026-1), Bases de Datos, Redes, Inglés I, Estadística |
| Alumno | karla@alumnos.edu.mx | Puede inscribir Redes (grupo 5); Programación II la rechaza por seriación |
| Alumno | juan@alumnos.edu.mx | Aprobó Programación I y ocupa el único lugar de Estructuras de Datos (grupo 6) |
| Alumno | sofia@alumnos.edu.mx | Aprobó Programación I; Estructuras de Datos la rechaza por cupo |
| Alumno | pedro@alumnos.edu.mx | Ingeniería Industrial; Bases de Datos la rechaza por no estar en su plan |
| Alumno | mario@alumnos.edu.mx | No ha pagado la inscripción del 2026-2; cualquier inscripción se rechaza |

El período 2026-1 ya está cerrado y el 2026-2 tiene la carga abierta durante 30 días a partir de que se corre el seed.

## Roles y qué puede hacer cada uno

- **Administrador** (control escolar): registra alumnos, maestros y materias, arma los planes de estudio, crea períodos y abre o cierra la carga, abre grupos, consulta la ocupación y los alumnos inscritos de cada grupo, registra cargos y pagos, y publica avisos. Las cuentas de alumnos y maestros solo las crea el administrador.
- **Alumno**: consulta los grupos disponibles, se inscribe y se da de baja, y consulta sus materias inscritas, su horario, su historial y su estado de cuenta.
- **Maestro**: consulta sus grupos, la lista de alumnos de cada uno y captura sus calificaciones.
- **Cualquier usuario con sesión**: consulta carreras, planes, materias, períodos, grupos y avisos.

Sin sesión solo se puede usar `POST /auth/login`.

## Puntos de entrada

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| POST | /auth/login | público | Inicia sesión y regresa el token (dura 1 hora) |
| GET | /auth/yo | con sesión | Quién soy y con qué rol |
| POST | /alumnos | administrador | Registrar alumno y su cuenta |
| GET | /alumnos | administrador | Listar alumnos |
| GET | /alumnos/yo/materias | alumno | Mis materias inscritas en el período actual |
| GET | /alumnos/yo/horario | alumno | Mi horario ordenado por día y hora |
| GET | /alumnos/yo/historial | alumno | Mi historial con calificaciones, por período |
| GET | /alumnos/yo/pagos | alumno | Mi estado de cuenta |
| POST | /maestros | administrador | Registrar maestro y su cuenta |
| GET | /maestros | administrador | Listar maestros |
| GET | /maestros/yo/grupos | maestro | Mis grupos y cuántos inscritos tienen |
| GET | /carreras | con sesión | Listar carreras |
| GET | /planes | con sesión | Listar planes de estudio con sus materias |
| PUT | /planes/:id/materias/:materiaId | administrador | Agregar una materia a un plan |
| GET | /materias | con sesión | Listar materias con sus prerrequisitos |
| POST | /materias | administrador | Registrar materia |
| GET | /periodos | con sesión | Listar períodos |
| POST | /periodos | administrador | Crear período |
| PATCH | /periodos/:id | administrador | Abrir o cerrar la carga (`{ "cargaAbierta": true }`) |
| GET | /grupos | con sesión | Grupos del período abierto con lugares disponibles (`?periodoId=` para otro) |
| POST | /grupos | administrador | Abrir grupo con maestro, cupo y horario |
| GET | /grupos/:id/ocupacion | administrador | Lugares ocupados y disponibles |
| GET | /grupos/:id/alumnos | administrador, maestro | Alumnos inscritos (el maestro solo de sus grupos) |
| PUT | /grupos/:id/calificaciones | maestro | Capturar calificaciones de mi grupo |
| POST | /inscripciones | alumno | Inscribirme a un grupo (`{ "grupoId": 5 }`) |
| DELETE | /inscripciones/:id | alumno | Darme de baja (la inscripción queda en estado baja) |
| POST | /pagos | administrador | Registrar un cargo |
| PATCH | /pagos/:id | administrador | Marcar un cargo como pagado (`{ "estado": "pagado" }`) |
| GET | /avisos?periodoId= | con sesión | Avisos de un período |
| POST | /avisos | administrador | Publicar aviso |

### Respuestas

Todas las respuestas tienen la misma forma. Si salió bien:

```json
{ "data": { ... }, "meta": { "ruta": "/inscripciones", "duracionMs": 10, "timestamp": "..." } }
```

Si no:

```json
{ "error": { "statusCode": 409, "tipo": "CupoAgotadoError", "mensaje": "..." }, "meta": { "ruta": "/inscripciones", "timestamp": "..." } }
```

| Código | Cuándo |
|---|---|
| 200 / 201 | Salió bien / se creó algo |
| 400 | La petición viene mal formada (faltan campos, tipos equivocados, campos que no existen) |
| 401 | No hay token, el token venció o fue alterado, o el correo y contraseña no coinciden |
| 403 | El token es válido pero el rol no tiene permiso, o un maestro intenta usar un grupo ajeno |
| 404 | No existe lo que se pidió |
| 409 | Una regla de negocio impidió la operación (cupo, empalme, seriación, pagos, etc.) |

Cada petición queda registrada en la consola con su código y lo que tardó.

### Los tres resultados del control de acceso

Con `POST /periodos` (solo administrador) y el cuerpo `{ "clave": "2027-1", "fechaAperturaCarga": "2027-01-05", "fechaCierreCarga": "2027-01-20", "creditosMaximos": 20 }`:

- Sin token → **401**
- Con el token de karla (alumna) → **403**
- Con el token de diana (administradora) → **201**

## Cambiar entre MySQL y memoria

La implementación del repositorio se elige en un solo lugar, `src/academico/academico.module.ts`:

```ts
{ provide: REPOSITORIO_ACADEMICO, useClass: RepositorioPrisma },
```

Si se cambia `RepositorioPrisma` por `RepositorioEnMemoria`, el servicio funciona igual sin MySQL. Los servicios del dominio y los controllers no cambian, porque solo conocen la interfaz `RepositorioAcademico`.

## Programa de escenarios del avance 1

El programa del avance 1 sigue funcionando sin base de datos:

```
npm run escenarios
```

Recorre 23 escenarios (acceso, carga académica, plan de estudios, pagos, horario, bajas e historial) usando el repositorio en memoria.

## Modelo de datos

- **Usuario**: la cuenta para iniciar sesión (correo, hash de la contraseña y **rol**: alumno, maestro o administrador). Apunta a la persona que representa.
- **Alumno, Maestro, Administrador**: los datos de cada persona. El alumno pertenece a un **plan de estudios**.
- **Carrera** y **PlanDeEstudios**: el plan lista sus materias. Una materia puede estar en varios planes (Inglés I es común a ISW e IIS).
- **Materia**: solo el catálogo (clave, nombre, créditos) y sus **prerrequisitos**.
- **Grupo**: lo que se abre de una materia en un período, con su maestro, su cupo y sus bloques de horario.
- **PeriodoEscolar**: fechas de carga, tope de créditos y si la carga está habilitada.
- **Inscripcion**: la inscripción del alumno **a un grupo**. Guarda la calificación que captura el maestro (`null` mientras la materia está en curso).
- **Pago**: los cargos del alumno por período (inscripción o colegiatura) y su estado (pendiente o pagado).
- **Aviso**: avisos publicados por período.

El esquema está en `prisma/schema.prisma` y el historial de cambios de la base en `prisma/migrations/`:

| Migración | Qué agrega |
|---|---|
| catalogo | carreras, planes de estudio, materias, materias por plan, prerrequisitos y períodos |
| personas_y_grupos | alumnos, maestros, administradores, grupos y bloques de horario |
| inscripciones_pagos_y_avisos | inscripciones, pagos y avisos |
| usuarios | cuentas de usuario con su rol |

## Reglas de negocio

Las reglas RN-01 a RN-13 son las del documento del avance 1; las marcadas como *(ajustada)* cambiaron con el nuevo modelo, y de la RN-14 en adelante son nuevas. En el código, cada validación lleva un comentario con su número de regla. Todas las que impiden algo responden **409**.

| Regla | Descripción | Errores |
|---|---|---|
| RN-01 *(ajustada)* | Un alumno no puede inscribirse si no hay un período con la carga abierta, si ya pasó la fecha límite, o si el grupo no es de ese período. | `PeriodoDeCargaCerradoError`, `GrupoFueraDePeriodoError` |
| RN-02 *(ajustada)* | Un alumno no puede inscribirse a un **grupo** que ya no tiene lugares disponibles. | `CupoAgotadoError` |
| RN-03 *(ajustada)* | Un alumno no puede inscribirse a un grupo cuyo horario se cruce con otro grupo que ya lleva ese período. | `EmpalmeDeHorarioError` |
| RN-04 | Un alumno no puede inscribir la misma materia dos veces en el mismo período, aunque sea en otro grupo. | `MateriaYaInscritaError` |
| RN-05 | Un alumno no puede pasarse del tope de créditos del período. | `LimiteDeCreditosExcedidoError` |
| RN-06 *(ajustada)* | No se puede registrar una materia sin clave, sin nombre, con créditos de cero o menos, con una clave ya usada, o con prerrequisitos que no existen. El maestro, el cupo y el horario pasaron al grupo (RN-24). | `MateriaInvalidaError`, `ClaveDeMateriaDuplicadaError`, `MateriaNoEncontradaError` |
| RN-07 | No puede haber dos períodos con la carga abierta al mismo tiempo. | `YaExistePeriodoAbiertoError` |
| RN-08 *(ajustada)* | Cada operación solo la puede hacer el rol que le corresponde (alumno, maestro o administrador), con una sesión iniciada. | `OperacionNoAutorizadaError` |
| RN-09 | Un bloque de horario solo es válido si su hora de fin es después de su hora de inicio. | `RangoHorarioInvalidoError` |
| RN-10 *(ajustada)* | Una inscripción nace activa y se puede dar de baja, lo que libera su lugar. Solo se da de baja una inscripción propia, activa, sin calificación y con la carga abierta. | `InscripcionNoEncontradaError`, `InscripcionYaDadaDeBajaError`, `InscripcionYaCalificadaError`, `PeriodoDeCargaCerradoError` |
| RN-11 *(ajustada)* | El historial guarda las materias cursadas por período con su calificación y si se aprobó; cerrar un período no las borra y las bajas no aparecen. | — |
| RN-12 *(ajustada)* | No se puede registrar un alumno sin matrícula, nombre o correo, con una matrícula ya usada, o con un plan de estudios que no existe. | `AlumnoInvalidoError`, `MatriculaDuplicadaError`, `PlanDeEstudiosNoEncontradoError` |
| RN-13 | No se puede registrar un maestro sin número de empleado, nombre o correo, ni con un número de empleado ya usado. | `MaestroInvalidoError`, `NumeroEmpleadoDuplicadoError` |
| RN-14 | **Seriación**: un alumno no puede inscribir una materia sin haber aprobado (calificación ≥ 70) todos sus prerrequisitos. | `SeriacionNoCumplidaError` |
| RN-15 | Un alumno no puede volver a inscribir una materia que ya aprobó. | `MateriaYaAprobadaError` |
| RN-16 | Un alumno solo puede inscribir materias de su plan de estudios. Una materia puede estar en varios planes. | `MateriaFueraDelPlanError` |
| RN-17 | Un alumno no puede inscribirse si no ha pagado la inscripción del período. | `PagoDeInscripcionPendienteError` |
| RN-18 | Un alumno no puede inscribirse si tiene algún cargo vencido sin pagar. | `AdeudoVencidoError` |
| RN-19 | Solo inicia sesión quien da un correo y una contraseña válidos; el mensaje de error es el mismo exista o no el correo. | `CredencialesInvalidasError` |
| RN-20 | Al registrar alumnos o maestros, la contraseña debe tener al menos 8 caracteres y el correo no puede estar usado por otra cuenta. Las contraseñas se guardan como hash. | `ContrasenaDebilError`, `CorreoDuplicadoError` |
| RN-21 | Un maestro solo puede ver y calificar sus propios grupos. | `GrupoAjenoError` |
| RN-22 | Las calificaciones son enteros de 0 a 100, y no se puede calificar una inscripción dada de baja. Se valida toda la captura antes de guardar. | `CalificacionInvalidaError`, `InscripcionYaDadaDeBajaError` |
| RN-23 | No se capturan calificaciones mientras la carga del período sigue abierta. | `CargaAunAbiertaError` |
| RN-24 | No se puede abrir un grupo sin materia, período o maestro existentes, sin clave, con cupo de cero o menos, sin bloques de horario, o con una clave ya usada para esa materia y período. | `GrupoInvalidoError`, `GrupoDuplicadoError`, `MateriaNoEncontradaError`, `PeriodoNoEncontradoError`, `MaestroNoEncontradoError` |
| RN-25 | Un maestro no puede tener dos grupos a la misma hora en un período. | `EmpalmeDeMaestroError` |
| RN-26 | Un cargo debe tener monto mayor a cero, y un pago no se puede registrar dos veces. | `PagoInvalidoError`, `PagoYaRegistradoError`, `PagoNoEncontradoError` |
| RN-27 | No se puede crear un período sin clave, con tope de créditos de cero o menos, con la fecha de cierre antes de la de apertura, o con una clave ya usada. El período nace con la carga cerrada. | `PeriodoInvalidoError`, `ClaveDePeriodoDuplicadaError` |

## Cambios respecto al avance 1 (retroalimentación)

| Comentario | Qué se hizo |
|---|---|
| Seriación de materias | `Materia.prerrequisitoIds`; la inscripción guarda la `calificacion` y el historial dice si se aprobó. Nuevas reglas RN-14 y RN-15. |
| Plan de estudios y materias compartidas | Nuevas entidades `Carrera` y `PlanDeEstudios`. El alumno tiene su plan, y una materia puede estar en varios planes. Nueva regla RN-16. |
| Captura de calificaciones | Nuevo `ServicioMaestro` con `consultarMisGrupos`, `consultarListaDeGrupo` y `capturarCalificaciones` (RN-21 a RN-23). |
| Pagos del período | Nueva entidad `Pago`. No hay carga sin la inscripción pagada (RN-17) ni con adeudos vencidos (RN-18). El administrador registra cargos y pagos (RN-26). |
| Grupos por período | `Materia` quedó como catálogo; nueva entidad `Grupo` (período, maestro, cupo, horario). La inscripción, el cupo y el empalme son por grupo (RN-02, RN-03 ajustadas; RN-24 y RN-25 nuevas). |
| Acceso | Nueva entidad `Usuario` con correo, hash de contraseña y rol; `ServicioAutenticacion.iniciarSesion` regresa una `Sesion`, y cada servicio revisa el rol (RN-08 ajustada, RN-19 y RN-20 nuevas). |
| Baja inexistente decía "alumno no encontrado" | Ahora es `InscripcionNoEncontradaError`, también para inscripciones de otro alumno. |
| Se podía dar de baja dos veces | `InscripcionYaDadaDeBajaError`. |
| El horario no se ordenaba por día | `DiaSemana` es un tipo cerrado y el horario se ordena por día y después por hora (`compararPorDiaYHora`). |
| El historial incluía las bajas | El historial solo muestra inscripciones activas, con su calificación y si se aprobó. |

En este avance también se completaron casos de uso que faltaban: crear períodos escolares (RN-27), que el administrador vea los alumnos inscritos en cada grupo, y que el alumno vea los grupos disponibles con sus lugares antes de inscribirse (`ServicioCatalogo`).

## Estructura del proyecto

```
prisma/
  schema.prisma                 # modelo de datos
  migrations/                   # historial de cambios de la base
  seed.ts                       # datos de prueba
src/
  dominio/                      # el dominio del avance 1: entidades, reglas, servicios y errores
  infra/
    repositorio-en-memoria.ts   # implementación en memoria (avance 1)
    repositorio-prisma.ts       # implementación con MySQL, mismo contrato
    hash-scrypt.ts              # hash de contraseñas
  prisma/                       # PrismaService
  academico/                    # aquí se elige la implementación del repositorio
  auth/                         # inicio de sesión, JWT, guards y decoradores
  alumnos/ maestros/ materias/ planes/ periodos/
  grupos/ inscripciones/ pagos/ avisos/   # un controller y sus DTO por recurso
  comun/                        # filtros de errores, formato de respuesta y registro de peticiones
  main.ts                       # arranque del servicio
  escenarios.ts                 # programa de escenarios del avance 1
```
