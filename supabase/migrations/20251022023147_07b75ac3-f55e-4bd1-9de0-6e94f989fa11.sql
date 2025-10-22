-- Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS "Team captains can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team captains can remove members" ON public.team_members;
DROP POLICY IF EXISTS "Team captains can update members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view members of their teams" ON public.team_members;

-- Criar função security definer para verificar se usuário é capitão da equipe
CREATE OR REPLACE FUNCTION public.is_team_captain(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_id = _team_id
      AND user_id = _user_id
      AND role = 'captain'
      AND status = 'active'
  )
$$;

-- Criar função security definer para verificar se usuário é membro da equipe
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_id = _team_id
      AND user_id = _user_id
      AND status = 'active'
  )
$$;

-- Recriar políticas usando as funções security definer
CREATE POLICY "Team captains can add members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (public.is_team_captain(team_id, auth.uid()));

CREATE POLICY "Team captains can remove members" 
ON public.team_members 
FOR DELETE 
USING (public.is_team_captain(team_id, auth.uid()));

CREATE POLICY "Team captains can update members" 
ON public.team_members 
FOR UPDATE 
USING (public.is_team_captain(team_id, auth.uid()));

CREATE POLICY "Users can view members of their teams" 
ON public.team_members 
FOR SELECT 
USING (public.is_team_member(team_id, auth.uid()));