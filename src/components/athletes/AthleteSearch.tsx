import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // Importação adicionada
import { Search, Send } from "lucide-react";
import { toast } from "sonner";
import { formatUsername } from "@/lib/validators";

export function AthleteSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchTerm.trim();

    if (!trimmedSearch) {
      toast.error("Digite um nome ou username para pesquisar.");
      return;
    }

    // Remove @ e formata para minúsculas para a URL
    const cleanUsername = formatUsername(trimmedSearch);

    if (cleanUsername.length < 3) {
      toast.error("O termo de busca deve ter no mínimo 3 caracteres.");
      return;
    }

    // Navega para a rota do atleta. O AthleteProfile fará a busca no banco.
    navigate(`/atleta/${cleanUsername}?tournament=all`);
    setSearchTerm("");
  };

  return (
    <Card className="bg-card/50 border-primary/20">
      <CardContent className="pt-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atleta por @username ou nome"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={!searchTerm.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}