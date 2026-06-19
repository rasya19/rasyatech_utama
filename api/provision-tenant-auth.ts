import type { VercelRequest, VercelResponse } from '@vercel/node';
import { provisionTenantAuthUser } from './_lib/provision-tenant-auth-server';

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

  const { product, email, password, redirectTo, metadata } = req.body || {};

  if (!product || (product !== 'siput' && product !== 'lms')) {
    return res.status(400).json({ error: 'product harus siput atau lms' });
  }
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email wajib' });
  }

  try {
    const result = await provisionTenantAuthUser({
      product,
      email,
      password,
      redirectTo: typeof redirectTo === 'string' ? redirectTo : undefined,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}
