import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Shuffle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  tournamentId: string;
}

export function PopulateDrawsButton({ tournamentId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handlePopulateDraws = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('populate-draws', {
        body: { tournament_id: tournamentId }
      });

      if (error) throw error;

      toast({
        title: "Sorteio realizado!",
        description: `${data.teams_processed} times foram sorteados com sucesso.`,
      });

      // Invalidar queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['tournament-draws', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournament-group-teams', tournamentId] });
      
    } catch (error: any) {
      console.error('Error populating draws:', error);
      toast({
        title: "Erro ao realizar sorteio",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handlePopulateDraws}
      disabled={isLoading}
      className="gap-2"
    >
      <Shuffle className="h-4 w-4" />
      {isLoading ? "Sorteando..." : "Sortear Times"}
    </Button>
  );
}
