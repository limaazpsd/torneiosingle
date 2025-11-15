import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const tournamentSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome muito longo"),
  slug: z.string().optional(),
  sport: z.string().min(1, "Selecione uma modalidade"),
  format: z.string().min(1, "Selecione um formato"),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  end_date: z.string().min(1, "Data de término é obrigatória"),
  location: z.string().min(3, "Local deve ter pelo menos 3 caracteres").max(200, "Local muito longo"),
  max_participants: z.number().min(2, "Mínimo 2 participantes").max(100, "Máximo 100 participantes"),
  entry_fee: z.number().min(0, "Taxa não pode ser negativa"),
  registration_deadline: z.string().min(1, "Prazo de inscrição é obrigatório"),
  prize_pool: z.number().min(0, "Premiação não pode ser negativa"),
  first_place_percentage: z.number().min(0).max(100),
  second_place_percentage: z.number().min(0).max(100),
  third_place_percentage: z.number().min(0).max(100),
  rules: z.string().min(10, "Regras devem ter pelo menos 10 caracteres").max(5000, "Regras muito longas"),
  logo_url: z.string().optional(),
}).refine((data) => {
  const sum = data.first_place_percentage + data.second_place_percentage + data.third_place_percentage;
  return sum === 100;
}, {
  message: "A soma das porcentagens deve ser 100%",
  path: ["first_place_percentage"],
}).refine((data) => {
  return new Date(data.end_date) >= new Date(data.start_date);
}, {
  message: "Data de término deve ser posterior à data de início",
  path: ["end_date"],
}).refine((data) => {
  return new Date(data.registration_deadline) <= new Date(data.start_date);
}, {
  message: "Prazo de inscrição deve ser antes da data de início",
  path: ["registration_deadline"],
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

const CreateTournament = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sportCategory, setSportCategory] = useState<string>("");

  const sportSubcategories: Record<string, string[]> = {
    "Futebol": ["Futsal", "Fut7", "Futebol"],
    "Vôlei": ["Vôlei de Quadra", "Vôlei de Areia", "FutVôlei"],
    "Luta": ["Karatê", "Taekwondo", "Kickboxing", "Boxe", "MMA", "Judô", "Hapkido", "Muay Thai", "Jiu Jitsu"]
  };

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      slug: "",
      sport: "",
      format: "",
      start_date: "",
      end_date: "",
      location: "",
      max_participants: 16,
      entry_fee: 0,
      registration_deadline: "",
      prize_pool: 0,
      first_place_percentage: 60,
      second_place_percentage: 30,
      third_place_percentage: 10,
      rules: "",
      logo_url: "",
    },
  });

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Watch name changes to auto-generate slug
  const watchName = form.watch("name");
  
  useEffect(() => {
    if (watchName) {
      const slug = generateSlug(watchName);
      form.setValue("slug", slug);
    }
  }, [watchName]);

  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Reset sport when category changes
  const handleCategoryChange = (category: string) => {
    setSportCategory(category);
    form.setValue("sport", "");
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !user) return null;
    
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('team-logos')
      .upload(fileName, logoFile);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('team-logos')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const onSubmit = async (values: TournamentFormValues) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um torneio",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await handleLogoUpload();
      }

      const { data, error } = await (supabase as any)
        .from('tournaments')
        .insert([{
          name: values.name,
          sport: values.sport,
          format: values.format,
          start_date: values.start_date,
          end_date: values.end_date,
          location: values.location,
          max_participants: values.max_participants,
          entry_fee: values.entry_fee,
          registration_deadline: values.registration_deadline,
          prize_pool: values.prize_pool,
          first_place_percentage: values.first_place_percentage,
          second_place_percentage: values.second_place_percentage,
          third_place_percentage: values.third_place_percentage,
          rules: values.rules,
          logo_url: logoUrl,
          creator_id: user.id,
          status: 'registration_open',
        }])
        .select()
        .single();

      if (error) throw error;

      // Se formato tem grupos, criar grupos automaticamente
      if (values.format === 'groups-knockout' || values.format === 'groups-only') {
        const calculateNumGroups = (maxParticipants: number): number => {
          if (maxParticipants <= 8) return 2;
          if (maxParticipants <= 16) return 4;
          if (maxParticipants <= 24) return 4;
          if (maxParticipants <= 32) return 8;
          return 4;
        };

        const numGroups = calculateNumGroups(values.max_participants);
        const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        
        const groupsToInsert = Array.from({ length: numGroups }, (_, i) => ({
          tournament_id: data.id,
          name: `Grupo ${groupLetters[i]}`,
          display_order: i + 1
        }));
        
        const { error: groupsError } = await supabase
          .from('groups')
          .insert(groupsToInsert);
        
        if (groupsError) {
          console.error('Error creating groups:', groupsError);
        }
      }

      toast({
        title: "Sucesso!",
        description: "Torneio criado com sucesso",
      });

      navigate(`/torneio/${data?.slug || ''}`);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar torneio",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Torneio Pro</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-8">
        <div className="max-w-3xl mx-auto">
          <Link to="/painel">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl">Criar Novo Torneio</CardTitle>
              <CardDescription>Preencha as informações básicas do seu campeonato</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary">Informações Básicas</h3>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Torneio</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Copa Verão 2024" {...field} className="bg-input border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço URL do Torneio</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-sm">/torneio/</span>
                              <Input {...field} placeholder="copa-verao-2024" className="bg-input border-border" disabled />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Sport Category Selection */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold">Modalidade Principal</Label>
                        <p className="text-sm text-muted-foreground mb-3">Selecione a categoria do seu torneio</p>
                        <RadioGroup value={sportCategory} onValueChange={handleCategoryChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.keys(sportSubcategories).map((category) => (
                            <div key={category} className="relative">
                              <RadioGroupItem
                                value={category}
                                id={category}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={category}
                                className="flex items-center justify-center rounded-lg border-2 border-border bg-card/50 px-6 py-4 cursor-pointer transition-all hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                              >
                                <span className="text-base font-medium">{category}</span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Sport Subcategory Selection - Only shows after category selection */}
                      {sportCategory && (
                        <FormField
                          control={form.control}
                          name="sport"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Especificação da Modalidade</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-input border-border">
                                    <SelectValue placeholder="Selecione a modalidade específica" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {sportSubcategories[sportCategory].map((subcategory) => (
                                    <SelectItem key={subcategory} value={subcategory}>
                                      {subcategory}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="format"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Formato</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-input border-border">
                                  <SelectValue placeholder="Selecione o formato" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="groups-knockout">Grupos + Mata-Mata</SelectItem>
                                <SelectItem value="knockout">Mata-Mata Simples</SelectItem>
                                <SelectItem value="round-robin">Pontos Corridos</SelectItem>
                                <SelectItem value="fighting">Torneio de Luta</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Início</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="bg-input border-border" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Término</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="bg-input border-border" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Arena Sports Center" {...field} className="bg-input border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <Label>Logo do Torneio</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>

                  {/* Registration Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-secondary">Configurações de Inscrição</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="max_participants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máximo de Participantes</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Ex: 16" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                className="bg-input border-border" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="entry_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxa de Inscrição (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="Ex: 200" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                className="bg-input border-border" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="registration_deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prazo de Inscrição</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-input border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Prize Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary">Premiação</h3>
                    
                    <FormField
                      control={form.control}
                      name="prize_pool"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Premiação Total (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="Ex: 5000" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="bg-input border-border" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="first_place_percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>1º Lugar (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="60" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                className="bg-input border-border" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="second_place_percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>2º Lugar (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="30" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                className="bg-input border-border" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="third_place_percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>3º Lugar (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="10" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                className="bg-input border-border" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Rules */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary">Regulamento</h3>
                    
                    <FormField
                      control={form.control}
                      name="rules"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Regras do Torneio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva as regras e regulamento do seu torneio..."
                              className="bg-input border-border min-h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-6">
                    <Button variant="hero" className="flex-1" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Criando..." : "Criar Torneio"}
                    </Button>
                    <Link to="/painel" className="flex-1">
                      <Button variant="ghost" className="w-full" type="button">
                        Cancelar
                      </Button>
                    </Link>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateTournament;
