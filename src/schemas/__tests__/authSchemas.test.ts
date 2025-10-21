import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, forgotPasswordSchema } from '../authSchemas';

describe('authSchemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email inválido');
      }
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mínimo 6 caracteres');
      }
    });

    it('should reject empty fields', () => {
      const invalidData = {
        email: '',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject when passwords do not match', () => {
      const invalidData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Password123',
        confirmPassword: 'Password456',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('As senhas não conferem');
      }
    });

    it('should reject weak password (no uppercase)', () => {
      const invalidData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('maiúscula'))).toBe(true);
      }
    });

    it('should reject weak password (no number)', () => {
      const invalidData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Password',
        confirmPassword: 'Password',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('número'))).toBe(true);
      }
    });

    it('should validate with optional CPF', () => {
      const validData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        cpf: '123.456.789-10',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate correct email', () => {
      const validData = {
        email: 'test@example.com',
      };

      const result = forgotPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
      };

      const result = forgotPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
