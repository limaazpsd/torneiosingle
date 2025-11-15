import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Search, Calendar, MapPin, Users, DollarSign, Award, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { usePublicTournaments } from "@/hooks/useTournaments";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Sport categories and subcategories mapping
const SPORT_CATEGORIES = {
  futebol: {
    label: "Futebol",
    subcategories: ["Futsal", "Fut7", "Futebol"]
  },
  volei: {
    label: "Vôlei",
    subcategories: ["Vôlei de Quadra", "Vôlei de Areia", "FutVôlei"]
  },
  luta: {
    label: "Luta",
    subcategories: ["Karatê", "Taekwondo", "Kickboxing", "Boxe", "MMA", "Judô", "Hapikdo", "Muay Thai", "Jiu Jitsu"]
  }
} as const;

const Tournaments = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sportCategory, setSportCategory] = useState<string>("");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  // Build sport filter based on category and subcategories
  const sportFilter = useMemo(() => {
    if (selectedSubcategories.length > 0) {
      return selectedSubcategories.join(",");
    }
    if (sportCategory) {
      const category = SPORT_CATEGORIES[sportCategory as keyof typeof SPORT_CATEGORIES];
      return category?.subcategories.join(",");
    }
    return undefined;
  }, [sportCategory, selectedSubcategories]);

  const { data: allTournaments, isLoading } = usePublicTournaments({
    search: search || undefined,
  });

  // Filter tournaments based on sport category/subcategories
  const tournaments = useMemo(() => {
    if (!allTournaments) return [];
    if (!sportFilter) return allTournaments;
    
    const sportsArray = sportFilter.split(",");
    return allTournaments.filter(tournament => 
      sportsArray.includes(tournament.sport)
    );
  }, [allTournaments, sportFilter]);

  const clearFilters = () => {
    setSearch("");
    setSportCategory("");
    setSelectedSubcategories([]);
  };

  const toggleSubcategory = (subcategory: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcategory) 
        ? prev.filter(s => s !== subcategory)
        : [...prev, subcategory]
    );
  };

  const handleCategoryChange = (value: string) => {
    setSportCategory(value);
    setSelectedSubcategories([]); // Clear subcategories when changing category
  };

  const getStatusBadge = (tournamentStatus: string) => {
    const badges = {
      registration_open: { label: "Inscrições Abertas", variant: "default" as const },
      registration_closed: { label: "Inscrições Encerradas", variant: "secondary" as const },
      in_progress: { label: "Em Andamento", variant: "default" as const },
      completed: { label: "Finalizado", variant: "outline" as const },
      draft: { label: "Rascunho", variant: "outline" as const },
    };
    return badges[tournamentStatus as keyof typeof badges] || { label: tournamentStatus, variant: "outline" as const };
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
          <Link to="/painel">
            <Button variant="hero">Meu Painel</Button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-hero border-b border-border">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore <span className="text-primary">Torneios Disponíveis</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Encontre competições, inscreva seu time e participe de campeonatos emocionantes
            </p>

            {/* Filters */}
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar torneio por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-card/50 border-border"
                />
              </div>

              {/* Sport Category Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Modalidade:</span>
                  <ToggleGroup 
                    type="single" 
                    value={sportCategory} 
                    onValueChange={handleCategoryChange}
                    className="bg-card/30 p-1 rounded-lg border border-border/50"
                  >
                    <ToggleGroupItem value="futebol" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      Futebol
                    </ToggleGroupItem>
                    <ToggleGroupItem value="volei" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      Vôlei
                    </ToggleGroupItem>
                    <ToggleGroupItem value="luta" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      Luta
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {/* Subcategory Selector (Conditional) */}
                {sportCategory && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Refinar:</span>
                    {SPORT_CATEGORIES[sportCategory as keyof typeof SPORT_CATEGORIES].subcategories.map((subcategory) => (
                      <Badge
                        key={subcategory}
                        variant={selectedSubcategories.includes(subcategory) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80 transition-colors"
                        onClick={() => toggleSubcategory(subcategory)}
                      >
                        {subcategory}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters Button */}
              {(search || sportCategory || selectedSubcategories.length > 0) && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-card/50">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament: any) => {
              const statusBadge = getStatusBadge(tournament.status);
              return (
                <Card
                  key={tournament.id}
                  className="bg-card/50 border-primary/20 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/torneio/${tournament.slug}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Logo do Torneio */}
                      <div className="flex-shrink-0 flex items-center justify-center">
                        {tournament.logo_url ? (
                          <img 
                            src={tournament.logo_url} 
                            alt={tournament.name}
                            className="w-20 h-20 object-contain rounded-lg border border-border"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg border border-border bg-card/50 flex items-center justify-center">
                            <Trophy className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Informações do Torneio */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant={statusBadge.variant} className="text-xs">
                            {statusBadge.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tournament.sport}
                          </Badge>
                        </div>

                        <h3 className="text-xl font-bold mb-3 line-clamp-2">{tournament.name}</h3>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(tournament.start_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{tournament.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-primary" />
                            <span>
                              {tournament.available_spots > 0
                                ? `${tournament.available_spots} vagas disponíveis`
                                : "Esgotado"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">
                              R$ {Number(tournament.entry_fee).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-secondary" />
                            <span className="text-sm font-semibold text-secondary">
                              R$ {Number(tournament.prize_pool).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Trophy className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-2">Nenhum torneio encontrado</h3>
            <p className="text-muted-foreground mb-8">
              {search || sportCategory || selectedSubcategories.length > 0
                ? "Tente ajustar os filtros para encontrar torneios"
                : "Seja o primeiro a criar um torneio!"}
            </p>
            <Link to="/criar-torneio">
              <Button variant="hero" size="lg">
                Criar Meu Torneio
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
