import { useEffect, useMemo, useState } from 'react';
import { getProductClient } from '../lib/supabase-hub';
import type { ProductType } from '../lib/types/products';
import SchoolLogin from './SchoolLogin';

type TenantDashboardProps = {
  portal?: ProductType | 'kuliner';
  tenantSubdomain?: string;
};

function resolveProductClient(portal?: ProductType | 'kuliner') {
  if (portal === 'siput' || portal === 'lms' || portal === 'scanbite' || portal === 'resto' || portal === 'instafood') {
    return getProductClient(portal);
  }
  const stored = localStorage.getItem('current_product_pillar');
  if (stored === 'siput' || stored === 'lms' || stored === 'scanbite' || stored === 'resto' || stored === 'instafood') {
    return getProductClient(stored);
  }
  return getProductClient('siput');
}

export default function TenantDashboard({ portal, tenantSubdomain }: TenantDashboardProps) {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [school, setSchool] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const resolvedSubdomain = useMemo(() => {
    return tenantSubdomain || localStorage.getItem('current_tenant_subdomain') || '';
  }, [tenantSubdomain]);

  const productClient = useMemo(() => resolveProductClient(portal), [portal]);

  useEffect(() => {
    productClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        void fetchSchoolData(session.user.email || '', resolvedSubdomain);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = productClient.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        void fetchSchoolData(session.user.email || '', resolvedSubdomain);
      } else {
        setUser(null);
        setSchool(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [productClient, resolvedSubdomain]);

  const fetchSchoolData = async (email: string, subdomain: string) => {
    let query = productClient.from('tenant').select('*');

    if (subdomain) {
      const { data: bySubdomain } = await query.eq('subdomain', subdomain).maybeSingle();
      if (bySubdomain) {
        setSchool(bySubdomain);
        setLoading(false);
        return;
      }
    }

    const { data } = await productClient.from('tenant').select('*').eq('admin_email', email).maybeSingle();
    if (data) {
      setSchool(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-600">Memuat portal tenant...</div>
      </div>
    );
  }

  if (!user) {
    return <SchoolLogin portal="siput" tenantSubdomain={resolvedSubdomain} />;
  }

  const schoolName = String(school?.school_name || school?.tenant_name || 'Sekolah');

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white shadow border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">Portal SIPUT</p>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard {schoolName}</h1>
          <p className="text-slate-600 mt-1">Selamat datang di portal administrasi sekolah Anda.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-900">Informasi Sekolah</h2>
          <div className="space-y-2 text-slate-700">
            <p>
              <strong>Nama Sekolah:</strong> {schoolName}
            </p>
            <p>
              <strong>NPSN:</strong> {String(school?.npsn || '-')}
            </p>
            <p>
              <strong>Email Admin:</strong> {user.email}
            </p>
            <p>
              <strong>Subdomain:</strong> {String(school?.subdomain || resolvedSubdomain || '-')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => productClient.auth.signOut()}
            className="mt-6 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
