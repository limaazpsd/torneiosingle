-- Remover a view que causa problema de segurança
DROP VIEW IF EXISTS public.tournament_top_scorers;

-- Em vez de usar view, faremos as queries diretamente no código TypeScript
-- Isso é mais seguro e permite melhor controle de RLS