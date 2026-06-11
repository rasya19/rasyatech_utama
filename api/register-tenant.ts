import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  registerTenant,
  type TenantRegistrationPayload,
} from '../src/lib/register-tenant-core';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://erosuotjshhmhduoprwi.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return res.status(500).json({ error: 'Server configuration missing: Service Role Key' });
  }

  const {
    tenant_name,
    product_app,
    subdomain,
    admin_name,
    admin_email,
    whatsapp,
    npsn,
    package_tier,
    meta_data,
    source,
  } = req.body ?? {};

  if (!tenant_name || !product_app || !subdomain || !admin_name || !admin_email || !whatsapp) {
    return res.status(400).json({
      error:
        'Field wajib: tenant_name, product_app, subdomain, admin_name, admin_email, whatsapp',
    });
  }

  const adminSupabase = createClient(supabaseUrl, serviceKey);

  try {
    const payload: TenantRegistrationPayload = {
      tenant_name,
      product_app,
      subdomain,
      admin_name,
      admin_email,
      whatsapp,
      npsn,
      package_tier,
      meta_data,
      source,
    };

    const result = await registerTenant(adminSupabase, payload);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('register-tenant error:', message);
    return res.status(400).json({ error: message });
  }
}
