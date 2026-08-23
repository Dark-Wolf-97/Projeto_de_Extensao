-- AlterTable
ALTER TABLE `consultas`
    ADD COLUMN `googleCalendarEventId` VARCHAR(255) NULL,
    ADD COLUMN `googleCalendarEventLink` TEXT NULL,
    ADD COLUMN `googleCalendarSyncedAt` DATETIME(3) NULL,
    ADD COLUMN `googleCalendarLastError` TEXT NULL;
