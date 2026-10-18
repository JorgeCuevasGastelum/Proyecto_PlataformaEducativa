-- CreateTable
CREATE TABLE `carreras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,

    UNIQUE INDEX `carreras_clave_key`(`clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planes_de_estudio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(20) NOT NULL,
    `carreraId` INTEGER NOT NULL,

    UNIQUE INDEX `planes_de_estudio_clave_key`(`clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `creditos` INTEGER NOT NULL,

    UNIQUE INDEX `materias_clave_key`(`clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materias_en_plan` (
    `planId` INTEGER NOT NULL,
    `materiaId` INTEGER NOT NULL,

    PRIMARY KEY (`planId`, `materiaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prerrequisitos` (
    `materiaId` INTEGER NOT NULL,
    `prerrequisitoId` INTEGER NOT NULL,

    PRIMARY KEY (`materiaId`, `prerrequisitoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periodos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(20) NOT NULL,
    `fechaAperturaCarga` DATETIME(3) NOT NULL,
    `fechaCierreCarga` DATETIME(3) NOT NULL,
    `creditosMaximos` INTEGER NOT NULL,
    `habilitado` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `periodos_clave_key`(`clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `planes_de_estudio` ADD CONSTRAINT `planes_de_estudio_carreraId_fkey` FOREIGN KEY (`carreraId`) REFERENCES `carreras`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materias_en_plan` ADD CONSTRAINT `materias_en_plan_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `planes_de_estudio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materias_en_plan` ADD CONSTRAINT `materias_en_plan_materiaId_fkey` FOREIGN KEY (`materiaId`) REFERENCES `materias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prerrequisitos` ADD CONSTRAINT `prerrequisitos_materiaId_fkey` FOREIGN KEY (`materiaId`) REFERENCES `materias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prerrequisitos` ADD CONSTRAINT `prerrequisitos_prerrequisitoId_fkey` FOREIGN KEY (`prerrequisitoId`) REFERENCES `materias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
