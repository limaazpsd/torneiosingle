import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyTeams, useMyInvitations, useAcceptInvitation, useRejectInvitation } from "@/hooks/useIndependentTeams";
import { Skeleton } from "@/components/ui/skeleton";

const MyTeamsSection = () => {
  const navigate = useNavigate();
  const { data: teams, isLoading: teamsLoading } = useMyTeams();
  const { data: invitations, isLoading: invitationsLoading } = useMyInvitations();
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <Mail className="h-5 w-5" />
              Convites Pendentes ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  {invitation.independent_teams?.emoji ? (
                    <span className="text-2xl">{invitation.independent_teams.emoji}</span>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{invitation.independent_teams?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Convite recebido
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="glow"
                    onClick={() => acceptInvitation.mutate(invitation.id)}
                    disabled={acceptInvitation.isPending}
                  >
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectInvitation.mutate(invitation.id)}
                    disabled={rejectInvitation.isPending}
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* My Teams */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Minhas Equipes
          </CardTitle>
          <CardDescription>Equipes que você faz parte</CardDescription>
        </CardHeader>
        <CardContent>
          {teamsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-card/30">
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : teams && teams.length > 0 ? (
            <div className="space-y-3">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className="bg-card/30 border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/time/${team.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {team.logo_url ? (
                          <img 
                            src={team.logo_url} 
                            alt={`${team.name} logo`}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : team.emoji ? (
                          <span className="text-3xl">{team.emoji}</span>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{team.name}</h3>
                            {team.user_role === "captain" && (
                              <Badge variant="default" className="flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                Capitão
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {team.member_count} {team.member_count === 1 ? "membro" : "membros"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="glow"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/time/${team.id}`);
                        }}
                      >
                        Gerenciar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Você ainda não faz parte de nenhuma equipe
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyTeamsSection;
