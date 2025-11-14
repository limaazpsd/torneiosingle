import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Trophy, TrendingUp, Settings } from "lucide-react";
import { useMyTeams, useTeamMembers, useTeamInvitations } from "@/hooks/useIndependentTeams";
import { TeamOverview } from "@/components/teams/TeamOverview";
import { TeamMembersList } from "@/components/teams/TeamMembersList";
import { TeamInviteSection } from "@/components/teams/TeamInviteSection";
import { TeamRegistrations } from "@/components/teams/TeamRegistrations";

const TeamManagement = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();

  const { data: myTeams } = useMyTeams();
  const { data: members, isLoading: membersLoading } = useTeamMembers(teamId);
  const { data: invitations } = useTeamInvitations(teamId);

  const team = myTeams?.find((t) => t.id === teamId);
  const isCapitain = team?.user_role === "captain";

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
        <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/painel")}
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

      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8 max-w-6xl">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Inscrições</span>
              <span className="sm:hidden">Torneios</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Desempenho</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            {isCapitain && (
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Gestão</span>
                <span className="sm:hidden">Gestão</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <TeamOverview 
              team={team} 
              membersCount={members?.length || 0}
            />
            <TeamMembersList 
              members={members}
              isLoading={membersLoading}
            />
          </TabsContent>

          <TabsContent value="registrations" className="space-y-6">
            <TeamRegistrations teamId={teamId!} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Desempenho em Desenvolvimento</h3>
                <p className="text-muted-foreground">
                  Estatísticas detalhadas, classificação e artilharia serão exibidas aqui em breve
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {isCapitain && (
            <TabsContent value="management" className="space-y-6">
              <TeamInviteSection 
                teamId={teamId!}
                invitations={invitations}
              />
              
              <Card className="bg-card/50 border-primary/20">
                <CardContent className="py-12 text-center">
                  <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Configurações Avançadas</h3>
                  <p className="text-muted-foreground">
                    Opções de edição de time, remoção de membros e outras configurações em breve
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default TeamManagement;
