import { supabase } from '@/lib/supabase';
import { createLocalRepo } from './localRepo';
import { createSupabaseRepo } from './supabaseRepo';
import type { CatalogRepo } from './repo';

export const repo: CatalogRepo = supabase ? createSupabaseRepo(supabase) : createLocalRepo();
