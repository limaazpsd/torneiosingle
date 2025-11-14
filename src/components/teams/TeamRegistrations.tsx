import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, MapPin, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface TeamRegistrationsProps {
  teamId: string;
}

export const TeamRegistrations = ({ teamId }: TeamRegistrationsProps) => {
  const navigate = useNavigate();
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['team-registrations', teamId],
    queryFn: async () => {
      // Get all tournament teams linked to this independent team
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
            status,
            logo_url,
            entry_fee
          )
        `)
        .eq('independent_team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!teamId,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Inscrito</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-card/50 border-primary/20">
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="py-12 text-center">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma inscrição ainda</h3>
          <p className="text-muted-foreground">
            Este time ainda não está inscrito em nenhum torneio
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {registrations.map((reg: any) => (
        <Card key={reg.id} className="bg-card/50 border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {reg.tournament?.logo_url && (
                  <img 
                    src={reg.tournament.logo_url} 
                    alt={reg.tournament.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <CardTitle className="text-xl mb-2">
                    {reg.tournament?.name || 'Torneio'}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      {reg.tournament?.sport}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {reg.tournament?.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(reg.tournament?.start_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
              {getStatusBadge(reg.payment_status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Taxa de Inscrição</p>
                <p className="text-lg font-semibold">
                  {reg.tournament?.entry_fee > 0 
                    ? `R$ ${reg.tournament.entry_fee.toFixed(2)}`
                    : 'Gratuito'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {reg.payment_status === 'pending' && reg.tournament?.entry_fee > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/regularizar-inscricao/${reg.id}`)}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Regularizar Inscrição
                  </Button>
                )}
                {reg.tournament?.slug && (
                  <Link to={`/torneio/${reg.tournament.slug}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                      Ver Torneio
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
