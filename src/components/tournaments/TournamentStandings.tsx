import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GroupStandings } from "./GroupStandings";
import { KnockoutBracket } from "./KnockoutBracket";
import { RoundRobinStandings } from "./RoundRobinStandings";
import { Skeleton } from "@/components/ui/skeleton";

interface Tournament {
  id: string;
  format: string;
  max_participants: number;
}

interface Team {
  id: string;
  name: string;
  emoji?: string;
  logo_url?: string;
  payment_status: string;
}

interface Props {
  tournament: Tournament;
  teams: Team[];
}

export function TournamentStandings({ tournament, teams }: Props) {
  // Buscar grupos se necessário
  const { data: groups = [] } = useQuery({
    queryKey: ['tournament-groups', tournament.id],
    queryFn: async () => {
      if (tournament.format !== 'groups-knockout' && tournament.format !== 'groups-only') {
        return [];
      }

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('tournament_id', tournament.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: tournament.format === 'groups-knockout' || tournament.format === 'groups-only',
  });

  // Buscar estatísticas dos times nos grupos
  const { data: groupTeams = [] } = useQuery({
    queryKey: ['tournament-group-teams', tournament.id],
    queryFn: async () => {
      if (tournament.format !== 'groups-knockout' && tournament.format !== 'groups-only') {
        return [];
      }

      const { data, error } = await supabase
        .from('group_teams')
        .select('*')
        .in('group_id', groups.map(g => g.id));

      if (error) throw error;
      return data || [];
    },
    enabled: (tournament.format === 'groups-knockout' || tournament.format === 'groups-only') && groups.length > 0,
  });

  // Buscar sorteios (team_draws)
  const { data: teamDraws = [], isLoading } = useQuery({
    queryKey: ['tournament-draws', tournament.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_draws')
        .select('*')
        .eq('tournament_id', tournament.id);

      if (error) throw error;
      return data || [];
    },
  });

  // Filtrar apenas times aprovados
  const approvedTeams = teams.filter(t => t.payment_status === 'approved');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  // Renderizar componente baseado no formato
  switch (tournament.format) {
    case 'groups-knockout':
    case 'groups-only':
      return (
        <GroupStandings
          groups={groups}
          groupTeams={groupTeams}
          registeredTeams={approvedTeams}
          teamDraws={teamDraws}
          maxParticipants={tournament.max_participants}
        />
      );

    case 'knockout':
      return (
        <KnockoutBracket
          registeredTeams={approvedTeams}
          teamDraws={teamDraws}
          maxParticipants={tournament.max_participants}
        />
      );

    case 'round-robin':
      return (
        <RoundRobinStandings
          registeredTeams={approvedTeams}
          teamStats={groupTeams}
          maxParticipants={tournament.max_participants}
        />
      );

    default:
      return (
        <div className="text-center text-muted-foreground py-8">
          Formato de torneio não suportado
        </div>
      );
  }
}
