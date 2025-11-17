import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, MapPin, Users, Award, Share2, Shield } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTournamentBySlug } from "@/hooks/useTournaments";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserTeamsForTournament } from "@/hooks/useTournamentRegistration";
import { IndependentTeam } from "@/types/database";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { TournamentStandings } from "@/components/tournaments/TournamentStandings";
import { MatchesList } from "@/components/tournaments/MatchesList";
import { TournamentScorers } from "@/components/tournaments/TournamentScorers";

// Lista de emojis padrão para times sem logo/emoji
const DEFAULT_EMOJIS = ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸"];

// Função para obter um emoji padrão baseado no ID do time (para consistência)
const getDefaultEmoji = (teamId: string) => {
  const hash = teamId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_EMOJIS[hash % DEFAULT_EMOJIS.length];
};

const PublicTournament = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: tournament, isLoading } = useTournamentBySlug(slug);
  const { data: availableTeams = [], isLoading: isLoadingTeams } = useUserTeamsForTournament(tournament?.id);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<(IndependentTeam & { members_count: number }) | null>(null);
  const [playersCount, setPlayersCount] = useState(1);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // Fetch matches
  const { data: matches = [] } = useQuery({
    queryKey: ['tournament-matches', tournament?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(name, emoji, logo_url),
          away_team:teams!matches_away_team_id_fkey(name, emoji, logo_url),
          group:groups(name)
        `)
        .eq('tournament_id', tournament?.id)
        .order('match_date');
      if (error) throw error;
      return data as any || [];
    },
    enabled: !!tournament?.id,
  });

  const handleSelectTeam = (team: IndependentTeam & { members_count: number }) => {
    setSelectedTeam(team);
    setPlayersCount(Math.max(team.members_count, team.players_count));
  };

  const handleRegisterTeam = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para inscrever um time",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTeam) {
      toast({
        title: "Selecione um time",
        description: "Escolha um dos seus times para inscrever",
        variant: "destructive",
      });
      return;
    }

    if (playersCount > 15) {
      toast({
        title: "Limite excedido",
        description: "O máximo é 15 jogadores por time",
        variant: "destructive",
      });
      return;
    }

    if (playersCount < selectedTeam.members_count) {
      toast({
        title: "Jogadores insuficientes",
        description: `O time tem ${selectedTeam.members_count} membros. O número de jogadores não pode ser menor.`,
        variant: "destructive",
      });
      return;
    }

    // Validate sport compatibility
    if (tournament && selectedTeam.sport !== tournament.sport) {
      toast({
        title: "Esporte incompatível",
        description: `Este time é de ${selectedTeam.sport}, mas o torneio é de ${tournament.sport}`,
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);

    try {
      // Determine payment status based on entry fee
      const isFree = !tournament?.entry_fee || tournament.entry_fee === 0;
      const paymentStatus = isFree ? 'approved' : 'pending';
      
      // Determine emoji fallback
      const teamEmoji = selectedTeam.emoji || (selectedTeam.logo_url ? null : getDefaultEmoji(selectedTeam.id));

      // Insert team into tournament
      // Usando (supabase as any) para forçar a inserção e ignorar o cache de tipagem do Supabase
      const { data: newTeam, error: teamError } = await (supabase as any)
        .from('teams')
        .insert([{
          tournament_id: tournament?.id,
          name: selectedTeam.name,
          captain_id: user.id,
          emoji: teamEmoji, // Usando o emoji de fallback se necessário
          logo_url: selectedTeam.logo_url,
          independent_team_id: selectedTeam.id,
          players_count: playersCount,
          payment_status: paymentStatus,
        }])
        .select()
        .single();

      if (teamError) throw teamError;

      // Get all active members of the independent team
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', selectedTeam.id)
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Add all members to team_registrations
      if (members && members.length > 0) {
        const registrations = members.map(member => ({
          team_id: newTeam.id,
          user_id: member.user_id,
          status: 'approved',
        }));

        const { error: regError } = await supabase
          .from('team_registrations')
          .insert(registrations);

        if (regError) throw regError;
      }

      toast({
        title: "Time inscrito com sucesso!",
        description: isFree 
          ? "Seu time está confirmado no torneio!" 
          : "Aguarde a aprovação do organizador e confirmação do pagamento",
      });

      setShowRegisterDialog(false);
      setSelectedTeam(null);
      setPlayersCount(1);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tournament', tournament?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-teams-for-tournament', user.id, tournament?.id] });
    } catch (error: any) {
      toast({
        title: "Erro ao inscrever time",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus amigos",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Torneio Pro</span>
            </Link>
          </div>
        </nav>
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-12">
          <Skeleton className="h-32 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Torneio não encontrado</h2>
          <Link to="/torneios">
            <Button variant="hero">Explorar Torneios</Button>
          </Link>
        </div>
      </div>
    );
  }

  const teams = tournament.teams || [];
  const availableSpots = tournament.max_participants - teams.length;
  const canRegister = tournament.status === 'registration_open' && availableSpots > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Torneio Pro</span>
          </Link>
          <Button variant="glow" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
        </div>
      </nav>

      {/* Tournament Header */}
      <div className="bg-gradient-hero border-b border-border">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {/* Logo do Torneio */}
                {tournament.logo_url && (
                  <div className="mb-6">
                    <img
                      src={tournament.logo_url}
                      alt={tournament.name}
                      className="h-24 w-24 md:h-32 md:w-32 object-contain rounded-lg border-2 border-primary/20"
                    />
                  </div>
                )}
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">{tournament.name}</h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(tournament.start_date).toLocaleDateString('pt-BR')} - {new Date(tournament.end_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{tournament.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{teams.length} / {tournament.max_participants} Times</span>
                  </div>
                </div>
              </div>
              {canRegister && (
                <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                  <DialogTrigger asChild>
                    <Button variant="hero" size="lg">
                      Inscrever Time
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Inscrever Time</DialogTitle>
                      <DialogDescription>
                        Selecione um dos seus times para participar do torneio
                      </DialogDescription>
                    </DialogHeader>
                    
                    {isLoadingTeams ? (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground">Carregando seus times...</p>
                      </div>
                    ) : availableTeams.length === 0 ? (
                      <div className="py-8 text-center space-y-4">
                        <Users className="h-16 w-16 text-muted-foreground mx-auto" />
                        <div>
                          <p className="font-semibold mb-2">Você ainda não tem times cadastrados</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Crie seu primeiro time para poder se inscrever em torneios
                          </p>
                        </div>
                        <Button
                          variant="hero"
                          onClick={() => navigate('/criar-time')}
                        >
                          Criar Meu Primeiro Time
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 py-4">
                        {!selectedTeam ? (
                          <>
                            <div className="space-y-3">
                              <Label>Selecione um Time</Label>
                              {availableTeams.map((team) => (
                                <TeamSelector
                                  key={team.id}
                                  team={team}
                                  onSelect={handleSelectTeam}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between items-center pt-4">
                              <Button
                                variant="outline"
                                onClick={() => navigate('/criar-time')}
                              >
                                Criar Novo Time
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-muted p-4 rounded-lg">
                              <div className="flex items-center gap-4 mb-4">
                                {selectedTeam.logo_url ? (
                                  <img 
                                    src={selectedTeam.logo_url} 
                                    alt={selectedTeam.name} 
                                    className="w-16 h-16 rounded-full object-cover"
                                  />
                                ) : selectedTeam.emoji ? (
                                  <span className="text-4xl">{selectedTeam.emoji}</span>
                                ) : (
                                  <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
                                    <Shield className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-semibold text-lg">{selectedTeam.name}</h3>
                                  <p className="text-sm text-muted-foreground">{selectedTeam.sport}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="players-count">
                                Número de Jogadores (máximo 15)
                              </Label>
                              <Input
                                id="players-count"
                                type="number"
                                min={selectedTeam.members_count}
                                max={15}
                                value={playersCount}
                                onChange={(e) => setPlayersCount(parseInt(e.target.value) || selectedTeam.members_count)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Seu time tem {selectedTeam.members_count} membros cadastrados
                              </p>
                            </div>

                            <div className="bg-muted p-4 rounded-lg">
                              <p className="text-sm text-muted-foreground mb-1">Taxa de Inscrição</p>
                              <p className="text-2xl font-bold">
                                R$ {Number(tournament.entry_fee).toFixed(2)}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedTeam(null);
                                  setPlayersCount(1);
                                }}
                              >
                                Voltar
                              </Button>
                              <Button
                                variant="hero"
                                className="flex-1"
                                onClick={handleRegisterTeam}
                                disabled={isRegistering}
                              >
                                {isRegistering ? "Inscrevendo..." : "Confirmar Inscrição"}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Prize Pool - Only show for paid tournaments */}
            {tournament.entry_fee > 0 && (
              <Card className="border-secondary/30 bg-card/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Award className="h-10 w-10 text-secondary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Premiação Total</p>
                        <p className="text-3xl font-bold text-secondary">
                          R$ {Number(tournament.prize_pool).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>1º: R$ {((Number(tournament.prize_pool) * tournament.first_place_percentage) / 100).toFixed(2)} ({tournament.first_place_percentage}%)</p>
                      <p>2º: R$ {((Number(tournament.prize_pool) * tournament.second_place_percentage) / 100).toFixed(2)} ({tournament.second_place_percentage}%)</p>
                      <p>3º: R$ {((Number(tournament.prize_pool) * tournament.third_place_percentage) / 100).toFixed(2)} ({tournament.third_place_percentage}%)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Content */}
      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="standings" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="standings">Classificação</TabsTrigger>
              <TabsTrigger value="matches">Partidas</TabsTrigger>
              <TabsTrigger value="scorers">Artilharia</TabsTrigger>
              <TabsTrigger value="teams">Times</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>

            {/* Standings Tab */}
            <TabsContent value="standings">
              <TournamentStandings tournament={tournament} teams={tournament.teams || []} />
            </TabsContent>

            {/* Matches Tab */}
            <TabsContent value="matches">
              <MatchesList matches={matches} />
            </TabsContent>

            {/* Scorers Tab */}
            <TabsContent value="scorers">
              {tournament && <TournamentScorers tournamentId={tournament.id} />}
            </TabsContent>

            {/* Teams Tab */}
            <TabsContent value="teams">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Times Inscritos ({teams.length})</CardTitle>
                  <CardDescription>
                    {availableSpots > 0
                      ? `${availableSpots} vagas disponíveis`
                      : "Vagas esgotadas"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teams.map((team: any) => (
                        <Card key={team.id} className="bg-card/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                {team.logo_url ? (
                                  <img 
                                    src={team.logo_url} 
                                    alt={team.name} 
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : team.emoji ? (
                                  <span className="text-3xl">{team.emoji}</span>
                                ) : (
                                  <Shield className="w-12 h-12 text-muted-foreground" />
                                )}
                                <div className="flex-1">
                                  <h3 className="font-semibold">{team.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {team.players_count} jogadores
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                className={
                                  team.payment_status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : team.payment_status === 'rejected'
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                }
                              >
                                {team.payment_status === 'approved' ? 'PAGO' : 
                                 team.payment_status === 'rejected' ? 'REJEITADO' : 
                                 'PENDENTE'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Seja o primeiro time a se inscrever!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info">
              <div className="space-y-6">
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle>Regulamento</CardTitle>
                    <CardDescription>Regras e diretrizes do torneio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="whitespace-pre-wrap">{tournament.rules}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle>Informações do Torneio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Esporte</Label>
                      <p className="text-lg font-semibold">{tournament.sport}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Formato</Label>
                      <p className="text-lg font-semibold">
                        {tournament.format === 'groups-knockout' && 'Grupos + Mata-Mata'}
                        {tournament.format === 'knockout' && 'Mata-Mata Simples'}
                        {(tournament.format === 'round-robin' || tournament.format === 'league') && 'Pontos Corridos'}
                        {tournament.format === 'fighting' && 'Torneio de Luta'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Prazo de Inscrição</Label>
                      <p className="text-lg font-semibold">
                        {new Date(tournament.registration_deadline).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <p className="text-lg font-semibold">
                        {tournament.status === 'registration_open' && 'Inscrições Abertas'}
                        {tournament.status === 'registration_closed' && 'Inscrições Encerradas'}
                        {tournament.status === 'in_progress' && 'Em Andamento'}
                        {tournament.status === 'completed' && 'Finalizado'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PublicTournament;