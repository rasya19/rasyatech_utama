/**
 * Rasyatech Dynamic Subdomain Router
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabaseMaster } from './supabase-hub';
import type { ProductType, MasterRegistration } from './types/products';

// ─── Context shape ────────────────────────────────────────────────────────────

export interface SubdomainRouterState {
  subdomain: string | null;
  productType: ProductType | null;
  tenant: MasterRegistration | null;
  loading: boolean;
  error: string | null;
}

const defaultState: SubdomainRouterState = {
  subdomain: null,
  productType: null,
  tenant: null,
  loading: true,
  error: null,
};

const SubdomainRouterContext = createContext<SubdomainRouterState>(defaultState);

// ─── Helper: detect subdomain from hostname ───────────────────────────────────

function detectSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Local dev / Cloud Run preview → always treat as main domain
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.run.app') ||
    hostname.endsWith('.vercel.app')
  ) {
    return null;
  }

  // Format: tenant.siput.rsch.my.id (4 bagian)
  const parts = hostname.split('.');
  
  if (parts.length >= 4) {
    const tenant = parts[0];
    const product = parts[1];
    
    if (product === 'siput' || product === 'lms') {
      localStorage.setItem('current_product', product);
      return tenant;
    }
  }
  
  // Main domain patterns
  const isMainDomain =
    parts[0] === 'rasyatech' ||
    parts[0] === 'www' ||
    parts.length < 3;

  return isMainDomain ? null : parts[0];
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SubdomainRouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubdomainRouterState>(defaultState);

  useEffect(() => {
    const subdomain = detectSubdomain();

    if (!subdomain) {
      setState({ subdomain: null, productType: null, tenant: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      try {
        const { data, error } = await supabaseMaster
          .from('tenant')
          .select('*')
          .eq('subdomain', subdomain)
          .maybeSingle();

        if (cancelled) return;

        if (error) throw error;

        if (!data) {
          setState({
            subdomain,
            productType: null,
            tenant: null,
            loading: false,
            error: `Subdomain "${subdomain}" tidak ditemukan.`,
          });
          return;
        }

        const productType = (data.product_app as ProductType) || inferProductFromData(data);

        setState({
          subdomain,
          productType,
          tenant: data as MasterRegistration,
          loading: false,
          error: null,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Gagal memuat data tenant.';
        setState({ subdomain, productType: null, tenant: null, loading: false, error: msg });
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, []);

  return (
    <SubdomainRouterContext.Provider value={state}>
      {children}
    </SubdomainRouterContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSubdomainRouter(): SubdomainRouterState {
  return useContext(SubdomainRouterContext);
}

export function useSubdomain(): string | null {
  return useContext(SubdomainRouterContext).subdomain;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function inferProductFromData(data: Record<string, unknown>): ProductType {
  const productApp = String(data.product_app || '');
  if (productApp === 'siput') return 'siput';
  if (productApp === 'lms') return 'lms';
  if (productApp === 'scanbite') return 'scanbite';
  if (productApp === 'instafood') return 'instafood';
  if (productApp === 'restoran_asli') return 'resto';
  
  const name = (String(data.school_name || data.tenant_name || '')).toLowerCase();
  if (name.includes('siput') || name.includes('paud') || name.includes('tk')) return 'siput';
  if (name.includes('scanbite')) return 'scanbite';
  if (name.includes('instafood')) return 'instafood';
  if (name.includes('resto') || name.includes('pos')) return 'resto';
  return 'lms';
}

// ─── Route guard ──────────────────────────────────────────────────────────────

interface ProductRouteProps {
  for: ProductType | ProductType[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProductRoute({ for: products, children, fallback = null }: ProductRouteProps) {
  const { productType, loading } = useSubdomainRouter();
  if (loading) return null;
  const allowed = Array.isArray(products) ? products : [products];
  return <>{allowed.includes(productType as ProductType) ? children : fallback}</>;
}
