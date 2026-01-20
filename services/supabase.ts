import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase project credentials
// You can get these from your Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = 'https://alxaiqatnkaqannrwedg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ny40FWtgVyLdNlx9DWUrmA_3NFWDPFl';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
