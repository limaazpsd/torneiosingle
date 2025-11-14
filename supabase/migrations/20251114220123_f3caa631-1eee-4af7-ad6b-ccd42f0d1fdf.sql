-- Corrigir constraint de payment_status para incluir 'approved' e 'rejected'
ALTER TABLE teams 
  DROP CONSTRAINT IF EXISTS teams_payment_status_check;

ALTER TABLE teams
  ADD CONSTRAINT teams_payment_status_check 
  CHECK (payment_status IN ('pending', 'approved', 'rejected', 'paid'));