import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute  from './components/common/ProtectedRoute';
import LandingPage             from './pages/LandingPage';
import LoginPage               from './pages/LoginPage';
import RegisterPage            from './pages/RegisterPage';
import EmailVerificationPage   from './pages/EmailVerificationPage';
import VerifyEmailChangePage   from './pages/VerifyEmailChangePage';
import TwoFactorLoginPage      from './pages/TwoFactorLoginPage';
import SettingsPage            from './pages/SettingsPage';
import VaultPage               from './pages/VaultPage';
import DashboardPage           from './pages/DashboardPage';
import ForgotPasswordPage      from './pages/ForgotPasswordPage';
import ResetPasswordPage       from './pages/ResetPasswordPage';

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/register"      element={<RegisterPage />} />
        <Route path="/verify-email"  element={<EmailVerificationPage />} />
        <Route path="/verify-email-change" element={<VerifyEmailChangePage />} />
        <Route path="/two-factor"    element={<TwoFactorLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}
