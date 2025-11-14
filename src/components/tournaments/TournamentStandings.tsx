import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GroupStandings } from "./GroupStandings";
import { KnockoutBracket } from "./KnockoutBracket";
import { RoundRobinStandings } from "./RoundRobinStandings";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

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

  // Verificar se há times mas sem sorteio (para mostrar alerta)
  const hasTeamsWithoutDraws = approvedTeams.length > 0 && teamDraws.length === 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  if (hasTeamsWithoutDraws) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          O organizador ainda não realizou o sorteio dos times. 
          {approvedTeams.length > 0 && ` Já há ${approvedTeams.length} time(s) inscrito(s).`}
          {' '}A classificação será exibida após o sorteio.
        </AlertDescription>
      </Alert>
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
