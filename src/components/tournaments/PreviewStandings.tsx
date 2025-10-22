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
  const teamsPerGroup = isGroupStage ? Math.ceil(teamsCount / groupsCount) : 0;

  // Generate preview groups
  const groups = isGroupStage 
    ? Array.from({ length: Math.min(groupsCount, 4) }, (_, i) => ({
        name: `Grupo ${String.fromCharCode(65 + i)}`,
        teams: Array.from({ length: teamsPerGroup }, (_, j) => ({
          position: j + 1,
          name: `Time ${j + 1}`,
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
                  <span className="text-muted-foreground">TIME A DEFINIR</span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">VS</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">TIME A DEFINIR</span>
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
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Pré-visualização - Fase de Grupos</CardTitle>
          <CardDescription>
            Após o sorteio, os times serão distribuídos automaticamente entre os grupos
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => (
          <Card key={group.name} className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{group.name}</span>
                <Badge variant="outline">{group.teams.length} times</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
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
                  {group.teams.map((team) => (
                    <TableRow key={team.position} className="opacity-60">
                      <TableCell className="font-medium">{team.position}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="w-6 h-6 text-muted-foreground" />
                          <span className="text-muted-foreground">TIME A DEFINIR</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">0</TableCell>
                      <TableCell className="text-center text-muted-foreground">0</TableCell>
                      <TableCell className="text-center text-muted-foreground">0</TableCell>
                      <TableCell className="text-center text-muted-foreground">0</TableCell>
                      <TableCell className="text-center text-muted-foreground">0</TableCell>
                      <TableCell className="text-center text-muted-foreground">0</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
