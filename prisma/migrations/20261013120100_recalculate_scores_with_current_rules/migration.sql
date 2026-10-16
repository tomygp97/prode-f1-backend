-- Recalcular todas las carreras ya puntuadas con las reglas actuales (rebalance del 7/10/2026:
-- sin bonus de ganador, piloto seguido 25/10). Al arrancar, el back las vuelve a puntuar
-- (CalculateAllPendingScoresUseCase): los puntajes se reemplazan, no se suman.
-- Mismo procedimiento ante un cambio de reglas futuro: una migración como esta.

-- Queda registrado en las carreras que tienen predicciones (las otras no cambian nada)
UPDATE `races`
SET `scores_recalculated_at` = NOW(3),
    `scores_recalculation_reason` = 'Cambio de reglas de puntaje (7/10/2026): sin bonus de ganador, piloto seguido 25/10'
WHERE `status` = 'RESULTS_SYNCED'
  AND `scores_calculated_at` IS NOT NULL
  AND `id` IN (SELECT DISTINCT `race_id` FROM `predictions`);

UPDATE `races`
SET `scores_calculated_at` = NULL
WHERE `status` = 'RESULTS_SYNCED';
