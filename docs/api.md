# Contrato REST y roles

Todas las rutas de servicio usan /api. Las operaciones protegidas reciben Authorization: Bearer TOKEN. El servidor valida firma HS256, expiración, emisor y audiencia; rechaza un token alterado. La identidad se obtiene del token.

| Rol | Facultades |
|---|---|
| Alumno | Inscribir/dar de baja grupos propios; consultar materias, horario, historial y pagos propios |
| Maestro | Consultar sus grupos y alumnos; capturar calificaciones de sus propios grupos |
| Administrador | Registrar alumnos/maestros, materias y grupos; agregar materias a planes; abrir/cerrar carga; registrar cargos/pagos y publicar avisos |
| Cualquier cuenta autenticada | Consultar catálogos y avisos |

No existe registro público ni una entrada para elegir el rol. El administrador inicial se crea por seed.

## Endpoints

La columna Entrada identifica el DTO documentado y probado en Swagger. Los ids y consultas también se validan.

| Método | Ruta después de /api | Acceso | Entrada / resultado |
|---|---|---|---|
| GET | /salud | Público | Verifica API y MySQL |
| POST | /auth/sesiones | Público | LoginDto → accessToken, tokenType, expiresIn |
| GET | /auth/sesion | Autenticado | Identidad y rol |
| POST | /alumnos | Admin | AlumnoDto → alumno y cuenta creados, 201 |
| GET | /alumnos | Admin | Lista de alumnos, sin secretos |
| GET | /alumnos/me/materias | Alumno | Materias inscritas en la carga actual |
| GET | /alumnos/me/horario | Alumno | Bloques ordenados por día y hora |
| GET | /alumnos/me/historial | Alumno | Períodos, materias, calificación y aprobación; excluye bajas |
| GET | /alumnos/me/pagos | Alumno | Estado de cuenta propio |
| POST | /maestros | Admin | MaestroDto → maestro y cuenta, 201 |
| GET | /maestros | Admin | Lista de maestros |
| GET | /maestros/me/grupos | Maestro | Grupos asignados y ocupación |
| GET | /carreras | Autenticado | Catálogo |
| GET | /planes | Autenticado | Planes y sus materiaIds |
| PUT | /planes/:id/materias/:materiaId | Admin | Agregar asociación; repetir no duplica |
| GET | /materias | Autenticado | Materias y prerrequisitoIds |
| POST | /materias | Admin | MateriaDto → materia, 201 |
| GET | /periodos | Autenticado | Períodos y fechas de carga |
| PATCH | /periodos/:id/carga | Admin | CargaDto, habilitado booleano |
| GET | /grupos | Autenticado | periodoId opcional en query |
| POST | /grupos | Admin | GrupoDto → grupo con horario, 201 |
| GET | /grupos/:id/ocupacion | Admin | ocupados y disponibles |
| GET | /grupos/:id/alumnos | Maestro dueño | Lista y calificaciones |
| PUT | /grupos/:id/calificaciones | Maestro dueño | CalificacionesDto → lote capturado |
| POST | /inscripciones | Alumno | InscripcionDto, solo grupoId → inscripción, 201 |
| DELETE | /inscripciones/:id | Alumno dueño | Baja lógica; repetir devuelve conflicto |
| POST | /pagos | Admin | CargoDto → cargo pendiente, 201 |
| PATCH | /pagos/:id/liquidacion | Admin | Registrar pago del cargo |
| GET | /avisos | Autenticado | periodoId requerido en query |
| POST | /avisos | Admin | AvisoDto → aviso, 201 |

El catálogo enumera lo que puede consultar el usuario; las reglas de inscripción se verifican al solicitarla. No se agregan casos de uso de edición/borrado general que todavía no existen en el dominio.

## Formato

Éxito:

