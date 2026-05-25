-- CreateTable
CREATE TABLE `Consulta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `hora` VARCHAR(191) NOT NULL,
    `medico` VARCHAR(191) NULL,
    `observacoes` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Agendada',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Consulta` ADD CONSTRAINT `Consulta_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
