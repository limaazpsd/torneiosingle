import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, AlertCircle, CircleAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PlayerStats {
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  is_suspended: boolean;
  teams: {
    name: string;
    logo_url: string | null;
    emoji: string | null;
  };
}

export default function AthleteProfile() {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');
  const navigate = useNavigate();

  // 1. Fetch Profile to get user_id
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['player-profile-by-username', username],
    queryFn: async () => {
      if (!username) return null;
      
      // Garante que a busca é feita apenas com o username limpo (sem @) e em minúsculas
      const cleanUsername = (username.startsWith('@') ? username.substring(1) : username).toLowerCase();

      // Usamos 'ilike' para busca case-insensitive
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', cleanUsername)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const playerId = profile?.user_id;

  // 2. Fetch Statistics using user_id
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['player-statistics', playerId, tournamentId],
    queryFn: async () => {
      if (!playerId) return null;

      let query = supabase
        .from('player_statistics')
        .select('goals, assists, yellow_cards, red_cards, is_suspended, teams(name, logo_url, emoji)')
        .eq('player_id', playerId);

      if (tournamentId && tournamentId !== 'all') {
        query = query.eq('tournament_id', tournamentId).maybeSingle();
      } else {
        // If tournamentId is 'all' or missing, fetch all stats and aggregate
        const { data: allStats, error: allStatsError } = await query;
        if (allStatsError) throw allStatsError;

        if (!allStats || allStats.length === 0) return null;

        // Aggregate stats (sum all values)
        const aggregatedStats = allStats.reduce((acc, current) => {
          acc.goals += current.goals;
          acc.assists += current.assists;
          acc.yellow_cards += current.yellow_cards;
          acc.red_cards += current.red_cards;
          // If any stat shows suspension, the player is considered suspended overall
          if (current.is_suspended) acc.is_suspended = true;
          return acc;
        }, {
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          is_suspended: false,
          teams: allStats[0].teams, // Use the team from the first entry (simplification)
        });

        return aggregatedStats as PlayerStats;
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PlayerStats | null;
    },
    enabled: !!playerId,
  });

  if (profileLoading || statsLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CircleAlert className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Perfil não encontrado</h2>
          <p className="text-muted-foreground mb-4">O usuário {username} não existe ou não tem um perfil público.</p>
          <Button variant="hero" onClick={() => navigate('/painel')}>
            Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  const statsData = stats || {
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    is_suspended: false,
    teams: null,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  {profile.username && (
                    <p className="text-lg text-muted-foreground">@{profile.username}</p>
                  )}
                  {statsData.teams && (
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      {statsData.teams.logo_url ? (
                        <img
                          src={statsData.teams.logo_url}
                          alt={statsData.teams.name}
                          className="w-6 h-6 object-contain"
                        />
                      ) : statsData.teams.emoji ? (
                        <span className="text-xl">{statsData.teams.emoji}</span>
                      ) : null}
                      <span className="text-muted-foreground">{statsData.teams.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  {statsData.is_suspended ? (
                    <Badge variant="destructive" className="text-base px-4 py-2">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Suspenso
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-base px-4 py-2 bg-green-600">
                      <Trophy className="w-4 h-4 mr-2" />
                      Disponível
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gols</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statsData.goals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assistências</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statsData.assists}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cartões Amarelos</CardTitle>
                <div className="w-4 h-6 bg-yellow-500 rounded" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statsData.yellow_cards}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cartões Vermelhos</CardTitle>
                <div className="w-4 h-6 bg-red-500 rounded" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statsData.red_cards}</div>
              </CardContent>
            </Card>
          </div>

          {statsData.is_suspended && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <CircleAlert className="w-5 h-5" />
                  <p className="font-medium">
                    Este jogador está suspenso e não pode participar da próxima partida.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}