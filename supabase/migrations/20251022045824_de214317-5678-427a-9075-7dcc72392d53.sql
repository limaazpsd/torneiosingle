-- Create groups table for tournament group stage
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_teams table for team standings within groups
CREATE TABLE IF NOT EXISTS public.group_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  goal_difference INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, team_id)
);

-- Create matches table for tournament matches
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  home_score INTEGER,
  away_score INTEGER,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  round TEXT NOT NULL DEFAULT 'group_stage',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Groups of public tournaments are viewable"
  ON public.groups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tournaments
    WHERE tournaments.id = groups.tournament_id
    AND tournaments.is_public = true
  ));

CREATE POLICY "Tournament creators can manage groups"
  ON public.groups FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tournaments
    WHERE tournaments.id = groups.tournament_id
    AND tournaments.creator_id = auth.uid()
  ));

-- RLS Policies for group_teams
CREATE POLICY "Group teams of public tournaments are viewable"
  ON public.group_teams FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM groups
    JOIN tournaments ON tournaments.id = groups.tournament_id
    WHERE groups.id = group_teams.group_id
    AND tournaments.is_public = true
  ));

CREATE POLICY "Tournament creators can manage group teams"
  ON public.group_teams FOR ALL
  USING (EXISTS (
    SELECT 1 FROM groups
    JOIN tournaments ON tournaments.id = groups.tournament_id
    WHERE groups.id = group_teams.group_id
    AND tournaments.creator_id = auth.uid()
  ));

-- RLS Policies for matches
CREATE POLICY "Matches of public tournaments are viewable"
  ON public.matches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tournaments
    WHERE tournaments.id = matches.tournament_id
    AND tournaments.is_public = true
  ));

CREATE POLICY "Tournament creators can manage matches"
  ON public.matches FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tournaments
    WHERE tournaments.id = matches.tournament_id
    AND tournaments.creator_id = auth.uid()
  ));