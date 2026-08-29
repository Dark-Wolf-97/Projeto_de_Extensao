-- AlterTable
ALTER TABLE `consultas` MODIFY `medicoId` INTEGER NULL;

-- DropForeignKey
ALTER TABLE `consultas` DROP FOREIGN KEY `consultas_medicoId_fkey`;

-- DropForeignKey
ALTER TABLE `consultas` DROP FOREIGN KEY `consultas_pacienteId_fkey`;

-- DropForeignKey
ALTER TABLE `prontuarios` DROP FOREIGN KEY `prontuarios_consultaId_fkey`;

-- AddForeignKey
ALTER TABLE `consultas` ADD CONSTRAINT `consultas_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultas` ADD CONSTRAINT `consultas_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prontuarios` ADD CONSTRAINT `prontuarios_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `consultas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
