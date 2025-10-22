-- Corrigir search_path na função de validação de username
CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Garantir que username sempre comece com @
  IF NEW.username IS NOT NULL AND NOT NEW.username LIKE '@%' THEN
    NEW.username := '@' || NEW.username;
  END IF;
  
  -- Validar formato (apenas letras, números e underscore após o @)
  IF NEW.username IS NOT NULL AND NEW.username !~ '^@[a-zA-Z0-9_]{2,19}$' THEN
    RAISE EXCEPTION 'Username deve ter entre 3 e 20 caracteres e conter apenas letras, números e underscore';
  END IF;
  
  -- Converter para minúsculo
  NEW.username := LOWER(NEW.username);
  
  RETURN NEW;
END;
$$;