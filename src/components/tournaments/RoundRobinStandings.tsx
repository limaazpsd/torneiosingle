import { Card, CardContent } from "@/components/ui/card";

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
    <Card className="bg-card/50 border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground pb-2 border-b border-border/50">
            <div className="col-span-4">Time</div>
            <div className="col-span-1 text-center">P</div>
            <div className="col-span-1 text-center">J</div>
            <div className="col-span-1 text-center">V</div>
            <div className="col-span-1 text-center">E</div>
            <div className="col-span-1 text-center">D</div>
            <div className="col-span-1 text-center">GP</div>
            <div className="col-span-1 text-center">GC</div>
            <div className="col-span-1 text-center">SG</div>
          </div>
          
          {sortedTeams.map(({ team, stats }, idx) => {
            const gamesPlayed = stats.wins + stats.draws + stats.losses;
            const isTop3 = idx < 3; // Top 3 highlighted
            
            return (
              <div
                key={team.id}
                className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border transition-all duration-300 ${
                  isTop3
                    ? "bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500/50 hover:shadow-md hover:shadow-cyan-500/10"
                    : "bg-card/30 border-border/30 hover:border-border/50"
                }`}
              >
                <div className="col-span-4 flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">{idx + 1}.</span>
                  {team.emoji && <span className="text-2xl">{team.emoji}</span>}
                  <span className="font-semibold text-foreground">{team.name}</span>
                </div>
                <div className="col-span-1 text-center font-bold text-foreground">{stats.points}</div>
                <div className="col-span-1 text-center text-muted-foreground">{gamesPlayed}</div>
                <div className="col-span-1 text-center text-muted-foreground">{stats.wins}</div>
                <div className="col-span-1 text-center text-muted-foreground">{stats.draws}</div>
                <div className="col-span-1 text-center text-muted-foreground">{stats.losses}</div>
                <div className="col-span-1 text-center text-muted-foreground">{stats.goals_for}</div>
                <div className="col-span-1 text-center text-muted-foreground">{stats.goals_against}</div>
                <div className="col-span-1 text-center text-muted-foreground">{stats.goal_difference}</div>
              </div>
            );
          })}

          {/* Placeholders para times que ainda não se inscreveram */}
          {placeholders.map((_, idx) => (
            <div key={`placeholder-${idx}`} className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg border bg-card/30 border-border/30">
              <div className="col-span-4 flex items-center gap-2">
                <span className="text-muted-foreground font-medium">{sortedTeams.length + idx + 1}.</span>
                <span className="text-muted-foreground italic">A DEFINIR</span>
              </div>
              <div className="col-span-1 text-center text-muted-foreground">-</div>
              <div className="col-span-1 text-center text-muted-foreground">-</div>
              <div className="col-span-1 text-center text-muted-foreground">-</div>
              <div className="col-span-1 text-center text-muted-foreground">-</div>
              <div className="col-span-1 text-center text-muted-foreground">-</div>
              <div className="col-span-1 text-center text-muted-foreground">-</div>
              <div className="col-span-1 text-center text-muted-foreground">-</div>
              <div className="col-span-1 text-center text-muted-foreground">-</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
