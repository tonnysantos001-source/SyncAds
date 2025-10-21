import { create } from 'zustand';
import { campaignsApi } from '@/lib/api';
import { Campaign } from '@/data/mocks';

interface CampaignsState {
  // Estado
  campaigns: Campaign[];

  // Actions
  loadCampaigns: (userId: string) => Promise<void>;
  addCampaign: (userId: string, campaign: Omit<Campaign, 'id'>) => Promise<void>;
  updateCampaign: (id: string, campaignData: Partial<Campaign>) => Promise<void>;
  updateCampaignStatus: (id: string, status: Campaign['status']) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
}

export const useCampaignsStore = create<CampaignsState>((set, get) => ({
  // Estado inicial
  campaigns: [],

  // Load Campaigns
  loadCampaigns: async (userId: string) => {
    try {
      const data = await campaignsApi.getCampaigns(userId);
      const campaigns: Campaign[] = data.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status === 'ACTIVE' ? 'Ativa' : c.status === 'PAUSED' ? 'Pausada' : 'Concluída',
        platform: c.platform === 'GOOGLE_ADS' ? 'Google Ads' : c.platform === 'META_ADS' ? 'Meta' : 'LinkedIn',
        budgetSpent: c.budgetSpent,
        budgetTotal: c.budgetTotal,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
        startDate: new Date(c.startDate).toISOString().split('T')[0],
        endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
        ctr: c.ctr,
        cpc: c.cpc,
      }));
      set({ campaigns });
    } catch (error) {
      console.error('Load campaigns error:', error);
    }
  },

  // Add Campaign
  addCampaign: async (userId: string, campaignData: Omit<Campaign, 'id'>) => {
    try {
      await campaignsApi.createCampaign(userId, {
        name: campaignData.name,
        objective: 'Conversões',
        platform: campaignData.platform === 'Google Ads' ? 'GOOGLE_ADS' : campaignData.platform === 'Meta' ? 'META_ADS' : 'LINKEDIN_ADS',
        status: campaignData.status === 'Ativa' ? 'ACTIVE' : campaignData.status === 'Pausada' ? 'PAUSED' : 'COMPLETED',
        budgetTotal: campaignData.budgetTotal,
        budgetSpent: campaignData.budgetSpent || 0,
        budgetDaily: campaignData.budgetTotal / 30,
        startDate: new Date(campaignData.startDate).toISOString(),
        endDate: campaignData.endDate ? new Date(campaignData.endDate).toISOString() : null,
        targeting: {},
        impressions: campaignData.impressions || 0,
        clicks: campaignData.clicks || 0,
        conversions: campaignData.conversions || 0,
        ctr: campaignData.ctr || 0,
        cpc: campaignData.cpc || 0,
        roi: 0,
      });
      await get().loadCampaigns(userId);
    } catch (error) {
      console.error('Add campaign error:', error);
      throw error;
    }
  },

  // Update Campaign
  updateCampaign: async (id: string, campaignData: Partial<Campaign>) => {
    try {
      await campaignsApi.updateCampaign(id, {
        ...(campaignData.name && { name: campaignData.name }),
        ...(campaignData.status && { 
          status: campaignData.status === 'Ativa' ? 'ACTIVE' : campaignData.status === 'Pausada' ? 'PAUSED' : 'COMPLETED'
        }),
        ...(campaignData.budgetTotal && { budgetTotal: campaignData.budgetTotal }),
        ...(campaignData.budgetSpent !== undefined && { budgetSpent: campaignData.budgetSpent }),
      });
      // Atualizar local state
      set((state) => ({
        campaigns: state.campaigns.map(c => 
          c.id === id ? { ...c, ...campaignData } : c
        )
      }));
    } catch (error) {
      console.error('Update campaign error:', error);
      throw error;
    }
  },

  // Update Campaign Status
  updateCampaignStatus: async (id: string, status: Campaign['status']) => {
    try {
      await campaignsApi.updateCampaign(id, {
        status: status === 'Ativa' ? 'ACTIVE' : status === 'Pausada' ? 'PAUSED' : 'COMPLETED'
      });
      // Atualizar local state
      set((state) => ({
        campaigns: state.campaigns.map(c => 
          c.id === id ? { ...c, status } : c
        )
      }));
    } catch (error) {
      console.error('Update campaign status error:', error);
      throw error;
    }
  },

  // Delete Campaign
  deleteCampaign: async (id: string) => {
    try {
      await campaignsApi.deleteCampaign(id);
      set((state) => ({
        campaigns: state.campaigns.filter(c => c.id !== id)
      }));
    } catch (error) {
      console.error('Delete campaign error:', error);
      throw error;
    }
  },
}));
