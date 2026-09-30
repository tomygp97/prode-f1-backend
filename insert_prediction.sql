INSERT INTO predictions (id, user_id, league_id, race_id, predicted_order, tracked_driver_position, safety_car, dnf_count, created_at, updated_at)
VALUES (
  UUID(),
  '7070bf76-8bd7-47b9-9d82-059dae8a994e',
  '923423d6-8aba-4320-adfd-e8e666f6f6fe',
  '097d35e4-170a-49ca-9837-004026d7e34f',
  '["a7d5a4e8-e899-4777-8ad2-9f03b8b2f627", "2e398316-52e1-464f-aeea-af18fd88a561", "c8e1edb1-dccc-4535-a3c4-7f5a6746ade7", "1077033c-9a38-49ba-b98a-724822d2cbc8", "cd0be515-ecc7-4be4-b016-e8409d76b759", "3f5583c0-9684-419b-bdcf-8781b32c9473", "132cde39-d393-4995-9c19-9c6a4b6b3758", "baba2169-06c3-451d-9160-47248e3cdb6a", "a3aee3db-e928-4bf5-bfa7-83fbff16a6ad", "6e13cff6-6d47-46cf-aa87-b9c8b4b9e89c"]',
  NULL,
  true,
  3,
  NOW(),
  NOW()
);
