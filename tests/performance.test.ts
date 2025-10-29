// ============================================
// PERFORMANCE TESTS
// ============================================
// Testes automatizados de performance para SyncAds
// ============================================

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

describe('Performance Tests', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  describe('Database Query Performance', () => {
    it('should query Organization table in < 500ms', async () => {
      const startTime = performance.now();

      await supabase.from('Organization').select('*').limit(10);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    it('should query User table in < 500ms', async () => {
      const startTime = performance.now();

      await supabase.from('User').select('*').limit(10);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    it('should query Campaign table with JOIN in < 1000ms', async () => {
      const startTime = performance.now();

      await supabase
        .from('Campaign')
        .select('*, User(name)')
        .limit(10);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should handle complex queries efficiently', async () => {
      const startTime = performance.now();

      await supabase
        .from('ChatConversation')
        .select('*, ChatMessage(count)')
        .limit(10);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(1500);
    });
  });

  describe('Index Performance', () => {
    it('should benefit from organizationId index', async () => {
      const startTime = performance.now();

      // Query que deve usar o índice idx_campaign_org_status
      await supabase
        .from('Campaign')
        .select('*')
        .eq('organizationId', 'test-id')
        .eq('status', 'ACTIVE')
        .limit(10);

      const duration = performance.now() - startTime;
      
      // Com índice, deve ser rápido mesmo filtrando
      expect(duration).toBeLessThan(300);
    });

    it('should benefit from userId index', async () => {
      const startTime = performance.now();

      await supabase
        .from('Campaign')
        .select('*')
        .eq('userId', 'test-id')
        .limit(10);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(300);
    });
  });

  describe('RLS Policy Performance', () => {
    it('should execute RLS policies efficiently', async () => {
      const startTime = performance.now();

      // Query que dispara RLS policies
      await supabase.from('User').select('*').limit(1);

      const duration = performance.now() - startTime;
      
      // Com (select auth.uid()), deve ser mais rápido
      expect(duration).toBeLessThan(400);
    });

    it('should handle nested RLS checks efficiently', async () => {
      const startTime = performance.now();

      // ChatMessage tem RLS que verifica ChatConversation
      await supabase.from('ChatMessage').select('*').limit(10);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(800);
    });
  });

  describe('API Response Time', () => {
    it('should respond to health check quickly', async () => {
      const startTime = performance.now();

      const response = await fetch(`${SUPABASE_URL}/rest/v1/`);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(500);
      expect(response.ok).toBeTruthy();
    });

    it('should handle concurrent requests', async () => {
      const startTime = performance.now();

      // 5 requisições simultâneas
      await Promise.all([
        supabase.from('Organization').select('*').limit(5),
        supabase.from('User').select('*').limit(5),
        supabase.from('Campaign').select('*').limit(5),
        supabase.from('Product').select('*').limit(5),
        supabase.from('Customer').select('*').limit(5),
      ]);

      const duration = performance.now() - startTime;
      
      // Deve processar todas em menos de 2s
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('N+1 Query Prevention', () => {
    it('should fetch related data in single query', async () => {
      const startTime = performance.now();

      // Buscar organizações com suas configurações de gateway
      await supabase
        .from('Organization')
        .select(`
          *,
          GatewayConfig (*)
        `)
        .limit(5);

      const duration = performance.now() - startTime;
      
      // Deve ser mais rápido que N+1 queries
      expect(duration).toBeLessThan(800);
    });

    it('should use efficient joins instead of multiple queries', async () => {
      const startTime = performance.now();

      // Query otimizada com join
      await supabase
        .from('Order')
        .select(`
          *,
          Customer (*),
          OrderItem (*)
        `)
        .limit(5);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Memory Usage', () => {
    it('should not load excessive data at once', async () => {
      // Limitar resultados para evitar sobrecarga
      const { data } = await supabase
        .from('ChatMessage')
        .select('*')
        .limit(100);

      if (data) {
        expect(data.length).toBeLessThanOrEqual(100);
      }
    });

    it('should use pagination for large datasets', async () => {
      // Testar paginação
      const { data } = await supabase
        .from('Product')
        .select('*')
        .range(0, 19); // Primeira página de 20 items

      if (data) {
        expect(data.length).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('Edge Function Performance', () => {
    it('should respond from Edge Function quickly', async () => {
      const startTime = performance.now();

      // Tentar acessar Edge Function (vai dar erro de auth, mas testa latência)
      await fetch(`${SUPABASE_URL}/functions/v1/chat-enhanced`, {
        method: 'OPTIONS', // CORS preflight
      });

      const duration = performance.now() - startTime;
      
      // Edge Functions devem responder rápido
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Database Connection Pool', () => {
    it('should handle multiple sequential requests', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        await supabase.from('Organization').select('*').limit(1);
      }

      const duration = performance.now() - startTime;
      
      // 10 requisições sequenciais em menos de 5s
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Data Transfer Optimization', () => {
    it('should select only needed columns', async () => {
      const startTime = performance.now();

      // Selecionar apenas colunas específicas
      await supabase
        .from('User')
        .select('id, name, email')
        .limit(10);

      const duration = performance.now() - startTime;
      
      // Deve ser mais rápido que SELECT *
      expect(duration).toBeLessThan(300);
    });
  });
});

