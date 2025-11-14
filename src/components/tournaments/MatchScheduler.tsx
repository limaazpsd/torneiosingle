import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, MapPin, Plus, Shuffle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Team {
  id: string;
  name: string;
  emoji: string | null;
  logo_url: string | null;
}

interface Group {
  id: string;
  name: string;
}

interface MatchSchedulerProps {
  tournamentId: string;
  teams: Team[];
  groups: Group[];
  location: string;
  format: string;
}

export const MatchScheduler = ({ tournamentId, teams, groups, location, format }: MatchSchedulerProps) => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [homeTeamId, setHomeTeamId] = useState<string>("");
  const [awayTeamId, setAwayTeamId] = useState<string>("");
  const [matchDate, setMatchDate] = useState<string>("");
  const [matchTime, setMatchTime] = useState<string>("19:00");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [round, setRound] = useState<string>("group_stage");

  const handleCreateMatch = async () => {
    if (!homeTeamId || !awayTeamId || !matchDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (homeTeamId === awayTeamId) {
      toast.error("Selecione times diferentes");
      return;
    }

    try {
      const dateTime = `${matchDate}T${matchTime}:00`;
      
      const { error } = await supabase
        .from('matches')
        .insert({
          tournament_id: tournamentId,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          match_date: dateTime,
          location: location,
          group_id: selectedGroup || null,
          round: round,
          status: 'scheduled'
        });

      if (error) throw error;

      toast.success("Confronto criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tournament-matches"] });
      
      // Reset form
      setHomeTeamId("");
      setAwayTeamId("");
      setMatchDate("");
      setMatchTime("19:00");
      setSelectedGroup("");
    } catch (error: any) {
      console.error("Error creating match:", error);
      toast.error("Erro ao criar confronto");
    }
  };

  const handleGenerateMatches = async () => {
    setIsGenerating(true);
    try {
      if (format === 'groups-knockout' || format === 'groups-only') {
        // Gerar confrontos de grupos
        for (const group of groups) {
          const { data: teamDraws } = await supabase
            .from('team_draws')
            .select('team_id')
            .eq('tournament_id', tournamentId)
            .eq('group_id', group.id);

          if (!teamDraws || teamDraws.length < 2) continue;

          const groupTeamIds = teamDraws.map(d => d.team_id);
          
          // Gerar round-robin para o grupo
          for (let i = 0; i < groupTeamIds.length; i++) {
            for (let j = i + 1; j < groupTeamIds.length; j++) {
              await supabase.from('matches').insert({
                tournament_id: tournamentId,
                home_team_id: groupTeamIds[i],
                away_team_id: groupTeamIds[j],
                match_date: new Date().toISOString(),
                location: location,
                group_id: group.id,
                round: 'group_stage',
                status: 'scheduled'
              });
            }
          }
        }
      } else if (format === 'round-robin') {
        // Gerar confrontos round-robin
        for (let i = 0; i < teams.length; i++) {
          for (let j = i + 1; j < teams.length; j++) {
            await supabase.from('matches').insert({
              tournament_id: tournamentId,
              home_team_id: teams[i].id,
              away_team_id: teams[j].id,
              match_date: new Date().toISOString(),
              location: location,
              round: 'group_stage',
              status: 'scheduled'
            });
          }
        }
      } else if (format === 'knockout') {
        // Gerar confrontos de mata-mata
        const numMatches = Math.floor(teams.length / 2);
        for (let i = 0; i < numMatches; i++) {
          await supabase.from('matches').insert({
            tournament_id: tournamentId,
            home_team_id: teams[i * 2].id,
            away_team_id: teams[i * 2 + 1].id,
            match_date: new Date().toISOString(),
            location: location,
            round: teams.length <= 4 ? 'semi_finals' : 'round_of_16',
            status: 'scheduled'
          });
        }
      }

      toast.success("Confrontos gerados automaticamente!");
      queryClient.invalidateQueries({ queryKey: ["tournament-matches"] });
    } catch (error) {
      console.error("Error generating matches:", error);
      toast.error("Erro ao gerar confrontos");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Geração Automática */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="w-5 h-5" />
            Gerar Confrontos Automaticamente
          </CardTitle>
          <CardDescription>
            Gera todos os confrontos baseado no formato do torneio. Você pode editar datas depois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleGenerateMatches}
            disabled={isGenerating || teams.length < 2}
            className="w-full"
          >
            {isGenerating ? "Gerando..." : "Gerar Todos os Confrontos"}
          </Button>
        </CardContent>
      </Card>

      {/* Criação Manual */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Criar Confronto Manual
          </CardTitle>
          <CardDescription>
            Adicione confrontos individualmente com data e horário personalizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="homeTeam">Time da Casa</Label>
              <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                <SelectTrigger id="homeTeam">
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        {team.emoji && <span>{team.emoji}</span>}
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="awayTeam">Time Visitante</Label>
              <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                <SelectTrigger id="awayTeam">
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        {team.emoji && <span>{team.emoji}</span>}
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="matchDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data do Confronto
              </Label>
              <Input
                id="matchDate"
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="matchTime">Horário</Label>
              <Input
                id="matchTime"
                type="time"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
              />
            </div>
          </div>

          {(format === 'groups-knockout' || format === 'groups-only') && groups.length > 0 && (
            <div>
              <Label htmlFor="group">Grupo (Opcional)</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger id="group">
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="round">Fase</Label>
            <Select value={round} onValueChange={setRound}>
              <SelectTrigger id="round">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="group_stage">Fase de Grupos</SelectItem>
                <SelectItem value="round_of_16">Oitavas de Final</SelectItem>
                <SelectItem value="quarter_finals">Quartas de Final</SelectItem>
                <SelectItem value="semi_finals">Semifinais</SelectItem>
                <SelectItem value="third_place">Disputa de 3º Lugar</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            Local: {location}
          </div>

          <Button onClick={handleCreateMatch} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Criar Confronto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
