import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ai/ChatPage';
import CreationPage from './pages/ai/CreationPage';
import MotherAIPage from './pages/MotherAIPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex-1 p-8">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
    <div className="mt-8 h-96 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border flex items-center justify-center">
      <p className="text-gray-500">Página de {title} em construção.</p>
    </div>
  </div>
);

function App() {
  const { session } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected App Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/ai/chat" element={<ChatPage />} />
                  <Route path="/ai/creation" element={<CreationPage />} />
                  
                  {/* Admin Only Routes */}
                  <Route path="/mother-ai" element={<AdminRoute><MotherAIPage /></AdminRoute>} />
                  <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
                  
                  <Route path="/settings/profile" element={<PlaceholderPage title="Perfil" />} />
                  <Route path="/settings/billing" element={<PlaceholderPage title="Faturamento" />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
