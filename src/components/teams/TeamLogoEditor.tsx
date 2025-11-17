import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { IndependentTeam } from "@/types/database";

interface TeamLogoEditorProps {
  team: IndependentTeam;
}

export const TeamLogoEditor = ({ team }: TeamLogoEditorProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(team.logo_url || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Arquivo inválido. Por favor, selecione uma imagem.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!user || !logoFile) return;

    setIsUploading(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      // Path: user_id/team_id/timestamp.ext
      const fileName = `${user.id}/${team.id}/${Date.now()}.${fileExt}`;
      
      // 1. Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('team-logos') 
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('team-logos')
        .getPublicUrl(uploadData.path);

      // 2. Update team record with new logo_url and clear emoji
      const { error: updateError } = await supabase
        .from('independent_teams')
        .update({ 
          logo_url: publicUrl,
          emoji: null, // Clear emoji when logo is set
          updated_at: new Date().toISOString(),
        })
        .eq('id', team.id);

      if (updateError) throw updateError;

      toast.success("Logo atualizada com sucesso!");
      setLogoFile(null);
      
      // Invalidate queries to refresh team data everywhere
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      queryClient.invalidateQueries({ queryKey: ["team-members", team.id] });
      
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Erro ao fazer upload da logo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!user || !team.logo_url) return;

    setIsUploading(true);
    try {
      // 1. Update team record to clear logo_url
      const { error: updateError } = await supabase
        .from('independent_teams')
        .update({ 
          logo_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', team.id);

      if (updateError) throw updateError;

      // Note: We skip deleting the file from storage for simplicity/safety, 
      // but the link is removed from the database.

      toast.success("Logo removida com sucesso!");
      setLogoFile(null);
      setLogoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      queryClient.invalidateQueries({ queryKey: ["team-members", team.id] });
      
    } catch (error: any) {
      console.error("Error removing logo:", error);
      toast.error(error.message || "Erro ao remover logo.");
    } finally {
      setIsUploading(false);
    }
  };

  const isLogoSet = !!logoPreview && !logoFile;
  const isNewFileSelected = !!logoFile;

  return (
    <Card className="bg-card/50 border-primary/20">
      <CardHeader>
        <CardTitle>Escudo da Equipe</CardTitle>
        <CardDescription>Defina a logo oficial da sua equipe</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          {/* Current Logo/Preview */}
          <div className="w-24 h-24 flex-shrink-0 rounded-lg border-2 border-primary/20 overflow-hidden flex items-center justify-center bg-card/30">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-full h-full object-cover"
              />
            ) : team.emoji ? (
              <span className="text-4xl">{team.emoji}</span>
            ) : (
              <Shield className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          {/* Upload/Action Area */}
          <div className="flex-1 space-y-2">
            <label
              htmlFor="logo-upload-input"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              {isLogoSet ? "Alterar Logo" : "Fazer Upload"}
            </label>
            <input
              id="logo-upload-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Máximo 2MB. PNG, JPG, WEBP.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {isNewFileSelected && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Nova Logo"
              )}
            </Button>
          )}
          
          {isLogoSet && !isNewFileSelected && (
            <Button
              onClick={handleRemoveLogo}
              variant="destructive"
              disabled={isUploading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Remover Logo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};