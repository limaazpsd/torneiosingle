-- Criar tabela para sorteio persistente de times
CREATE TABLE IF NOT EXISTS public.team_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  bracket_position INTEGER,
  drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, team_id)
);

-- Habilitar RLS
ALTER TABLE public.team_draws ENABLE ROW LEVEL SECURITY;

-- Policy para visualização pública
CREATE POLICY "Draws of public tournaments are viewable"
ON public.team_draws
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments 
    WHERE tournaments.id = team_draws.tournament_id 
    AND tournaments.is_public = true
  )
);

-- Policy para criadores gerenciarem
CREATE POLICY "Tournament creators can manage draws"
ON public.team_draws
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments 
    WHERE tournaments.id = team_draws.tournament_id 
    AND tournaments.creator_id = auth.uid()
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_team_draws_tournament ON public.team_draws(tournament_id);
CREATE INDEX IF NOT EXISTS idx_team_draws_team ON public.team_draws(team_id);
CREATE INDEX IF NOT EXISTS idx_team_draws_group ON public.team_draws(group_id);