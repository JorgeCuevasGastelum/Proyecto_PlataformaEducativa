-- CreateTable
CREATE TABLE `alumnos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matricula` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `planDeEstudiosId` INTEGER NOT NULL,

    UNIQUE INDEX `alumnos_matricula_key`(`matricula`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maestros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroEmpleado` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,

    UNIQUE INDEX `maestros_numeroEmpleado_key`(`numeroEmpleado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `administradores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `materiaId` INTEGER NOT NULL,
    `periodoId` INTEGER NOT NULL,
    `clave` VARCHAR(10) NOT NULL,
    `maestroId` INTEGER NOT NULL,
    `cupoMaximo` INTEGER NOT NULL,

    UNIQUE INDEX `grupos_materiaId_periodoId_clave_key`(`materiaId`, `periodoId`, `clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bloques_horario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `grupoId` INTEGER NOT NULL,
    `diaSemana` ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado') NOT NULL,
    `minutoInicio` INTEGER NOT NULL,
    `minutoFin` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `alumnos` ADD CONSTRAINT `alumnos_planDeEstudiosId_fkey` FOREIGN KEY (`planDeEstudiosId`) REFERENCES `planes_de_estudio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupos` ADD CONSTRAINT `grupos_materiaId_fkey` FOREIGN KEY (`materiaId`) REFERENCES `materias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupos` ADD CONSTRAINT `grupos_periodoId_fkey` FOREIGN KEY (`periodoId`) REFERENCES `periodos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupos` ADD CONSTRAINT `grupos_maestroId_fkey` FOREIGN KEY (`maestroId`) REFERENCES `maestros`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bloques_horario` ADD CONSTRAINT `bloques_horario_grupoId_fkey` FOREIGN KEY (`grupoId`) REFERENCES `grupos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
