import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function SimpleTenantGuard({ children }) {
  useEffect(() => {
    const checkAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      
      const { data: tenant } = await supabase
        .from('tenant')
        .select('subdomain, product_app')
        .eq('admin_email', user.email)
        .single();
      
      if (tenant) {
        const expectedHost = `${tenant.subdomain}.${tenant.product_app}.rsch.my.id`;
        if (window.location.hostname !== expectedHost) {
          window.location.href = `https://${expectedHost}/admin`;
        }
      }
    };
    
    checkAndRedirect();
  }, []);
  
  return children;
}
