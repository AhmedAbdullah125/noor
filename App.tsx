
import React, { useState, useMemo, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import TabBar from './components/TabBar';
import NotificationsTab from './components/NotificationsTab';
import AccountTab from './components/account/AccountTab';
import AppointmentsTab from './components/AppointmentsTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import HomeTab from './components/home/HomeTab';
import AllProductsPage from './components/AllProductsPage';
import BrandPage from './components/BrandPage';
import SubscriptionDetailsPage from './components/SubscriptionDetailsPage';
import EditAppointmentPage from './components/EditAppointmentPage';
import BookNextSessionPage from './components/BookNextSessionPage';
import CartPage from './components/CartPage';
import SignUpPage from './components/auth/SignUpPage';
import LoginPage from './components/auth/LoginPage';
import OTPPage from './components/auth/OTPPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import { authEvents, resetAuthState } from "./components/services/http";
import { clearAuth, isLoggedIn } from "./components/auth/authStorage";
import { toast } from "sonner";

import HairProfilePage from './components/HairProfilePage';
import PlaceholderTab from './components/PlaceholderTab';
import { TabId, Product, ServiceAddon, ServicePackageOption, BookingItem } from './types';
import { cacheService } from './services/cacheService';

export interface Order {
  id: string;
  date: string;
  time?: string;
  status: string;
  total: string;
  items: BookingItem[];
  isPackage?: boolean;
  packageName?: string;
  walletPaid?: number;
  onlinePaid?: number;
  paymentMethodType?: string;
}

const STORAGE_KEY_BOOKINGS = 'mezo_bookings_v1';
const STORAGE_KEY_FAVOURITES = 'mezo_favourites_v1';
const STORAGE_KEY_IS_LOGGED_IN = 'mezo_auth_is_logged_in';
const STORAGE_KEY_AUTH_MODE = 'mezo_auth_mode';

type AuthStatus = 'anonymous' | 'guest' | 'authenticated';

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [orders, setOrders] = useState<Order[]>([]);
  const [favourites, setFavourites] = useState<number[]>([]);

  // Derive auth status from the REAL token in storage — this is the source of truth.
  // Falls back to the legacy auth-mode flag for guest sessions.
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => {
    if (isLoggedIn()) return 'authenticated';
    const authMode = localStorage.getItem(STORAGE_KEY_AUTH_MODE);
    if (authMode === 'guest') return 'guest';
    return 'anonymous';
  });

  // Prevent ProtectedRoute from redirecting before we've confirmed auth on first render.
  const [authChecked, setAuthChecked] = useState(false);

  const ProtectedRoute: React.FC<{ children: React.ReactNode; authStatus: AuthStatus }> = ({ children, authStatus }) => {
    if (!authChecked) return null; // Wait silently while confirming auth
    if (authStatus === 'anonymous') {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  // Wire global 401 / session-expired logout
  useEffect(() => {
    authEvents.onLogout = (_reason?: string, message?: string) => {
      clearAuth();
      localStorage.removeItem(STORAGE_KEY_IS_LOGGED_IN);
      localStorage.removeItem(STORAGE_KEY_AUTH_MODE);
      localStorage.removeItem("mezo_auth_user_name");
      localStorage.removeItem("mezo_auth_user_phone");
      setAuthStatus("anonymous");
      navigate("/login");
      if (message) {
        toast(message, {
          id: "session-expired",
          style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
        });
      }
    };
    return () => {
      authEvents.onLogout = () => { };
    };
  }, [navigate]);

  // Load initial data and confirm auth from real token
  useEffect(() => {
    cacheService.warmup();

    // Load bookings
    const savedBookings = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (savedBookings) {
      setOrders(JSON.parse(savedBookings));
    }

    // Load favourites
    const savedFavs = localStorage.getItem(STORAGE_KEY_FAVOURITES);
    if (savedFavs) {
      setFavourites(JSON.parse(savedFavs));
    }

    // Re-confirm auth using the actual token (source of truth)
    if (isLoggedIn()) {
      setAuthStatus('authenticated');
    } else {
      const authMode = localStorage.getItem(STORAGE_KEY_AUTH_MODE);
      if (authMode === 'guest') {
        setAuthStatus('guest');
      } else {
        setAuthStatus('anonymous');
      }
    }

    // Auth is now confirmed — allow ProtectedRoute to make decisions
    setAuthChecked(true);
  }, []);

  // Update Active Tab based on route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/product/') || path.startsWith('/category/') || path.startsWith('/brand/')) setActiveTab('home');
    else if (path.startsWith('/subscriptions')) setActiveTab('subscriptions');
    else if (path.startsWith('/notifications')) setActiveTab('notifications');
    else if (path.startsWith('/appointments')) setActiveTab('appointments');
    else if (path.startsWith('/account')) setActiveTab('account');
  }, [location.pathname]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home': navigate('/'); break;
      case 'subscriptions': navigate('/subscriptions'); break;
      case 'notifications': navigate('/notifications'); break;
      case 'appointments': navigate('/appointments'); break;
      case 'account': navigate('/account'); break;
    }
  };

  const handleBook = (
    product: Product,
    quantity: number,
    selectedAddons?: ServiceAddon[],
    packageOption?: ServicePackageOption,
    customFinalPrice?: number
  ) => {
    if (authStatus === 'anonymous') {
      navigate('/login');
      return;
    }
    // The previous /booking route generated a fake local order and payment.
    // All bookings now begin from the server-backed service-detail/cart flow.
    navigate(`/product/${product.id}`);
  };

  const handleAddOrder = (newOrder: Order) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updatedOrders));
  };

  const toggleFavourite = (productId: number) => {
    let newFavs;
    if (favourites.includes(productId)) {
      newFavs = favourites.filter(id => id !== productId);
    } else {
      newFavs = [...favourites, productId];
    }
    setFavourites(newFavs);
    localStorage.setItem(STORAGE_KEY_FAVOURITES, JSON.stringify(newFavs));
  };

  const handleLoginSuccess = () => {
    resetAuthState();
    const mode = localStorage.getItem(STORAGE_KEY_AUTH_MODE);
    if (mode === 'guest') {
      setAuthStatus('guest');
    } else {
      setAuthStatus('authenticated');
    }
  };

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem(STORAGE_KEY_IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEY_AUTH_MODE);
    localStorage.removeItem("mezo_auth_user_name");
    localStorage.removeItem("mezo_auth_user_phone");
    setAuthStatus("anonymous");
    navigate("/login");
  };

  const showTabBar = !location.pathname.startsWith('/booking') &&
    !location.pathname.startsWith('/login') &&
    !location.pathname.startsWith('/signup') &&
    !location.pathname.startsWith('/verify') &&
    !location.pathname.startsWith('/forgot-password') &&
    !location.pathname.startsWith('/cart') &&
    !location.pathname.startsWith('/product/') &&
    !location.pathname.startsWith('/technician/online');



  return (
    <div className="h-[100vh] flex flex-col bg-app-bg w-full max-w-[430px] mx-auto relative shadow-2xl overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute authStatus={authStatus}>
              <HomeTab
                onBook={handleBook}
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            </ProtectedRoute>
          } />

          <Route path="/product/:productId" element={
            <ProtectedRoute authStatus={authStatus}>
              <HomeTab
                onBook={handleBook}
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            </ProtectedRoute>
          } />

          <Route path="/category/:categoryName" element={
            <ProtectedRoute authStatus={authStatus}>
              <HomeTab
                onBook={handleBook}
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            </ProtectedRoute>
          } />

          <Route path="/brand/:brandId" element={
            <ProtectedRoute authStatus={authStatus}>
              <BrandPage
                onBook={handleBook}
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            </ProtectedRoute>
          } />

          <Route path="/all-products" element={
            <ProtectedRoute authStatus={authStatus}>
              <AllProductsPage
                onBook={handleBook}
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
              />
            </ProtectedRoute>
          } />

          <Route path="/subscriptions" element={
            <ProtectedRoute authStatus={authStatus}>
              <SubscriptionsTab />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute authStatus={authStatus}>
              <NotificationsTab />
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute authStatus={authStatus}>
              <AppointmentsTab />
            </ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute authStatus={authStatus}>
              <CartPage />
            </ProtectedRoute>
          } />

          <Route path="/account/*" element={
            <ProtectedRoute authStatus={authStatus}>
              <AccountTab
                orders={orders}
                onNavigateToHome={() => handleTabChange('home')}
                favourites={favourites}
                onToggleFavourite={toggleFavourite}
                onBook={handleBook}
                onLogout={handleLogout}
                isGuest={authStatus === 'guest'}
              />
            </ProtectedRoute>
          } />

          <Route path="/booking" element={<Navigate to="/cart" replace />} />

          <Route path="/subscription-details/:subscriptionId" element={
            <ProtectedRoute authStatus={authStatus}>
              <SubscriptionDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/edit-appointment/:subscriptionId" element={
            <ProtectedRoute authStatus={authStatus}>
              <EditAppointmentPage />
            </ProtectedRoute>
          } />
          <Route path="/book-next-session/:subscriptionId" element={
            <ProtectedRoute authStatus={authStatus}>
              <BookNextSessionPage />
            </ProtectedRoute>
          } />

          <Route path="/hair-profile" element={
            <ProtectedRoute authStatus={authStatus}>
              <HairProfilePage />
            </ProtectedRoute>
          } />

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/signup" element={<SignUpPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/verify" element={<OTPPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />


          {/* Placeholder for technician online */}
          <Route path="/technician/online" element={<PlaceholderTab title="Technician Online" />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {showTabBar && (
        <TabBar currentTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
