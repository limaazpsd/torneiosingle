import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Team {
  id: string;
  name: string;
  emoji?: string;
  logo_url?: string;
}

interface GroupTeam {
  team_id: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

interface Group {
  id: string;
  name: string;
  display_order: number;
}

interface TeamDraw {
  team_id: string;
  group_id: string;
}

interface Props {
  groups: Group[];
  groupTeams: GroupTeam[];
  registeredTeams: Team[];
  teamDraws: TeamDraw[];
  maxParticipants: number;
}

export function GroupStandings({ 
  groups, 
  groupTeams, 
  registeredTeams, 
  teamDraws,
  maxParticipants 
}: Props) {
  // Calcular times por grupo
  const teamsPerGroup = Math.ceil(maxParticipants / groups.length);

  // Organizar times por grupo
  const getTeamsForGroup = (groupId: string) => {
    // Se não há sorteios, distribuir times sequencialmente (torneios antigos)
    if (teamDraws.length === 0 && registeredTeams.length > 0) {
      const groupIndex = groups.findIndex(g => g.id === groupId);
      const teamsInGroup: Team[] = [];
      
      for (let i = groupIndex; i < registeredTeams.length; i += groups.length) {
        if (teamsInGroup.length < teamsPerGroup) {
          teamsInGroup.push(registeredTeams[i]);
        }
      }
      
      const emptySlots = Math.max(0, teamsPerGroup - teamsInGroup.length);
      const placeholders = Array(emptySlots).fill(null);
      return [...teamsInGroup, ...placeholders];
    }
    
    // Buscar times sorteados para este grupo (torneios novos)
    const drawnTeamIds = teamDraws
      .filter(draw => draw.group_id === groupId)
      .map(draw => draw.team_id);

    const drawnTeams = registeredTeams.filter(team => 
      drawnTeamIds.includes(team.id)
    );

    // Preencher com "A DEFINIR" se necessário
    const emptySlots = Math.max(0, teamsPerGroup - drawnTeams.length);
    const placeholders = Array(emptySlots).fill(null);

    return [...drawnTeams, ...placeholders];
  };

  // Obter estatísticas do time
  const getTeamStats = (teamId: string) => {
    return groupTeams.find(gt => gt.team_id === teamId) || {
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
    };
  };

  // Cores para cada grupo
  const groupColors = [
    "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
    "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
  ];

  // Ordenar grupos por display_order
  const sortedGroups = [...groups].sort((a, b) => a.display_order - b.display_order);

  // Verificar se há grupos configurados
  if (!groups || groups.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Grupos não configurados</AlertTitle>
        <AlertDescription>
          Este torneio precisa ter grupos criados. Entre no painel de gerenciamento para criar os grupos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {sortedGroups.map((group, index) => {
        const teams = getTeamsForGroup(group.id);
        const colorClass = groupColors[index % groupColors.length];
        const borderColor = index % 2 === 0 ? 'border-cyan-500/30' : 'border-green-500/30';
        const hoverBorder = index % 2 === 0 ? 'hover:border-cyan-500/60' : 'hover:border-green-500/60';
        const hoverShadow = index % 2 === 0 ? 'hover:shadow-cyan-500/20' : 'hover:shadow-green-500/20';
        const textColor = index % 2 === 0 ? 'text-cyan-400' : 'text-green-400';
        const badgeBg = index % 2 === 0 ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-green-500/20 border-green-500/30';

        return (
          <Card key={group.id} className={`bg-card/50 ${borderColor} ${hoverBorder} hover:shadow-xl ${hoverShadow} transition-all duration-300`}>
            <CardHeader className="relative border-b border-border/20">
              <CardTitle className={`${textColor} text-2xl flex items-center gap-2`}>
                <span className="text-3xl">⚽</span>
                {group.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground pb-2 border-b border-border/50">
                  <div className="col-span-5">Time</div>
                  <div className="col-span-2 text-center">P</div>
                  <div className="col-span-2 text-center">V</div>
                  <div className="col-span-2 text-center">SG</div>
                  <div className="col-span-1 text-center">GP</div>
                </div>
                {teams.map((team, idx) => {
                  if (!team) {
                    return (
                      <div key={`placeholder-${idx}`} className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg border bg-card/30 border-border/30">
                        <div className="col-span-5 text-muted-foreground italic">A DEFINIR</div>
                        <div className="col-span-2 text-center text-muted-foreground">-</div>
                        <div className="col-span-2 text-center text-muted-foreground">-</div>
                        <div className="col-span-2 text-center text-muted-foreground">-</div>
                        <div className="col-span-1 text-center text-muted-foreground">-</div>
                      </div>
                    );
                  }

                  const stats = getTeamStats(team.id);
                  const isQualified = idx < 2; // Top 2 qualify

                  return (
                    <div
                      key={team.id}
                      className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border transition-all duration-300 ${
                        isQualified
                          ? index % 2 === 0
                            ? "bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500/50 hover:shadow-md hover:shadow-cyan-500/10"
                            : "bg-green-500/10 border-green-500/30 hover:border-green-500/50 hover:shadow-md hover:shadow-green-500/10"
                          : "bg-card/30 border-border/30 hover:border-border/50"
                      }`}
                    >
                      <div className="col-span-5 flex items-center gap-2">
                        {team.emoji && <span className="text-2xl">{team.emoji}</span>}
                        <span className="font-semibold text-foreground">{team.name}</span>
                      </div>
                      <div className="col-span-2 text-center font-bold text-foreground">{stats.points}</div>
                      <div className="col-span-2 text-center text-muted-foreground">{stats.wins}</div>
                      <div className="col-span-2 text-center text-muted-foreground">{stats.goal_difference}</div>
                      <div className="col-span-1 text-center text-muted-foreground">{stats.goals_for}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
