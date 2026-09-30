/*
  Warnings:

  - A unique constraint covering the columns `[race_session_key]` on the table `races` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[qualifying_session_key]` on the table `races` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `races` ADD COLUMN `qualifying_session_key` INTEGER NULL,
    ADD COLUMN `race_session_key` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `races_race_session_key_key` ON `races`(`race_session_key`);

-- CreateIndex
CREATE UNIQUE INDEX `races_qualifying_session_key_key` ON `races`(`qualifying_session_key`);
