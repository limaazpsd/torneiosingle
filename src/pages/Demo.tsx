import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Calendar, DollarSign, Trophy, Users, Zap } from "lucide-react";

const Demo = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { number: 1, title: "Configuração", icon: "⚙️" },
    { number: 2, title: "Times Inscritos", icon: "👥" },
    { number: 3, title: "Fase de Grupos", icon: "⚽" },
    { number: 4, title: "Mata-Mata", icon: "🏆" },
  ];

  const goNext = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const goPrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Torneio <span className="text-primary">Pro</span>
          </Link>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Como Funciona o <span className="text-primary">Torneio Pro</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Veja um exemplo completo de como criar e gerenciar um campeonato de futsal com 20 times
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => setCurrentStep(step.number)}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all ${
                currentStep === step.number
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <span className="text-2xl">{step.icon}</span>
              <div className="text-left">
                <div className="text-xs opacity-70">Etapa {step.number}</div>
                <div className="font-semibold">{step.title}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="animate-fade-in">
          {currentStep === 1 && <ConfigurationStep />}
          {currentStep === 2 && <TeamsStep />}
          {currentStep === 3 && <GroupsStep />}
          {currentStep === 4 && <BracketStep />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-12 gap-4">
          <Button
            onClick={goPrev}
            disabled={currentStep === 1}
            variant="outline"
            size="lg"
            className="min-w-[140px]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Etapa {currentStep} de 4
          </div>
          <Button
            onClick={goNext}
            disabled={currentStep === 4}
            variant="default"
            size="lg"
            className="min-w-[140px]"
          >
            Próximo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Step 1: Configuration
const ConfigurationStep = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <span className="text-3xl">⚙️</span>
          Configuração do Torneio
        </h2>
        <p className="text-muted-foreground">
          Defina as informações básicas e o formato da competição
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome do Torneio */}
        <Card className="bg-card/50 border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2">Nome do Torneio</div>
            <div className="text-xl font-bold text-foreground">Copa Futsal Verão 2025</div>
          </CardContent>
        </Card>

        {/* Data de Início */}
        <Card className="bg-card/50 border-border/50 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              Data de Início
            </div>
            <div className="text-xl font-bold text-foreground">15/03/2025</div>
          </CardContent>
        </Card>

        {/* Esporte */}
        <Card className="bg-card/50 border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2">Esporte</div>
            <div className="text-xl font-bold text-foreground">Futsal</div>
          </CardContent>
        </Card>

        {/* Taxa de Inscrição */}
        <Card className="bg-card/50 border-border/50 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-400" />
              Taxa de Inscrição
            </div>
            <div className="text-xl font-bold text-foreground">R$ 200,00</div>
          </CardContent>
        </Card>

        {/* Formato */}
        <Card className="bg-card/50 border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2">Formato</div>
            <div className="text-xl font-bold text-foreground mb-2">Fase de Grupos + Mata-Mata</div>
            <div className="text-sm text-muted-foreground">
              2 grupos de 5 times • Os 2 melhores de cada grupo avançam
            </div>
          </CardContent>
        </Card>

        {/* Premiação Total - Destaque especial */}
        <Card className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-emerald-400 mb-2">
              <Trophy className="h-5 w-5" />
              Premiação Total
            </div>
            <div className="text-3xl font-bold text-emerald-400 mb-3">R$ 2.000,00</div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-muted-foreground">1º: <span className="text-foreground font-semibold">R$ 1.200</span></span>
              <span className="text-muted-foreground">2º: <span className="text-foreground font-semibold">R$ 600</span></span>
              <span className="text-muted-foreground">3º: <span className="text-foreground font-semibold">R$ 200</span></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automação Inteligente */}
      <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <Zap className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-cyan-400">Automação Inteligente</h3>
              <p className="text-muted-foreground">
                Após definir o formato, o sistema sorteia automaticamente os grupos e gera toda a chave do mata-mata baseada nos resultados da fase de grupos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 2: Teams
