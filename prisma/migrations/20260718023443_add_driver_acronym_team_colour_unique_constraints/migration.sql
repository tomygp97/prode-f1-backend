/*
  Warnings:

  - A unique constraint covering the columns `[driver_number,season_id]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,season_id]` on the table `teams` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `acronym` to the `drivers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `colour` to the `teams` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `drivers` ADD COLUMN `acronym` VARCHAR(191) NOT NULL AFTER `name`;

-- AlterTable
ALTER TABLE `teams` ADD COLUMN `colour` VARCHAR(191) NOT NULL AFTER `name`;

-- CreateIndex
CREATE UNIQUE INDEX `drivers_driver_number_season_id_key` ON `drivers`(`driver_number`, `season_id`);

-- CreateIndex
CREATE UNIQUE INDEX `teams_name_season_id_key` ON `teams`(`name`, `season_id`);
