import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute  from './components/common/ProtectedRoute';
import LandingPage  from './pages/LandingPage';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VaultPage    from './pages/VaultPage';

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/vault" element={<VaultPage />} />
        </Route>

        {/* Catch-all → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}
