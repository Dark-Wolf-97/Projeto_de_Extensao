-- DropForeignKey
ALTER TABLE `mensagens` DROP FOREIGN KEY `mensagens_consultaId_fkey`;

-- AddForeignKey
ALTER TABLE `mensagens` ADD CONSTRAINT `mensagens_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `consultas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
