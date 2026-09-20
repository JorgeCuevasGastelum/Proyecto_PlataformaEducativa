# Plataforma Educativa — Avance 1: El Dominio y la Arquitectura

Proyecto 4 — Portal universitario de carga académica. Este avance entrega solo la capa de dominio: las entidades, el repositorio (interfaz + implementación en memoria), el servicio con las reglas de negocio y los errores propios del dominio. No hay servidor, ni base de datos, ni pantallas todavía.

## Requisitos

- Node.js (versión 18 o más reciente)
- npm

## Instalación

Desde la raíz del proyecto:

```
npm install
```

## Cómo correr el programa de los 3 escenarios

```
npm run dev
```

Esto ejecuta `src/main.ts`, que corre 3 escenarios seguidos y muestra el resultado de cada uno en la consola:

1. **Carga académica exitosa** — un alumno se inscribe a una materia con cupo disponible y sin empalme de horario.
2. **Rechazado por cupo agotado** — un alumno intenta inscribirse a una materia que ya no tiene lugares.
3. **Rechazado por empalme de horario** — un alumno intenta inscribirse a una materia cuyo horario se cruza con otra que ya tiene inscrita.

## Otros comandos

Revisar que el código compile sin errores de tipos:

```
npm run typecheck
```

## Estructura del proyecto

```
src/
  dominio/
    entidades.ts              # Alumno, Maestro, Materia, PeriodoEscolar, Inscripcion, Aviso, BloqueHorario
    errores.ts                # errores propios del dominio, uno por cada regla que impide algo
    repositorio-academico.ts  # la interfaz del contrato de acceso a datos
    servicio-academico.ts     # el servicio con las 13 reglas de negocio (RN-01 a RN-13)
  infra/
    repositorio-en-memoria.ts # implementación en memoria del repositorio, con datos de prueba
  main.ts                      # el programa que corre los 3 escenarios
```
