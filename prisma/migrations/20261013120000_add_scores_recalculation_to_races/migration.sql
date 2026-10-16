-- Registro del último recálculo de puntos de una carrera ya puntuada
ALTER TABLE `races`
    ADD COLUMN `scores_recalculated_at` DATETIME(3) NULL,
    ADD COLUMN `scores_recalculation_reason` VARCHAR(500) NULL;
