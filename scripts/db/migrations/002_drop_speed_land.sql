-- Migration: 002_drop_speed_land
-- Date: 2026-03-09
-- Removes the stale speed_land column from the monsters table.
-- "land" is not a standard d20 speed mode — "walk" is used instead.
-- The column was defined in DDL but never seeded or read by adapters.

ALTER TABLE monsters
  DROP COLUMN IF EXISTS speed_land;
