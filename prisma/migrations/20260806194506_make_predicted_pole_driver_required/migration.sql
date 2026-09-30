/*
  Warnings:

  - Made the column `predicted_pole_driver_id` on table `predictions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `predictions` MODIFY `predicted_pole_driver_id` VARCHAR(191) NOT NULL;
