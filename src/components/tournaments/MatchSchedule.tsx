import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Edit, FileText, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MatchEventManager } from "./MatchEventManager";

interface Match {
  id: string;
  match_date: string;
  location: string | null;
  round: string;
  status: string;
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
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
}

interface MatchScheduleProps {
  tournamentId: string;
  matches: Match[];
  defaultLocation: string;
}

export const MatchSchedule = ({ tournamentId, matches, defaultLocation }: MatchScheduleProps) => {
  const queryClient = useQueryClient();
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [showSumulaDialog, setShowSumulaDialog] = useState<Match | null>(null);

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    
    // Parse existing date if available
    if (match.match_date) {
      const date = new Date(match.match_date);
      setMatchDate(format(date, "yyyy-MM-dd"));
      setMatchTime(format(date, "HH:mm"));
    }
    
    setLocation(match.location || defaultLocation);
  };

  const handleSaveSchedule = async () => {
    if (!editingMatch || !matchDate) {
      toast.error("Preencha a data do jogo");
      return;
    }

    try {
      const dateTime = `${matchDate}T${matchTime}:00`;
      
      const { error } = await supabase
        .from('matches')
        .update({
          match_date: dateTime,
          location: location || defaultLocation,
        })
        .eq('id', editingMatch.id);

      if (error) throw error;

      toast.success("Horário definido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tournament-matches"] });
      setEditingMatch(null);
    } catch (error: any) {
      console.error("Error updating match:", error);
      toast.error("Erro ao atualizar horário");
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;

      toast.success("Partida removida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tournament-matches"] });
    } catch (error: any) {
      console.error("Error deleting match:", error);
      toast.error("Erro ao remover partida");
    }
  };

  const getStatusBadge = (match: Match) => {
    if (match.home_score !== null && match.away_score !== null) {
      return <Badge className="bg-green-500/20 text-green-400">Finalizado</Badge>;
    }
    
    const matchDate = new Date(match.match_date);
    const now = new Date();
    
    if (matchDate < now) {
      return <Badge className="bg-amber-500/20 text-amber-400">Aguardando Súmula</Badge>;
    }
    
    return <Badge className="bg-blue-500/20 text-blue-400">Agendado</Badge>;
  };

  const isScheduled = (match: Match) => {
    const matchDate = new Date(match.match_date);
    // Check if date is not the default "now" value
    return matchDate.getFullYear() > 2024 && matchDate.getMonth() < 11;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Jogos</CardTitle>
          <CardDescription>
            Gerencie as datas, horários e súmulas de todas as partidas do torneio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {matches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma partida criada ainda.</p>
              <p className="text-sm">Use o botão "Sortear Jogos" na aba Visão Geral para criar os confrontos.</p>
            </div>
          ) : (
            matches.map((match) => (
              <Card key={match.id} className="bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Teams */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 flex-1">
                          {match.home_team.emoji && (
                            <span className="text-2xl">{match.home_team.emoji}</span>
                          )}
                          <span className="font-semibold">{match.home_team.name}</span>
                        </div>
                        <span className="text-muted-foreground font-bold">VS</span>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="font-semibold">{match.away_team.name}</span>
                          {match.away_team.emoji && (
                            <span className="text-2xl">{match.away_team.emoji}</span>
                          )}
                        </div>
                      </div>

                      {/* Match Info */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {isScheduled(match) ? (
                            <span>
                              {format(new Date(match.match_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-amber-500">Sem data definida</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{match.location || "Local não definido"}</span>
                        </div>
                        {getStatusBadge(match)}
                      </div>

                      {/* Score if finalized */}
                      {match.home_score !== null && match.away_score !== null && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                          <div className="flex items-center justify-center gap-4 text-xl font-bold">
                            <span>{match.home_score}</span>
                            <span className="text-muted-foreground">×</span>
                            <span>{match.away_score}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Dialog open={editingMatch?.id === match.id} onOpenChange={(open) => !open && setEditingMatch(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditMatch(match)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Definir Horário
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Definir Horário da Partida</DialogTitle>
                            <DialogDescription>
                              Configure a data, hora e local do jogo
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="date">Data</Label>
                              <Input
                                id="date"
                                type="date"
                                value={matchDate}
                                onChange={(e) => setMatchDate(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="time">Horário</Label>
                              <Input
                                id="time"
                                type="time"
                                value={matchTime}
                                onChange={(e) => setMatchTime(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="location">Local</Label>
                              <Input
                                id="location"
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Ex: Quadra Central"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingMatch(null)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleSaveSchedule}>
                              Salvar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {isScheduled(match) && match.home_score === null && (
                        <Dialog open={showSumulaDialog?.id === match.id} onOpenChange={(open) => !open && setShowSumulaDialog(null)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => setShowSumulaDialog(match)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Adicionar Súmula
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Súmula da Partida</DialogTitle>
                              <DialogDescription>
                                {match.home_team.name} vs {match.away_team.name}
                              </DialogDescription>
                            </DialogHeader>
                            {showSumulaDialog && (
                              <MatchEventManager
                                matchId={match.id}
                                homeTeamId={match.home_team_id}
                                awayTeamId={match.away_team_id}
                                homeTeamName={match.home_team.name}
                                awayTeamName={match.away_team.name}
                                tournamentId={tournamentId}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja remover esta partida?")) {
                            handleDeleteMatch(match.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
