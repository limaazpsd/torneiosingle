import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, UserPlus, Crown, Trash2 } from "lucide-react";
import {
  useMyTeams,
  useTeamMembers,
  useTeamInvitations,
  useInviteToTeam,
} from "@/hooks/useIndependentTeams";
import { Skeleton } from "@/components/ui/skeleton";

const TeamManagement = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [usernameInput, setUsernameInput] = useState("");

  const { data: myTeams } = useMyTeams();
  const { data: members, isLoading: membersLoading } = useTeamMembers(teamId);
  const { data: invitations } = useTeamInvitations(teamId);
  const inviteToTeam = useInviteToTeam();

  const team = myTeams?.find((t) => t.id === teamId);
  const isCapitain = team?.user_role === "captain";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !usernameInput.trim()) return;

    const username = usernameInput.startsWith("@")
      ? usernameInput
      : `@${usernameInput}`;

    inviteToTeam.mutate(
      { teamId, username },
      {
        onSuccess: () => {
          setUsernameInput("");
        },
      }
    );
  };

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/50 border-primary/20 p-8">
          <p className="text-muted-foreground">Equipe não encontrada</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            {team.logo_url ? (
              <img 
                src={team.logo_url} 
                alt={`${team.name} logo`}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : team.emoji ? (
              <span className="text-3xl">{team.emoji}</span>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            )}
            <span className="text-xl font-bold">{team.name}</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Team Info */}
          <Card className="bg-card/50 border-primary/20">
            <CardHeader>
              <CardTitle>Informações da Equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Nome</Label>
                <p className="text-lg font-semibold">{team.name}</p>
              </div>
              {team.description && (
                <div>
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p>{team.description}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Membros</Label>
                <p className="text-lg font-semibold">{team.member_count || 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* Invite Members (only for captain) */}
          {isCapitain && (
            <Card className="bg-card/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Convidar Membros
                </CardTitle>
                <CardDescription>
                  Digite o @username do usuário que deseja convidar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvite} className="flex gap-2">
                  <Input
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="@username"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    variant="glow"
                    disabled={inviteToTeam.isPending || !usernameInput.trim()}
                  >
                    {inviteToTeam.isPending ? "Enviando..." : "Enviar Convite"}
                  </Button>
                </form>

                {/* Pending Invitations */}
                {invitations && invitations.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-muted-foreground">Convites Pendentes</Label>
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm">Aguardando resposta...</span>
                        <Badge variant="outline">Pendente</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <Card className="bg-card/50 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membros da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : members && members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.profiles?.name?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{member.profiles?.name}</p>
                          {member.profiles?.username && (
                            <p className="text-sm text-muted-foreground">
                              {member.profiles.username}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role === "captain" && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Capitão
                          </Badge>
                        )}
                        {member.role === "member" && (
                          <Badge variant="outline">Membro</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum membro encontrado
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
