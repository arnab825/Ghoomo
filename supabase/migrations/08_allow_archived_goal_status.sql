-- Migration 08: Allow 'archived' in learning_goals status check constraint
-- Ensures both 'archived' and 'abandoned' are valid non-active statuses in PostgreSQL

DO $$
BEGIN
  -- Drop existing status check if present
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'learning_goals_status_check' 
    AND conrelid = 'public.learning_goals'::regclass
  ) THEN
    ALTER TABLE public.learning_goals DROP CONSTRAINT learning_goals_status_check;
  END IF;

  -- Add updated check constraint allowing 'archived'
  ALTER TABLE public.learning_goals 
    ADD CONSTRAINT learning_goals_status_check 
    CHECK (status IN ('active', 'completed', 'abandoned', 'archived'));
END $$;
