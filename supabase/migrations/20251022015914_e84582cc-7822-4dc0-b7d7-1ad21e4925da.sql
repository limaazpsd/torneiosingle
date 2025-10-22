-- Atualizar função handle_new_user para incluir username e documento
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, username, document_type, document_number)
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