```json
{
  "ok": true,
  "data": { "id": 6, "alumnoId": 1, "grupoId": 5, "estadoActual": "activa" },
  "meta": { "timestamp": "2026-10-14T20:00:00.000Z" }
}
```

Conflicto:

```json
{
  "ok": false,
  "error": {
    "codigo": "CupoAgotadoError",
    "mensaje": "El grupo ya no tiene lugares disponibles."
  },
  "meta": { "timestamp": "2026-10-14T20:00:00.000Z" }
}
```

Una validación fallida agrega error.detalles como arreglo de mensajes. Los fallos inesperados devuelven un mensaje genérico, sin información del driver o secretos. Las fechas se serializan en ISO 8601; monto se devuelve como número con hasta dos decimales.

| Estado | Significado |
|---|---|
| 200 | Consulta, sesión iniciada o actualización |
| 201 | Recurso creado |
| 400 | Tipo, formato, id o atributo de entrada inválido |
| 401 | Sin token, token alterado/vencido o credenciales inválidas |
| 403 | Rol insuficiente, grupo ajeno o origen no permitido |
| 404 | Recurso inexistente; una inscripción ajena no revela su existencia |
| 409 | Conflicto con reglas de negocio o unicidad |
| 500 | Fallo inesperado, sin detalles internos |

## Reglas del dominio

| Reglas | Casos y errores relevantes |
|---|---|
| RN-01, RN-07 | PeriodoDeCargaCerradoError, GrupoFueraDePeriodoError, YaExistePeriodoAbiertoError |
| RN-02–05 | CupoAgotadoError, EmpalmeDeHorarioError, MateriaYaInscritaError, LimiteDeCreditosExcedidoError |
| RN-06, RN-09 | MateriaInvalidaError, ClaveDeMateriaDuplicadaError, RangoHorarioInvalidoError |
| RN-08 | OperacionNoAutorizadaError → 403 |
| RN-10 | InscripcionYaDadaDeBajaError, InscripcionYaCalificadaError; inexistencia → 404 |
| RN-11 | Historial con calificación y sin bajas |
| RN-12, RN-13 | MatriculaDuplicadaError, NumeroEmpleadoDuplicadoError y validación de personas |
| RN-14–16 | SeriacionNoCumplidaError, MateriaYaAprobadaError, MateriaFueraDelPlanError |
| RN-17, RN-18 | PagoDeInscripcionPendienteError, AdeudoVencidoError |
| RN-19 | CredencialesInvalidasError → 401, mismo mensaje para correo desconocido y contraseña incorrecta |
| RN-20 | CorreoDuplicadoError, ContrasenaDebilError |
| RN-21 | GrupoAjenoError → 403 |
| RN-22, RN-23 | CalificacionInvalidaError, CargaAunAbiertaError |
| RN-24, RN-25 | GrupoInvalidoError, GrupoDuplicadoError, EmpalmeDeMaestroError |
| RN-26 | PagoInvalidoError, PagoYaRegistradoError |

Los errores de negocio son 409 salvo acceso o inexistencia. Antes del dominio se rechazan con 400 los datos mal formados, por ejemplo un id textual, correo inválido, día inexistente o campo extra. Un número bien formado pero prohibido por la regla —cero créditos, calificación 101— llega al dominio y responde 409.

## Documentación y CORS

/docs es la interfaz Swagger; /docs-json es OpenAPI. Las entradas se documentan desde los mismos DTO que validan la petición. Los tres roles pueden probarse con Authorize, cambiando el token.

La documentación HTML, OpenAPI y las respuestas OPTIONS estándar son recursos de herramientas/protocolo y no usan el sobre JSON de los endpoints del servicio.

CORS_ORIGINS contiene orígenes exactos separados por coma. Cambia esos valores cuando se conozcan las direcciones de los clientes de los siguientes avances. No se admiten comodines. Las peticiones sin Origin, como una herramienta CLI, siguen necesitando JWT en rutas protegidas; CORS no sustituye la autenticación.
