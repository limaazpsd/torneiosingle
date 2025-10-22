-- Ensure creator_id is auto-populated on insert
CREATE OR REPLACE FUNCTION public.set_creator_id_independent_teams()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.creator_id IS NULL THEN
    NEW.creator_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_creator_id_before_insert ON public.independent_teams;
CREATE TRIGGER set_creator_id_before_insert
BEFORE INSERT ON public.independent_teams
FOR EACH ROW
EXECUTE FUNCTION public.set_creator_id_independent_teams();

-- Allow creators to add themselves as captain right after team creation
DROP POLICY IF EXISTS "Creator can add self as captain" ON public.team_members;
CREATE POLICY "Creator can add self as captain"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'captain'
  AND EXISTS (
    SELECT 1 FROM public.independent_teams t
    WHERE t.id = team_id AND t.creator_id = auth.uid()
  )
);
