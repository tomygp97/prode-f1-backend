/*
  Warnings:

  - You are about to drop the column `pole_driver_id` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `top1_driver_id` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `top2_driver_id` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `top3_driver_id` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `top4_driver_id` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `top5_driver_id` on the `predictions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[league_id,race_id,user_id]` on the table `predictions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `league_id` to the `predictions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `predicted_order` to the `predictions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `predictions` DROP FOREIGN KEY `predictions_race_id_fkey`;

-- DropIndex
DROP INDEX `predictions_race_id_user_id_key` ON `predictions`;

-- AlterTable
ALTER TABLE `predictions` DROP COLUMN `pole_driver_id`,
    DROP COLUMN `top1_driver_id`,
    DROP COLUMN `top2_driver_id`,
    DROP COLUMN `top3_driver_id`,
    DROP COLUMN `top4_driver_id`,
    DROP COLUMN `top5_driver_id`,
    ADD COLUMN `league_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `predicted_order` JSON NOT NULL,
    ADD COLUMN `tracked_driver_position` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `predictions_league_id_race_id_user_id_key` ON `predictions`(`league_id`, `race_id`, `user_id`);

-- AddForeignKey
ALTER TABLE `predictions` ADD CONSTRAINT `predictions_league_id_fkey` FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `predictions` ADD CONSTRAINT `predictions_race_id_fkey` FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;