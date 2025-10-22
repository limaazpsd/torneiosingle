import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Shield, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Team } from "@/types/database";

interface TeamApprovalSectionProps {
  teams: Team[];
  onApprove: (teamId: string) => void;
  onReject: (teamId: string) => void;
  isUpdating?: boolean;
}

export const TeamApprovalSection = ({ teams, onApprove, onReject, isUpdating }: TeamApprovalSectionProps) => {
  const pendingTeams = teams?.filter(t => t.payment_status === 'pending') || [];
  const approvedTeams = teams?.filter(t => t.payment_status === 'approved') || [];
  const rejectedTeams = teams?.filter(t => t.payment_status === 'rejected') || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingTeams.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              Solicitações Pendentes
            </CardTitle>
            <CardDescription>Times aguardando aprovação de inscrição</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTeams.map((team: any) => (
                <Card key={team.id} className="bg-card/50 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : team.emoji ? (
                          <span className="text-3xl">{team.emoji}</span>
                        ) : (
                          <Shield className="w-10 h-10 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{team.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{team.players_count} jogadores</span>
                            <span>•</span>
                            <span>Capitão: {team.profiles?.name || 'Não informado'}</span>
                          </div>
                        </div>
                        {getStatusBadge(team.payment_status)}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600"
                              disabled={isUpdating}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Aprovar time?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Confirme que o pagamento de <strong>{team.name}</strong> foi recebido. 
                                O time será oficialmente registrado no torneio.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onApprove(team.id)}>
                                Confirmar Aprovação
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={isUpdating}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Rejeitar time?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Você está prestes a rejeitar a inscrição de <strong>{team.name}</strong>. 
                                Esta ação pode ser revertida depois, se necessário.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onReject(team.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Confirmar Rejeição
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved Teams */}
      {approvedTeams.length > 0 && (
        <Card className="border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Times Aprovados ({approvedTeams.length})
            </CardTitle>
            <CardDescription>Times com pagamento confirmado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {approvedTeams.map((team: any) => (
                <Card key={team.id} className="bg-card/50 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : team.emoji ? (
                        <span className="text-2xl">{team.emoji}</span>
                      ) : (
                        <Shield className="w-10 h-10 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{team.name}</h4>
                        <p className="text-sm text-muted-foreground">{team.players_count} jogadores</p>
                      </div>
                      {getStatusBadge(team.payment_status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected Teams */}
      {rejectedTeams.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              Times Rejeitados ({rejectedTeams.length})
            </CardTitle>
            <CardDescription>Inscrições não aprovadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rejectedTeams.map((team: any) => (
                <Card key={team.id} className="bg-card/50 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : team.emoji ? (
                        <span className="text-2xl">{team.emoji}</span>
                      ) : (
                        <Shield className="w-10 h-10 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{team.name}</h4>
                        <p className="text-sm text-muted-foreground">{team.players_count} jogadores</p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(team.payment_status)}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onApprove(team.id)}
                          disabled={isUpdating}
                        >
                          Reativar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {teams?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum time inscrito</h3>
            <p className="text-muted-foreground">
              Aguarde as inscrições dos times para gerenciar as aprovações
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
