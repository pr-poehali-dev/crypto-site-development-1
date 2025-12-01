
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TradingPage from "./pages/TradingPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('crypto_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (userId: number, username: string) => {
    const userData = { id: userId, username };
    setUser(userData);
    localStorage.setItem('crypto_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('crypto_user');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {!user ? (
            <LoginPage onLogin={handleLogin} />
          ) : (
            <Routes>
              <Route path="/" element={<TradingPage userId={user.id} username={user.username} onLogout={handleLogout} />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;