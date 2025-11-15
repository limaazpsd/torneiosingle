import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface TournamentScorersProps {
  tournamentId: string;
}

interface ScorerData {
  player_id: string;
  goals: number;
  assists: number;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
  teams: {
    name: string;
    logo_url: string | null;
    emoji: string | null;
  };
}

export const TournamentScorers = ({ tournamentId }: TournamentScorersProps) => {
  const { data: scorers = [], isLoading } = useQuery({
    queryKey: ['tournament-scorers', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_statistics')
        .select('player_id, goals, assists, profiles(name, avatar_url), teams(name, logo_url, emoji)')
        .eq('tournament_id', tournamentId)
        .gt('goals', 0)
        .order('goals', { ascending: false })
        .order('assists', { ascending: false });
      
      if (error) throw error;
      return data as ScorerData[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Artilharia</CardTitle>
          <CardDescription>Maiores goleadores do torneio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scorers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Artilharia</CardTitle>
          <CardDescription>Maiores goleadores do torneio</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum gol marcado ainda neste torneio.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
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
              <TableHead className="text-center">Assists</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scorers.map((scorer, index) => (
              <TableRow key={scorer.player_id}>
                <TableCell className="font-medium">
                  {index === 0 && <Trophy className="w-5 h-5 text-yellow-500 inline" />}
                  {index > 0 && <span>{index + 1}</span>}
                </TableCell>
                <TableCell>
                  <Link
                    to={`/player/${scorer.player_id}?tournament=${tournamentId}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={scorer.profiles.avatar_url || undefined} />
                      <AvatarFallback>
                        {scorer.profiles.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{scorer.profiles.name}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {scorer.teams.logo_url ? (
                      <img
                        src={scorer.teams.logo_url}
                        alt={scorer.teams.name}
                        className="w-6 h-6 object-contain"
                      />
                    ) : scorer.teams.emoji ? (
                      <span className="text-xl">{scorer.teams.emoji}</span>
                    ) : null}
                    <span className="text-sm">{scorer.teams.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold text-lg">
                  {scorer.goals}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {scorer.assists}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
