import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useUser,
  useAuth,
  useAuthActions,
  useCampaigns,
  useActiveCampaigns,
  useCampaignsCount,
  useConnectedIntegrations,
} from '../useOptimizedSelectors';
import { useAuthStore } from '@/store/authStore';
import { useCampaignsStore } from '@/store/campaignsStore';
import { useIntegrationsStore } from '@/store/integrationsStore';

describe('useOptimizedSelectors', () => {
  describe('useUser', () => {
    beforeEach(() => {
      useAuthStore.setState({ user: null });
    });

    it('should return user', () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        plan: 'Pro',
      };

      act(() => {
        useAuthStore.setState({ user: mockUser as any });
      });

      const { result } = renderHook(() => useUser());
      expect(result.current).toEqual(mockUser);
    });

    it('should return null when no user', () => {
      const { result } = renderHook(() => useUser());
      expect(result.current).toBeNull();
    });
  });

  describe('useAuth', () => {
    it('should return auth state', () => {
      act(() => {
        useAuthStore.setState({
          isAuthenticated: true,
          isInitialized: true,
          user: { id: '123', name: 'Test' } as any,
        });
      });

      const { result } = renderHook(() => useAuth());
      
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.user?.id).toBe('123');
    });
  });

  describe('useAuthActions', () => {
    it('should return auth actions', () => {
      const { result } = renderHook(() => useAuthActions());
      
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.updateUser).toBe('function');
    });

    it('should have stable function references', () => {
      const { result, rerender } = renderHook(() => useAuthActions());
      
      const firstRender = result.current;
      rerender();
      const secondRender = result.current;
      
      // Functions should be the same reference
      expect(firstRender.login).toBe(secondRender.login);
      expect(firstRender.logout).toBe(secondRender.logout);
    });
  });

  describe('useCampaigns', () => {
    beforeEach(() => {
      useCampaignsStore.setState({ campaigns: [] });
    });

    it('should return campaigns list', () => {
      const mockCampaigns = [
        { id: '1', name: 'Campaign 1', status: 'Ativa' },
        { id: '2', name: 'Campaign 2', status: 'Pausada' },
      ];

      act(() => {
        useCampaignsStore.setState({ campaigns: mockCampaigns as any });
      });

      const { result } = renderHook(() => useCampaigns());
      expect(result.current).toHaveLength(2);
      expect(result.current[0].id).toBe('1');
    });
  });

  describe('useActiveCampaigns', () => {
    it('should filter active campaigns only', () => {
      const mockCampaigns = [
        { id: '1', name: 'Active 1', status: 'Ativa' },
        { id: '2', name: 'Paused', status: 'Pausada' },
        { id: '3', name: 'Active 2', status: 'Ativa' },
      ];

      act(() => {
        useCampaignsStore.setState({ campaigns: mockCampaigns as any });
      });

      const { result } = renderHook(() => useActiveCampaigns());
      expect(result.current).toHaveLength(2);
      expect(result.current.every(c => c.status === 'Ativa')).toBe(true);
    });

    it('should return empty array when no active campaigns', () => {
      act(() => {
        useCampaignsStore.setState({
          campaigns: [{ id: '1', status: 'Pausada' }] as any,
        });
      });

      const { result } = renderHook(() => useActiveCampaigns());
      expect(result.current).toEqual([]);
    });
  });

  describe('useCampaignsCount', () => {
    it('should return total count', () => {
      act(() => {
        useCampaignsStore.setState({
          campaigns: [
            { id: '1' } as any,
            { id: '2' } as any,
            { id: '3' } as any,
          ],
        });
      });

      const { result } = renderHook(() => useCampaignsCount());
      expect(result.current).toBe(3);
    });

    it('should return 0 when empty', () => {
      act(() => {
        useCampaignsStore.setState({ campaigns: [] });
      });

      const { result } = renderHook(() => useCampaignsCount());
      expect(result.current).toBe(0);
    });
  });

  describe('useConnectedIntegrations', () => {
    beforeEach(() => {
      useIntegrationsStore.setState({ integrations: [] });
    });

    it('should filter connected integrations', () => {
      const mockIntegrations = [
        { id: '1', platform: 'META_ADS', isConnected: true },
        { id: '2', platform: 'GOOGLE_ADS', isConnected: false },
        { id: '3', platform: 'LINKEDIN_ADS', isConnected: true },
      ];

      act(() => {
        useIntegrationsStore.setState({ integrations: mockIntegrations as any });
      });

      const { result } = renderHook(() => useConnectedIntegrations());
      expect(result.current).toHaveLength(2);
      expect(result.current.every(i => i.isConnected)).toBe(true);
    });
  });
});
