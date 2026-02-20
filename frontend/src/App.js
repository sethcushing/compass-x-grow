import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeContext";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Pipeline from "@/pages/Pipeline";
import Organizations from "@/pages/Organizations";
import OrganizationDetail from "@/pages/OrganizationDetail";
import Contacts from "@/pages/Contacts";
import ContactDetail from "@/pages/ContactDetail";
import OpportunityDetail from "@/pages/OpportunityDetail";
import Activities from "@/pages/Activities";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user was passed from login or OAuth callback, use it
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Not authenticated');
        }

        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      }
    };

    checkAuth();
  }, [navigate, location.state]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-ocean-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
};

// App Router - Handles routing
const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
      <Route path="/organizations" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
      <Route path="/organizations/:orgId" element={<ProtectedRoute><OrganizationDetail /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/contacts/:contactId" element={<ProtectedRoute><ContactDetail /></ProtectedRoute>} />
      <Route path="/opportunities/:oppId" element={<ProtectedRoute><OpportunityDetail /></ProtectedRoute>} />
      <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/my-pipeline" element={<Navigate to="/pipeline" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App font-body">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
