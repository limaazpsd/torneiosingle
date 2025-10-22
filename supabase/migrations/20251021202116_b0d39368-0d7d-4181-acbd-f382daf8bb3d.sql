-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('groups-knockout', 'knockout', 'league', 'fighting')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT NOT NULL,
  max_participants INTEGER NOT NULL CHECK (max_participants >= 2 AND max_participants <= 100),
  entry_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (entry_fee >= 0),
  registration_deadline DATE NOT NULL,
  prize_pool DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (prize_pool >= 0),
  first_place_percentage INTEGER NOT NULL CHECK (first_place_percentage >= 0 AND first_place_percentage <= 100),
  second_place_percentage INTEGER NOT NULL CHECK (second_place_percentage >= 0 AND second_place_percentage <= 100),
  third_place_percentage INTEGER NOT NULL CHECK (third_place_percentage >= 0 AND third_place_percentage <= 100),
  rules TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registration_open' CHECK (status IN ('draft', 'registration_open', 'registration_closed', 'in_progress', 'completed')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  captain_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT '⚽',
  players_count INTEGER NOT NULL DEFAULT 1 CHECK (players_count >= 1),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, name)
);

-- Create team_registrations table
CREATE TABLE public.team_registrations (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for tournaments
CREATE POLICY "Public tournaments are viewable by everyone"
  ON public.tournaments FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own tournaments"
  ON public.tournaments FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Authenticated users can create tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own tournaments"
  ON public.tournaments FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own tournaments"
  ON public.tournaments FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS Policies for teams
CREATE POLICY "Teams of public tournaments are viewable"
  ON public.teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE tournaments.id = teams.tournament_id
      AND tournaments.is_public = true
    )
  );

CREATE POLICY "Users can view teams they captain"
  ON public.teams FOR SELECT
  USING (auth.uid() = captain_id);

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "Captains can update their own teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() = captain_id);

CREATE POLICY "Captains can delete their own teams"
  ON public.teams FOR DELETE
  USING (auth.uid() = captain_id);

-- RLS Policies for team_registrations
CREATE POLICY "Users can view registrations of public tournament teams"
  ON public.team_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      JOIN public.tournaments ON tournaments.id = teams.tournament_id
      WHERE teams.id = team_registrations.team_id
      AND tournaments.is_public = true
    )
  );

CREATE POLICY "Users can view their own registrations"
  ON public.team_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Team captains can view their team registrations"
  ON public.team_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_registrations.team_id
      AND teams.captain_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create registrations"
  ON public.team_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function and trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_tournaments_creator_id ON public.tournaments(creator_id);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_is_public ON public.tournaments(is_public);
CREATE INDEX idx_teams_tournament_id ON public.teams(tournament_id);
CREATE INDEX idx_teams_captain_id ON public.teams(captain_id);
CREATE INDEX idx_team_registrations_team_id ON public.team_registrations(team_id);
CREATE INDEX idx_team_registrations_user_id ON public.team_registrations(user_id);