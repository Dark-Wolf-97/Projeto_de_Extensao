-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `googleCalendarId` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `consultas` ADD COLUMN `googleCalendarId` VARCHAR(255) NULL;
