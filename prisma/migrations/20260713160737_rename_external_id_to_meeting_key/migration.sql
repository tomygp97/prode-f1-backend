/*
  Warnings:

  - You are about to drop the column `external_id` on the `races` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `races` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - A unique constraint covering the columns `[meeting_key]` on the table `races` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `meeting_key` to the `races` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `races_external_id_key` ON `races`;

-- AlterTable
ALTER TABLE `races` DROP COLUMN `external_id`,
    ADD COLUMN `meeting_key` INTEGER NOT NULL,
    MODIFY `status` ENUM('SCHEDULED', 'LOCKED', 'FINISHED', 'CANCELLED', 'RESULTS_SYNCED') NOT NULL DEFAULT 'SCHEDULED';

-- CreateIndex
CREATE UNIQUE INDEX `races_meeting_key_key` ON `races`(`meeting_key`);
