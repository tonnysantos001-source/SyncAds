import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Tables, TablesInsert, TablesUpdate } from '../database.types';

export type Campaign = Tables<'Campaign'>;
export type CampaignInsert = TablesInsert<'Campaign'>;
export type CampaignUpdate = TablesUpdate<'Campaign'>;

export const campaignsApi = {
  // Get all campaigns for the current user
  getCampaigns: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('Campaign')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get campaigns error:', error);
      throw error;
    }
  },

  // Get a single campaign by ID
  getCampaign: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('Campaign')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get campaign error:', error);
      throw error;
    }
  },

  // Create a new campaign
  createCampaign: async (userId: string, campaignData: Omit<CampaignInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const newCampaign: CampaignInsert = {
        id: uuidv4(),
        userId,
        ...campaignData,
        createdAt: now,
        updatedAt: now,
      };

      const { data, error } = await supabase
        .from('Campaign')
        .insert(newCampaign)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create campaign error:', error);
      throw error;
    }
  },

  // Update a campaign
  updateCampaign: async (id: string, campaignData: Partial<Omit<Campaign, 'id' | 'userId' | 'createdAt'>>) => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('Campaign')
        .update({
          ...campaignData,
          updatedAt: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update campaign error:', error);
      throw error;
    }
  },

  // Delete a campaign
  deleteCampaign: async (id: string) => {
    try {
      const { error } = await supabase
        .from('Campaign')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete campaign error:', error);
      throw error;
    }
  },

  // Get campaign analytics
  getCampaignAnalytics: async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('Analytics')
        .select('*')
        .eq('campaignId', campaignId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get campaign analytics error:', error);
      throw error;
    }
  },
};
