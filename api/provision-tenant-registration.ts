import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { TenantProductDbTab } from '../src/lib/create-tenant-client';
import { provisionTenantRegistrationOnApprovalServer } from '../src/lib/provision-tenant-registration-server';

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
    const result = await provisionTenantRegistrationOnApprovalServer(
      tab as TenantProductDbTab,
      registrationRow
    );
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[api/provision-tenant-registration]', message);
    return res.status(500).json({ error: message });
  }
}
