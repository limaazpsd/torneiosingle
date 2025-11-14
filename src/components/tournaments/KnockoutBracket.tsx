import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Team {
  id: string;
  name: string;
  emoji?: string;
  logo_url?: string;
}

interface TeamDraw {
  team_id: string;
  bracket_position: number;
}

interface Props {
  registeredTeams: Team[];
  teamDraws: TeamDraw[];
  maxParticipants: number;
}

export function KnockoutBracket({ registeredTeams, teamDraws, maxParticipants }: Props) {
  // Determinar fase inicial baseado no número de vagas
  const getInitialRound = () => {
    if (maxParticipants >= 16) return "Oitavas de Final";
    if (maxParticipants >= 8) return "Quartas de Final";
    if (maxParticipants >= 4) return "Semifinais";
    return "Final";
  };

  // Criar array de posições do chaveamento
  const positions = Array.from({ length: maxParticipants }, (_, i) => i + 1);

  // Obter time para uma posição
  const getTeamForPosition = (position: number) => {
    // Se há sorteios, usar o sistema novo
    if (teamDraws.length > 0) {
      const draw = teamDraws.find(d => d.bracket_position === position);
      if (draw) {
        return registeredTeams.find(t => t.id === draw.team_id);
      }
      return null;
    }
    
    // Para torneios antigos sem sorteio, distribuir sequencialmente
    const index = position - 1;
    return registeredTeams[index] || null;
  };

  // Criar confrontos por fase
  const createMatchups = () => {
    const matchups = [];
    for (let i = 0; i < positions.length; i += 2) {
      const team1 = getTeamForPosition(positions[i]);
      const team2 = getTeamForPosition(positions[i + 1]);
      matchups.push({ team1, team2, position: i / 2 });
    }
    return matchups;
  };

  const matchups = createMatchups();
  const initialRound = getInitialRound();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Badge className="bg-gradient-to-r from-cyan-500 to-orange-500 text-white text-base px-6 py-2 border-0">
          {initialRound}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {matchups.map((matchup, idx) => (
          <Card key={idx} className="bg-card/50 border-cyan-500/30 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
            <CardContent className="pt-6 space-y-4">
              {/* Team 1 */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card/30 border-border/30 transition-all duration-300">
                {matchup.team1 ? (
                  <div className="flex items-center gap-3 flex-1">
                    {matchup.team1.emoji && (
                      <span className="text-3xl">{matchup.team1.emoji}</span>
                    )}
                    <span className="font-bold text-lg text-foreground">{matchup.team1.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">A DEFINIR</span>
                )}
              </div>

              {/* VS */}
              <div className="text-center text-sm text-muted-foreground font-semibold">vs</div>

              {/* Team 2 */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card/30 border-border/30 transition-all duration-300">
                {matchup.team2 ? (
                  <div className="flex items-center gap-3 flex-1">
                    {matchup.team2.emoji && (
                      <span className="text-3xl">{matchup.team2.emoji}</span>
                    )}
                    <span className="font-bold text-lg text-foreground">{matchup.team2.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">A DEFINIR</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {maxParticipants > 4 && (
        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>As próximas fases serão exibidas após a conclusão desta rodada</p>
        </div>
      )}
    </div>
  );
}
