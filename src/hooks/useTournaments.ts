import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Tournament {
  id: string;
  creator_id: string;
  name: string;
  sport: string;
  format: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants: number;
  entry_fee: number;
  registration_deadline: string;
  prize_pool: number;
  first_place_percentage: number;
  second_place_percentage: number;
  third_place_percentage: number;
  rules: string;
  status: string;
  is_public: boolean;
  slug: string | null;
  created_at: string;
  updated_at: string;
  teams?: { count: number }[];
}

export interface TournamentWithStats extends Tournament {
  teams_count: number;
  revenue: number;
}

// Hook para buscar torneios do usuário
export const useMyTournaments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['myTournaments', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('tournaments')
        .select('*, teams(id)')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calcular estatísticas
      return data.map((tournament) => {
        const teamsCount = tournament.teams?.length || 0;
        return {
          ...tournament,
          teams_count: teamsCount,
          revenue: teamsCount * Number(tournament.entry_fee),
          slug: tournament.slug,
          teams: undefined, // Remove teams array do retorno
        };
      }) as TournamentWithStats[];
    },
    enabled: !!user,
  });
};

// Hook para buscar estatísticas do dashboard
export const useMyTournamentStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['myTournamentStats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: tournaments, error } = await (supabase as any)
        .from('tournaments')
        .select('*, teams(id)')
        .eq('creator_id', user.id);

      if (error) throw error;

      const activeTournaments = tournaments.filter(
        (t) => t.status === 'registration_open' || t.status === 'in_progress'
      ).length;

      const totalParticipants = tournaments.reduce(
        (sum, t) => sum + (t.teams?.length || 0),
        0
      );

      const totalRevenue = tournaments.reduce(
        (sum, t) => sum + ((t.teams?.length || 0) * Number(t.entry_fee)),
        0
      );

      // Contar próximos jogos (torneios que ainda não terminaram)
      const upcomingMatches = tournaments.filter(
        (t) => t.status !== 'completed'
      ).length;

      return {
        activeTournaments,
        totalParticipants,
        totalRevenue,
        upcomingMatches,
      };
    },
    enabled: !!user,
  });
};

// Hook para buscar torneios públicos com filtros
export const usePublicTournaments = (filters?: {
  sport?: string;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['publicTournaments', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('tournaments')
        .select('*, teams(id)')
        .eq('is_public', true);

      if (filters?.sport) {
        query = query.eq('sport', filters.sport);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      query = query.order('start_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return data.map((tournament) => ({
        ...tournament,
        teams_count: tournament.teams?.length || 0,
        available_spots: tournament.max_participants - (tournament.teams?.length || 0),
      }));
    },
  });
};

// Hook para buscar um torneio específico
export const useTournament = (id: string | undefined) => {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await (supabase as any)
        .from('tournaments')
        .select('*, teams(*, profiles(name))')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    },
    enabled: !!id,
  });
};

// Hook para buscar um torneio específico por slug
export const useTournamentBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['tournament-by-slug', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await (supabase as any)
        .from('tournaments')
        .select('*, teams(*, profiles(name))')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;

      return data;
    },
    enabled: !!slug,
  });
};
