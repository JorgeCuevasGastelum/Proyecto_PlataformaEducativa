-- Autenticación, integridad y coordinación de escrituras.
CREATE TABLE `Usuario` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `correoInstitucional` VARCHAR(254) NOT NULL,
  `contrasenaHash` VARCHAR(255) NOT NULL,
  `rol` ENUM('alumno', 'maestro', 'administrador') NOT NULL,
  `alumnoId` INTEGER NULL,
  `maestroId` INTEGER NULL,
  `administradorId` INTEGER NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Usuario_correoInstitucional_key` (`correoInstitucional`),
  UNIQUE INDEX `Usuario_alumnoId_key` (`alumnoId`),
  UNIQUE INDEX `Usuario_maestroId_key` (`maestroId`),
  UNIQUE INDEX `Usuario_administradorId_key` (`administradorId`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Mutex` (
  `id` INTEGER NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_alumnoId_fkey` FOREIGN KEY (`alumnoId`) REFERENCES `Alumno` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_maestroId_fkey` FOREIGN KEY (`maestroId`) REFERENCES `Maestro` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_administradorId_fkey` FOREIGN KEY (`administradorId`) REFERENCES `Administrador` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Una cuenta está asociada exactamente a la persona de su rol.
ALTER TABLE Usuario ADD CONSTRAINT Usuario_persona_rol_check CHECK (
  (rol = 'alumno' AND alumnoId IS NOT NULL AND maestroId IS NULL AND administradorId IS NULL) OR
  (rol = 'maestro' AND maestroId IS NOT NULL AND alumnoId IS NULL AND administradorId IS NULL) OR
  (rol = 'administrador' AND administradorId IS NOT NULL AND alumnoId IS NULL AND maestroId IS NULL)
);
ALTER TABLE Materia ADD CONSTRAINT Materia_creditos_check CHECK (creditos > 0);
ALTER TABLE Grupo ADD CONSTRAINT Grupo_cupo_check CHECK (cupoMaximo > 0);
ALTER TABLE PeriodoEscolar ADD CONSTRAINT Periodo_creditos_check CHECK (creditosMaximos > 0);
ALTER TABLE BloqueHorario ADD CONSTRAINT Bloque_rango_check CHECK (minutoInicio >= 0 AND minutoFin <= 1439 AND minutoFin > minutoInicio);
ALTER TABLE Inscripcion ADD CONSTRAINT Inscripcion_calificacion_check CHECK (calificacion IS NULL OR calificacion BETWEEN 0 AND 100);
ALTER TABLE Pago ADD CONSTRAINT Pago_monto_check CHECK (monto > 0);
INSERT INTO Mutex (id) VALUES (1);
