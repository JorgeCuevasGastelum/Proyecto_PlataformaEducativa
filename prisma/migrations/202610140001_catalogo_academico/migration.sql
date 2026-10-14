-- Catálogo, personas y operación académica del dominio corregido.
CREATE TABLE `Carrera` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `clave` VARCHAR(40) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Carrera_clave_key` (`clave`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PlanDeEstudios` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `clave` VARCHAR(40) NOT NULL,
  `carreraId` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `PlanDeEstudios_clave_key` (`clave`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Materia` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `clave` VARCHAR(40) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` VARCHAR(2000) NOT NULL,
  `creditos` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Materia_clave_key` (`clave`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MateriaEnPlan` (
  `planId` INTEGER NOT NULL,
  `materiaId` INTEGER NOT NULL,
  PRIMARY KEY (`planId`, `materiaId`),
  INDEX `MateriaEnPlan_materiaId_idx` (`materiaId`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Prerrequisito` (
  `materiaId` INTEGER NOT NULL,
  `prerrequisitoId` INTEGER NOT NULL,
  PRIMARY KEY (`materiaId`, `prerrequisitoId`),
  INDEX `Prerrequisito_prerrequisitoId_idx` (`prerrequisitoId`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Alumno` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `matricula` VARCHAR(40) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `planDeEstudiosId` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Alumno_matricula_key` (`matricula`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Maestro` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `numeroEmpleado` VARCHAR(40) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Maestro_numeroEmpleado_key` (`numeroEmpleado`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Administrador` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PeriodoEscolar` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `clave` VARCHAR(40) NOT NULL,
  `fechaAperturaCarga` DATETIME(3) NOT NULL,
  `fechaCierreCarga` DATETIME(3) NOT NULL,
  `creditosMaximos` INTEGER NOT NULL,
  `habilitado` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `PeriodoEscolar_clave_key` (`clave`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Grupo` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `materiaId` INTEGER NOT NULL,
  `periodoId` INTEGER NOT NULL,
  `clave` VARCHAR(40) NOT NULL,
  `maestroId` INTEGER NOT NULL,
  `cupoMaximo` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Grupo_materiaId_periodoId_clave_key` (`materiaId`, `periodoId`, `clave`),
  INDEX `Grupo_periodoId_idx` (`periodoId`),
  INDEX `Grupo_maestroId_idx` (`maestroId`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BloqueHorario` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `grupoId` INTEGER NOT NULL,
  `diaSemana` ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado') NOT NULL,
  `minutoInicio` INTEGER NOT NULL,
  `minutoFin` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `BloqueHorario_grupoId_idx` (`grupoId`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Inscripcion` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `alumnoId` INTEGER NOT NULL,
  `grupoId` INTEGER NOT NULL,
  `fechaRegistro` DATETIME(3) NOT NULL,
  `estadoActual` ENUM('activa', 'baja') NOT NULL DEFAULT 'activa',
  `calificacion` INTEGER NULL,
  PRIMARY KEY (`id`),
  INDEX `Inscripcion_alumnoId_idx` (`alumnoId`),
  INDEX `Inscripcion_grupoId_estadoActual_idx` (`grupoId`, `estadoActual`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Pago` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `alumnoId` INTEGER NOT NULL,
  `periodoId` INTEGER NOT NULL,
  `concepto` ENUM('inscripcion', 'colegiatura') NOT NULL,
  `monto` DECIMAL(12, 2) NOT NULL,
  `fechaLimite` DATETIME(3) NOT NULL,
  `estado` ENUM('pendiente', 'pagado') NOT NULL DEFAULT 'pendiente',
  `fechaPago` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `Pago_alumnoId_idx` (`alumnoId`),
  INDEX `Pago_periodoId_idx` (`periodoId`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Aviso` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(150) NOT NULL,
  `contenido` VARCHAR(4000) NOT NULL,
  `periodoId` INTEGER NOT NULL,
  `fechaPublicacion` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Aviso_periodoId_idx` (`periodoId`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PlanDeEstudios` ADD CONSTRAINT `PlanDeEstudios_carreraId_fkey` FOREIGN KEY (`carreraId`) REFERENCES `Carrera` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `MateriaEnPlan` ADD CONSTRAINT `MateriaEnPlan_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `PlanDeEstudios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `MateriaEnPlan` ADD CONSTRAINT `MateriaEnPlan_materiaId_fkey` FOREIGN KEY (`materiaId`) REFERENCES `Materia` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Prerrequisito` ADD CONSTRAINT `Prerrequisito_materiaId_fkey` FOREIGN KEY (`materiaId`) REFERENCES `Materia` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Prerrequisito` ADD CONSTRAINT `Prerrequisito_prerrequisitoId_fkey` FOREIGN KEY (`prerrequisitoId`) REFERENCES `Materia` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Alumno` ADD CONSTRAINT `Alumno_planDeEstudiosId_fkey` FOREIGN KEY (`planDeEstudiosId`) REFERENCES `PlanDeEstudios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Grupo` ADD CONSTRAINT `Grupo_materiaId_fkey` FOREIGN KEY (`materiaId`) REFERENCES `Materia` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Grupo` ADD CONSTRAINT `Grupo_periodoId_fkey` FOREIGN KEY (`periodoId`) REFERENCES `PeriodoEscolar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Grupo` ADD CONSTRAINT `Grupo_maestroId_fkey` FOREIGN KEY (`maestroId`) REFERENCES `Maestro` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `BloqueHorario` ADD CONSTRAINT `BloqueHorario_grupoId_fkey` FOREIGN KEY (`grupoId`) REFERENCES `Grupo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Inscripcion` ADD CONSTRAINT `Inscripcion_alumnoId_fkey` FOREIGN KEY (`alumnoId`) REFERENCES `Alumno` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Inscripcion` ADD CONSTRAINT `Inscripcion_grupoId_fkey` FOREIGN KEY (`grupoId`) REFERENCES `Grupo` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Pago` ADD CONSTRAINT `Pago_alumnoId_fkey` FOREIGN KEY (`alumnoId`) REFERENCES `Alumno` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Pago` ADD CONSTRAINT `Pago_periodoId_fkey` FOREIGN KEY (`periodoId`) REFERENCES `PeriodoEscolar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Aviso` ADD CONSTRAINT `Aviso_periodoId_fkey` FOREIGN KEY (`periodoId`) REFERENCES `PeriodoEscolar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
