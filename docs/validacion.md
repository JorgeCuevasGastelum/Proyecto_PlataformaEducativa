# Validación del avance

Las pruebas HTTP usan la aplicación compilada para comprobar también los metadatos de decoradores y la validación real de NestJS. Se conectan a MySQL, sin sustituir la persistencia por un mock.

La implementación se validó con Node.js 24.19.0 y MySQL 8.4.11: instalación limpia con npm ci, generación del cliente, tipos y compilación correctos; 3 pruebas de registro y 28 de API aprobadas, sin pruebas omitidas; 23 escenarios originales con el resultado esperado. Las dos migraciones y el seed se ejecutaron desde cero y se repitieron sin sobrescribir datos. Se comprobó el arranque tanto con npm start como con npm run dev.

## Comprobaciones automatizadas

| Comando | Qué verifica |
|---|---|
| npm run db:generate | Generación del cliente según el modelo |
| npm run db:migrate | Historial SQL; puede repetirse sin reaplicar |
| npm run db:seed | Datos de arranque; puede repetirse sin borrar cambios |
| npm run typecheck | Tipos y contrato del repositorio |
| npm run build | Compilación con metadatos |
| npm test | Registro compartido, autenticación y permisos administrados |
| npm run demo | 23 escenarios originales del dominio |
| npm run test:api | Pruebas de API y MySQL en base exclusiva _test |

La suite de API comprueba los 30 endpoints documentados, registro persistente, 401/403/operación correcta, JWT alterado y vencido, mensajes de login uniformes, hashes no legibles, validación anidada, CORS, OpenAPI, consultas y conflictos de negocio.

También comprueba una baja repetida, historial sin bajas, maestro con grupo ajeno, captura atómica, pagos, cierre de carga, dos solicitudes por el último cupo, registro concurrente sin personas huérfanas y reversión de una operación que falla después de crear una persona.

## Revisión técnica desde Swagger

Estos son casos de comprobación, no un guion de video:

1. GET /api/salud devuelve disponibilidad de MySQL.
2. POST /api/alumnos sin Authorize devuelve 401.
3. La misma operación con token de Karla devuelve 403; con token administrativo crea el recurso con 201.
4. Karla solicita grupo 5 y obtiene 201. Repetir responde MateriaYaInscritaError con 409.
5. Sofía solicita grupo 6 y recibe CupoAgotadoError con 409.
6. Karla solicita grupo 3 antes de ser calificada y recibe SeriacionNoCumplidaError.
7. Ana captura en grupo 1 la inscripción 1 con 90. Karla puede solicitar después grupo 3.
8. Luis intenta calificar grupo 1 y recibe 403.
9. Mario intenta grupo 5 sin pago y obtiene conflicto; el administrador liquida pago 5 y la inscripción puede hacerse si todavía hay cupo.
10. Revisa en Workbench las inscripciones y los hashes de Usuario; reinicia la API y verifica que los datos sigan ahí.

Los pasos modifican datos y dependen del estado de las operaciones anteriores. Usa una base de demostración recién preparada para repetir la secuencia completa.

El formato de errores diferencia petición inválida, acceso, inexistencia y conflicto. El registro HTTP muestra método, ruta, código y duración, sin cuerpos ni tokens.
