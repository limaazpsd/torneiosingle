-- Adicionar campo logo_url na tabela tournaments se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournaments' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE public.tournaments ADD COLUMN logo_url TEXT;
  END IF;
END $$;

-- Criar tabela para armazenar gols marcados
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  minute INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Política para visualizar gols de torneios públicos
CREATE POLICY "Goals of public tournaments are viewable"
  ON public.goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.tournaments t ON t.id = m.tournament_id
      WHERE m.id = goals.match_id AND t.is_public = true
    )
  );

-- Política para criadores de torneios gerenciarem gols
CREATE POLICY "Tournament creators can manage goals"
  ON public.goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.tournaments t ON t.id = m.tournament_id
      WHERE m.id = goals.match_id AND t.creator_id = auth.uid()
    )
  );

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_goals_match_id ON public.goals(match_id);
CREATE INDEX IF NOT EXISTS idx_goals_player_id ON public.goals(player_id);
CREATE INDEX IF NOT EXISTS idx_goals_team_id ON public.goals(team_id);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar view para estatísticas de artilheiros por torneio
CREATE OR REPLACE VIEW public.tournament_top_scorers AS
SELECT 
  t.id as tournament_id,
  g.player_id,
  p.name as player_name,
  p.avatar_url,
  teams.name as team_name,
  teams.emoji as team_emoji,
  teams.logo_url as team_logo_url,
  COUNT(g.id) as goals_count
FROM public.goals g
JOIN public.matches m ON m.id = g.match_id
JOIN public.tournaments t ON t.id = m.tournament_id
JOIN public.profiles p ON p.user_id = g.player_id
JOIN public.teams ON teams.id = g.team_id
GROUP BY t.id, g.player_id, p.name, p.avatar_url, teams.name, teams.emoji, teams.logo_url
ORDER BY goals_count DESC;

-- Conceder permissão para visualizar a view
GRANT SELECT ON public.tournament_top_scorers TO authenticated, anon;