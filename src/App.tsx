import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CookieBanner } from "./components/CookieBanner";
import { FeedbackButton } from "./components/FeedbackButton";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CreatePassword from "./pages/CreatePassword";
import Register from "./pages/Register";
import CreateTestUser from "./pages/CreateTestUser";
import CreateFounder from "./pages/CreateFounder";
import LegalNotice from "./pages/LegalNotice";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiesPolicy from "./pages/CookiesPolicy";
import Manifesto from "./pages/Manifesto";
import About from "./pages/About";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/create-password" element={<CreatePassword />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/create-test-user" 
                element={
                  <ProtectedRoute requireAdmin>
                    <CreateTestUser />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-founder" 
                element={
                  <ProtectedRoute requireAdmin>
                    <CreateFounder />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
              <Route path="/manifesto" element={<Manifesto />} />
              <Route path="/about" element={<About />} />
              <Route path="/legal-notice" element={<LegalNotice />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cookies-policy" element={<CookiesPolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <FeedbackButton />
          <CookieBanner />
        </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
