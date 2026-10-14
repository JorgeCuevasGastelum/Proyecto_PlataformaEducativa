# Plataforma Educativa — El Dominio y la Arquitectura

Proyecto 4 — Portal universitario de carga académica. Por ahora el proyecto entrega solo la capa de dominio: las entidades, el repositorio (interfaz + implementación en memoria), los servicios con las reglas de negocio y los errores propios del dominio. No hay servidor, ni base de datos, ni pantallas todavía.

## Requisitos

- Node.js (versión 18 o más reciente)
- npm

## Instalación

Desde la raíz del proyecto:

```
npm install
```

## Cómo correr el programa de escenarios

```
npm run dev
```

Esto ejecuta `src/main.ts`, que recorre los escenarios en orden y muestra en la consola el resultado de cada uno:

| Bloque | Escenarios |
|---|---|
| Acceso | inicio de sesión, contraseña incorrecta, alumno que intenta una operación de administrador |
| Carga académica | carga exitosa, rechazo por seriación, captura de calificaciones (grupo ajeno, carga aún abierta, captura correcta), seriación cumplida, empalme de horario, cupo agotado |
| Plan de estudios | materia fuera del plan, materia común entre carreras (Inglés I) |
| Pagos | sin pago de inscripción, pago registrado, seriación con materia reprobada, adeudo vencido |
| Horario, bajas e historial | horario ordenado por día y hora, baja, baja repetida, baja de inscripción inexistente o ajena, historial con calificaciones y sin bajas |

Todas las cuentas de prueba usan la contraseña `Potros2026` (constante `CONTRASENA_DE_PRUEBA` en `src/infra/repositorio-en-memoria.ts`):

| Rol | Correo | Notas |
|---|---|---|
| Administrador | diana@admin.edu.mx | |
| Maestro | ana@maestros.edu.mx | Programación I 01 (2026-1), Programación II, Estructuras de Datos |
| Maestro | luis@maestros.edu.mx | Programación I 02 (2026-1), Bases de Datos, Redes, Inglés I, Estadística |
| Alumno | karla@alumnos.edu.mx | ISW; cursó Programación I en 2026-1 sin calificación todavía |
| Alumno | juan@alumnos.edu.mx | ISW; aprobó Programación I (85) y ocupa el único lugar de Estructuras de Datos |
| Alumno | sofia@alumnos.edu.mx | ISW; aprobó Programación I (95) |
| Alumno | pedro@alumnos.edu.mx | IIS (Ingeniería Industrial) |
| Alumno | mario@alumnos.edu.mx | ISW; no ha pagado la inscripción del 2026-2 |

## Otros comandos

Revisar que el código compile sin errores de tipos:

```
npm run typecheck
```

## Modelo del dominio

- **Usuario**: la cuenta para iniciar sesión (correo, hash de la contraseña y **rol**: alumno, maestro o administrador). Apunta a la persona que representa.
- **Alumno, Maestro, Administrador**: los datos de cada persona. El alumno pertenece a un **plan de estudios**.
- **Carrera** y **PlanDeEstudios**: el plan lista sus materias. Una materia puede estar en varios planes (Inglés I es común a ISW e IIS).
- **Materia**: solo el catálogo (clave, nombre, créditos) y sus **prerrequisitos**.
- **Grupo**: lo que se abre de una materia en un período, con su maestro, su cupo y sus bloques de horario.
- **PeriodoEscolar**: fechas de carga, tope de créditos y si la carga está habilitada.
- **Inscripcion**: la inscripción del alumno **a un grupo**. Guarda la calificación que captura el maestro (`null` mientras la materia está en curso).
- **Pago**: los cargos del alumno por período (inscripción o colegiatura) y su estado (pendiente o pagado).
- **Aviso**: avisos publicados por período.

## Reglas de negocio

Las reglas RN-01 a RN-13 son las del documento del Avance 1. Las marcadas como *(ajustada)* cambiaron con el nuevo modelo, y de la RN-14 en adelante son nuevas. En el código, cada validación lleva un comentario con su número de regla.

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

## Cambios respecto al avance anterior (retroalimentación)

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

## Estructura del proyecto

```
src/
  dominio/
    entidades.ts                # entidades, tipos y constantes del dominio
    errores.ts                  # errores propios del dominio (heredan de ErrorDeDominio)
    reglas.ts                   # funciones puras compartidas: rol, empalme, aprobación, orden del horario, pagos vencidos
    repositorio-academico.ts    # la interfaz del contrato de acceso a datos
    generador-de-hash.ts        # la interfaz para generar y comparar hashes de contraseñas
    servicio-autenticacion.ts   # inicio de sesión
    servicio-alumno.ts          # carga académica, bajas, horario, historial, estado de cuenta
    servicio-maestro.ts         # grupos del maestro, lista de alumnos y captura de calificaciones
    servicio-administracion.ts  # alumnos, maestros, materias, planes, grupos, períodos, avisos y pagos
  infra/
    repositorio-en-memoria.ts   # implementación en memoria del repositorio, con datos de prueba
    hash-scrypt.ts              # implementación del hash con scrypt (node:crypto)
  main.ts                       # el programa que corre los escenarios
```
