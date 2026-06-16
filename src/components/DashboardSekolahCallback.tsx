import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function DashboardSekolahCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(error);
        navigate('/login-sekolah');
        return;
      }
      if (data.session) {
        const userEmail = data.session.user.email;
        // Cari tenant berdasarkan email
        const { data: tenant, error: tenantError } = await supabase
          .from('tenant')
          .select('subdomain, product_app')
          .eq('admin_email', userEmail)
          .single();
        if (tenantError || !tenant) {
          navigate('/login-sekolah');
          return;
        }
        // Redirect ke dashboard admin tenant di subdomain yang sama
        window.location.href = `https://${tenant.subdomain}.${tenant.product_app}.rsch.my.id/admin`;
      } else {
        navigate('/login-sekolah');
      }
    };
    handleSession();
  }, [navigate]);

  return <div className="flex justify-center items-center h-screen">Memproses login...</div>;
}
