import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import SchoolLogin from './SchoolLogin';

export default function TenantDashboard() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchSchoolData(session.user.email);
      } else {
        setLoading(false);
      }
    });

    // Subscribe ke perubahan auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchSchoolData(session.user.email);
      } else {
        setUser(null);
        setSchool(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSchoolData = async (email: string) => {
    const { data, error } = await supabase
      .from('tenant')
      .select('*')
      .eq('admin_email', email)
      .single();
    
    if (data) {
      setSchool(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">Memuat dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return <SchoolLogin />;
  }

  // Dashboard tenant (yang benar)
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard {school?.school_name || 'Sekolah'}
          </h1>
          <p className="text-gray-600 mt-1">Selamat datang di portal SIPUT!</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Informasi Sekolah</h2>
          <div className="space-y-2">
            <p><strong>Nama Sekolah:</strong> {school?.school_name || '-'}</p>
            <p><strong>NPSN:</strong> {school?.npsn || '-'}</p>
            <p><strong>Email Admin:</strong> {user.email}</p>
            <p><strong>Subdomain:</strong> {school?.subdomain || '-'}</p>
          </div>
          
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
