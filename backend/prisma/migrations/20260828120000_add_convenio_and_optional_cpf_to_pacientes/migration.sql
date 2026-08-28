-- AlterTable
ALTER TABLE `pacientes`
    MODIFY `cpf` VARCHAR(14) NULL,
    ADD COLUMN `convenio` VARCHAR(100) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `pacientes_cpf_key` ON `pacientes`(`cpf`);
