-- Add slug column to tournaments table
ALTER TABLE public.tournaments ADD COLUMN slug text UNIQUE;

-- Create index for better performance on slug lookups
CREATE INDEX idx_tournaments_slug ON public.tournaments(slug);

-- Add phone and birth_date to profiles table
ALTER TABLE public.profiles ADD COLUMN phone text;
ALTER TABLE public.profiles ADD COLUMN birth_date date;

-- Function to generate slug from tournament name
CREATE OR REPLACE FUNCTION public.generate_slug(name text)
RETURNS text
LANGUAGE plpgsql
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

-- Function to auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.set_tournament_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate slug
CREATE TRIGGER set_tournament_slug_trigger
BEFORE INSERT OR UPDATE ON public.tournaments
FOR EACH ROW
EXECUTE FUNCTION public.set_tournament_slug();

-- Generate slugs for existing tournaments
UPDATE public.tournaments
SET slug = generate_slug(name)
WHERE slug IS NULL;