-- Fix search_path for generate_slug function
CREATE OR REPLACE FUNCTION public.generate_slug(name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(trim(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  
  final_slug := base_slug;
  
  -- Check if slug exists and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.tournaments WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;