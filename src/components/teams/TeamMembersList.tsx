import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Crown } from "lucide-react";

interface Member {
  id: string;
  role: string;
  profiles?: {
    name: string;
    username?: string;
  };
}

interface TeamMembersListProps {
  members?: Member[];
  isLoading: boolean;
}

export const TeamMembersList = ({ members, isLoading }: TeamMembersListProps) => {
  return (
    <Card className="bg-card/50 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Membros da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : members && members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.profiles?.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.profiles?.name}</p>
                    {member.profiles?.username && (
                      <p className="text-sm text-muted-foreground">
                        {member.profiles.username}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "captain" && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Capitão
                    </Badge>
                  )}
                  {member.role === "member" && (
                    <Badge variant="outline">Membro</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Nenhum membro encontrado
          </p>
        )}
      </CardContent>
    </Card>
  );
};
