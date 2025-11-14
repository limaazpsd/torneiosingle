import { Card, CardContent } from "@/components/ui/card";
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

interface TeamStats {
  team_id: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

interface Props {
  registeredTeams: Team[];
  teamStats: TeamStats[];
  maxParticipants: number;
}

export function RoundRobinStandings({ registeredTeams, teamStats, maxParticipants }: Props) {
  // Obter estatísticas do time ou valores padrão
  const getTeamStats = (teamId: string): TeamStats => {
    return teamStats.find(ts => ts.team_id === teamId) || {
      team_id: teamId,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
    };
  };

  // Ordenar times por pontos, vitórias, saldo de gols, gols feitos
  const sortedTeams = [...registeredTeams]
    .map(team => ({
      team,
      stats: getTeamStats(team.id),
    }))
    .sort((a, b) => {
      // Pontos
      if (b.stats.points !== a.stats.points) {
        return b.stats.points - a.stats.points;
      }
      // Vitórias
      if (b.stats.wins !== a.stats.wins) {
        return b.stats.wins - a.stats.wins;
      }
      // Saldo de gols
      if (b.stats.goal_difference !== a.stats.goal_difference) {
        return b.stats.goal_difference - a.stats.goal_difference;
      }
      // Gols feitos
      return b.stats.goals_for - a.stats.goals_for;
    });

  // Preencher vagas restantes com "A DEFINIR"
  const emptySlots = maxParticipants - registeredTeams.length;
  const placeholders = Array(emptySlots).fill(null);

  return (
    <Card>
      <CardContent className="pt-6">
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
              <TableHead className="text-center">GP</TableHead>
              <TableHead className="text-center">GC</TableHead>
              <TableHead className="text-center">SG</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map(({ team, stats }, idx) => {
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
                  <TableCell className="text-center">{stats.goals_for}</TableCell>
                  <TableCell className="text-center">{stats.goals_against}</TableCell>
                  <TableCell className="text-center">{stats.goal_difference}</TableCell>
                </TableRow>
              );
            })}
            
            {placeholders.map((_, idx) => (
              <TableRow key={`placeholder-${idx}`}>
                <TableCell className="font-medium">
                  {sortedTeams.length + idx + 1}
                </TableCell>
                <TableCell className="text-muted-foreground italic">
                  A DEFINIR
                </TableCell>
                <TableCell className="text-center">-</TableCell>
                <TableCell className="text-center">-</TableCell>
                <TableCell className="text-center">-</TableCell>
                <TableCell className="text-center">-</TableCell>
                <TableCell className="text-center">-</TableCell>
                <TableCell className="text-center">-</TableCell>
                <TableCell className="text-center">-</TableCell>
                <TableCell className="text-center">-</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
