import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

/**
 * Usa só "https://xxxx.supabase.co". Se a variável vier com caminho a mais
 * (ex.: ".../rest/v1/", copiado do painel), o login falha com
 * "Invalid path specified in request URL".
 */
function baseUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).origin;
  } catch {
    return value;
  }
}

const url = baseUrl(rawUrl);

/** `null` quando o Supabase não está configurado → o site roda em modo local. */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const isCloud = supabase !== null;
