-- Create player_statistics table to track player stats per tournament
CREATE TABLE IF NOT EXISTS public.player_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  yellow_cards INTEGER NOT NULL DEFAULT 0,
  red_cards INTEGER NOT NULL DEFAULT 0,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspension_matches_remaining INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, player_id, team_id)
);

-- Create match_events table to track individual events in matches
CREATE TABLE IF NOT EXISTS public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card')),
  minute INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on player_statistics
ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;

-- RLS policies for player_statistics
CREATE POLICY "Player statistics of public tournaments are viewable"
  ON public.player_statistics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE tournaments.id = player_statistics.tournament_id
      AND tournaments.is_public = true
    )
  );

CREATE POLICY "Tournament creators can manage player statistics"
  ON public.player_statistics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE tournaments.id = player_statistics.tournament_id
      AND tournaments.creator_id = auth.uid()
    )
  );

-- Enable RLS on match_events
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for match_events
CREATE POLICY "Match events of public tournaments are viewable"
  ON public.match_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      JOIN public.tournaments ON tournaments.id = matches.tournament_id
      WHERE matches.id = match_events.match_id
      AND tournaments.is_public = true
    )
  );

CREATE POLICY "Tournament creators can manage match events"
  ON public.match_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      JOIN public.tournaments ON tournaments.id = matches.tournament_id
      WHERE matches.id = match_events.match_id
      AND tournaments.creator_id = auth.uid()
    )
  );

-- Create trigger for player_statistics updated_at
CREATE TRIGGER update_player_statistics_updated_at
  BEFORE UPDATE ON public.player_statistics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_player_statistics_tournament ON public.player_statistics(tournament_id);
CREATE INDEX idx_player_statistics_player ON public.player_statistics(player_id);
CREATE INDEX idx_player_statistics_team ON public.player_statistics(team_id);
CREATE INDEX idx_match_events_match ON public.match_events(match_id);
CREATE INDEX idx_match_events_player ON public.match_events(player_id);
CREATE INDEX idx_match_events_type ON public.match_events(event_type);