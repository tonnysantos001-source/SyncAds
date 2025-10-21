import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export interface Customer {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  gender?: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt?: string;
  tags?: string[];
  notes?: string;
  acceptsMarketing: boolean;
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  label?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  organizationId: string;
  email: string;
  name?: string;
  phone?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  notes?: string;
  convertedAt?: string;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CUSTOMERS API
// ============================================

export const customersApi = {
  // Lista todos os clientes
  async list(filters?: {
    status?: 'ACTIVE' | 'BLOCKED';
    search?: string;
    tags?: string[];
  }) {
    try {
      let query = supabase
        .from('Customer')
        .select('*')
        .order('createdAt', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%`);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Customer[];
    } catch (error) {
      console.error('Error listing customers:', error);
      throw error;
    }
  },

  // Busca um cliente por ID
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('Customer')
        .select('*, CustomerAddress(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Customer;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  },

  // Busca cliente por email
  async getByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('Customer')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data as Customer;
    } catch (error) {
      console.error('Error getting customer by email:', error);
      throw error;
    }
  },

  // Cria um novo cliente
  async create(customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'averageOrderValue' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data, error } = await supabase
        .from('Customer')
        .insert({
          ...customer,
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // Atualiza um cliente
  async update(id: string, updates: Partial<Customer>) {
    try {
      const { data, error } = await supabase
        .from('Customer')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // Bloqueia/Desbloqueia um cliente
  async toggleStatus(id: string, status: 'ACTIVE' | 'BLOCKED') {
    try {
      const { data, error } = await supabase
        .from('Customer')
        .update({ status, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    } catch (error) {
      console.error('Error toggling customer status:', error);
      throw error;
    }
  },

  // Deleta um cliente
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('Customer')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },
};

// ============================================
// CUSTOMER ADDRESSES API
// ============================================

export const customerAddressesApi = {
  // Lista endereços de um cliente
  async listByCustomer(customerId: string) {
    try {
      const { data, error } = await supabase
        .from('CustomerAddress')
        .select('*')
        .eq('customerId', customerId)
        .order('isDefault', { ascending: false });

      if (error) throw error;
      return data as CustomerAddress[];
    } catch (error) {
      console.error('Error listing addresses:', error);
      throw error;
    }
  },

  // Adiciona um endereço
  async create(address: Omit<CustomerAddress, 'id' | 'createdAt'>) {
    try {
      // Se for o endereço padrão, remove o padrão dos outros
      if (address.isDefault) {
        await supabase
          .from('CustomerAddress')
          .update({ isDefault: false })
          .eq('customerId', address.customerId);
      }

      const { data, error } = await supabase
        .from('CustomerAddress')
        .insert(address)
        .select()
        .single();

      if (error) throw error;
      return data as CustomerAddress;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  },

  // Atualiza um endereço
  async update(id: string, updates: Partial<CustomerAddress>) {
    try {
      // Se está definindo como padrão, remove o padrão dos outros
      if (updates.isDefault) {
        const address = await supabase
          .from('CustomerAddress')
          .select('customerId')
          .eq('id', id)
          .single();

        if (address.data) {
          await supabase
            .from('CustomerAddress')
            .update({ isDefault: false })
            .eq('customerId', address.data.customerId);
        }
      }

      const { data, error } = await supabase
        .from('CustomerAddress')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CustomerAddress;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  },

  // Deleta um endereço
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('CustomerAddress')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  },
};

// ============================================
// LEADS API
// ============================================

export const leadsApi = {
  // Lista todos os leads
  async list(filters?: {
    status?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
    source?: string;
    search?: string;
  }) {
    try {
      let query = supabase
        .from('Lead')
        .select('*')
        .order('createdAt', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.source) {
        query = query.eq('source', filters.source);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Lead[];
    } catch (error) {
      console.error('Error listing leads:', error);
      throw error;
    }
  },

  // Busca um lead por ID
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('Lead')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Lead;
    } catch (error) {
      console.error('Error getting lead:', error);
      throw error;
    }
  },

  // Cria um novo lead
  async create(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data, error } = await supabase
        .from('Lead')
        .insert(lead)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  },

  // Atualiza um lead
  async update(id: string, updates: Partial<Lead>) {
    try {
      const { data, error } = await supabase
        .from('Lead')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  },

  // Converte lead em cliente
  async convertToCustomer(leadId: string, customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'averageOrderValue' | 'createdAt' | 'updatedAt'>) {
    try {
      // Cria o cliente
      const customer = await customersApi.create(customerData);

      // Atualiza o lead
      await supabase
        .from('Lead')
        .update({
          status: 'CONVERTED',
          customerId: customer.id,
          convertedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', leadId);

      return customer;
    } catch (error) {
      console.error('Error converting lead:', error);
      throw error;
    }
  },

  // Deleta um lead
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('Lead')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  },
};
