import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface TeamStanding {
  id: string;
  name: string;
  emoji: string | null;
  logo_url: string | null;
  points: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

interface StandingsTableProps {
  standings: TeamStanding[];
  title?: string;
  description?: string;
}

export const StandingsTable = ({ standings, title = "Classificação", description }: StandingsTableProps) => {
  if (standings.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Nenhum dado de classificação disponível ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
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
              <TableHead className="text-center">GP</TableHead>
              <TableHead className="text-center">GC</TableHead>
              <TableHead className="text-center">SG</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((team, index) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-6 h-6 rounded-full object-cover" />
                    ) : team.emoji ? (
                      <span className="text-xl">{team.emoji}</span>
                    ) : (
                      <Shield className="w-6 h-6 text-muted-foreground" />
                    )}
                    <span className="font-medium">{team.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold">{team.points}</TableCell>
                <TableCell className="text-center">{team.matches_played}</TableCell>
                <TableCell className="text-center">{team.wins}</TableCell>
                <TableCell className="text-center">{team.draws}</TableCell>
                <TableCell className="text-center">{team.losses}</TableCell>
                <TableCell className="text-center">{team.goals_for}</TableCell>
                <TableCell className="text-center">{team.goals_against}</TableCell>
                <TableCell className="text-center font-medium">{team.goal_difference}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
