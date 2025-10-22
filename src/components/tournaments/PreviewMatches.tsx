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
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Partidas</h3>
        <p className="text-sm text-muted-foreground">
          Após o sorteio, as partidas serão definidas com datas e horários
        </p>
      </div>

      {rounds.map((round) => (
        <Card key={round.name} className="border-primary/20 bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{round.name}</CardTitle>
              <Badge variant="outline" className="text-muted-foreground">
                {round.matches} partida{round.matches !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: Math.min(round.matches, 4) }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/30"
                >
                  {/* Home Team */}
                  <div className="flex items-center gap-3 flex-1">
                    <Shield className="w-6 h-6 text-muted-foreground/50" />
                    <span className="font-medium text-muted-foreground">A DEFINIR</span>
                  </div>

                  {/* Score placeholder */}
                  <div className="px-6 flex items-center gap-3">
                    <span className="text-xl font-bold text-muted-foreground/50">-</span>
                    <span className="text-xs text-muted-foreground">VS</span>
                    <span className="text-xl font-bold text-muted-foreground/50">-</span>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="font-medium text-muted-foreground">A DEFINIR</span>
                    <Shield className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                </div>
              ))}
              
              {round.matches > 4 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  ... e mais {round.matches - 4} partida{round.matches - 4 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>As datas e horários serão definidos após o sorteio</span>
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
