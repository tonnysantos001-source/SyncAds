import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import { authApi } from '@/lib/api';

// Mock authApi
vi.mock('@/lib/api', () => ({
  authApi: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      isInitialized: false,
    });
    vi.clearAllMocks();
  });

  describe('initAuth', () => {
    it('should initialize with no user when not authenticated', async () => {
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(null);

      await useAuthStore.getState().initAuth();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
    });

    it('should initialize with user when authenticated', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: null,
        plan: 'PRO' as const,
        isSuperAdmin: false,
      };

      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser);

      await useAuthStore.getState().initAuth();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: undefined,
        avatar: null,
        plan: 'Pro',
        isSuperAdmin: false,
      });
    });
  });

  describe('login', () => {
    it('should authenticate user on successful login', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: null,
        plan: 'FREE' as const,
        isSuperAdmin: false,
      };

      vi.mocked(authApi.signIn).mockResolvedValue({ user: { id: '123' } } as any);
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser);

      await useAuthStore.getState().login('test@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
      expect(state.user?.plan).toBe('Free');
    });

    it('should throw error on failed login', async () => {
      vi.mocked(authApi.signIn).mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        useAuthStore.getState().login('test@example.com', 'wrong')
      ).rejects.toThrow('Invalid credentials');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
    });
  });

  describe('register', () => {
    it('should authenticate user on successful registration', async () => {
      const mockUser = {
        id: '123',
        name: 'New User',
        email: 'new@example.com',
        avatar: null,
        plan: 'FREE' as const,
        isSuperAdmin: false,
      };

      vi.mocked(authApi.signUp).mockResolvedValue({ user: { id: '123' } } as any);
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser);

      await useAuthStore.getState().register('new@example.com', 'password', 'New User');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.name).toBe('New User');
    });
  });

  describe('logout', () => {
    it('should clear user state on logout', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
          plan: 'Pro',
        },
      });

      vi.mocked(authApi.signOut).mockResolvedValue();

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
    });
  });

  describe('updateUser', () => {
    it('should update user data', () => {
      useAuthStore.setState({
        user: {
          id: '123',
          name: 'Old Name',
          email: 'test@example.com',
          plan: 'Free',
        },
      });

      useAuthStore.getState().updateUser({ name: 'New Name' });

      const state = useAuthStore.getState();
      expect(state.user?.name).toBe('New Name');
      expect(state.user?.email).toBe('test@example.com');
    });

    it('should not update if no user', () => {
      useAuthStore.setState({ user: null });

      useAuthStore.getState().updateUser({ name: 'New Name' });

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
    });
  });
});
