-- Migration 013: Action system rename — update spell casting_time values
-- "action"/"Action" → "Major Action", "bonus action"/"Bonus Action" → "Minor Action"
-- Only affects spells table; monsters use filesystem metadata (regenerated).

BEGIN;

-- casting_time_raw (text): replace inline values
UPDATE spells
SET casting_time_raw = REPLACE(casting_time_raw, '1 Action', '1 Major Action')
WHERE casting_time_raw LIKE '%1 Action%';

UPDATE spells
SET casting_time_raw = REPLACE(casting_time_raw, '1 action', '1 Major Action')
WHERE casting_time_raw LIKE '%1 action%';

UPDATE spells
SET casting_time_raw = REPLACE(casting_time_raw, '1 Bonus Action', '1 Minor Action')
WHERE casting_time_raw LIKE '%1 Bonus Action%';

-- casting_time array (text[]): replace individual elements
UPDATE spells
SET casting_time = ARRAY(
  SELECT CASE
    WHEN elem IN ('Action', 'action') THEN 'Major Action'
    WHEN elem IN ('Bonus Action', 'bonus action') THEN 'Minor Action'
    ELSE elem
  END
  FROM unnest(casting_time) AS elem
)
WHERE casting_time IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM unnest(casting_time) AS e
    WHERE e IN ('Action', 'action', 'Bonus Action', 'bonus action')
  );

COMMIT;
