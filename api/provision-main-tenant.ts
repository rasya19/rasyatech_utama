import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { PendaftarProductTab } from '../src/lib/pendaftar-mutations';
import { provisionMainTenantOnApprovalServer } from '../src/lib/provision-tenant-server';
import { provisionKulinerTenantOnApprovalServer } from '../src/lib/provision-tenant-server';

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
  if (!tab || typeof tab !== 'string') {
    return res.status(400).json({ error: 'tab wajib' });
  }
  if (!registrationRow || typeof registrationRow !== 'object') {
    return res.status(400).json({ error: 'registrationRow wajib' });
  }

  try {
    const productTab = tab as PendaftarProductTab;
    const result =
      productTab === 'siput' || productTab === 'lms'
        ? await provisionMainTenantOnApprovalServer(productTab, registrationRow)
        : await provisionKulinerTenantOnApprovalServer(productTab, registrationRow);

    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[api/provision-main-tenant]', message);
    return res.status(500).json({ error: message });
  }
}
