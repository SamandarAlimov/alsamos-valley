import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Hubs from "./pages/Hubs";
import HubDetail from "./pages/HubDetail";
import Startups from "./pages/Startups";
import Investors from "./pages/Investors";
import Events from "./pages/Events";
import Auth from "./pages/Auth";
import CreateRoom from "./pages/CreateRoom";
import Room from "./pages/Room";
import StartupProfile from "./pages/StartupProfile";
import SubmitStartup from "./pages/SubmitStartup";
import Classrooms from "./pages/Classrooms";
import CreateClassroom from "./pages/CreateClassroom";
import ClassroomDetail from "./pages/ClassroomDetail";
import ResearchLabs from "./pages/ResearchLabs";
import CreateResearchLab from "./pages/CreateResearchLab";
import ResearchLabDetail from "./pages/ResearchLabDetail";
import Notifications from "./pages/Notifications";
import AIChat from "./pages/AIChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/profile/:userId?" element={<Profile />} />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/hubs" element={<Hubs />} />
            <Route path="/hubs/:hubId" element={<HubDetail />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/startups" element={<Startups />} />
            <Route path="/startup/:id" element={<StartupProfile />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/events" element={<Events />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/create-room"
              element={
                <ProtectedRoute>
                  <CreateRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/submit-startup"
              element={
                <ProtectedRoute>
                  <SubmitStartup />
                </ProtectedRoute>
              }
            />
            <Route path="/classrooms" element={<Classrooms />} />
            <Route
              path="/classrooms/create"
              element={
                <ProtectedRoute>
                  <CreateClassroom />
                </ProtectedRoute>
              }
            />
            <Route path="/classrooms/:classroomId" element={<ClassroomDetail />} />
            <Route path="/research-labs" element={<ResearchLabs />} />
            <Route
              path="/create-research-lab"
              element={
                <ProtectedRoute>
                  <CreateResearchLab />
                </ProtectedRoute>
              }
            />
            <Route path="/research-labs/:id" element={<ResearchLabDetail />} />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
