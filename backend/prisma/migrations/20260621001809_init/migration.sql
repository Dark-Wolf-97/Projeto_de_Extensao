/*
  Warnings:

  - You are about to drop the `consulta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `paciente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `consulta` DROP FOREIGN KEY `Consulta_pacienteId_fkey`;

-- DropTable
DROP TABLE `consulta`;

-- DropTable
DROP TABLE `paciente`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'SECRETARIA', 'MEDICO') NOT NULL DEFAULT 'SECRETARIA',
    `crm` VARCHAR(20) NULL,
    `especialidade` VARCHAR(100) NULL,
    `telefone` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pacientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `cpf` VARCHAR(14) NOT NULL,
    `telefone` VARCHAR(20) NOT NULL,
    `dataNascimento` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `medicoId` INTEGER NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `hora` VARCHAR(5) NOT NULL,
    `status` ENUM('AGENDADA', 'CONFIRMADA', 'REALIZADA', 'CANCELADA') NOT NULL DEFAULT 'AGENDADA',
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prontuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultaId` INTEGER NOT NULL,
    `anamnese` TEXT NULL,
    `diagnostico` TEXT NULL,
    `prescricao` TEXT NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prontuarios_consultaId_key`(`consultaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `consultas` ADD CONSTRAINT `consultas_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultas` ADD CONSTRAINT `consultas_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prontuarios` ADD CONSTRAINT `prontuarios_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `consultas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
