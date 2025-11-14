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
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <Badge variant="outline" className="text-lg px-4 py-2">
          {initialRound}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matchups.map((matchup, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Confronto {idx + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                {matchup.team1 ? (
                  <div className="flex items-center gap-2">
                    {matchup.team1.emoji && (
                      <span className="text-xl">{matchup.team1.emoji}</span>
                    )}
                    <span className="font-medium">{matchup.team1.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">A DEFINIR</span>
                )}
              </div>

              <div className="text-center text-xs font-bold text-muted-foreground">
                VS
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                {matchup.team2 ? (
                  <div className="flex items-center gap-2">
                    {matchup.team2.emoji && (
                      <span className="text-xl">{matchup.team2.emoji}</span>
                    )}
                    <span className="font-medium">{matchup.team2.name}</span>
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
        <div className="text-center text-sm text-muted-foreground">
          <p>As próximas fases serão exibidas após a conclusão desta rodada</p>
        </div>
      )}
    </div>
  );
}
