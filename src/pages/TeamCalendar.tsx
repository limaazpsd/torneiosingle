import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, MapPin, Trophy, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Match {
  id: string;
  match_date: string;
  location: string | null;
  round: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team: {
    name: string;
    emoji: string | null;
    logo_url: string | null;
  };
  away_team: {
    name: string;
    emoji: string | null;
    logo_url: string | null;
  };
  tournament: {
    name: string;
    slug: string;
  };
}

const TeamCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['user-team-matches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // 1. Get all active team memberships for the user
      const { data: memberships, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberError) throw memberError;
      if (!memberships || memberships.length === 0) return [];

      const independentTeamIds = memberships.map(m => m.team_id);

      // 2. Get all tournament teams linked to these independent teams
      const { data: tournamentTeams, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .in('independent_team_id', independentTeamIds);

      if (teamError) throw teamError;
      if (!tournamentTeams || tournamentTeams.length === 0) return [];

      const tournamentTeamIds = tournamentTeams.map(t => t.id);

      // 3. Get all matches involving these tournament teams
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          location,
          round,
          status,
          home_score,
          away_score,
          home_team:teams!matches_home_team_id_fkey(name, emoji, logo_url),
          away_team:teams!matches_away_team_id_fkey(name, emoji, logo_url),
          tournament:tournaments(name, slug)
        `)
        .in('home_team_id', tournamentTeamIds)
        .or(`away_team_id.in.(${tournamentTeamIds.join(',')})`)
        .order('match_date', { ascending: true });

      if (matchesError) throw matchesError;
      
      // Filter out matches that haven't been scheduled (default date)
      return (matchesData as Match[]).filter(match => new Date(match.match_date).getFullYear() > 2024);
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary">Finalizado</Badge>;
      case "in_progress":
        return <Badge className="bg-emerald-500/20 text-emerald-400">Ao Vivo</Badge>;
      case "scheduled":
        return <Badge variant="outline">Agendado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/painel")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Painel
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Calendário de Jogos</h1>
        </div>

        <Card className="bg-card/50 border-primary/20">
          <CardHeader>
            <CardTitle>Próximas Partidas</CardTitle>
            <CardDescription>
              Cronograma de jogos de todas as equipes que você faz parte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma partida agendada para suas equipes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <Card key={match.id} className="bg-card/30 border-border/50 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Teams and Score */}
                        <div className="flex-1 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 flex-1">
                            {match.home_team.emoji && (
                              <span className="text-2xl">{match.home_team.emoji}</span>
                            )}
                            <span className="font-semibold">{match.home_team.name}</span>
                          </div>

                          <div className="text-center">
                            {match.status === "completed" && match.home_score !== null && match.away_score !== null ? (
                              <div className="text-2xl font-bold">
                                {match.home_score} - {match.away_score}
                              </div>
                            ) : (
                              <div className="text-2xl font-bold text-muted-foreground">vs</div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <span className="font-semibold">{match.away_team.name}</span>
                            {match.away_team.emoji && (
                              <span className="text-2xl">{match.away_team.emoji}</span>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                          {getStatusBadge(match.status)}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(new Date(match.match_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {match.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{match.location}</span>
                            </div>
                          )}
                          <Link to={`/torneio/${match.tournament.slug}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                            <Trophy className="w-3 h-3" />
                            {match.tournament.name}
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamCalendar;