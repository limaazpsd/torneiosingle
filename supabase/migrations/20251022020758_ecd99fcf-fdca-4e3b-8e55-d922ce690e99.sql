-- Criar tabela de equipes independentes
CREATE TABLE public.independent_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '⚽',
  description TEXT,
  creator_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de membros das equipes
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.independent_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'captain', 'member'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Criar tabela de convites para equipes
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.independent_teams(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invited_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(team_id, invited_user_id)
);

-- Habilitar RLS
ALTER TABLE public.independent_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas para independent_teams
CREATE POLICY "Users can view teams they are members of"
ON public.independent_teams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = independent_teams.id
    AND team_members.user_id = auth.uid()
    AND team_members.status = 'active'
  )
);

CREATE POLICY "Users can create teams"
ON public.independent_teams FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Team captains can update their teams"
ON public.independent_teams FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = independent_teams.id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'captain'
  )
);

CREATE POLICY "Team captains can delete their teams"
ON public.independent_teams FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = independent_teams.id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'captain'
  )
);

-- Políticas para team_members
CREATE POLICY "Users can view members of their teams"
ON public.team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Team captains can add members"
ON public.team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = team_members.team_id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'captain'
  )
);

CREATE POLICY "Team captains can update members"
ON public.team_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'captain'
  )
);

CREATE POLICY "Team captains can remove members"
ON public.team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'captain'
  )
);

-- Políticas para team_invitations
CREATE POLICY "Users can view invitations sent to them"
ON public.team_invitations FOR SELECT
USING (auth.uid() = invited_user_id);

CREATE POLICY "Team captains can view invitations for their teams"
ON public.team_invitations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = team_invitations.team_id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'captain'
  )
);

CREATE POLICY "Team captains can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
  auth.uid() = inviter_id AND
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = team_invitations.team_id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'captain'
  )
);

CREATE POLICY "Invited users can update their invitations"
ON public.team_invitations FOR UPDATE
USING (auth.uid() = invited_user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_independent_teams_updated_at
BEFORE UPDATE ON public.independent_teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para aceitar convite e adicionar membro automaticamente
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
  v_invited_user_id UUID;
BEGIN
  -- Buscar dados do convite
  SELECT team_id, invited_user_id
  INTO v_team_id, v_invited_user_id
  FROM public.team_invitations
  WHERE id = invitation_id
  AND invited_user_id = auth.uid()
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite não encontrado ou já respondido';
  END IF;

  -- Atualizar status do convite
  UPDATE public.team_invitations
  SET status = 'accepted', responded_at = now()
  WHERE id = invitation_id;

  -- Adicionar usuário como membro da equipe
  INSERT INTO public.team_members (team_id, user_id, role, status)
  VALUES (v_team_id, v_invited_user_id, 'member', 'active')
  ON CONFLICT (team_id, user_id) DO UPDATE
  SET status = 'active', joined_at = now();
END;
$$;