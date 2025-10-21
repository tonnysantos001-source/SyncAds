import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useIntegrationsStore } from '../integrationsStore';
import { integrationsApi } from '@/lib/api/integrations';

// Mock integrationsApi
vi.mock('@/lib/api/integrations', () => ({
  integrationsApi: {
    getIntegrations: vi.fn(),
    upsertIntegration: vi.fn(),
    deleteIntegration: vi.fn(),
  },
}));

describe('integrationsStore', () => {
  beforeEach(() => {
    useIntegrationsStore.setState({
      integrations: [],
      loading: false,
    });
    vi.clearAllMocks();
  });

  describe('loadIntegrations', () => {
    it('should load integrations from Supabase', async () => {
      const mockIntegrations = [
        {
          id: '1',
          userId: 'user-123',
          platform: 'META_ADS',
          isConnected: true,
          credentials: {},
          lastSyncAt: new Date().toISOString(),
          syncStatus: 'success',
        },
      ];

      vi.mocked(integrationsApi.getIntegrations).mockResolvedValue(mockIntegrations as any);

      await useIntegrationsStore.getState().loadIntegrations('user-123');

      const state = useIntegrationsStore.getState();
      expect(state.integrations).toEqual(mockIntegrations);
      expect(state.loading).toBe(false);
    });

    it('should handle empty integrations', async () => {
      vi.mocked(integrationsApi.getIntegrations).mockResolvedValue([]);

      await useIntegrationsStore.getState().loadIntegrations('user-123');

      const state = useIntegrationsStore.getState();
      expect(state.integrations).toEqual([]);
    });

    it('should handle load errors', async () => {
      vi.mocked(integrationsApi.getIntegrations).mockRejectedValue(new Error('Load failed'));

      await useIntegrationsStore.getState().loadIntegrations('user-123');

      const state = useIntegrationsStore.getState();
      expect(state.integrations).toEqual([]);
      expect(state.loading).toBe(false);
    });
  });

  describe('connectIntegration', () => {
    it('should connect integration and reload list', async () => {
      const mockIntegration = {
        id: '2',
        userId: 'user-123',
        platform: 'GOOGLE_ADS',
        isConnected: true,
      };

      vi.mocked(integrationsApi.upsertIntegration).mockResolvedValue(mockIntegration as any);
      vi.mocked(integrationsApi.getIntegrations).mockResolvedValue([mockIntegration] as any);

      await useIntegrationsStore.getState().connectIntegration('user-123', 'GOOGLE_ADS', { apiKey: 'test' });

      expect(integrationsApi.upsertIntegration).toHaveBeenCalledWith(
        'user-123',
        'GOOGLE_ADS',
        true,
        { apiKey: 'test' }
      );
      
      const state = useIntegrationsStore.getState();
      expect(state.integrations).toHaveLength(1);
    });

    it('should throw error on connection failure', async () => {
      vi.mocked(integrationsApi.upsertIntegration).mockRejectedValue(new Error('Connection failed'));

      await expect(
        useIntegrationsStore.getState().connectIntegration('user-123', 'META_ADS')
      ).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnectIntegration', () => {
    it('should disconnect integration', async () => {
      vi.mocked(integrationsApi.upsertIntegration).mockResolvedValue({} as any);
      vi.mocked(integrationsApi.getIntegrations).mockResolvedValue([]);

      await useIntegrationsStore.getState().disconnectIntegration('user-123', 'META_ADS');

      expect(integrationsApi.upsertIntegration).toHaveBeenCalledWith(
        'user-123',
        'META_ADS',
        false
      );
    });
  });

  describe('isIntegrationConnected', () => {
    it('should return true for connected integration', () => {
      useIntegrationsStore.setState({
        integrations: [
          {
            id: '1',
            platform: 'META_ADS',
            isConnected: true,
          } as any,
        ],
      });

      const isConnected = useIntegrationsStore.getState().isIntegrationConnected('META_ADS');
      expect(isConnected).toBe(true);
    });

    it('should return false for disconnected integration', () => {
      useIntegrationsStore.setState({
        integrations: [
          {
            id: '1',
            platform: 'META_ADS',
            isConnected: false,
          } as any,
        ],
      });

      const isConnected = useIntegrationsStore.getState().isIntegrationConnected('META_ADS');
      expect(isConnected).toBe(false);
    });

    it('should return false for non-existent integration', () => {
      useIntegrationsStore.setState({
        integrations: [],
      });

      const isConnected = useIntegrationsStore.getState().isIntegrationConnected('GOOGLE_ADS');
      expect(isConnected).toBe(false);
    });
  });
});
