import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";
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

interface RandomDrawButtonProps {
  tournamentId: string;
  location: string;
}

export const RandomDrawButton = ({ tournamentId, location }: RandomDrawButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleRandomDraw = async () => {
    setIsGenerating(true);
    try {
      // Buscar times aprovados
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('payment_status', 'approved');

      if (teamsError) throw teamsError;
      
      if (!teams || teams.length < 2) {
        toast.error("É necessário pelo menos 2 times aprovados para sortear os jogos");
        setIsGenerating(false);
        return;
      }

      // Embaralhar times
      const shuffledTeams = shuffleArray(teams);
      
      // Criar confrontos
      const matches = [];
      for (let i = 0; i < shuffledTeams.length - 1; i += 2) {
        if (i + 1 < shuffledTeams.length) {
          matches.push({
            tournament_id: tournamentId,
            home_team_id: shuffledTeams[i].id,
            away_team_id: shuffledTeams[i + 1].id,
            match_date: new Date().toISOString(),
            location: location,
            round: 'primeira_rodada',
            status: 'scheduled'
          });
        }
      }

      // Inserir confrontos
      const { error: matchesError } = await supabase
        .from('matches')
        .insert(matches);

      if (matchesError) throw matchesError;

      toast.success(`${matches.length} confrontos sorteados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["tournament-matches"] });
    } catch (error: any) {
      console.error("Error generating matches:", error);
      toast.error("Erro ao sortear jogos: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isGenerating}>
          <Shuffle className="w-4 h-4 mr-2" />
          {isGenerating ? "Sorteando..." : "Sortear Jogos"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sortear Confrontos</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá criar automaticamente os confrontos da primeira rodada usando todos os times aprovados. 
            Os times serão sorteados aleatoriamente para formar os pares de jogos.
            <br /><br />
            <strong>Nota:</strong> Os jogos serão criados sem data/hora definidas. Você poderá configurar essas informações na aba de Cronograma.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleRandomDraw}>
            Confirmar Sorteio
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
