-- Rol en la app (no en una liga). Todos arrancan como USER; los admins se nombran a mano:
-- UPDATE users SET app_role = 'ADMIN' WHERE email IN (...);
ALTER TABLE `users` ADD COLUMN `app_role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';
