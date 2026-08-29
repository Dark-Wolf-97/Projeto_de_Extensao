-- DropForeignKey
ALTER TABLE `mensagens` DROP FOREIGN KEY `mensagens_pacienteId_fkey`;

-- AddForeignKey
ALTER TABLE `mensagens` ADD CONSTRAINT `mensagens_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
