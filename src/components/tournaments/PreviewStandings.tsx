import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface PreviewStandingsProps {
  teamsCount: number;
  format: string;
  groupsCount?: number;
}

export const PreviewStandings = ({ teamsCount, format, groupsCount = 4 }: PreviewStandingsProps) => {
  const isGroupStage = format === 'groups-knockout' || format === 'groups-only';
  
  // Limit to maximum 4 groups and 4 teams per group
  const displayGroupsCount = Math.min(groupsCount, 4);
  const teamsPerGroup = 4;

  // Generate preview groups
  const groups = isGroupStage 
    ? Array.from({ length: displayGroupsCount }, (_, i) => ({
        name: `Grupo ${String.fromCharCode(65 + i)}`,
        teams: Array.from({ length: teamsPerGroup }, (_, j) => ({
          position: j + 1,
          points: 0,
          wins: 0,
          goalDifference: 0,
          goalsFor: 0,
        })),
      }))
    : [];

  if (!isGroupStage) {
    // For knockout-only format, show bracket preview
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Pré-visualização - Chaveamento</CardTitle>
          <CardDescription>Após o sorteio, as chaves serão definidas automaticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: Math.ceil(teamsCount / 2) }, (_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-dashed border-border rounded-lg bg-card/50">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-muted-foreground" />
                  <span className="text-muted-foreground">A DEFINIR</span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">VS</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">A DEFINIR</span>
                  <Shield className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Classificação</h3>
        <p className="text-sm text-muted-foreground">
          Após o sorteio, os times serão distribuídos automaticamente entre os grupos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group, groupIndex) => (
          <Card key={group.name} className="border-primary/20 bg-card/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Shield className="w-5 h-5" />
                  {group.name}
                </CardTitle>
                <Badge variant="outline" className="text-muted-foreground">
                  Pendente
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <div className="grid grid-cols-[1fr,auto,auto,auto,auto] gap-2 px-6 py-3 text-xs font-medium text-muted-foreground border-b border-border/50">
                  <div>Time</div>
                  <div className="text-center w-12">P</div>
                  <div className="text-center w-12">V</div>
                  <div className="text-center w-12">SG</div>
                  <div className="text-center w-12">GP</div>
                </div>
                
                <div className="space-y-1 p-2">
                  {group.teams.map((team, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr,auto,auto,auto,auto] gap-2 px-4 py-3 rounded-lg bg-background/50 border border-border/30 items-center"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-muted-foreground/50" />
                        <span className="font-medium text-muted-foreground">A DEFINIR</span>
                      </div>
                      <div className="text-center w-12 font-bold">{team.points}</div>
                      <div className="text-center w-12 text-muted-foreground">{team.wins}</div>
                      <div className="text-center w-12 text-muted-foreground">{team.goalDifference}</div>
                      <div className="text-center w-12 text-muted-foreground">{team.goalsFor}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="px-4 py-3 mt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>→</span>
                  <span>Times classificados serão definidos após o sorteio</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
