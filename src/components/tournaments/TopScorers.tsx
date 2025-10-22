import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Shield } from "lucide-react";

interface TopScorer {
  player_id: string;
  player_name: string;
  avatar_url: string | null;
  team_name: string;
  team_emoji: string | null;
  team_logo_url: string | null;
  goals_count: number;
}

interface TopScorersProps {
  scorers: TopScorer[];
}

export const TopScorers = ({ scorers }: TopScorersProps) => {
  if (scorers.length === 0) {
    return (
      <Card className="border-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-secondary" />
            Artilharia
          </CardTitle>
          <CardDescription>Nenhum gol marcado ainda</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-secondary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-secondary" />
          Artilharia
        </CardTitle>
        <CardDescription>Maiores goleadores do torneio</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-center">Gols</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scorers.map((scorer, index) => (
              <TableRow key={scorer.player_id}>
                <TableCell className="font-medium">
                  {index === 0 && <Trophy className="w-4 h-4 text-secondary inline mr-1" />}
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={scorer.avatar_url || undefined} alt={scorer.player_name} />
                      <AvatarFallback>{scorer.player_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{scorer.player_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {scorer.team_logo_url ? (
                      <img
                        src={scorer.team_logo_url}
                        alt={scorer.team_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : scorer.team_emoji ? (
                      <span className="text-lg">{scorer.team_emoji}</span>
                    ) : (
                      <Shield className="w-6 h-6 text-muted-foreground" />
                    )}
                    <span className="text-sm">{scorer.team_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-bold text-lg">{scorer.goals_count}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
