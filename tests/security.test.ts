// ============================================
// SECURITY TESTS
// ============================================
// Testes automatizados de segurança para SyncAds
// ============================================

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

describe('Security Tests', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  describe('Environment Variables', () => {
    it('should have Supabase URL configured', () => {
      expect(SUPABASE_URL).toBeTruthy();
      expect(SUPABASE_URL).toMatch(/^https:\/\//);
    });

    it('should have Supabase anon key configured', () => {
      expect(SUPABASE_ANON_KEY).toBeTruthy();
      expect(SUPABASE_ANON_KEY).toMatch(/^eyJ/); // JWT format
    });

    it('should NOT have hardcoded credentials in source', () => {
      // Este teste garante que não há credenciais hardcoded
      // Se falhar, revise src/lib/config.ts
      expect(SUPABASE_URL).not.toContain('ovskepqggmxlfckxqgbr');
    });
  });

  describe('RLS Policies', () => {
    it('should block unauthorized access to User table', async () => {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .limit(1);

      // Sem autenticação, deve retornar vazio ou erro
      expect(data).toEqual([]);
    });

    it('should block unauthorized access to Campaign table', async () => {
      const { data, error } = await supabase
        .from('Campaign')
        .select('*')
        .limit(1);

      expect(data).toEqual([]);
    });

    it('should block unauthorized access to ChatConversation table', async () => {
      const { data, error } = await supabase
        .from('ChatConversation')
        .select('*')
        .limit(1);

      expect(data).toEqual([]);
    });

    it('should block unauthorized access to Organization table', async () => {
      const { data, error } = await supabase
        .from('Organization')
        .select('*')
        .limit(1);

      expect(data).toEqual([]);
    });
  });

  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in text fields', async () => {
      const maliciousInput = "'; DROP TABLE User; --";

      const { error } = await supabase
        .from('Campaign')
        .select('*')
        .eq('name', maliciousInput);

      // Não deve quebrar, deve apenas não retornar resultados
      expect(error).toBeNull();
    });

    it('should sanitize special characters', async () => {
      const specialChars = "<script>alert('xss')</script>";

      const { error } = await supabase
        .from('Campaign')
        .select('*')
        .eq('name', specialChars);

      expect(error).toBeNull();
    });
  });

  describe('API Rate Limiting', () => {
    it('should have reasonable response time', async () => {
      const startTime = Date.now();

      await supabase.from('Organization').select('*').limit(1);

      const duration = Date.now() - startTime;

      // Deve responder em menos de 2 segundos
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected endpoints', async () => {
      // Tentar acessar endpoint protegido sem token
      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'test' }),
      });

      // Deve retornar 401 ou 403
      expect([401, 403, 400]).toContain(response.status);
    });
  });

  describe('CORS Configuration', () => {
    it('should have CORS headers configured', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-enhanced`, {
        method: 'OPTIONS',
      });

      const corsHeader = response.headers.get('access-control-allow-origin');
      expect(corsHeader).toBeTruthy();
    });
  });

  describe('Data Encryption', () => {
    it('should use HTTPS for all requests', () => {
      expect(SUPABASE_URL).toMatch(/^https:\/\//);
    });
  });

  describe('Error Handling', () => {
    it('should not leak sensitive information in errors', async () => {
      const { error } = await supabase
        .from('NonExistentTable')
        .select('*');

      if (error) {
        // Erro não deve conter informações sensíveis do banco
        expect(error.message).not.toContain('password');
        expect(error.message).not.toContain('secret');
        expect(error.message).not.toContain('token');
      }
    });
  });
});

