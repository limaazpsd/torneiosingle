-- ===================================================================
-- EXECUTE ESTE SQL NO EDITOR SQL DO SUPABASE
-- ===================================================================
-- Este script atualiza o trigger de registro para salvar automaticamente
-- username, document_type e document_number quando um usuário se registra
-- ===================================================================

-- Atualizar a função handle_new_user para incluir os novos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    name,
    username,
    document_type,
    document_number
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'document_type',
    NEW.raw_user_meta_data->>'document_number'
  );
  RETURN NEW;
END;
$$;

-- Garantir que as políticas RLS permitam atualização dos novos campos
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===================================================================
-- SUCESSO! O trigger foi atualizado.
-- Agora quando novos usuários se registrarem, todos os dados serão
-- salvos automaticamente no perfil.
-- ===================================================================
