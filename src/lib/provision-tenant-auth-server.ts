import { createClient } from '@supabase/supabase-js';

export type TenantAuthProduct = 'siput' | 'lms';

export type ProvisionTenantAuthInput = {
  product: TenantAuthProduct;
  email: string;
  password?: string | null;
  redirectTo?: string;
  metadata?: Record<string, unknown>;
};

export type ProvisionTenantAuthOutput = {
  userId: string;
  created: boolean;
  magicLinkSent: boolean;
  message: string;
};

function getTenantServiceConfig(product: TenantAuthProduct): { url: string; serviceKey: string } | null {
  if (product === 'siput') {
    const url =
      process.env.SUPABASE_URL_SIPUT ||
      process.env.VITE_SUPABASE_URL_SIPUT ||
      '';
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY_SIPUT ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      '';
    if (!url || !serviceKey) return null;
    return { url: url.replace(/\/$/, ''), serviceKey };
  }

  const url =
    process.env.SUPABASE_URL_LMS ||
    process.env.VITE_SUPABASE_URL_LMS ||
    '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY_LMS ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/$/, ''), serviceKey };
}

export async function provisionTenantAuthUser(
  input: ProvisionTenantAuthInput
): Promise<ProvisionTenantAuthOutput> {
  const config = getTenantServiceConfig(input.product);
  if (!config) {
    throw new Error(
      `Service role Supabase ${input.product.toUpperCase()} belum dikonfigurasi di server.`
    );
  }

  const admin = createClient(config.url, config.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const normalizedEmail = input.email.trim().toLowerCase();
  const plainPassword =
    typeof input.password === 'string' &&
    input.password.trim() &&
    !input.password.trim().startsWith('$2')
      ? input.password.trim()
      : null;

  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.warn('[provision-tenant-auth] listUsers:', listError.message);
  }

  const existing = existingUsers?.users?.find(
    (user: { id: string; email?: string | null }) =>
      user.email?.toLowerCase() === normalizedEmail
  );

  if (existing?.id) {
    return {
      userId: existing.id,
      created: false,
      magicLinkSent: false,
      message: 'Akun auth sudah ada di tenant.',
    };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: plainPassword || undefined,
    email_confirm: true,
    user_metadata: input.metadata || {},
  });

  if (createError || !created.user?.id) {
    throw new Error(createError?.message || 'Gagal membuat akun auth tenant.');
  }

  let magicLinkSent = false;

  if (!plainPassword) {
    const { error: resetError } = await admin.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: input.redirectTo,
    });
    if (resetError) {
      console.warn('[provision-tenant-auth] resetPasswordForEmail:', resetError.message);
    } else {
      magicLinkSent = true;
    }
  }

  return {
    userId: created.user.id,
    created: true,
    magicLinkSent,
    message: plainPassword
      ? 'Akun auth tenant dibuat dengan password pendaftaran.'
      : magicLinkSent
        ? 'Akun auth tenant dibuat — email reset password dikirim.'
        : 'Akun auth tenant dibuat — minta pengguna reset password manual.',
  };
}
