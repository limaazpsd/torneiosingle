import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tournament, Team } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ArrowLeft, Users, Settings, Info, Trash2, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { MatchManagement } from "@/components/tournaments/MatchManagement";
import { MatchScheduler } from "@/components/tournaments/MatchScheduler";
import { TeamApprovalSection } from "@/components/tournaments/TeamApprovalSection";
import { PreviewStandings } from "@/components/tournaments/PreviewStandings";
import { PreviewMatches } from "@/components/tournaments/PreviewMatches";
import { PopulateDrawsButton } from "@/components/tournaments/PopulateDrawsButton";
import { CreateGroupsButton } from "@/components/tournaments/CreateGroupsButton";
import { RandomDrawButton } from "@/components/tournaments/RandomDrawButton";
import { MatchSchedule } from "@/components/tournaments/MatchSchedule";
import { ResetDrawsButton } from "@/components/tournaments/ResetDrawsButton";
import { TournamentTeamsList } from "@/components/tournaments/TournamentTeamsList";

const TournamentManagement = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch tournament details
  const { data: tournament, isLoading: tournamentLoading } = useQuery<Tournament>({
    queryKey: ["tournament-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tournaments")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      
      // Check if user is the creator
      if (data?.creator_id !== user?.id) {
        toast.error("Você não tem permissão para gerenciar este torneio");
        navigate("/painel");
        throw new Error("Unauthorized");
      }
      
      return data as Tournament;
    },
    enabled: !!slug && !!user,
  });

  // Fetch registered teams
  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["tournament-teams", tournament?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("teams")
        .select(`
          *,
          profiles!teams_captain_id_fkey(name)
        `)
        .eq("tournament_id", tournament?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Team[];
    },
    enabled: !!tournament?.id,
  });

  // Fetch matches
  const { data: matches = [] } = useQuery({
    queryKey: ["tournament-matches", tournament?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(name, emoji, logo_url),
          away_team:teams!matches_away_team_id_fkey(name, emoji, logo_url)
        `)
        .eq('tournament_id', tournament?.id)
        .order('match_date');
      if (error) throw error;
      return data || [];
    },
    enabled: !!tournament?.id,
  });

  // Fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ["tournament-groups", tournament?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('tournament_id', tournament?.id)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!tournament?.id,
  });

  // Update tournament mutation
  const updateTournamentMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await (supabase as any)
        .from("tournaments")
        .update(updates)
        .eq("id", tournament?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-by-slug", slug] });
      toast.success("Torneio atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar torneio");
    },
  });

  // Update team payment status
  const updateTeamPaymentMutation = useMutation({
    mutationFn: async ({ teamId, status }: { teamId: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("teams")
        .update({ payment_status: status })
        .eq("id", teamId);
      
      if (error) throw error;
      
      // Se aprovar o time, chamar a edge function para fazer o sorteio
      if (status === 'approved') {
        const { error: drawError } = await supabase.functions.invoke('draw-team', {
          body: {
            type: 'UPDATE',
            table: 'teams',
            record: {
              id: teamId,
              tournament_id: tournament?.id,
              payment_status: 'approved'
            },
            old_record: {
              payment_status: 'pending'
            }
          }
        });
        
        if (drawError) {
          console.error('Error drawing team:', drawError);
          // Não falhar a aprovação se o sorteio falhar
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-teams", tournament?.id] });
      queryClient.invalidateQueries({ queryKey: ["tournament-draws", tournament?.id] });
      queryClient.invalidateQueries({ queryKey: ["tournament-group-teams", tournament?.id] });
      toast.success("Status de pagamento atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status de pagamento");
    },
  });

  // Delete tournament mutation
  const deleteTournamentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("tournaments")
        .delete()
        .eq("id", tournament?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Torneio deletado com sucesso!");
      navigate("/painel");
    },
    onError: () => {
      toast.error("Erro ao deletar torneio");
    },
  });

  const handleUpdateStatus = (status: string) => {
    updateTournamentMutation.mutate({ status });
  };

  const handleUpdateTournament = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get("name"),
      sport: formData.get("sport"),
      location: formData.get("location"),
      rules: formData.get("rules"),
      max_participants: Number(formData.get("max_participants")),
      entry_fee: Number(formData.get("entry_fee")),
    };
    updateTournamentMutation.mutate(updates);
  };

  const getPaymentStatusBadge = (status: string) => {
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

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </nav>
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/painel")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">{tournament.name}</span>
            </div>
          </div>
          <Link to={`/torneio/${tournament.slug}`}>
            <Button variant="outline" size="sm">Ver Página Pública</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 max-w-4xl">
            <TabsTrigger value="overview">
              <Info className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="approvals">
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprovações
            </TabsTrigger>
            <TabsTrigger value="teams">
              <Users className="h-4 w-4 mr-2" />
              Times
            </TabsTrigger>
            <TabsTrigger value="standings">
              <Trophy className="h-4 w-4 mr-2" />
              Classificação
            </TabsTrigger>
            <TabsTrigger value="matches">
              <Trophy className="h-4 w-4 mr-2" />
              Partidas
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Times Inscritos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {teams?.length || 0} / {tournament.max_participants}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-400">
                    R$ {((teams?.filter(t => t.payment_status === 'approved').length || 0) * Number(tournament.entry_fee)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="text-base px-3 py-1">
                    {getStatusLabel(tournament.status)}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Botão de Sorteio e Criação de Grupos */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Estrutura do Torneio</CardTitle>
                <CardDescription>
                  Configure grupos, realize o sorteio dos times e sorteie os confrontos aleatórios.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {(tournament.format === 'groups-knockout' || tournament.format === 'groups-only') && (
                  <CreateGroupsButton tournamentId={tournament.id} />
                )}
                {(tournament.format === 'groups-knockout' || 
                  tournament.format === 'groups-only' || 
                  tournament.format === 'knockout') && (
                  <PopulateDrawsButton tournamentId={tournament.id} />
                )}
                <RandomDrawButton 
                  tournamentId={tournament.id} 
                  location={tournament.location} 
                />
                <ResetDrawsButton tournamentId={tournament.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações do Torneio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome do Torneio */}
                  <Card className="md:col-span-2 bg-card/50 border-border/50">
                    <CardContent className="pt-6">
                      <Label className="text-sm text-muted-foreground">Nome do Torneio</Label>
                      <p className="text-2xl font-bold mt-2">{tournament.name}</p>
                    </CardContent>
                  </Card>

                  {/* Esporte */}
                  <Card className="bg-card/50 border-border/50">
                    <CardContent className="pt-6">
                      <Label className="text-sm text-muted-foreground">Esporte</Label>
                      <p className="text-xl font-semibold mt-2">{tournament.sport}</p>
                    </CardContent>
                  </Card>

                  {/* Data de Início */}
                  <Card className="bg-card/50 border-border/50">
                    <CardContent className="pt-6">
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Data de Início
                      </Label>
                      <p className="text-xl font-semibold mt-2">
                        {new Date(tournament.start_date).toLocaleDateString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Formato */}
                  <Card className="bg-card/50 border-border/50">
                    <CardContent className="pt-6">
                      <Label className="text-sm text-muted-foreground">Formato</Label>
                      <p className="text-xl font-semibold mt-2">{tournament.format}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tournament.max_participants} times • {tournament.sport}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Taxa de Inscrição */}
                  <Card className="bg-card/50 border-border/50">
                    <CardContent className="pt-6">
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Taxa de Inscrição
                      </Label>
                      <p className="text-2xl font-bold mt-2">
                        R$ {Number(tournament.entry_fee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Premiação Total */}
                  <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="pt-6">
                      <Label className="text-sm text-primary flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Premiação Total
                      </Label>
                      <p className="text-3xl font-bold text-primary mt-2">
                        R$ {Number(tournament.prize_pool).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex gap-4 mt-3 text-sm">
                        <span>1º: R$ {((Number(tournament.prize_pool) * tournament.first_place_percentage) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span>2º: R$ {((Number(tournament.prize_pool) * tournament.second_place_percentage) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span>3º: R$ {((Number(tournament.prize_pool) * tournament.third_place_percentage) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Local */}
                  <Card className="bg-card/50 border-border/50">
                    <CardContent className="pt-6">
                      <Label className="text-sm text-muted-foreground">Local</Label>
                      <p className="text-lg font-medium mt-2">{tournament.location}</p>
                    </CardContent>
                  </Card>

                  {/* Data de Término */}
                  <Card className="bg-card/50 border-border/50">
                    <CardContent className="pt-6">
                      <Label className="text-sm text-muted-foreground">Data de Término</Label>
                      <p className="text-xl font-semibold mt-2">
                        {new Date(tournament.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Prazo de Inscrição */}
                  <Card className="bg-card/50 border-border/50">
                    <CardContent className="pt-6">
                      <Label className="text-sm text-muted-foreground">Prazo de Inscrição</Label>
                      <p className="text-xl font-semibold mt-2">
                        {new Date(tournament.registration_deadline).toLocaleDateString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Regras */}
                  <Card className="md:col-span-2 bg-card/50 border-border/50">
                    <CardContent className="pt-6">
                      <Label className="text-sm text-muted-foreground">Regras</Label>
                      <p className="font-medium whitespace-pre-wrap mt-2">{tournament.rules}</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <TeamApprovalSection 
              teams={teams || []}
              onApprove={(teamId) => updateTeamPaymentMutation.mutate({ teamId, status: "approved" })}
              onReject={(teamId) => updateTeamPaymentMutation.mutate({ teamId, status: "rejected" })}
              isUpdating={updateTeamPaymentMutation.isPending}
            />
          </TabsContent>
          
          {/* Teams List Tab (New) */}
          <TabsContent value="teams" className="space-y-6">
            {tournament && teams && (
              <TournamentTeamsList tournament={tournament} teams={teams} />
            )}
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings" className="space-y-6">
            {teams && teams.length > 0 ? (
              <PreviewStandings 
                teamsCount={teams.length}
                format={tournament.format}
                groupsCount={4}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aguardando inscrições</h3>
                  <p className="text-muted-foreground">
                    A pré-visualização da classificação aparecerá quando times se inscreverem
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-6">
            <MatchSchedule 
              tournamentId={tournament?.id!}
              matches={matches as any}
              defaultLocation={tournament.location}
            />
          </TabsContent>

            {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Editar Torneio</CardTitle>
                <CardDescription>Atualize as informações do seu torneio</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateTournament} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Torneio</Label>
                    <Input id="name" name="name" defaultValue={tournament.name} required />
                  </div>
                  <div>
                    <Label htmlFor="sport">Esporte</Label>
                    <Input id="sport" name="sport" defaultValue={tournament.sport} required />
                  </div>
                  <div>
                    <Label htmlFor="location">Local</Label>
                    <Input id="location" name="location" defaultValue={tournament.location} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max_participants">Máximo de Participantes</Label>
                      <Input id="max_participants" name="max_participants" type="number" defaultValue={tournament.max_participants} required />
                    </div>
                    <div>
                      <Label htmlFor="entry_fee">Taxa de Inscrição (R$)</Label>
                      <Input id="entry_fee" name="entry_fee" type="number" step="0.01" defaultValue={tournament.entry_fee} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rules">Regras</Label>
                    <Textarea id="rules" name="rules" defaultValue={tournament.rules} rows={6} />
                  </div>
                  <Button type="submit" disabled={updateTournamentMutation.isPending}>
                    {updateTournamentMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status do Torneio</CardTitle>
                <CardDescription>Controle o estado atual do torneio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Status Atual</Label>
                    <p className="text-sm text-muted-foreground">
                      {getStatusLabel(tournament.status)}
                    </p>
                  </div>
                  <Select value={tournament.status} onValueChange={handleUpdateStatus}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="registration_open">Inscrições Abertas</SelectItem>
                      <SelectItem value="registration_closed">Inscrições Encerradas</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                <CardDescription>Ações irreversíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar Torneio
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso irá deletar permanentemente o torneio
                        e todos os dados associados, incluindo times inscritos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteTournamentMutation.mutate()}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Deletar Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TournamentManagement;