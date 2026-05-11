-- ----------------------------------------------------------------
-- Remove waitlist position offset, 2026-05-11.
--
-- The 2026-05-08 referrals migration started waitlist_position_seq
-- at 688 to seed a "product offset" that inflated displayed waitlist
-- positions (POSITION_OFFSET = 687 in src/lib/referral.ts). That
-- offset has been removed from the application code in the same
-- change set as this migration. Production DB rows currently have
-- inflated position values (688..N); this migration brings them in
-- line with the "no fake numbers" policy.
--
-- Operations performed:
--   1. Renumber every existing waitlist row to 1..N in
--      (created_at NULLS LAST, email) order, matching the ordering
--      that the original 20260508 backfill used. The IS DISTINCT
--      FROM clause skips no-op writes so the statement is cheap on
--      a re-run.
--   2. Realign waitlist_position_seq so the next INSERT gets
--      position = N + 1. Empty-table case uses setval(seq, 1,
--      is_called=false) so the first nextval returns 1.
--
-- Idempotent: a second run renumbers existing rows to the same
-- values and realigns the sequence to the same MAX(position).
--
-- Triggers: waitlist_apply_referral_bump fires AFTER INSERT only,
-- so the UPDATE does not invoke it.
--
-- Operational note: apply during a brief signup quiet window so an
-- in-flight INSERT cannot consume a sequence value between the
-- renumber and the setval. The full operation typically runs in
-- well under a second on a list of tens of thousands of rows; on
-- the current ~12-row list it is effectively instantaneous.
-- ----------------------------------------------------------------

BEGIN;

-- 1. Renumber existing rows to 1..N in the original backfill order.
WITH ordered AS (
  SELECT email,
         row_number() OVER (
           ORDER BY created_at NULLS LAST, email
         ) AS new_position
    FROM waitlist
)
UPDATE waitlist w
   SET position = ordered.new_position
  FROM ordered
 WHERE w.email = ordered.email
   AND w.position IS DISTINCT FROM ordered.new_position;

-- 2. Realign waitlist_position_seq so the next nextval returns
--    MAX(position) + 1, or 1 if the table is empty.
DO $$
DECLARE
  max_pos int;
BEGIN
  SELECT COALESCE(MAX(position), 0) INTO max_pos FROM waitlist;
  IF max_pos > 0 THEN
    PERFORM setval('waitlist_position_seq', max_pos, true);
  ELSE
    PERFORM setval('waitlist_position_seq', 1, false);
  END IF;
END $$;

COMMIT;
