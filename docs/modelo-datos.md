# Modelo de datos

MySQL almacena el catálogo, las personas y las operaciones académicas. Los atributos coinciden con schema.prisma y las dos migraciones SQL.

```mermaid
erDiagram
    Carrera {
        Int id PK
        String clave UK
        String nombre
    }
    PlanDeEstudios {
        Int id PK
        String clave UK
        Int carreraId FK
    }
    Materia {
        Int id PK
        String clave UK
        String nombre
        String descripcion
        Int creditos
    }
    MateriaEnPlan {
        Int planId FK
        Int materiaId FK
    }
    Prerrequisito {
        Int materiaId FK
        Int prerrequisitoId FK
    }
    Alumno {
        Int id PK
        String matricula UK
        String nombre
        Int planDeEstudiosId FK
    }
    Maestro {
        Int id PK
        String numeroEmpleado UK
        String nombre
    }
    Administrador {
        Int id PK
        String nombre
    }
    PeriodoEscolar {
        Int id PK
        String clave UK
        DateTime fechaAperturaCarga
        DateTime fechaCierreCarga
        Int creditosMaximos
        Boolean habilitado
    }
    Grupo {
        Int id PK
        Int materiaId FK
        Int periodoId FK
        String clave
        Int maestroId FK
        Int cupoMaximo
    }
    BloqueHorario {
        Int id PK
        Int grupoId FK
        DiaSemana diaSemana
        Int minutoInicio
        Int minutoFin
    }
    Inscripcion {
        Int id PK
        Int alumnoId FK
        Int grupoId FK
        DateTime fechaRegistro
        EstadoInscripcion estadoActual
        Int calificacion
    }
    Pago {
        Int id PK
        Int alumnoId FK
        Int periodoId FK
        ConceptoDePago concepto
        Decimal monto
        DateTime fechaLimite
        EstadoDePago estado
        DateTime fechaPago
    }
    Aviso {
        Int id PK
        String titulo
        String contenido
        Int periodoId FK
        DateTime fechaPublicacion
    }
    Usuario {
        Int id PK
        String correoInstitucional UK
        String contrasenaHash
        Rol rol
        Int alumnoId FK
        Int maestroId FK
        Int administradorId FK
    }
    Mutex {
        Int id PK
    }
    Carrera ||--o{ PlanDeEstudios : ofrece
    PlanDeEstudios ||--o{ Alumno : asigna
    PlanDeEstudios ||--o{ MateriaEnPlan : incluye
    Materia ||--o{ MateriaEnPlan : comparte
    Materia ||--o{ Prerrequisito : requiere
    Materia ||--o{ Prerrequisito : antecede
    Materia ||--o{ Grupo : abre
    PeriodoEscolar ||--o{ Grupo : agrupa
    Maestro ||--o{ Grupo : imparte
    Grupo ||--|{ BloqueHorario : tiene
    Alumno ||--o{ Inscripcion : realiza
    Grupo ||--o{ Inscripcion : recibe
    Alumno ||--o{ Pago : adeuda
    PeriodoEscolar ||--o{ Pago : corresponde
    PeriodoEscolar ||--o{ Aviso : publica
    Alumno o|--o| Usuario : cuenta
    Maestro o|--o| Usuario : cuenta
    Administrador o|--o| Usuario : cuenta
```

## Atributos

| Entidad | Atributos (tipo del esquema; ? indica opcional) |
|---|---|
| Carrera | id (Int), clave (String), nombre (String) |
| PlanDeEstudios | id (Int), clave (String), carreraId (Int) |
| Materia | id (Int), clave (String), nombre (String), descripcion (String), creditos (Int) |
| MateriaEnPlan | planId (Int), materiaId (Int) |
| Prerrequisito | materiaId (Int), prerrequisitoId (Int) |
| Alumno | id (Int), matricula (String), nombre (String), planDeEstudiosId (Int) |
| Maestro | id (Int), numeroEmpleado (String), nombre (String) |
| Administrador | id (Int), nombre (String) |
| PeriodoEscolar | id (Int), clave (String), fechaAperturaCarga (DateTime), fechaCierreCarga (DateTime), creditosMaximos (Int), habilitado (Boolean) |
| Grupo | id (Int), materiaId (Int), periodoId (Int), clave (String), maestroId (Int), cupoMaximo (Int) |
| BloqueHorario | id (Int), grupoId (Int), diaSemana (DiaSemana), minutoInicio (Int), minutoFin (Int) |
| Inscripcion | id (Int), alumnoId (Int), grupoId (Int), fechaRegistro (DateTime), estadoActual (EstadoInscripcion), calificacion (Int?) |
| Pago | id (Int), alumnoId (Int), periodoId (Int), concepto (ConceptoDePago), monto (Decimal), fechaLimite (DateTime), estado (EstadoDePago), fechaPago (DateTime?) |
| Aviso | id (Int), titulo (String), contenido (String), periodoId (Int), fechaPublicacion (DateTime) |
| Usuario | id (Int), correoInstitucional (String), contrasenaHash (String), rol (Rol), alumnoId (Int?), maestroId (Int?), administradorId (Int?) |
| Mutex | id (Int) |

_migraciones es una tabla técnica adicional del ejecutor: nombre (PK), checksum SHA-256, estado, iniciadoEn y aplicadoEn opcional. Mutex es técnico: su fila id 1 coordina las transacciones de escritura.

## Relaciones y restricciones

- Carrera tiene muchos planes; un alumno pertenece a un plan.
- Plan y Materia se relacionan muchos a muchos mediante MateriaEnPlan. Una materia puede ser compartida.
- Prerrequisito relaciona la materia objetivo con las materias que deben aprobarse antes.
- Un Grupo pertenece a una materia, un período y un maestro, y tiene uno o más bloques de horario.
- Inscripcion une Alumno y Grupo; almacena fecha, estado y calificación opcional. Puede haber registros históricos de bajas; la duplicidad de materia activa en el período se controla en el dominio dentro de la transacción.
- Pago pertenece a un alumno y período; monto usa DECIMAL(12,2), estado y fecha de pago reflejan su liquidación.
- Aviso pertenece a un período.
- Usuario tiene exactamente una relación con Alumno, Maestro o Administrador según su rol, garantizada por CHECK. Las relaciones son únicas, por lo que cada persona tiene como máximo una cuenta.
- El contrato de dominio conserva personaId; RepositorioPrisma lo traduce a las claves foráneas de Usuario.

Rol: alumno, maestro, administrador. EstadoInscripcion: activa, baja. ConceptoDePago: inscripcion, colegiatura. EstadoDePago: pendiente, pagado. DiaSemana: lunes a sábado.

El mínimo de un bloque por grupo se valida en el dominio; las claves foráneas por sí solas no imponen ese mínimo. Horarios, cupo, seriación, créditos y pagos se validan con las reglas del dominio antes de guardar.
