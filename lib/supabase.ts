import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseEnabled = Boolean(url && anonKey);

export const supabase = isSupabaseEnabled
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
