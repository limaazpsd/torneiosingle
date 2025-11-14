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

        return (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className={colorClass}>
                  {group.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Pos</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center">J</TableHead>
                    <TableHead className="text-center">V</TableHead>
                    <TableHead className="text-center">E</TableHead>
                    <TableHead className="text-center">D</TableHead>
                    <TableHead className="text-center">SG</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team, idx) => {
                    if (!team) {
                      return (
                        <TableRow key={`placeholder-${idx}`}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell className="text-muted-foreground italic">
                            A DEFINIR
                          </TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                        </TableRow>
                      );
                    }

                    const stats = getTeamStats(team.id);
                    const gamesPlayed = stats.wins + stats.draws + stats.losses;

                    return (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {team.emoji && <span>{team.emoji}</span>}
                            <span className="font-medium">{team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {stats.points}
                        </TableCell>
                        <TableCell className="text-center">{gamesPlayed}</TableCell>
                        <TableCell className="text-center">{stats.wins}</TableCell>
                        <TableCell className="text-center">{stats.draws}</TableCell>
                        <TableCell className="text-center">{stats.losses}</TableCell>
                        <TableCell className="text-center">{stats.goal_difference}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
