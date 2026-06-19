import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdminSiput } from './_lib/supabaseSiput';
import type { TenantProductDbTab } from './_lib/provision-registration-shared';
import { provisionTenantRegistrationOnApprovalServer } from './_lib/provision-tenant-registration-server';
import {
  logProvisioningEnvCheck,
  logProvisioningError,
  serializeProvisioningError,
} from './_lib/provision-debug';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

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

  const rawBody = req.body ?? {};
  console.log('[BE] Raw request body:', rawBody);

  const { tab, registrationRow } = rawBody as {
    tab?: string;
    registrationRow?: Record<string, unknown>;
  };

  logProvisioningEnvCheck(String(tab || 'unknown'));

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

    console.log('[BE] Provisioning start', {
      tab,
      registrationId: registrationRow.id,
      email: registrationRow.email,
      subdomain: registrationRow.subdomain || registrationRow.kode_tenant,
      npsn: registrationRow.npsn,
      paket:
        registrationRow.package_tier ||
        registrationRow.selected_package ||
        registrationRow.paket_langganan,
    });

    const result = await provisionTenantRegistrationOnApprovalServer(
      tab as TenantProductDbTab,
      registrationRow
    );

    console.log('[BE] Provisioning success', {
      tab,
      tenantId: result.tenant.tenantId,
      slug: result.tenant.slug,
      registrationId: result.registrationId,
    });

    return res.status(201).json(result);
  } catch (error: unknown) {
    logProvisioningError('api/provision-tenant-registration', error);
    const detail = serializeProvisioningError(error);

    return res.status(500).json({
      error: 'Provisioning gagal',
      detail: detail.message,
      step: 'provision-tenant-registration',
      code: detail.code,
      hint: detail.hint,
      details: detail.details,
    });
  }
}
