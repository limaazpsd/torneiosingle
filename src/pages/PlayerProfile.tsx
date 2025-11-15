import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, AlertCircle, CircleAlert } from "lucide-react";

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

export default function PlayerProfile() {
  const { playerId } = useParams();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['player-profile', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', playerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!playerId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['player-statistics', playerId, tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_statistics')
        .select('*, teams(name, logo_url, emoji)')
        .eq('player_id', playerId)
        .eq('tournament_id', tournamentId)
        .maybeSingle();
      
      if (error) throw error;
      return data as PlayerStats | null;
    },
    enabled: !!playerId && !!tournamentId,
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
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Jogador não encontrado</p>
          </CardContent>
        </Card>
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
  );
}