const TeamsStep = () => {
  const teams = [
    { emoji: "🐯", name: "Tigres FC", players: 8, position: 1, group: "A" },
    { emoji: "🦅", name: "Águias Douradas", players: 9, position: 2, group: "A" },
    { emoji: "🦁", name: "Leões Unidos", players: 8, position: 3, group: "A" },
    { emoji: "🦅", name: "Falcões Negros", players: 10, position: 4, group: "A" },
    { emoji: "🐉", name: "Dragões de Fogo", players: 9, position: 5, group: "A" },
    { emoji: "🐆", name: "Panteras Azuis", players: 9, position: 6, group: "B" },
    { emoji: "🐺", name: "Lobos da Noite", players: 8, position: 7, group: "B" },
    { emoji: "🦈", name: "Tubarões FC", players: 10, position: 8, group: "B" },
    { emoji: "🦖", name: "Raptores Verdes", players: 9, position: 9, group: "B" },
    { emoji: "🐍", name: "Cobras Reais", players: 8, position: 10, group: "B" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">👥 Times Inscritos</h2>
        <p className="text-muted-foreground text-lg">
          10 times confirmados • Inscrições encerradas
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {teams.map((team, index) => (
          <Card
            key={index}
            className="bg-card/95 border-primary/20 hover:border-primary/50 transition-all hover-scale"
          >
            <CardContent className="pt-6 text-center space-y-3">
              <div className="relative inline-block">
                <div className="text-5xl mb-2">{team.emoji}</div>
                <Badge className="absolute -top-2 -right-2 bg-orange-500/20 text-orange-500 border-orange-500/30">
                  #{team.position}
                </Badge>
              </div>
              <div>
                <h3 className="font-bold text-foreground">{team.name}</h3>
                <p className="text-sm text-muted-foreground">{team.players} jogadores</p>
                <Badge className="mt-2 bg-primary/20 text-primary">
                  Grupo {team.group}
                </Badge>
              </div>
              <div className="flex items-center justify-center gap-1 text-green-400 text-sm">
                <span>💵</span>
                <span>Pago</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Step 3: Groups
const GroupsStep = () => {
  const groupA = [
    { pos: 1, emoji: "🐯", name: "Tigres FC", points: 6, wins: 2, sg: 6, gp: 8, qualified: true },
    { pos: 2, emoji: "🦅", name: "Águias Douradas", points: 4, wins: 1, sg: 2, gp: 5, qualified: true },
    { pos: 3, emoji: "🦁", name: "Leões Unidos", points: 3, wins: 1, sg: 0, gp: 4, qualified: false },
    { pos: 4, emoji: "🦅", name: "Falcões Negros", points: 1, wins: 0, sg: -3, gp: 2, qualified: false },
    { pos: 5, emoji: "🐉", name: "Dragões de Fogo", points: 0, wins: 0, sg: -5, gp: 1, qualified: false },
  ];

  const groupB = [
    { pos: 1, emoji: "🐆", name: "Panteras Azuis", points: 6, wins: 2, sg: 6, gp: 9, qualified: true },
    { pos: 2, emoji: "🐺", name: "Lobos da Noite", points: 4, wins: 1, sg: 2, gp: 6, qualified: true },
    { pos: 3, emoji: "🦈", name: "Tubarões FC", points: 3, wins: 1, sg: 0, gp: 5, qualified: false },
    { pos: 4, emoji: "🦖", name: "Raptores Verdes", points: 1, wins: 0, sg: -3, gp: 3, qualified: false },
    { pos: 5, emoji: "🐍", name: "Cobras Reais", points: 0, wins: 0, sg: -5, gp: 2, qualified: false },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">⚽ Fase de Grupos</h2>
        <p className="text-muted-foreground text-lg">
          Os 2 melhores times de cada grupo avançam para as semifinais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Group A */}
        <Card className="bg-card/50 border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
          <CardHeader className="relative border-b border-cyan-500/20">
            <CardTitle className="text-cyan-400 text-2xl flex items-center gap-2">
              <span className="text-3xl">⚽</span>
              Grupo A
            </CardTitle>
            <Badge className="absolute top-6 right-6 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              Concluído
            </Badge>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground pb-2 border-b border-border/50">
                <div className="col-span-5">Time</div>
                <div className="col-span-2 text-center">P</div>
                <div className="col-span-2 text-center">V</div>
                <div className="col-span-2 text-center">SG</div>
                <div className="col-span-1 text-center">GP</div>
              </div>
              {groupA.map((team) => (
                <div
                  key={team.pos}
                  className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border transition-all duration-300 ${
                    team.qualified
                      ? "bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500/50 hover:shadow-md hover:shadow-cyan-500/10"
                      : "bg-card/30 border-border/30 hover:border-border/50"
                  }`}
                >
                  <div className="col-span-5 flex items-center gap-2">
                    <span className="text-2xl">{team.emoji}</span>
                    <span className="font-semibold text-foreground">{team.name}</span>
                  </div>
                  <div className="col-span-2 text-center font-bold text-foreground">{team.points}</div>
                  <div className="col-span-2 text-center text-muted-foreground">{team.wins}</div>
                  <div className="col-span-2 text-center text-muted-foreground">{team.sg}</div>
                  <div className="col-span-1 text-center text-muted-foreground">{team.gp}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-sm text-cyan-400 flex items-center gap-2">
              <span>→</span>
              <span>Tigres FC e Águias Douradas classificados</span>
            </div>
          </CardContent>
        </Card>

        {/* Group B */}
        <Card className="bg-card/50 border-lime-500/30 hover:border-lime-500/60 hover:shadow-xl hover:shadow-lime-500/20 transition-all duration-300">
          <CardHeader className="relative border-b border-lime-500/20">
            <CardTitle className="text-lime-400 text-2xl flex items-center gap-2">
              <span className="text-3xl">⚽</span>
              Grupo B
            </CardTitle>
            <Badge className="absolute top-6 right-6 bg-lime-500/20 text-lime-400 border-lime-500/30">
              Concluído
            </Badge>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground pb-2 border-b border-border/50">
                <div className="col-span-5">Time</div>
                <div className="col-span-2 text-center">P</div>
                <div className="col-span-2 text-center">V</div>
                <div className="col-span-2 text-center">SG</div>
                <div className="col-span-1 text-center">GP</div>
              </div>
              {groupB.map((team) => (
                <div
                  key={team.pos}
                  className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border transition-all duration-300 ${
                    team.qualified
                      ? "bg-lime-500/10 border-lime-500/30 hover:border-lime-500/50 hover:shadow-md hover:shadow-lime-500/10"
                      : "bg-card/30 border-border/30 hover:border-border/50"
                  }`}
                >
                  <div className="col-span-5 flex items-center gap-2">
                    <span className="text-2xl">{team.emoji}</span>
                    <span className="font-semibold text-foreground">{team.name}</span>
                  </div>
                  <div className="col-span-2 text-center font-bold text-foreground">{team.points}</div>
                  <div className="col-span-2 text-center text-muted-foreground">{team.wins}</div>
                  <div className="col-span-2 text-center text-muted-foreground">{team.sg}</div>
                  <div className="col-span-1 text-center text-muted-foreground">{team.gp}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-lime-500/10 border border-lime-500/20 rounded-lg text-sm text-lime-400 flex items-center gap-2">
              <span>→</span>
              <span>Panteras Azuis e Lobos da Noite classificados</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Step 4: Bracket
const BracketStep = () => {
  const semifinals = [
    {
      id: 1,
      team1: { emoji: "🐯", name: "Tigres FC", score: 3 },
      team2: { emoji: "🐺", name: "Lobos da Noite", score: 2 },
      winner: "Tigres FC",
      winnerEmoji: "🐯",
    },
    {
      id: 2,
      team1: { emoji: "🐆", name: "Panteras Azuis", score: 4 },
      team2: { emoji: "🦅", name: "Águias Douradas", score: 3 },
      winner: "Panteras Azuis",
      winnerEmoji: "🐆",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3 flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          Chaveamento - Mata-Mata
        </h2>
        <p className="text-muted-foreground text-lg">
          Os 4 melhores times disputam o título em jogos eliminatórios
        </p>
      </div>

      {/* Semifinais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {semifinals.map((game) => (
          <Card key={game.id} className="bg-card/50 border-cyan-500/30 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
            <CardContent className="pt-6 space-y-4">
              {/* Team 1 */}
              <div className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                game.team1.score > game.team2.score 
                  ? "bg-cyan-500/10 border-cyan-500/30" 
                  : "bg-card/30 border-border/30"
              }`}>
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-3xl">{game.team1.emoji}</span>
                  <span className="font-bold text-lg text-foreground">{game.team1.name}</span>
                </div>
                <span className="text-3xl font-bold text-foreground">{game.team1.score}</span>
              </div>

              {/* VS */}
              <div className="text-center text-sm text-muted-foreground font-semibold">vs</div>

              {/* Team 2 */}
              <div className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                game.team2.score > game.team1.score 
                  ? "bg-cyan-500/10 border-cyan-500/30" 
                  : "bg-card/30 border-border/30"
              }`}>
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-3xl">{game.team2.emoji}</span>
                  <span className="font-bold text-lg text-foreground">{game.team2.name}</span>
                </div>
                <span className="text-3xl font-bold text-foreground">{game.team2.score}</span>
              </div>

              {/* Winner */}
              <div className="text-center pt-3 border-t border-orange-500/20">
                <div className="flex items-center justify-center gap-2 text-orange-500 font-bold text-sm">
                  <Trophy className="h-4 w-4" />
                  <span>Vencedor: {game.winner}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grande Final */}
      <div className="mt-12">
        <div className="flex justify-center mb-6">
          <Badge className="bg-gradient-to-r from-cyan-500 to-orange-500 text-white text-base px-6 py-2 border-0">
            🏆 GRANDE FINAL 🏆
          </Badge>
        </div>

        <Card className="bg-gradient-to-br from-cyan-500/10 via-teal-500/10 to-orange-500/10 border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300 max-w-2xl mx-auto">
          <CardContent className="pt-8 space-y-6">
            {/* Campeão */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 rounded-lg">
              <div className="flex items-center gap-4 flex-1">
                <span className="text-5xl">{semifinals[0].winnerEmoji}</span>
                <div>
                  <span className="font-bold text-2xl text-foreground">{semifinals[0].winner}</span>
                  <div className="text-cyan-400 text-sm font-semibold">🏆 CAMPEÃO</div>
                </div>
              </div>
              <span className="text-5xl font-bold text-foreground">5</span>
            </div>

            {/* Placar Final Label */}
            <div className="text-center">
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-1">
                PLACAR FINAL
              </Badge>
            </div>

            {/* Vice-Campeão */}
            <div className="flex items-center justify-between p-6 bg-card/50 border border-border/50 rounded-lg">
              <div className="flex items-center gap-4 flex-1">
                <span className="text-4xl">{semifinals[1].winnerEmoji}</span>
                <span className="font-bold text-xl text-foreground">{semifinals[1].winner}</span>
              </div>
              <span className="text-4xl font-bold text-muted-foreground">4</span>
            </div>

            {/* Premiação */}
            <div className="mt-6 p-6 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-lg text-center">
              <div className="text-sm text-emerald-400 mb-2">Premiação do Campeão</div>
              <div className="text-4xl font-bold text-emerald-400">R$ 1.200,00</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Demo;
