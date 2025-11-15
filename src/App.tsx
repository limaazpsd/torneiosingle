import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateTournament from "./pages/CreateTournament";
import TournamentManagement from "./pages/TournamentManagement";
import PublicTournament from "./pages/PublicTournament";
import Tournaments from "./pages/Tournaments";
import CreateIndependentTeam from "./pages/CreateIndependentTeam";
import TeamManagement from "./pages/TeamManagement";
import RegularizePayment from "./pages/RegularizePayment";
import Demo from "./pages/Demo";
import Profile from "./pages/Profile";
import PlayerProfile from "./pages/PlayerProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/painel" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/criar-torneio" 
              element={
                <ProtectedRoute>
                  <CreateTournament />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/editar-torneio/:slug" 
              element={
                <ProtectedRoute>
                  <TournamentManagement />
                </ProtectedRoute>
              } 
            />
            <Route path="/torneio/:slug" element={<PublicTournament />} />
            <Route path="/torneios" element={<Tournaments />} />
            <Route 
              path="/criar-time" 
              element={
                <ProtectedRoute>
                  <CreateIndependentTeam />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/time/:teamId" 
              element={
                <ProtectedRoute>
                  <TeamManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/regularizar-inscricao/:teamId" 
              element={
                <ProtectedRoute>
                  <RegularizePayment />
                </ProtectedRoute>
              } 
            />
            <Route path="/demo" element={<Demo />} />
            <Route 
              path="/perfil" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route path="/player/:playerId" element={<PlayerProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
