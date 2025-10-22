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
import Demo from "./pages/Demo";
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
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-tournament" 
              element={
                <ProtectedRoute>
                  <CreateTournament />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-tournament/:id" 
              element={
                <ProtectedRoute>
                  <TournamentManagement />
                </ProtectedRoute>
              } 
            />
            <Route path="/tournament/:id" element={<PublicTournament />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route 
              path="/create-team" 
              element={
                <ProtectedRoute>
                  <CreateIndependentTeam />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/team/:teamId" 
              element={
                <ProtectedRoute>
                  <TeamManagement />
                </ProtectedRoute>
              } 
            />
            <Route path="/demo" element={<Demo />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
