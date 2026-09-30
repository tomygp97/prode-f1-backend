-- CreateTable
CREATE TABLE `league_prizes` (
    `id` VARCHAR(191) NOT NULL,
    `league_id` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `league_prizes_league_id_position_key`(`league_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `league_prizes` ADD CONSTRAINT `league_prizes_league_id_fkey` FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
