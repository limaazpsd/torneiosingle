import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield } from "lucide-react";
import { IndependentTeam } from "@/types/database";

interface TeamSelectorProps {
  team: IndependentTeam & { members_count: number; is_registered: boolean };
  onSelect: (team: IndependentTeam & { members_count: number }) => void;
  disabled?: boolean;
}

export const TeamSelector = ({ team, onSelect, disabled }: TeamSelectorProps) => {
  return (
    <Card className={`bg-card/30 transition-all hover:border-primary/50 ${disabled ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Logo or Emoji */}
          <div className="flex-shrink-0">
            {team.logo_url ? (
              <img 
                src={team.logo_url} 
                alt={team.name} 
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : team.emoji ? (
              <span className="text-3xl">{team.emoji}</span>
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Shield className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{team.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{team.sport}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{team.members_count} membros</span>
              </div>
            </div>
          </div>

          {/* Action */}
          <div>
            {team.is_registered ? (
              <Badge variant="secondary">Já Inscrito</Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelect(team)}
                disabled={disabled}
              >
                Selecionar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
