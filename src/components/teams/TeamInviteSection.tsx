import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";
import { useInviteToTeam } from "@/hooks/useIndependentTeams";

interface Invitation {
  id: string;
  status: string;
}

interface TeamInviteSectionProps {
  teamId: string;
  invitations?: Invitation[];
}

export const TeamInviteSection = ({ teamId, invitations }: TeamInviteSectionProps) => {
  const [usernameInput, setUsernameInput] = useState("");
  const inviteToTeam = useInviteToTeam();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    const username = usernameInput.startsWith("@")
      ? usernameInput
      : `@${usernameInput}`;

    inviteToTeam.mutate(
      { teamId, username },
      {
        onSuccess: () => {
          setUsernameInput("");
        },
      }
    );
  };

  return (
    <Card className="bg-card/50 border-cyan-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Convidar Membros
        </CardTitle>
        <CardDescription>
          Digite o @username do usuário que deseja convidar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="@username"
            className="flex-1"
          />
          <Button
            type="submit"
            variant="glow"
            disabled={inviteToTeam.isPending || !usernameInput.trim()}
          >
            {inviteToTeam.isPending ? "Enviando..." : "Enviar Convite"}
          </Button>
        </form>

        {/* Pending Invitations */}
        {invitations && invitations.length > 0 && (
          <div className="mt-4 space-y-2">
            <Label className="text-muted-foreground">Convites Pendentes</Label>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <span className="text-sm">Aguardando resposta...</span>
                <Badge variant="outline">Pendente</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
