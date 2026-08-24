-- CreateTable
CREATE TABLE `mensagens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('CONFIRMACAO', 'LEMBRETE', 'ANIVERSARIO') NOT NULL,
    `status` ENUM('PENDENTE', 'ENVIADA', 'CANCELADA', 'FALHA') NOT NULL DEFAULT 'PENDENTE',
    `pacienteId` INTEGER NOT NULL,
    `consultaId` INTEGER NULL,
    `telefone` VARCHAR(20) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `agendadoPara` DATETIME(3) NOT NULL,
    `enviadoEm` DATETIME(3) NULL,
    `canceladoEm` DATETIME(3) NULL,
    `whatsappMessageId` VARCHAR(255) NULL,
    `erro` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mensagens_status_agendadoPara_idx`(`status`, `agendadoPara`),
    INDEX `mensagens_pacienteId_tipo_idx`(`pacienteId`, `tipo`),
    INDEX `mensagens_consultaId_tipo_idx`(`consultaId`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mensagens` ADD CONSTRAINT `mensagens_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagens` ADD CONSTRAINT `mensagens_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `consultas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
