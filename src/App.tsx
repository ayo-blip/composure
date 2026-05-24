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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import Waitlist from "./pages/Waitlist";
import ResetPassword from "./pages/ResetPassword";
import SuperAdmin from "./pages/SuperAdmin";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Redirects logged-in users with no org to /setup, and blocks deactivated accounts
function OrgGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return null;
  if (user && profile && !profile.organisation_id) {
    return <Navigate to="/setup" replace />;
  }
  if (user && profile && profile.active === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-3">
          <p className="font-heading text-xl font-semibold text-foreground">Account deactivated</p>
          <p className="text-sm text-muted-foreground">Your account has been deactivated. Please contact your organisation admin.</p>
        </div>
      </div>
    );
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
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/superadmin" element={<SuperAdmin />} />
            <Route path="/security" element={<Security />} />
            <Route path="/settings" element={<OrgGuard><Settings /></OrgGuard>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
