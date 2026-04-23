import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PixelsPage from './pages/PixelsPage';
import ConsentPage from './pages/ConsentPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/consent/:code" element={<ConsentPage />} />
            <Route
              path="/dashboard"
              element={<PrivateRoute><DashboardPage /></PrivateRoute>}
            />
            <Route
              path="/analytics/:code"
              element={<PrivateRoute><AnalyticsPage /></PrivateRoute>}
            />
            <Route
              path="/pixels"
              element={<PrivateRoute><PixelsPage /></PrivateRoute>}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
