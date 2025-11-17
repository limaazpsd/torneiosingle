import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Trash2, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Team, Tournament } from "@/types/database";

interface TournamentEquipesListProps {
  tournament: Tournament;
  teams: Team[];
}

export const TournamentEquipesList = ({ tournament, teams }: TournamentEquipesListProps) => {
  const queryClient = useQueryClient();
  const isPaidTournament = tournament.entry_fee > 0;

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      // 1. Deletar registros dependentes (team_registrations, team_draws, group_teams)
      // Nota: A exclusão do time (tabela 'teams') deve ser a última, pois ela pode ter chaves estrangeiras em outras tabelas.
      
      // Deletar team_registrations
      await supabase.from('team_registrations').delete().eq('team_id', teamId);
      
      // Deletar team_draws
      await supabase.from('team_draws').delete().eq('team_id', teamId).eq('tournament_id', tournament.id);
      
      // Deletar group_teams (se houver)
      await supabase.from('group_teams').delete().eq('team_id', teamId);

      // 2. Deletar o time principal
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipe removida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tournament-teams", tournament.id] });
      queryClient.invalidateQueries({ queryKey: ["tournament-draws", tournament.id] });
      queryClient.invalidateQueries({ queryKey: ["tournament-group-teams", tournament.id] });
    },
    onError: (error: any) => {
      console.error("Error deleting team:", error);
      toast.error("Erro ao remover equipe: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/20 text-emerald-400"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-400"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Equipes Inscritas ({teams.length})</CardTitle>
        <CardDescription>
          Gerencie todas as equipes que se inscreveram no seu torneio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teams.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma equipe inscrita ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => {
              const canDelete = !isPaidTournament || (team.payment_status !== 'approved');
              const deleteReason = isPaidTournament && team.payment_status === 'approved'
                ? "A exclusão não é permitida para equipes com pagamento aprovado."
                : "Esta ação é irreversível e removerá a equipe do torneio.";

              return (
                <Card key={team.id} className="bg-card/30 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        {team.logo_url ? (
                          <img 
                            src={team.logo_url} 
                            alt={team.name} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : team.emoji ? (
                          <span className="text-2xl">{team.emoji}</span>
                        ) : (
                          <Shield className="w-10 h-10 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{team.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{team.players_count} jogadores</span>
                            {isPaidTournament && (
                              <>
                                <span>•</span>
                                {getStatusBadge(team.payment_status)}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            disabled={!canDelete || deleteTeamMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-destructive flex items-center gap-2">
                              <AlertTriangle className="h-6 w-6" />
                              Remover {team.name}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {deleteReason}
                              {!canDelete && (
                                <p className="mt-2 font-semibold text-red-500">
                                  Para excluir esta equipe, você deve primeiro reverter o status de pagamento.
                                </p>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteTeamMutation.mutate(team.id)}
                              disabled={!canDelete}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {deleteTeamMutation.isPending ? "Removendo..." : "Confirmar Remoção"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};