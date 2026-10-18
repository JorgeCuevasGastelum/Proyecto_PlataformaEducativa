-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `correoInstitucional` VARCHAR(120) NOT NULL,
    `contrasenaHash` VARCHAR(255) NOT NULL,
    `rol` ENUM('alumno', 'maestro', 'administrador') NOT NULL,
    `alumnoId` INTEGER NULL,
    `maestroId` INTEGER NULL,
    `administradorId` INTEGER NULL,

    UNIQUE INDEX `usuarios_correoInstitucional_key`(`correoInstitucional`),
    UNIQUE INDEX `usuarios_alumnoId_key`(`alumnoId`),
    UNIQUE INDEX `usuarios_maestroId_key`(`maestroId`),
    UNIQUE INDEX `usuarios_administradorId_key`(`administradorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_alumnoId_fkey` FOREIGN KEY (`alumnoId`) REFERENCES `alumnos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_maestroId_fkey` FOREIGN KEY (`maestroId`) REFERENCES `maestros`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_administradorId_fkey` FOREIGN KEY (`administradorId`) REFERENCES `administradores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
