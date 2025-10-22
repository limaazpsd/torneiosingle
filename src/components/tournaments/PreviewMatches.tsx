import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Calendar } from "lucide-react";

interface PreviewMatchesProps {
  teamsCount: number;
  format: string;
}

export const PreviewMatches = ({ teamsCount, format }: PreviewMatchesProps) => {
  const isGroupStage = format === 'groups-knockout' || format === 'groups-only';
  
  // Calculate matches for group stage (each team plays all others in their group)
  const groupStageMatches = isGroupStage 
    ? Math.floor(teamsCount * (teamsCount / 4 - 1) / 2) // Simplified calculation
    : 0;
    
  // Calculate knockout matches
  const knockoutMatches = format !== 'groups-only' 
    ? teamsCount - 1 // N-1 matches in a knockout tournament
    : 0;

  const rounds = [
    ...(isGroupStage ? [{ name: 'Fase de Grupos', matches: groupStageMatches }] : []),
    ...(knockoutMatches > 0 ? [
      { name: 'Oitavas de Final', matches: 8 },
      { name: 'Quartas de Final', matches: 4 },
      { name: 'Semifinal', matches: 2 },
      { name: 'Final', matches: 1 },
    ] : []),
  ].filter(round => round.matches > 0);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Pré-visualização - Partidas</CardTitle>
          <CardDescription>
            Após o sorteio, as partidas serão definidas com datas e horários
          </CardDescription>
        </CardHeader>
      </Card>

      {rounds.map((round) => (
        <Card key={round.name} className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>{round.name}</span>
              <Badge variant="outline">{round.matches} partida{round.matches !== 1 ? 's' : ''}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: Math.min(round.matches, 4) }, (_, i) => (
                <Card key={i} className="bg-card/50 border-dashed border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Home Team */}
                      <div className="flex items-center gap-3 flex-1">
                        <Shield className="w-8 h-8 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">TIME A DEFINIR</span>
                      </div>

                      {/* Score placeholder */}
                      <div className="px-6 flex items-center gap-4">
                        <span className="text-2xl font-bold text-muted-foreground/50">-</span>
                        <span className="text-sm text-muted-foreground">VS</span>
                        <span className="text-2xl font-bold text-muted-foreground/50">-</span>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <span className="text-muted-foreground font-medium">TIME A DEFINIR</span>
                        <Shield className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Match details */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Data a definir</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Aguardando sorteio
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {round.matches > 4 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  ... e mais {round.matches - 4} partida{round.matches - 4 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
