import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trophy, Calendar, MapPin, DollarSign, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const RegularizePayment = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch team registration details
  const { data: registration, isLoading } = useQuery({
    queryKey: ['team-registration', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          payment_status,
          created_at,
          tournament:tournaments(
            id,
            name,
            slug,
            sport,
            location,
            start_date,
            end_date,
            entry_fee,
            logo_url
          )
        `)
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  // Mutation to confirm payment (placeholder - will be replaced with actual payment integration)
  const confirmPayment = useMutation({
    mutationFn: async () => {
      // TODO: Integrate with actual payment system (Stripe/Pix)
      // For now, just update the status to approved
      const { error } = await supabase
        .from('teams')
        .update({ payment_status: 'approved' })
        .eq('id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Pagamento confirmado!",
        description: "Seu time agora está inscrito no torneio",
      });
      queryClient.invalidateQueries({ queryKey: ['team-registration', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-registrations'] });
      navigate(-1);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center">
            <Skeleton className="h-8 w-32" />
          </div>
        </nav>
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8 max-w-3xl">
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-12">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/50 border-primary/20 p-8">
          <p className="text-muted-foreground">Inscrição não encontrada</p>
        </Card>
      </div>
    );
  }

  const tournament = registration.tournament as any;
  const isPending = registration.payment_status === 'pending';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8 max-w-3xl">
        <Card className="bg-card/50 border-primary/20">
          <CardHeader>
            <div className="flex items-start gap-4 mb-4">
              {tournament?.logo_url && (
                <img
                  src={tournament.logo_url}
                  alt={tournament.name}
                  className="w-20 h-20 rounded-lg object-cover border-2 border-primary/20"
                />
              )}
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{tournament?.name}</CardTitle>
                <CardDescription className="flex flex-wrap gap-3 text-base">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {tournament?.sport}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {tournament?.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(tournament?.start_date).toLocaleDateString('pt-BR')}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Team Info */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Seu Time</p>
              <p className="text-xl font-semibold">{registration.name}</p>
            </div>

            {/* Payment Status */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Status da Inscrição</p>
              {isPending ? (
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                  Aguardando Pagamento
                </Badge>
              ) : (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Inscrito
                </Badge>
              )}
            </div>

            {/* Entry Fee */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <p className="text-sm text-muted-foreground">Valor da Inscrição</p>
              </div>
              <p className="text-4xl font-bold text-primary">
                R$ {Number(tournament?.entry_fee || 0).toFixed(2)}
              </p>
            </div>

            {/* Payment Instructions */}
            {isPending && (
              <Card className="bg-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Instruções de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Para regularizar sua inscrição, realize o pagamento da taxa e aguarde a confirmação do organizador do torneio.
                  </p>
                  
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="font-semibold">Métodos de Pagamento:</p>
                    <p className="text-sm text-muted-foreground">
                      • Pix<br />
                      • Transferência bancária<br />
                      • Cartão de crédito
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground italic">
                    Nota: A integração com sistemas de pagamento será implementada em breve. Por enquanto, entre em contato com o organizador do torneio para realizar o pagamento.
                  </p>

                  {/* Placeholder button for payment confirmation */}
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={() => confirmPayment.mutate()}
                    disabled={confirmPayment.isPending}
                  >
                    {confirmPayment.isPending ? (
                      "Processando..."
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Simular Confirmação de Pagamento
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isPending && (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-green-400">Pagamento Confirmado!</p>
                <p className="text-muted-foreground mt-2">Sua inscrição está regularizada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegularizePayment;
