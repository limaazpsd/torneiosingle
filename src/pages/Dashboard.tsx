import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Plus, Calendar, Users, DollarSign, TrendingUp, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyTournaments, useMyTournamentStats } from "@/hooks/useTournaments";
import MyTeamsSection from "@/components/teams/MyTeamsSection";
import { useQuery } from "@tanstack/react-query"; // Importação adicionada
import { supabase } from "@/integrations/supabase/client"; // Importação adicionada

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: tournaments, isLoading: tournamentsLoading } = useMyTournaments();
  const { data: stats, isLoading: statsLoading } = useMyTournamentStats();

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      registration_open: "Inscrições Abertas",
      registration_closed: "Inscrições Encerradas",
      in_progress: "Em Andamento",
      completed: "Finalizado",
      draft: "Rascunho",
    };
    return labels[status] || status;
  };

  // O username é armazenado no metadata do usuário ou no perfil. 
  // Como o perfil é carregado na página Profile, vamos usar o username do perfil se estiver disponível.
  // Por enquanto, vamos assumir que o username está disponível no perfil (que é o que o PlayerProfile busca).
  // Para o link funcionar, precisamos do username. Se o usuário não tiver username, o link não funcionará.
  // Vamos buscar o username do perfil do usuário logado.
  
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-username', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();
      return data?.username;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Torneio Pro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/perfil">
              <Button variant="ghost">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </Button>
            </Link>
            <Button variant="ghost" onClick={signOut}>Sair</Button>
            <Link to="/criar-torneio">
              <Button variant="hero">
                <Plus className="mr-2 h-4 w-4" />
                Novo Torneio
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Torneios Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold text-primary">{stats?.activeTournaments || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold text-cyan-400">{stats?.totalParticipants || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <div className="text-3xl font-bold text-emerald-400">
                  R$ {(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-orange-500/20 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Próximos Jogos</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold text-orange-400">{stats?.upcomingMatches || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tournaments List */}
          <div className="lg:col-span-2">
            <Card className="bg-card/50 border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Meus Torneios
                  <Link to="/criar-torneio">
                    <Button variant="hero" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Novo
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription>Gerencie seus torneios ativos e passados</CardDescription>
              </CardHeader>
              <CardContent>
                {tournamentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="bg-card/30">
                        <CardContent className="p-6">
                          <Skeleton className="h-6 w-3/4 mb-4" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : tournaments && tournaments.length > 0 ? (
                  <div className="space-y-4">
                    {tournaments.map((tournament) => (
                      <Card
                        key={tournament.id}
                        className="bg-card/30 border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
                        onClick={() => navigate(`/torneio/${tournament.slug}`)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{tournament.name}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  tournament.status === 'registration_open' || tournament.status === 'in_progress'
                                    ? 'bg-primary/20 text-primary' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {getStatusLabel(tournament.status)}
                                </span>
                              </div>
                              <p className="text-muted-foreground mb-4">{tournament.sport}</p>
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-primary" />
                                  <span>{tournament.teams_count} times</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-secondary" />
                                  <span>R$ {tournament.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{new Date(tournament.start_date).toLocaleDateString('pt-BR')}</span>
                                </div>
                              </div>
                            </div>
                            <Button variant="glow" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/editar-torneio/${tournament.slug}`);
                            }}>
                              Gerenciar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum torneio criado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comece criando seu primeiro torneio!
                    </p>
                    <Link to="/criar-torneio">
                      <Button variant="hero">
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Primeiro Torneio
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Teams */}
          <div className="space-y-6">
            <Card className="bg-card/50 border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/criar-torneio">
                  <Button variant="glow" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Torneio
                  </Button>
                </Link>
                <Link to="/criar-time">
                  <Button variant="ghost" className="w-full justify-start text-white border border-transparent hover:border-primary hover:bg-primary/10 hover:text-white transition-all">
                    <Users className="mr-2 h-4 w-4" />
                    Criar Equipe
                  </Button>
                </Link>
                <Link to="/calendario">
                  <Button variant="ghost" className="w-full justify-start text-white border border-transparent hover:border-primary hover:bg-primary/10 hover:text-white transition-all">
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendário de Jogos
                  </Button>
                </Link>
                <Link 
                  to={userProfile ? `/jogador/${userProfile}?tournament=all` : '/perfil'} 
                  className="w-full"
                >
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-white border border-transparent hover:border-primary hover:bg-primary/10 hover:text-white transition-all"
                    disabled={!userProfile}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Meu Perfil Público
                  </Button>
                </Link>
                {!userProfile && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Crie seu username no <Link to="/perfil" className="text-primary hover:underline">Meu Perfil</Link> para acessar o perfil público.
                  </p>
                )}
              </CardContent>
            </Card>

            <MyTeamsSection />

            <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-orange-400">Dica Pro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Compartilhe o link do seu torneio nas redes sociais para aumentar as inscrições!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;