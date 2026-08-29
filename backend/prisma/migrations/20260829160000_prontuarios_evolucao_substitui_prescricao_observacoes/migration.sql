-- AlterTable
ALTER TABLE `prontuarios`
    DROP COLUMN `prescricao`,
    DROP COLUMN `observacoes`,
    ADD COLUMN `evolucao` TEXT NULL;
