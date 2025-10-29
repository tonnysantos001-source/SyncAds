// ============================================
// TEST SETUP
// ============================================
// Configuração inicial para todos os testes
// ============================================

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock de variáveis de ambiente para testes
if (!import.meta.env.VITE_SUPABASE_URL) {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
}

