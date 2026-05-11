-- ----------------------------------------------------------------
-- Waitlist referral mechanics, 2026-05-08.
--
-- Adds:
--   position         (int, NOT NULL): user's display rank
--   referral_code    (text, UNIQUE NOT NULL): 8-char share token
--   referred_by      (text, NULLABLE): referral_code of inviter
--   referred_count   (int, DEFAULT 0): denormalized referral total
--
-- Position assignment uses a Postgres SEQUENCE so concurrent inserts
-- get distinct values atomically (first new row -> 1). The earlier
-- iteration of this migration started the sequence at 688 to seed a
-- now-removed "product offset" that inflated displayed positions;
-- see 20260511_remove_waitlist_position_offset.sql for the rollback
-- migration that renumbered existing prod rows.
--
-- Referral bump: after-insert trigger decrements the inviter's
-- position by 25 (floor 1) and increments referred_count when the
-- new row carries a referred_by code that resolves to an existing
-- row.
--
-- Existing rows (if any) are backfilled in insertion order
-- starting at 1 before the NOT NULL constraint is enforced, so
-- the migration is idempotent against a populated table.
-- ----------------------------------------------------------------

-- 1. SEQUENCE for atomic position assignment.
CREATE SEQUENCE IF NOT EXISTS waitlist_position_seq
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  NO MAXVALUE
  CACHE 1;

-- 2. New columns (nullable first; backfilled below; then NOT NULL).
ALTER TABLE waitlist
  ADD COLUMN IF NOT EXISTS position int,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS referred_count int NOT NULL DEFAULT 0;

-- 3. Backfill `position` for any pre-existing rows in insertion
--    order. Uses created_at as the order key (existing schema has
--    it). Falls back to row order if created_at is missing.
DO $$
DECLARE
  next_pos int;
  rec RECORD;
BEGIN
  -- Reset the sequence so backfill values come first; live inserts
  -- continue from there. is_called=false means the next nextval()
  -- returns 1 (matching START WITH 1) rather than 2.
  PERFORM setval('waitlist_position_seq', 1, false);

  FOR rec IN
    SELECT email
      FROM waitlist
     WHERE position IS NULL
     ORDER BY created_at NULLS LAST, email
  LOOP
    next_pos := nextval('waitlist_position_seq');
    UPDATE waitlist SET position = next_pos WHERE email = rec.email;
  END LOOP;
END $$;

-- 4. Backfill referral_code for pre-existing rows (8-char,
--    lookalikes-safe alphabet). This generator runs only for rows
--    that are missing a code; new inserts get codes from app code.
DO $$
DECLARE
  rec RECORD;
  new_code text;
  attempts int;
BEGIN
  FOR rec IN SELECT email FROM waitlist WHERE referral_code IS NULL LOOP
    attempts := 0;
    LOOP
      attempts := attempts + 1;
      new_code := lower(substring(
        translate(
          encode(gen_random_bytes(12), 'base64'),
          '+/=01OIl',
          'abcdefgh'
        )
        FROM 1 FOR 8
      ));
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM waitlist WHERE referral_code = new_code
      ) OR attempts > 5;
    END LOOP;
    UPDATE waitlist SET referral_code = new_code WHERE email = rec.email;
  END LOOP;
END $$;

-- 5. Tighten constraints now that backfill is complete.
ALTER TABLE waitlist
  ALTER COLUMN position SET NOT NULL,
  ALTER COLUMN referral_code SET NOT NULL;

-- Bind the sequence default for new inserts (after backfill so
-- backfilled values are preserved).
ALTER TABLE waitlist
  ALTER COLUMN position SET DEFAULT nextval('waitlist_position_seq');

-- 6. Indexes.
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_referral_code_unique
  ON waitlist (lower(referral_code));

CREATE INDEX IF NOT EXISTS waitlist_referred_by_idx
  ON waitlist (referred_by);

-- 7. After-insert trigger: when a new row carries referred_by,
--    decrement the inviter's position by 25 (floor 1) and bump the
--    inviter's referred_count.
CREATE OR REPLACE FUNCTION waitlist_apply_referral_bump()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE waitlist
       SET position = GREATEST(position - 25, 1),
           referred_count = referred_count + 1
     WHERE lower(referral_code) = lower(NEW.referred_by);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS waitlist_referral_bump ON waitlist;
CREATE TRIGGER waitlist_referral_bump
  AFTER INSERT ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION waitlist_apply_referral_bump();
