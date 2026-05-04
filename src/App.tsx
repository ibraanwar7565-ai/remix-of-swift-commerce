import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { RiderGuard } from "@/components/rider/RiderGuard";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, lazy, Suspense } from "react";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import { useNewProductNotifications } from "./hooks/useNewProductNotifications";
import { usePromotionNotifications } from "./hooks/usePromotionNotifications";

// Lazy load non-critical routes
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Orders = lazy(() => import("./pages/Orders"));
const Account = lazy(() => import("./pages/Account"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Chat = lazy(() => import("./pages/Chat"));
const Favourites = lazy(() => import("./pages/Favourites"));

const GroceryService = lazy(() => import("./pages/GroceryService"));
const CartPage = lazy(() => import("./pages/Cart"));
const Install = lazy(() => import("./pages/Install"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminInventory = lazy(() => import("./pages/admin/Inventory"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminRiders = lazy(() => import("./pages/admin/Riders"));
const AdminChat = lazy(() => import("./pages/admin/Chat"));
const AdminPromoCodes = lazy(() => import("./pages/admin/PromoCodes"));
const AdminPromotions = lazy(() => import("./pages/admin/Promotions"));
const RiderDashboard = lazy(() => import("./pages/rider/Dashboard"));
const RiderChat = lazy(() => import("./pages/rider/Chat"));
const StaffLogin = lazy(() => import("./pages/StaffLogin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('hasSeenOnboarding') === 'true';
  });

  // Listen for storage changes (when onboarding completes)
  useEffect(() => {
    const handleStorageChange = () => {
      setHasSeenOnboarding(localStorage.getItem('hasSeenOnboarding') === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on custom event for same-tab updates
    const checkOnboarding = () => {
      setHasSeenOnboarding(localStorage.getItem('hasSeenOnboarding') === 'true');
    };
    window.addEventListener('onboarding-complete', checkOnboarding);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('onboarding-complete', checkOnboarding);
    };
  }, []);

  // Listen for new products globally so all customers get notified
  useNewProductNotifications();
  usePromotionNotifications();

  const fallback = <div className="min-h-screen bg-background" />;

  return (
    <Suspense fallback={fallback}>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />
        
        {/* Client Routes */}
        <Route path="/store" element={<Index />} />
        <Route path="/welcome" element={<Onboarding />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/portal-9x2k" element={<StaffLogin />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/account" element={<Account />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/favourites" element={<Favourites />} />
        
        <Route path="/grocery" element={<GroceryService />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/install" element={<Install />} />
        
        {/* Admin Routes - Protected */}
        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
        <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />
        <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
        <Route path="/admin/inventory" element={<AdminGuard allowRoles={['inventory_manager']}><AdminInventory /></AdminGuard>} />
        <Route path="/admin/reports" element={<AdminGuard><AdminReports /></AdminGuard>} />
        <Route path="/admin/riders" element={<AdminGuard><AdminRiders /></AdminGuard>} />
        <Route path="/admin/chat" element={<AdminGuard><AdminChat /></AdminGuard>} />
        <Route path="/admin/promo-codes" element={<AdminGuard><AdminPromoCodes /></AdminGuard>} />
        <Route path="/admin/promotions" element={<AdminGuard><AdminPromotions /></AdminGuard>} />
        <Route path="/admin/*" element={<AdminGuard><AdminDashboard /></AdminGuard>} />

        {/* Rider Routes - Protected */}
        <Route path="/rider" element={<RiderGuard><RiderDashboard /></RiderGuard>} />
        <Route path="/rider/chat" element={<RiderGuard><RiderChat /></RiderGuard>} />
        <Route path="/rider/*" element={<RiderGuard><RiderDashboard /></RiderGuard>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
                <PWAUpdatePrompt />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
