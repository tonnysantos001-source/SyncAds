import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCampaignsStore } from '../campaignsStore';
import { campaignsApi } from '@/lib/api';

// Mock campaignsApi
vi.mock('@/lib/api', () => ({
  campaignsApi: {
    getCampaigns: vi.fn(),
    createCampaign: vi.fn(),
    updateCampaign: vi.fn(),
    deleteCampaign: vi.fn(),
  },
}));

describe('campaignsStore', () => {
  beforeEach(() => {
    // Reset store state
    useCampaignsStore.setState({
      campaigns: [],
      loading: false,
    });
    vi.clearAllMocks();
  });

  describe('loadCampaigns', () => {
    it('should load campaigns successfully', async () => {
      const mockCampaigns = [
        {
          id: '1',
          name: 'Test Campaign',
          platform: 'Meta',
          status: 'Ativa',
          budgetTotal: 1000,
          budgetSpent: 500,
          impressions: 10000,
          clicks: 500,
          conversions: 50,
          ctr: 5,
          cpc: 1,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(campaignsApi.getCampaigns).mockResolvedValue(mockCampaigns as any);

      await useCampaignsStore.getState().loadCampaigns('user-123');

      const state = useCampaignsStore.getState();
      expect(state.campaigns).toEqual(mockCampaigns);
      expect(state.loading).toBe(false);
      expect(campaignsApi.getCampaigns).toHaveBeenCalledWith('user-123');
    });

    it('should handle load error gracefully', async () => {
      vi.mocked(campaignsApi.getCampaigns).mockRejectedValue(new Error('API Error'));

      await useCampaignsStore.getState().loadCampaigns('user-123');

      const state = useCampaignsStore.getState();
      expect(state.campaigns).toEqual([]);
      expect(state.loading).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      vi.mocked(campaignsApi.getCampaigns).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      const loadPromise = useCampaignsStore.getState().loadCampaigns('user-123');
      
      // Check loading state immediately
      expect(useCampaignsStore.getState().loading).toBe(true);
      
      await loadPromise;
      
      // Check loading is false after completion
      expect(useCampaignsStore.getState().loading).toBe(false);
    });
  });

  describe('addCampaign', () => {
    it('should add campaign successfully', async () => {
      const newCampaign = {
        name: 'New Campaign',
        platform: 'Google Ads' as const,
        status: 'Ativa' as const,
        budgetTotal: 2000,
        budgetSpent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      };

      const createdCampaign = { id: '2', ...newCampaign };
      vi.mocked(campaignsApi.createCampaign).mockResolvedValue(createdCampaign as any);

      await useCampaignsStore.getState().addCampaign('user-123', newCampaign);

      const state = useCampaignsStore.getState();
      expect(state.campaigns).toHaveLength(1);
      expect(state.campaigns[0].id).toBe('2');
      expect(campaignsApi.createCampaign).toHaveBeenCalledWith('user-123', newCampaign);
    });

    it('should throw error on add failure', async () => {
      vi.mocked(campaignsApi.createCampaign).mockRejectedValue(new Error('Create failed'));

      await expect(
        useCampaignsStore.getState().addCampaign('user-123', {} as any)
      ).rejects.toThrow('Create failed');
    });
  });

  describe('updateCampaign', () => {
    beforeEach(() => {
      useCampaignsStore.setState({
        campaigns: [
          {
            id: '1',
            name: 'Old Name',
            platform: 'Meta',
            status: 'Ativa',
          } as any,
        ],
      });
    });

    it('should update campaign successfully', async () => {
      const updates = { name: 'New Name', status: 'Pausada' as const };
      vi.mocked(campaignsApi.updateCampaign).mockResolvedValue({ id: '1', ...updates } as any);

      await useCampaignsStore.getState().updateCampaign('1', updates);

      const state = useCampaignsStore.getState();
      expect(state.campaigns[0].name).toBe('New Name');
      expect(state.campaigns[0].status).toBe('Pausada');
    });

    it('should not update state if API call fails', async () => {
      vi.mocked(campaignsApi.updateCampaign).mockRejectedValue(new Error('Update failed'));

      await expect(
        useCampaignsStore.getState().updateCampaign('1', { name: 'Failed' })
      ).rejects.toThrow('Update failed');

      const state = useCampaignsStore.getState();
      expect(state.campaigns[0].name).toBe('Old Name');
    });
  });

  describe('deleteCampaign', () => {
    beforeEach(() => {
      useCampaignsStore.setState({
        campaigns: [
          { id: '1', name: 'Campaign 1' } as any,
          { id: '2', name: 'Campaign 2' } as any,
        ],
      });
    });

    it('should delete campaign successfully', async () => {
      vi.mocked(campaignsApi.deleteCampaign).mockResolvedValue();

      await useCampaignsStore.getState().deleteCampaign('1');

      const state = useCampaignsStore.getState();
      expect(state.campaigns).toHaveLength(1);
      expect(state.campaigns[0].id).toBe('2');
    });

    it('should handle delete error', async () => {
      vi.mocked(campaignsApi.deleteCampaign).mockRejectedValue(new Error('Delete failed'));

      await expect(
        useCampaignsStore.getState().deleteCampaign('1')
      ).rejects.toThrow('Delete failed');

      const state = useCampaignsStore.getState();
      expect(state.campaigns).toHaveLength(2); // State unchanged
    });
  });
});
