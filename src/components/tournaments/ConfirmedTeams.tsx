import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Shield } from "lucide-react";

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  emoji: string | null;
  players_count: number;
  payment_status: string;
  captain_id: string;
}

interface ConfirmedTeamsProps {
  teams: Team[];
}

const ConfirmedTeams = ({ teams }: ConfirmedTeamsProps) => {
  const approvedTeams = teams.filter(team => team.payment_status === 'approved');
  const pendingTeams = teams.filter(team => team.payment_status === 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">PAGO</Badge>;
      case 'pending':
        return <Badge variant="secondary">PENDENTE</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {approvedTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Times Aprovados ({approvedTeams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {approvedTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={team.logo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-2xl">
                        {team.emoji || team.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{team.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{team.players_count} jogadores</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(team.payment_status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-yellow-500" />
              Times Pendentes ({pendingTeams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {pendingTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors opacity-70"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={team.logo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-2xl">
                        {team.emoji || team.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{team.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{team.players_count} jogadores</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(team.payment_status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {teams.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum time inscrito ainda</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConfirmedTeams;
