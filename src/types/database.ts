// Tipos temporários para o banco de dados
export interface Tournament {
  id: string;
  name: string;
  sport: string;
  format: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_participants: number;
  entry_fee: number;
  prize_pool: number;
  first_place_percentage: number;
  second_place_percentage: number;
  third_place_percentage: number;
  status: string;
  rules: string;
  creator_id: string;
  is_public: boolean;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  captain_id: string;
  emoji: string | null;
  logo_url?: string | null;
  independent_team_id?: string | null;
  players_count: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  username?: string;
  document_type?: 'cpf' | 'rg';
  document_number?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamRegistration {
  id: string;
  team_id: string;
  user_id: string;
  status: string;
  created_at: string;
}

export interface TournamentWithStats extends Tournament {
  teams_count: number;
  revenue: number;
  teams?: Team[];
  slug: string | null;
}

export interface IndependentTeam {
  id: string;
  name: string;
  emoji: string | null;
  sport: string;
  players_count: number;
  description: string | null;
  logo_url?: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'captain' | 'member';
  status: 'active' | 'inactive';
  joined_at: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_id: string;
  invited_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  responded_at: string | null;
}
