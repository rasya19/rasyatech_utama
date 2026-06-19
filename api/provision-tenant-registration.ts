import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdminSiput } from './_lib/supabaseSiput';
import type { TenantProductDbTab } from './_lib/provision-registration-shared';
import { provisionTenantRegistrationOnApprovalServer } from './_lib/provision-tenant-registration-server';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tab, registrationRow } = req.body || {};
  if (tab !== 'lms' && tab !== 'siput') {
    return res.status(400).json({ error: 'tab harus lms atau siput' });
  }
  if (!registrationRow || typeof registrationRow !== 'object') {
    return res.status(400).json({ error: 'registrationRow wajib' });
  }

  try {
    if (tab === 'siput') {
      getSupabaseAdminSiput();
    }

    console.log('[api/provision-tenant-registration] start', {
      tab,
      registrationId: registrationRow.id,
      email: registrationRow.email,
      subdomain: registrationRow.subdomain || registrationRow.kode_tenant,
    });

    const result = await provisionTenantRegistrationOnApprovalServer(
      tab as TenantProductDbTab,
      registrationRow
    );

    console.log('[api/provision-tenant-registration] success', {
      tab,
      tenantId: result.tenant.tenantId,
      registrationId: result.registrationId,
    });

    return res.status(201).json(result);
  } catch (error: unknown) {
    const message = formatError(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[api/provision-tenant-registration] FAILED:', {
      message,
      stack,
      tab,
      registrationId: registrationRow?.id,
      email: registrationRow?.email,
    });
    return res.status(500).json({ error: message, step: 'provision-tenant-registration' });
  }
}
