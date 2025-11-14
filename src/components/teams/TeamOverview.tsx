import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";

interface TeamOverviewProps {
  team: {
    name: string;
    description?: string;
    sport: string;
    players_count: number;
  };
  membersCount: number;
}

export const TeamOverview = ({ team, membersCount }: TeamOverviewProps) => {
  return (
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
          <Label className="text-muted-foreground">Esporte</Label>
          <p className="text-lg font-semibold">{team.sport}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Membros</Label>
          <p className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {membersCount} / {team.players_count}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
