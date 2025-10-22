-- Add logo_url column to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Make emoji nullable in teams table
ALTER TABLE public.teams ALTER COLUMN emoji DROP NOT NULL;
ALTER TABLE public.teams ALTER COLUMN emoji SET DEFAULT NULL;

-- Add constraint for max 15 players
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS max_players_check;
ALTER TABLE public.teams ADD CONSTRAINT max_players_check CHECK (players_count <= 15 AND players_count >= 1);

-- Add reference to independent teams
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS independent_team_id UUID REFERENCES public.independent_teams(id) ON DELETE SET NULL;