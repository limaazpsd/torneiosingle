import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Player {
  user_id: string;
  profiles: {
    name: string;
  };
}

interface MatchEventManagerProps {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  tournamentId: string;
}

interface MatchEvent {
  id: string;
  player_id: string;
  team_id: string;
  event_type: 'goal' | 'assist' | 'yellow_card' | 'red_card';
  minute: number | null;
  profiles: {
    name: string;
  };
}

export const MatchEventManager = ({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  tournamentId,
}: MatchEventManagerProps) => {
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [eventType, setEventType] = useState<string>("");
  const [minute, setMinute] = useState<string>("");

  // Fetch players for both teams
  const { data: homePlayers = [] } = useQuery({
    queryKey: ['team-players', homeTeamId],
    queryFn: async () => {
      const { data: registrations, error } = await supabase
        .from('team_registrations')
        .select('user_id')
        .eq('team_id', homeTeamId)
        .eq('status', 'approved');
      
      if (error) throw error;
      if (!registrations || registrations.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', registrations.map(r => r.user_id));

      if (profilesError) throw profilesError;
      
      return profiles.map(p => ({
        user_id: p.user_id,
        profiles: { name: p.name }
      })) as Player[];
    },
  });

  const { data: awayPlayers = [] } = useQuery({
    queryKey: ['team-players', awayTeamId],
    queryFn: async () => {
      const { data: registrations, error } = await supabase
        .from('team_registrations')
        .select('user_id')
        .eq('team_id', awayTeamId)
        .eq('status', 'approved');
      
      if (error) throw error;
      if (!registrations || registrations.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', registrations.map(r => r.user_id));

      if (profilesError) throw profilesError;
      
      return profiles.map(p => ({
        user_id: p.user_id,
        profiles: { name: p.name }
      })) as Player[];
    },
  });

  // Fetch existing events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['match-events', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_events')
        .select('*, profiles(name)')
        .eq('match_id', matchId)
        .order('minute', { ascending: true });
      
      if (error) throw error;
      return data as MatchEvent[];
    },
  });

  const addEventMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTeam || !selectedPlayer || !eventType) {
        throw new Error("Selecione time, jogador e tipo de evento");
      }

      // Insert event
      const { error: eventError } = await supabase
        .from('match_events')
        .insert({
          match_id: matchId,
          player_id: selectedPlayer,
          team_id: selectedTeam,
          event_type: eventType,
          minute: minute ? parseInt(minute) : null,
        });

      if (eventError) throw eventError;

      // Update or create player statistics
      const { data: existingStats, error: fetchError } = await supabase
        .from('player_statistics')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('player_id', selectedPlayer)
        .eq('team_id', selectedTeam)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const updates: any = {};
      if (eventType === 'goal') updates.goals = (existingStats?.goals || 0) + 1;
      if (eventType === 'assist') updates.assists = (existingStats?.assists || 0) + 1;
      if (eventType === 'yellow_card') {
        updates.yellow_cards = (existingStats?.yellow_cards || 0) + 1;
        // Check for suspension (2 yellow cards)
        if ((existingStats?.yellow_cards || 0) + 1 >= 2) {
          updates.is_suspended = true;
          updates.suspension_matches_remaining = 1;
        }
      }
      if (eventType === 'red_card') {
        updates.red_cards = (existingStats?.red_cards || 0) + 1;
        updates.is_suspended = true;
        updates.suspension_matches_remaining = 1;
      }

      if (existingStats) {
        const { error: updateError } = await supabase
          .from('player_statistics')
          .update(updates)
          .eq('id', existingStats.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('player_statistics')
          .insert({
            tournament_id: tournamentId,
            player_id: selectedPlayer,
            team_id: selectedTeam,
            ...updates,
          });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      toast.success("Evento registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['match-events', matchId] });
      queryClient.invalidateQueries({ queryKey: ['player-statistics'] });
      setSelectedPlayer("");
      setEventType("");
      setMinute("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar evento");
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const event = events.find(e => e.id === eventId);
      if (!event) throw new Error("Evento não encontrado");

      // Delete event
      const { error: deleteError } = await supabase
        .from('match_events')
        .delete()
        .eq('id', eventId);

      if (deleteError) throw deleteError;

      // Update player statistics
      const { data: stats } = await supabase
        .from('player_statistics')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('player_id', event.player_id)
        .eq('team_id', event.team_id)
        .maybeSingle();

      if (stats) {
        const updates: any = {};
        if (event.event_type === 'goal') updates.goals = Math.max(0, stats.goals - 1);
        if (event.event_type === 'assist') updates.assists = Math.max(0, stats.assists - 1);
        if (event.event_type === 'yellow_card') {
          updates.yellow_cards = Math.max(0, stats.yellow_cards - 1);
          if (updates.yellow_cards < 2) {
            updates.is_suspended = false;
            updates.suspension_matches_remaining = 0;
          }
        }
        if (event.event_type === 'red_card') {
          updates.red_cards = Math.max(0, stats.red_cards - 1);
        }

        await supabase
          .from('player_statistics')
          .update(updates)
          .eq('id', stats.id);
      }
    },
    onSuccess: () => {
      toast.success("Evento removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['match-events', matchId] });
      queryClient.invalidateQueries({ queryKey: ['player-statistics'] });
    },
    onError: () => {
      toast.error("Erro ao remover evento");
    },
  });

  const currentPlayers = selectedTeam === homeTeamId ? homePlayers : selectedTeam === awayTeamId ? awayPlayers : [];

  const getEventTypeName = (type: string) => {
    const names: Record<string, string> = {
      goal: "Gol",
      assist: "Assistência",
      yellow_card: "Cartão Amarelo",
      red_card: "Cartão Vermelho",
    };
    return names[type] || type;
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      goal: "bg-green-500/10 text-green-700 border-green-500/20",
      assist: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      yellow_card: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      red_card: "bg-red-500/10 text-red-700 border-red-500/20",
    };
    return colors[type] || "";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Evento da Partida</CardTitle>
          <CardDescription>
            Adicione gols, assistências e cartões aos jogadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Time</Label>
              <Select value={selectedTeam} onValueChange={(value) => {
                setSelectedTeam(value);
                setSelectedPlayer("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={homeTeamId}>{homeTeamName}</SelectItem>
                  <SelectItem value={awayTeamId}>{awayTeamName}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedTeam && (
              <div className="grid gap-2">
                <Label>Jogador</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o jogador" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentPlayers.map((player) => (
                      <SelectItem key={player.user_id} value={player.user_id}>
                        {player.profiles.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Tipo de Evento</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goal">⚽ Gol</SelectItem>
                  <SelectItem value="assist">🅰️ Assistência</SelectItem>
                  <SelectItem value="yellow_card">🟨 Cartão Amarelo</SelectItem>
                  <SelectItem value="red_card">🟥 Cartão Vermelho</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Minuto (opcional)</Label>
              <Input
                type="number"
                placeholder="Ex: 45"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                min="0"
                max="120"
              />
            </div>

            <Button
              onClick={() => addEventMutation.mutate()}
              disabled={!selectedTeam || !selectedPlayer || !eventType || addEventMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Evento
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <p className="text-muted-foreground text-sm">Carregando eventos...</p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum evento registrado ainda</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="outline" className={getEventColor(event.event_type)}>
                      {getEventTypeName(event.event_type)}
                    </Badge>
                    <span className="font-medium">{event.profiles.name}</span>
                    {event.minute && (
                      <span className="text-muted-foreground text-sm">{event.minute}'</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteEventMutation.mutate(event.id)}
                    disabled={deleteEventMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
