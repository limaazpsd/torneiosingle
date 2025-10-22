-- Adicionar campos sport e players_count à tabela independent_teams
ALTER TABLE public.independent_teams
ADD COLUMN sport TEXT NOT NULL DEFAULT 'Futebol',
ADD COLUMN players_count INTEGER NOT NULL DEFAULT 5;