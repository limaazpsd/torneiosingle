import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar, Award, Target, Zap, DollarSign, CheckCircle2, Star, TrendingUp, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterModal } from "@/components/auth/RegisterModal";
import heroImage from "@/assets/hero-tournament.jpg";

const Index = () => {
  const { user, signOut } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleCreateTournamentClick = () => {
    if (!user) {
      setShowLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Torneio Pro</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost">
                    <User className="h-4 w-4 mr-2" />
                    Meu Painel
                  </Button>
                </Link>
                <Button variant="ghost" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setShowLoginModal(true)}>
                  Login
                </Button>
                <Button variant="hero" onClick={() => setShowRegisterModal(true)}>
                  Registrar-se
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">Gestão de Campeonatos Automatizada</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Organize Torneios{" "}
              <span className="text-primary">de Forma Profissional</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              A plataforma completa para criar, gerenciar e promover campeonatos. Do planejamento à premiação, tudo em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to="/create-tournament">
                  <Button variant="hero" size="lg" className="text-lg">
                    Criar meu torneio agora
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="text-lg"
                  onClick={handleCreateTournamentClick}
                >
                  Criar meu torneio agora
                </Button>
              )}
            <Link to="/demo">
              <Button variant="glow" size="lg" className="text-lg">
                Ver Demonstração
              </Button>
            </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Metrics */}
      <section className="py-16">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">1000+</div>
              <div className="text-sm text-muted-foreground">Torneios Criados</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">50k+</div>
              <div className="text-sm text-muted-foreground">Participantes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">4.9⭐</div>
              <div className="text-sm text-muted-foreground">Avaliação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tudo que você precisa para <span className="text-primary">gerenciar campeonatos</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Automatize processos, economize tempo e ofereça uma experiência profissional aos participantes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Criação Rápida</h3>
              <p className="text-muted-foreground">
                Configure seu torneio em minutos. Múltiplos formatos: grupos, mata-mata, pontos corridos.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Inscrições Online</h3>
              <p className="text-muted-foreground">
                Link único para inscrições. Formulário customizável e controle automático de vagas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Pagamentos Integrados</h3>
              <p className="text-muted-foreground">
                Receba taxas de inscrição com segurança. Integração com os principais gateways de pagamento.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Chaveamento Automático</h3>
              <p className="text-muted-foreground">
                Sistema inteligente para tabelas e chaves automaticamente. Sorteio aleatório ou justo.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Resultados em Tempo Real</h3>
              <p className="text-muted-foreground">
                Atualize placares e veja tabelas mudarem instantaneamente. Tudo sincronizado.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Página Pública</h3>
              <p className="text-muted-foreground">
                Cada torneio tem sua página com tabelas, chaves e agenda atualizadas em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Torneios de Destaque Organizados Conosco</h2>
            <p className="text-xl text-muted-foreground">Eventos que confiam no Torneio Pro</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-card/50 border-primary/20 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-32 mb-4">
                  <Trophy className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Copa Regional 2024</h3>
                <p className="text-sm text-muted-foreground text-center">32 times • R$ 10.000 em premiação</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-32 mb-4">
                  <Award className="h-16 w-16 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Liga Metropolitana</h3>
                <p className="text-sm text-muted-foreground text-center">24 times • R$ 7.500 em premiação</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-32 mb-4">
                  <Star className="h-16 w-16 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Torneio Elite MMA</h3>
                <p className="text-sm text-muted-foreground text-center">16 atletas • R$ 5.000 em premiação</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Explore Tournaments Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Descubra <span className="text-primary">Torneios Disponíveis</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Participe de competições organizadas por outros usuários da plataforma
            </p>
          </div>
          
          <Card className="bg-card/50 border-primary/20 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300">
            <CardContent className="p-12 text-center">
              <Trophy className="h-20 w-20 text-primary mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">
                Torneios Aguardando por Você
              </h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Explore torneios de diversos esportes, encontre competições na sua região
                e inscreva seu time em campeonatos emocionantes.
              </p>
              <Link to="/tournaments">
                <Button variant="hero" size="lg">
                  <Trophy className="mr-2" />
                  Explorar Torneios
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Planos que <span className="text-primary">crescem com você</span>
            </h2>
            <p className="text-xl text-muted-foreground">Escolha o modelo que melhor se encaixa no seu negócio</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan 1 */}
            <Card className="bg-card/50 border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Gratuito</CardTitle>
                <CardDescription>Para começar e testar</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">R$ 0</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">1 torneio ativo por vez</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Até 20 participantes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Funcionalidades básicas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Página pública do torneio</span>
                  </li>
                </ul>
                <Button variant="glow" className="w-full">Começar Grátis</Button>
              </CardContent>
            </Card>

            {/* Plan 2 - Featured */}
            <Card className="bg-card/50 border-primary hover:border-primary hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-primary px-4 py-1 rounded-full">
                <span className="text-sm font-bold text-primary-foreground">Mais Popular</span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Por Evento</CardTitle>
                <CardDescription>Perfeito para organizadores regulares</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">5%</span>
                  <span className="text-muted-foreground"> por inscrição</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Torneios ilimitados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Participantes ilimitados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Pagamentos online integrados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Suporte prioritário</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dashboard completo</span>
                  </li>
                </ul>
                <Button variant="hero" className="w-full">Começar Agora</Button>
              </CardContent>
            </Card>

            {/* Plan 3 */}
            <Card className="bg-card/50 border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Pro Ilimitado</CardTitle>
                <CardDescription>Para organizadores profissionais</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">R$ 297</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Tudo do plano Por Evento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Sem taxas por transação</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Personalização avançada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">White label (sua marca)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Suporte dedicado 24/7</span>
                  </li>
                </ul>
                <Button variant="glow" className="w-full">Falar com Vendas</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <Card className="max-w-4xl mx-auto border-primary/30 bg-card/50 backdrop-blur">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Pronto para profissionalizar seu campeonato?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Comece a usar o Torneio Pro hoje mesmo e ofereça a melhor experiência para seus competidores.
              </p>
              {user ? (
                <Link to="/create-tournament">
                  <Button variant="hero" size="lg" className="text-lg">
                    Criar meu torneio agora
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="text-lg"
                  onClick={handleCreateTournamentClick}
                >
                  Criar meu torneio agora
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Modals */}
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      <RegisterModal 
        open={showRegisterModal} 
        onOpenChange={setShowRegisterModal}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 text-center text-muted-foreground">
          <p>© 2024 Torneio Pro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
