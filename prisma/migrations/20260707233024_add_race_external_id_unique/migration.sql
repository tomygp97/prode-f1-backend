/*
  Warnings:

  - A unique constraint covering the columns `[external_id]` on the table `races` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `races_external_id_key` ON `races`(`external_id`);
