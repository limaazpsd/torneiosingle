import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  tournamentId: string;
}

export function CreateGroupsButton({ tournamentId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleCreateGroups = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-missing-groups', {
        body: { tournament_id: tournamentId }
      });

      if (error) throw error;

      toast({
        title: "Grupos criados!",
        description: `${data.groups_created} grupos foram criados com sucesso.`,
      });

      // Invalidar queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['tournament-groups', tournamentId] });
      
    } catch (error: any) {
      console.error('Error creating groups:', error);
      toast({
        title: "Erro ao criar grupos",
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
      onClick={handleCreateGroups}
      disabled={isLoading}
      className="gap-2"
    >
      <FolderPlus className="h-4 w-4" />
      {isLoading ? "Criando..." : "Criar Grupos"}
    </Button>
  );
}
