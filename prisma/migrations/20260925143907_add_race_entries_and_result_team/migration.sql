-- Equipo con el que corrió cada piloto en cada carrera + grilla por carrera (race_entries).
-- Las filas existentes se completan con el equipo actual del piloto (mejor dato disponible)
-- y las carreras ya sincronizadas reciben su grilla a partir de sus resultados.

-- AlterTable: primero opcional para poder completar las filas existentes
ALTER TABLE `race_driver_results` ADD COLUMN `team_id` VARCHAR(191) NULL;

UPDATE `race_driver_results` rdr
    JOIN `drivers` d ON d.`id` = rdr.`driver_id`
SET rdr.`team_id` = d.`team_id`;

ALTER TABLE `race_driver_results` MODIFY `team_id` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `race_entries` (
    `id` VARCHAR(191) NOT NULL,
    `race_id` VARCHAR(191) NOT NULL,
    `driver_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `race_entries_race_id_driver_id_key`(`race_id`, `driver_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `race_entries` ADD CONSTRAINT `race_entries_race_id_fkey` FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `race_entries` ADD CONSTRAINT `race_entries_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `race_entries` ADD CONSTRAINT `race_entries_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: grilla de las carreras que ya tienen resultados
INSERT INTO `race_entries` (`id`, `race_id`, `driver_id`, `team_id`)
SELECT UUID(), rdr.`race_id`, rdr.`driver_id`, rdr.`team_id`
FROM `race_driver_results` rdr;
