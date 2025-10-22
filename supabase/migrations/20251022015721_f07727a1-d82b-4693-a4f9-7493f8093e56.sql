-- Adicionar campos de perfil de usuário
ALTER TABLE public.profiles
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN document_type TEXT CHECK (document_type IN ('cpf', 'rg')),
ADD COLUMN document_number TEXT,
ADD COLUMN avatar_url TEXT;

-- Criar índice único para username
CREATE UNIQUE INDEX idx_profiles_username ON public.profiles(username);

-- Criar função de validação de username (apenas letras, números e underscore)
CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar trigger para validar username
DROP TRIGGER IF EXISTS validate_username_trigger ON public.profiles;
CREATE TRIGGER validate_username_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_username();

-- Comentários nas colunas
COMMENT ON COLUMN public.profiles.username IS 'Username único do usuário no formato @username';
COMMENT ON COLUMN public.profiles.document_type IS 'Tipo de documento: cpf ou rg';
COMMENT ON COLUMN public.profiles.document_number IS 'Número do documento';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL do avatar do usuário (opcional)';