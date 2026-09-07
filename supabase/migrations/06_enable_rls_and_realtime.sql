-- ============================================================================
-- Ghoomo Adaptive Learning Navigation Engine
-- Migration 06: Comprehensive RLS & Realtime Activation
-- ============================================================================

-- 1. Ensure Row Level Security is explicitly enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_concept_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.misconceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;

-- 2. Automatic RLS Event Trigger for any newly created tables
CREATE OR REPLACE FUNCTION public.pgrst_enable_rls()
RETURNS event_trigger AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag = 'CREATE TABLE' AND cmd.schema_name = 'public' THEN
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY;', cmd.object_identity);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

DROP EVENT TRIGGER IF EXISTS pgrst_enable_rls;
CREATE EVENT TRIGGER pgrst_enable_rls ON ddl_command_end
WHEN TAG IN ('CREATE TABLE')
EXECUTE FUNCTION public.pgrst_enable_rls();

-- 3. Configure Replica Identity Full for Realtime updates & deletes
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.learning_goals REPLICA IDENTITY FULL;
ALTER TABLE public.learning_journeys REPLICA IDENTITY FULL;
ALTER TABLE public.concepts REPLICA IDENTITY FULL;
ALTER TABLE public.concept_prerequisites REPLICA IDENTITY FULL;
ALTER TABLE public.learner_concept_state REPLICA IDENTITY FULL;
ALTER TABLE public.learning_activities REPLICA IDENTITY FULL;
ALTER TABLE public.questions REPLICA IDENTITY FULL;
ALTER TABLE public.attempts REPLICA IDENTITY FULL;
ALTER TABLE public.misconceptions REPLICA IDENTITY FULL;
ALTER TABLE public.evidence REPLICA IDENTITY FULL;
ALTER TABLE public.route_events REPLICA IDENTITY FULL;
ALTER TABLE public.resources REPLICA IDENTITY FULL;
ALTER TABLE public.learning_squads REPLICA IDENTITY FULL;
ALTER TABLE public.squad_members REPLICA IDENTITY FULL;
ALTER TABLE public.squad_messages REPLICA IDENTITY FULL;

-- 4. Ensure publication supabase_realtime exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 5. Add all tables to supabase_realtime publication
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'profiles',
    'learning_goals',
    'learning_journeys',
    'concepts',
    'concept_prerequisites',
    'learner_concept_state',
    'learning_activities',
    'questions',
    'attempts',
    'misconceptions',
    'evidence',
    'route_events',
    'resources',
    'learning_squads',
    'squad_members',
    'squad_messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls
  LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    END IF;
  END LOOP;
END $$;
