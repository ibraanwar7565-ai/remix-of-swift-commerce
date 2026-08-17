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
import { useEffect, useState, Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { useNewProductNotifications } from "./hooks/useNewProductNotifications";
import { usePromotionNotifications } from "./hooks/usePromotionNotifications";

// Lazy load non-critical routes
const Onboarding = lazyWithRetry(() => import("./pages/Onboarding"));
const Orders = lazyWithRetry(() => import("./pages/Orders"));
const Account = lazyWithRetry(() => import("./pages/Account"));
const AboutUs = lazyWithRetry(() => import("./pages/AboutUs"));
const Chat = lazyWithRetry(() => import("./pages/Chat"));
const Favourites = lazyWithRetry(() => import("./pages/Favourites"));

const GroceryService = lazyWithRetry(() => import("./pages/GroceryService"));
const CartPage = lazyWithRetry(() => import("./pages/Cart"));
const Install = lazyWithRetry(() => import("./pages/Install"));
const AdminDashboard = lazyWithRetry(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazyWithRetry(() => import("./pages/admin/Users"));
const AdminSettings = lazyWithRetry(() => import("./pages/admin/Settings"));
const AdminInventory = lazyWithRetry(() => import("./pages/admin/Inventory"));
const AdminOrders = lazyWithRetry(() => import("./pages/admin/Orders"));
const AdminReports = lazyWithRetry(() => import("./pages/admin/Reports"));
const AdminRiders = lazyWithRetry(() => import("./pages/admin/Riders"));
const AdminChat = lazyWithRetry(() => import("./pages/admin/Chat"));
const AdminPromoCodes = lazyWithRetry(() => import("./pages/admin/PromoCodes"));
const AdminPromotions = lazyWithRetry(() => import("./pages/admin/Promotions"));
const RiderDashboard = lazyWithRetry(() => import("./pages/rider/Dashboard"));
const RiderChat = lazyWithRetry(() => import("./pages/rider/Chat"));
const StaffLogin = lazyWithRetry(() => import("./pages/StaffLogin"));

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
    try {
      return localStorage.getItem('hasSeenOnboarding') === 'true';
    } catch {
      return false;
    }
  });

  // Listen for storage changes (when onboarding completes)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setHasSeenOnboarding(localStorage.getItem('hasSeenOnboarding') === 'true');
      } catch {
        setHasSeenOnboarding(false);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on custom event for same-tab updates
    const checkOnboarding = () => {
      try {
        setHasSeenOnboarding(localStorage.getItem('hasSeenOnboarding') === 'true');
      } catch {
        setHasSeenOnboarding(false);
      }
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

  const fallback = (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

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
    <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
