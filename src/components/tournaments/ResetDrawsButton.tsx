import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ResetDrawsButtonProps {
  tournamentId: string;
}

export const ResetDrawsButton = ({ tournamentId }: ResetDrawsButtonProps) => {
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();

  const handleResetDraws = async () => {
    setIsResetting(true);
    try {
      // 1. Buscar IDs das partidas e grupos
      const { data: matchesData, error: matchesFetchError } = await supabase
        .from('matches')
        .select('id')
        .eq('tournament_id', tournamentId);
      
      if (matchesFetchError) throw matchesFetchError;
      const matchIds = matchesData.map(m => m.id);

      const { data: groupsData, error: groupsFetchError } = await supabase
        .from('groups')
        .select('id')
        .eq('tournament_id', tournamentId);
      
      if (groupsFetchError) throw groupsFetchError;
      const groupIds = groupsData.map(g => g.id);

      // 2. Deletar dados dependentes (eventos, gols)
      if (matchIds.length > 0) {
        // Deletar match_events
        const { error: eventsError } = await supabase
          .from('match_events')
          .delete()
          .in('match_id', matchIds);
        if (eventsError) throw eventsError;

        // Deletar goals
        const { error: goalsError } = await supabase
          .from('goals')
          .delete()
          .in('match_id', matchIds);
        if (goalsError) throw goalsError;
      }

      // 3. Deletar partidas
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .eq('tournament_id', tournamentId);
      if (matchesError) throw matchesError;

      // 4. Deletar dados de classificação e sorteio
      
      // Deletar player_statistics
      const { error: statsError } = await supabase
        .from('player_statistics')
        .delete()
        .eq('tournament_id', tournamentId);
      if (statsError) throw statsError;

      // Deletar group_teams
      if (groupIds.length > 0) {
        const { error: groupTeamsError } = await supabase
          .from('group_teams')
          .delete()
          .in('group_id', groupIds);
        if (groupTeamsError) throw groupTeamsError;
      }

      // Deletar team_draws
      const { error: drawsError } = await supabase
        .from('team_draws')
        .delete()
        .eq('tournament_id', tournamentId);
      if (drawsError) throw drawsError;

      toast.success("Sorteio e partidas resetados com sucesso!");
      
      // Invalidar queries para forçar recarregamento
      queryClient.invalidateQueries({ queryKey: ["tournament-matches", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament-draws", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament-group-teams", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["player-statistics"] });

    } catch (error: any) {
      console.error("Error resetting draws:", error);
      toast.error("Erro ao resetar sorteio: " + error.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isResetting} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          {isResetting ? "Resetando..." : "Resetar Sorteio"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Resetar Sorteio e Partidas?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é **irreversível** e irá deletar todos os dados de sorteio, 
            partidas, placares, eventos e estatísticas de jogadores deste torneio.
            <br /><br />
            Use isso apenas se precisar refazer o sorteio dos times ou a criação dos jogos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleResetDraws}
            className="bg-destructive hover:bg-destructive/90"
          >
            Confirmar Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};