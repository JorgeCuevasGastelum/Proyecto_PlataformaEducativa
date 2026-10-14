# Persistencia e historial

Prisma consulta MySQL con su cliente JavaScript y el adaptador oficial @prisma/adapter-mariadb. El servidor sigue siendo MySQL.

Las migraciones SQL se aplican con scripts/migrar.mjs. Evita descargar un motor nativo externo para migrar. **No es Prisma Migrate** ni utiliza su tabla de seguimiento.

| Cambio | Contenido |
|---|---|
| 202610140001_catalogo_academico | Personas, catálogo, grupos, horarios, períodos, inscripciones, pagos y avisos |
| 202610140002_acceso_e_integridad | Cuentas por rol, checks y coordinación de escrituras |

## Aplicación y mantenimiento

db:migrate toma un bloqueo en MySQL, verifica el historial y aplica las carpetas pendientes en orden. _migraciones guarda nombre, checksum SHA-256, estado e inicio/aplicación. Repetir no repite cambios. Modificar o quitar un archivo aplicado hace fallar el comando antes de cambios nuevos.

MySQL no revierte automáticamente el DDL. Una migración fallida queda registrada y detiene ejecuciones posteriores; revisa y recupera la base antes de continuar. No borres datos de trabajo para resolver un fallo. Una base de pruebas desechable puede reemplazarse por otra vacía.

Para agregar cambios, crea una carpeta nueva con nombre ordenable y migration.sql incremental, actualiza schema.prisma, ejecuta db:generate y valida desde una base vacía y desde la versión anterior. No reescribas migraciones aplicadas. No mezcles este historial con prisma migrate deploy, migrate dev o db push.

## Datos de arranque

El seed usa una transacción y los ejemplos del demo: dos carreras, dos planes, siete materias, dos maestros, cinco alumnos, un administrador, ocho grupos, cinco inscripciones, cinco pagos y un aviso.

Las ocho cuentas reciben hashes de SEED_PASSWORD con sal aleatoria. El correo administrativo se configura con SEED_ADMIN_EMAIL.

Si el administrador ya existe, no modifica datos ni contraseñas. Si encuentra información previa sin él, falla para no mezclar datos desconocidos. No es un mecanismo de reinicio.

## Integridad

Las claves foráneas e índices protegen relaciones y unicidad de matrículas, números de empleado, correos y claves del catálogo. Los grupos son únicos por materia, período y clave.

Usuario tiene tres relaciones opcionales con claves foráneas; un CHECK exige exactamente la correspondiente a su rol. El repositorio las convierte al personaId del contrato original.

Las asociaciones representan materias compartidas y prerrequisitos. Las bajas se almacenan y el dominio las excluye de horario e historial. Los CHECK apoyan valores positivos y rangos. Cupo, empalme, seriación, pagos y créditos se validan en el dominio dentro de la transacción.
