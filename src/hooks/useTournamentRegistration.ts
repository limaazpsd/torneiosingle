import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { IndependentTeam } from "@/types/database";

interface AvailableTeam extends IndependentTeam {
  members_count: number;
  is_registered: boolean;
}

export const useUserTeamsForTournament = (tournamentId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-teams-for-tournament', user?.id, tournamentId],
    queryFn: async () => {
      if (!user?.id || !tournamentId) return [];

      // Get user's independent teams where they are captain
      const { data: teams, error: teamsError } = await supabase
        .from('independent_teams')
        .select('*')
        .eq('creator_id', user.id);

      if (teamsError) throw teamsError;
      if (!teams) return [];

      // Get member counts and registration status for each team
      const teamsWithStatus = await Promise.all(
        teams.map(async (team) => {
          // Count active members
          const { count: membersCount } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)
            .eq('status', 'active');

          // Check if team is already registered in this tournament
          const { data: registration } = await supabase
            .from('teams')
            .select('id')
            .eq('independent_team_id', team.id)
            .eq('tournament_id', tournamentId)
            .maybeSingle();

          return {
            ...team,
            members_count: membersCount || 0,
            is_registered: !!registration,
          };
        })
      );

      return teamsWithStatus as AvailableTeam[];
    },
    enabled: !!user?.id && !!tournamentId,
  });
};
