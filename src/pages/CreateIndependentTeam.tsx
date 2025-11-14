import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Upload, X } from "lucide-react";
import { useCreateTeam } from "@/hooks/useIndependentTeams";
import { toast } from "@/hooks/use-toast";

const SPORTS = [
  "Futebol",
  "Basquete",
  "Vôlei",
  "Futsal",
  "Beach Tennis",
  "Tênis",
  "Handebol",
  "E-sports",
  "Outro",
];

const CreateIndependentTeam = () => {
  const navigate = useNavigate();
  const createTeam = useCreateTeam();

  const [formData, setFormData] = useState({
    name: "",
    sport: "Futebol",
    players_count: 5,
    description: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem (PNG, JPG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite o nome da equipe",
        variant: "destructive",
      });
      return;
    }

    createTeam.mutate(
      { ...formData, logo: logoFile || undefined },
      {
        onSuccess: () => {
          navigate("/painel");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/painel")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Nova Equipe</span>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </nav>

      {/* Form */}
      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Card className="bg-card/50 border-primary/20">
            <CardHeader>
              <CardTitle>Informações da Equipe</CardTitle>
              <CardDescription>
                Crie sua equipe independente e convide amigos para participar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Equipe *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Digite o nome da equipe"
                  required
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo da Equipe</Label>
                <div className="flex flex-col gap-3">
                  {logoPreview ? (
                    <div className="relative w-32 h-32 rounded-lg border-2 border-primary/20 overflow-hidden">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="logo-upload"
                      className="w-32 h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-card/30"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground text-center px-2">
                        Clique para fazer upload
                      </span>
                    </label>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: PNG, JPG, WEBP (máx. 2MB)
                  </p>
                </div>
              </div>

              {/* Sport */}
              <div className="space-y-2">
                <Label htmlFor="sport">Esporte *</Label>
                <Select
                  value={formData.sport}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sport: value })
                  }
                >
                  <SelectTrigger id="sport">
                    <SelectValue placeholder="Selecione o esporte" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Players Count */}
              <div className="space-y-2">
                <Label htmlFor="players_count">Número de Jogadores *</Label>
                <Input
                  id="players_count"
                  type="number"
                  min="1"
                  max="15"
                  value={formData.players_count}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setFormData({
                      ...formData,
                      players_count: Math.min(Math.max(value, 1), 15),
                    });
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">Máximo de 15 jogadores por equipe</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva sua equipe..."
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/painel")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={createTeam.isPending || !formData.name.trim()}
                  className="flex-1"
                >
                  {createTeam.isPending ? "Criando..." : "Criar Equipe"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default CreateIndependentTeam;
