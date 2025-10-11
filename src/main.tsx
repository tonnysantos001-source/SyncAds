import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Toaster } from 'sonner';
import { useTheme } from './hooks/useTheme.ts';
import { AuthProvider } from './contexts/AuthContext.tsx';

const Main = () => {
  const { theme } = useTheme();

  return (
    <StrictMode>
      <AuthProvider>
        <App />
        <Toaster richColors theme={theme} position="top-right" />
      </AuthProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Main />);
