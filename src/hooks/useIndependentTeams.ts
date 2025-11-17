import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface IndependentTeam {
  id: string;
  name: string;
  emoji: string | null;
  sport: string;
  players_count: number;
  description: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
  logo_url?: string | null;
  member_count?: number;
  user_role?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profiles?: {
    name: string;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_id: string;
  invited_user_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  independent_teams?: {
    name: string;
    emoji: string;
  };
  inviter_profile?: {
    name: string;
    username: string | null;
  };
}

export const useMyTeams = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-teams", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: memberships, error: membershipsError } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (membershipsError) throw membershipsError;
      if (!memberships || memberships.length === 0) return [];

      const teamIds = memberships.map((m) => m.team_id);

      const { data: teams, error: teamsError } = await supabase
        .from("independent_teams")
        .select("*")
        .in("id", teamIds);

      if (teamsError) throw teamsError;

      // Get member counts
      const teamsWithCounts = await Promise.all(
        (teams || []).map(async (team) => {
          const { count } = await supabase
            .from("team_members")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id)
            .eq("status", "active");

          const membership = memberships.find((m) => m.team_id === team.id);

          return {
            ...team,
            member_count: count || 0,
            user_role: membership?.role || "member",
          };
        })
      );

      return teamsWithCounts as IndependentTeam[];
    },
    enabled: !!user,
  });
};

export const useTeamMembers = (teamId: string | undefined) => {
  return useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      if (!teamId) return [];

      // Buscar membros
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId)
        .eq("status", "active");

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      // Buscar perfis dos membros
      const userIds = members.map((m) => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, username, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Combinar dados
      const membersWithProfiles = members.map((member) => ({
        ...member,
        profiles: profiles?.find((p) => p.user_id === member.user_id) || null,
      }));

      return membersWithProfiles as TeamMember[];
    },
    enabled: !!teamId,
  });
};

export const useTeamInvitations = (teamId: string | undefined) => {
  return useQuery({
    queryKey: ["team-invitations", teamId],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from("team_invitations")
        .select(`
          *,
          independent_teams (name, emoji)
        `)
        .eq("team_id", teamId)
        .eq("status", "pending");

      if (error) throw error;
      return data as TeamInvitation[];
    },
    enabled: !!teamId,
  });
};

export const useMyInvitations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-invitations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("team_invitations")
        .select(`
          *,
          independent_teams (name, emoji)
        `)
        .eq("invited_user_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      return data as TeamInvitation[];
    },
    enabled: !!user,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (teamData: {
      name: string;
      emoji?: string;
      sport: string;
      players_count: number;
      description?: string;
      logo?: File;
    }) => {
      if (!user) throw new Error("User not authenticated");

      let logo_url: string | undefined;

      // Upload logo if provided
      if (teamData.logo) {
        const fileExt = teamData.logo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('team-logos')
          .upload(fileName, teamData.logo, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          // Adiciona tratamento específico para o erro de bucket
          if (uploadError.message.includes("bucket not found")) {
            throw new Error("Erro de configuração: O bucket 'team-logos' não foi encontrado no Supabase Storage. Tente novamente sem o logo ou configure o bucket.");
          }
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('team-logos')
          .getPublicUrl(uploadData.path);

        logo_url = publicUrl;
      }

      // Create team via secure RPC (handles creator + captain membership)
      const { data: teamId, error: rpcError } = await supabase.rpc('create_independent_team', {
        _name: teamData.name,
        _sport: teamData.sport,
        _players_count: teamData.players_count,
        _description: teamData.description ?? null,
        _emoji: teamData.emoji ?? null,
        _logo_url: logo_url ?? null,
      });

      if (rpcError) throw rpcError;

      return { id: teamId } as { id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      toast({
        title: "Equipe criada!",
        description: "Sua equipe foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar equipe",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useInviteToTeam = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      teamId,
      username,
    }: {
      teamId: string;
      username: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Find user by username
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username.toLowerCase())
        .single();

      if (profileError || !profile) {
        throw new Error("Usuário não encontrado");
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", profile.user_id)
        .single();

      if (existingMember) {
        throw new Error("Usuário já é membro da equipe");
      }

      // Create invitation
      const { error: inviteError } = await supabase
        .from("team_invitations")
        .insert({
          team_id: teamId,
          inviter_id: user.id,
          invited_user_id: profile.user_id,
          status: "pending",
        });

      if (inviteError) {
        if (inviteError.code === "23505") {
          throw new Error("Convite já enviado para este usuário");
        }
        throw inviteError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations", variables.teamId] });
      toast({
        title: "Convite enviado!",
        description: "O usuário receberá o convite para entrar na equipe.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.rpc("accept_team_invitation", {
        invitation_id: invitationId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      toast({
        title: "Convite aceito!",
        description: "Você agora faz parte da equipe.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aceitar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRejectInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("team_invitations")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      toast({
        title: "Convite recusado",
        description: "Você recusou o convite para a equipe.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao recusar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};