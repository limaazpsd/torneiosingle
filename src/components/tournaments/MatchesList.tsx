import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Shield } from "lucide-react";

interface Match {
  id: string;
  match_date: string;
  location: string | null;
  round: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team: {
    name: string;
    emoji: string | null;
    logo_url: string | null;
  };
  away_team: {
    name: string;
    emoji: string | null;
    logo_url: string | null;
  };
  group?: {
    name: string;
  } | null;
}

interface MatchesListProps {
  matches: Match[];
}

const getRoundLabel = (round: string) => {
  const labels: Record<string, string> = {
    group_stage: "Fase de Grupos",
    round_of_16: "Oitavas de Final",
    quarter_finals: "Quartas de Final",
    semi_finals: "Semifinais",
    third_place: "Disputa de 3º Lugar",
    final: "Final",
  };
  return labels[round] || round;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge variant="secondary">Finalizado</Badge>;
    case "in_progress":
      return <Badge className="bg-emerald-500/20 text-emerald-400">Ao Vivo</Badge>;
    case "scheduled":
      return <Badge variant="outline">Agendado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const MatchesList = ({ matches }: MatchesListProps) => {
  if (matches.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Partidas</CardTitle>
          <CardDescription>Nenhuma partida agendada ainda</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Agrupar por rodada
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Partidas</CardTitle>
        <CardDescription>Agenda completa do torneio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(matchesByRound).map(([round, roundMatches]) => (
          <div key={round}>
            <h3 className="font-semibold text-lg mb-3">{getRoundLabel(round)}</h3>
            <div className="space-y-3">
              {roundMatches.map((match) => (
                <Card key={match.id} className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Times */}
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          {match.home_team.logo_url ? (
                            <img
                              src={match.home_team.logo_url}
                              alt={match.home_team.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : match.home_team.emoji ? (
                            <span className="text-2xl">{match.home_team.emoji}</span>
                          ) : (
                            <Shield className="w-8 h-8 text-muted-foreground" />
                          )}
                          <span className="font-medium">{match.home_team.name}</span>
                        </div>

                        {/* Placar */}
                        <div className="text-center">
                          {match.status === "completed" && match.home_score !== null && match.away_score !== null ? (
                            <div className="text-2xl font-bold">
                              {match.home_score} - {match.away_score}
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-muted-foreground">vs</div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="font-medium">{match.away_team.name}</span>
                          {match.away_team.logo_url ? (
                            <img
                              src={match.away_team.logo_url}
                              alt={match.away_team.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : match.away_team.emoji ? (
                            <span className="text-2xl">{match.away_team.emoji}</span>
                          ) : (
                            <Shield className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                        {getStatusBadge(match.status)}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(match.match_date).toLocaleString('pt-BR')}</span>
                        </div>
                        {match.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{match.location}</span>
                          </div>
                        )}
                        {match.group && <span className="text-xs">({match.group.name})</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
