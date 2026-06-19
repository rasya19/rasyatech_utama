import type { PostgrestError } from '@supabase/supabase-js';

export type ProvisioningErrorDetail = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  stack?: string;
};

export function serializeProvisioningError(error: unknown): ProvisioningErrorDetail {
  const pg = error as PostgrestError;
  const message =
    pg?.message || (error instanceof Error ? error.message : String(error ?? 'Unknown error'));

  return {
    message,
    code: pg?.code,
    details: pg?.details,
    hint: pg?.hint,
    stack: error instanceof Error ? error.stack : undefined,
  };
}

/** Log env yang dipakai provisioning — tanpa mengekspos nilai secret. */
export function logProvisioningEnvCheck(tab: string): void {
  console.log('[BE] ENV CHECK:', {
    tab,
    hasMasterServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasSiputUrl: Boolean(
      process.env.SIPUT_SUPABASE_URL ||
        process.env.SUPABASE_URL_SIPUT ||
        process.env.VITE_SUPABASE_URL_SIPUT
    ),
    hasSiputServiceKey: Boolean(
      process.env.SIPUT_SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SIPUT_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY_SIPUT
    ),
    hasLmsUrl: Boolean(
      process.env.LMS_SUPABASE_URL ||
        process.env.SUPABASE_URL_LMS ||
        process.env.VITE_SUPABASE_URL_LMS
    ),
    hasLmsServiceKey: Boolean(
      process.env.LMS_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY_LMS
    ),
  });
}

export function logProvisioningError(context: string, error: unknown): void {
  console.error(`[BE] PROVISIONING ERROR DETAIL (${context}):`, serializeProvisioningError(error));
}
