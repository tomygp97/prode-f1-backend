/*
  Warnings:

  - Added the required column `driver_number` to the `drivers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `drivers` ADD COLUMN `driver_number` INTEGER NOT NULL AFTER `name`;
