import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { SUPABASE_CONFIG } from './config';

export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
