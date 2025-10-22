CREATE OR REPLACE FUNCTION public.create_independent_team(
  _name text,
  _sport text,
  _players_count integer,
  _description text,
  _emoji text,
  _logo_url text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  -- Create team with creator_id from auth context
  INSERT INTO public.independent_teams (name, sport, players_count, description, emoji, logo_url, creator_id)
  VALUES (_name, _sport, _players_count, _description, _emoji, _logo_url, auth.uid())
  RETURNING id INTO v_team_id;

  -- Add creator as captain
  INSERT INTO public.team_members (team_id, user_id, role, status)
  VALUES (v_team_id, auth.uid(), 'captain', 'active')
  ON CONFLICT (team_id, user_id) DO UPDATE SET status = 'active';

  RETURN v_team_id;
END;
$$;