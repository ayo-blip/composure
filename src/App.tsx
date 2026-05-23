import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AdminRoute from "@/components/AdminRoute";
import { ChatBubble } from "@/components/ChatBubble";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Library from "./pages/Library";
import OrgSetup from "./pages/OrgSetup";
import KnowledgeBase from "./pages/KnowledgeBase";
import AdminDashboard from "./pages/AdminDashboard";
import Pricing from "./pages/Pricing";
import BillingSuccess from "./pages/BillingSuccess";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Redirects logged-in users with no org to /setup
function OrgGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return null;
  if (user && profile && !profile.organisation_id) {
    return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ChatBubble />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/setup" element={<OrgSetup />} />
            <Route
              path="/"
              element={
                <OrgGuard>
                  <Index />
                </OrgGuard>
              }
            />
            <Route
              path="/library"
              element={
                <OrgGuard>
                  <Library />
                </OrgGuard>
              }
            />
            <Route
              path="/knowledge-base"
              element={
                <AdminRoute>
                  <KnowledgeBase />
                </AdminRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/billing/success" element={<BillingSuccess />} />
            <Route path="/cases" element={<OrgGuard><Cases /></OrgGuard>} />
            <Route path="/cases/:id" element={<OrgGuard><CaseDetail /></OrgGuard>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
