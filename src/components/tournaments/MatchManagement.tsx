import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Trophy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Team {
  id: string;
  name: string;
  emoji: string | null;
  logo_url: string | null;
}

interface TeamRegistration {
  user_id: string;
  profiles: {
    name: string;
  } | null;
}

interface Match {
  id: string;
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  home_team: Team;
  away_team: Team;
}

interface Goal {
  id: string;
  player_id: string;
  minute: number | null;
  profiles: {
    name: string;
  } | null;
  teams: {
    name: string;
  } | null;
}

interface MatchManagementProps {
  tournamentId: string;
  matches: Match[];
  teams: Team[];
}

export const MatchManagement = ({ tournamentId, matches, teams }: MatchManagementProps) => {
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<TeamRegistration[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<TeamRegistration[]>([]);

  const handleOpenScoreDialog = async (match: Match) => {
    setSelectedMatch(match);
    setHomeScore(match.home_score || 0);
    setAwayScore(match.away_score || 0);
    
    // Carregar jogadores dos times
    const { data: homeData } = await supabase
      .from('team_registrations')
      .select('user_id, profiles!team_registrations_user_id_fkey(name)')
      .eq('team_id', match.home_team_id);
    
    const { data: awayData } = await supabase
      .from('team_registrations')
      .select('user_id, profiles!team_registrations_user_id_fkey(name)')
      .eq('team_id', match.away_team_id);
    
    setHomeTeamPlayers((homeData as any) || []);
    setAwayTeamPlayers((awayData as any) || []);
    
    // Carregar gols existentes
    setIsLoadingGoals(true);
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*, profiles!goals_player_id_fkey(name), teams!goals_team_id_fkey(name)')
      .eq('match_id', match.id);
    
    setGoals((goalsData as any) || []);
    setIsLoadingGoals(false);
  };

  const handleSaveScore = async () => {
    if (!selectedMatch) return;

    // Verificar se o número de gols bate com o placar
    const homeGoals = goals.filter(g => g.teams.name === selectedMatch.home_team.name).length;
    const awayGoals = goals.filter(g => g.teams.name === selectedMatch.away_team.name).length;

    if (homeGoals !== homeScore || awayGoals !== awayScore) {
      toast.error(`O número de gols atribuídos (${homeGoals}-${awayGoals}) não corresponde ao placar (${homeScore}-${awayScore})`);
      return;
    }

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: 'completed'
        })
        .eq('id', selectedMatch.id);

      if (error) throw error;

      toast.success('Placar atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tournament-matches'] });
      setSelectedMatch(null);
    } catch (error: any) {
      toast.error('Erro ao atualizar placar: ' + error.message);
    }
  };

  const handleAddGoal = async (playerId: string, teamId: string, minute: number) => {
    if (!selectedMatch) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([{
          match_id: selectedMatch.id,
          team_id: teamId,
          player_id: playerId,
          minute: minute
        }])
        .select('*, profiles!goals_player_id_fkey(name), teams!goals_team_id_fkey(name)')
        .single();

      if (error) throw error;

      setGoals([...goals, data as any]);
      toast.success('Gol adicionado!');
    } catch (error: any) {
      toast.error('Erro ao adicionar gol: ' + error.message);
    }
  };

  const handleRemoveGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals(goals.filter(g => g.id !== goalId));
      toast.success('Gol removido!');
    } catch (error: any) {
      toast.error('Erro ao remover gol: ' + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Partidas e Placares</CardTitle>
        <CardDescription>Atualize os resultados e atribua gols aos jogadores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {matches.map((match) => (
          <Card key={match.id} className="bg-card/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{match.home_team.name}</span>
                  <span className="text-2xl font-bold">
                    {match.home_score !== null ? match.home_score : '-'} - {match.away_score !== null ? match.away_score : '-'}
                  </span>
                  <span className="font-medium">{match.away_team.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(match.match_date).toLocaleString('pt-BR')}
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => handleOpenScoreDialog(match)}>
                    <Trophy className="w-4 h-4 mr-2" />
                    {match.status === 'completed' ? 'Editar Placar' : 'Adicionar Placar'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Gerenciar Placar e Gols</DialogTitle>
                    <DialogDescription>
                      {match.home_team.name} vs {match.away_team.name}
                    </DialogDescription>
                  </DialogHeader>

                  {selectedMatch && (
                    <div className="space-y-6">
                      {/* Placar */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{match.home_team.name}</Label>
                          <Input
                            type="number"
                            min="0"
                            value={homeScore}
                            onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label>{match.away_team.name}</Label>
                          <Input
                            type="number"
                            min="0"
                            value={awayScore}
                            onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      {/* Gols Atribuídos */}
                      <div>
                        <Label>Gols Atribuídos ({goals.length} gols)</Label>
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                          {goals.map((goal) => (
                            <div key={goal.id} className="flex items-center justify-between bg-muted p-2 rounded">
                              <span className="text-sm">
                                {goal.profiles?.name || 'Jogador'} ({goal.teams?.name || 'Time'}) {goal.minute ? `- ${goal.minute}'` : ''}
                              </span>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveGoal(goal.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Adicionar Gol */}
                      <div className="border-t pt-4">
                        <Label>Adicionar Gol</Label>
                        <GoalForm
                          homeTeam={{ id: match.home_team_id, name: match.home_team.name, players: homeTeamPlayers }}
                          awayTeam={{ id: match.away_team_id, name: match.away_team.name, players: awayTeamPlayers }}
                          onAddGoal={handleAddGoal}
                        />
                      </div>

                      <Button onClick={handleSaveScore} className="w-full">
                        Salvar Placar
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

interface GoalFormProps {
  homeTeam: { id: string; name: string; players: TeamRegistration[] };
  awayTeam: { id: string; name: string; players: TeamRegistration[] };
  onAddGoal: (playerId: string, teamId: string, minute: number) => void;
}

const GoalForm = ({ homeTeam, awayTeam, onAddGoal }: GoalFormProps) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [minute, setMinute] = useState<number>(0);

  const currentPlayers = selectedTeam === homeTeam.id ? homeTeam.players : awayTeam.players;

  const handleAdd = () => {
    if (!selectedPlayer || !selectedTeam) {
      toast.error('Selecione o time e o jogador');
      return;
    }
    onAddGoal(selectedPlayer, selectedTeam, minute);
    setSelectedPlayer('');
    setMinute(0);
  };

  return (
    <div className="grid grid-cols-4 gap-2 mt-2">
      <Select value={selectedTeam} onValueChange={setSelectedTeam}>
        <SelectTrigger>
          <SelectValue placeholder="Time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={homeTeam.id}>{homeTeam.name}</SelectItem>
          <SelectItem value={awayTeam.id}>{awayTeam.name}</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={selectedPlayer} onValueChange={setSelectedPlayer} disabled={!selectedTeam}>
        <SelectTrigger>
          <SelectValue placeholder="Jogador" />
        </SelectTrigger>
        <SelectContent>
          {currentPlayers.map((player) => (
            <SelectItem key={player.user_id} value={player.user_id}>
              {player.profiles?.name || 'Jogador'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        type="number"
        placeholder="Minuto"
        value={minute}
        onChange={(e) => setMinute(parseInt(e.target.value) || 0)}
      />
      
      <Button onClick={handleAdd} size="sm">
        <Plus className="w-4 h-4 mr-1" />
        Adicionar
      </Button>
    </div>
  );
};
