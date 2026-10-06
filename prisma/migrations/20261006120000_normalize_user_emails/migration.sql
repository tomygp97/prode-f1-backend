-- Emails guardados sin espacios y en minúsculas (el registro y el login ya normalizan).
-- Seguro: el índice único de users.email es case-insensitive (utf8mb4_unicode_ci),
-- así que no puede haber dos emails que solo difieran en mayúsculas.
UPDATE `users` SET `email` = LOWER(TRIM(`email`));
