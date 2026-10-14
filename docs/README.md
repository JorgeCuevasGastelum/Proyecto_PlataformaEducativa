# Documentación del avance 2

El servicio expone el dominio corregido por HTTP, persiste en MySQL y aplica autenticación y autorización. Incluye acceso, registro administrado, catálogo, grupos, inscripciones, calificaciones, pagos y avisos.

| Documento | Contenido |
|---|---|
| [Arquitectura](arquitectura.md) | Capas, composición, transacciones y extensión del registro |
| [Modelo de datos](modelo-datos.md) | Atributos, relaciones y diagrama entidad–relación |
| [Persistencia](persistencia.md) | Historial SQL, seed y mantenimiento |
| [API y roles](api.md) | Los 30 endpoints, permisos y respuestas |
| [Validación](validacion.md) | Pruebas y demostración técnica |
| [Instalación](../README.md) | Pasos desde cero para cada laptop |

Los diagramas Mermaid se incluyen en los documentos y como archivos editables en [diagramas](diagramas/). GitHub puede renderizarlos.

Esta entrega no incluye frontend, PDF maquetado ni guion/video. La consigna solicita también PDF y video; esta carpeta sirve de fuente para el PDF posterior.

## Correspondencia con la consigna

| Requisito | Implementación |
|---|---|
| Modelo completo | schema.prisma y modelo-datos.md |
| Más de un cambio registrado | Dos migraciones SQL y _migraciones |
| Mismo contrato que el repositorio en memoria | RepositorioPrisma implementa RepositorioAcademico |
| Composición en un lugar | CasosDeUso selecciona el repositorio de la API |
| Datos de arranque | Administrador, maestros, alumnos y ejemplos académicos |
| REST por recursos | Controladores y catálogo de endpoints |
| Validación | DTO, ValidationPipe e IdPipe |
| Conflictos de negocio | 409 con el error del dominio; acceso e inexistencia se distinguen |
| Formato uniforme | Interceptor y filtro global |
| Registro de petición y tiempo | Método, ruta, estado y milisegundos |
| Orígenes concretos | CORS_ORIGINS |
| Documentación ejecutable | Swagger /docs y OpenAPI /docs-json |
| Registro y sesión | Registro administrado y JWT con expiración |
| Contraseñas transformadas | Scrypt con sal aleatoria |
| Roles protegidos | Guard global e identidad del JWT |
| Configuración sin secretos | .env.example y .env ignorado |

La rama se llama 2do-Avance por instrucción del equipo, aunque la consigna menciona feat-servicio.
