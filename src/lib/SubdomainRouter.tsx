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
import { parseTenantHostname, inferProductAppFromInstitutionalSlug } from './tenant-host-parser';
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
  const parsed = parseTenantHostname(window.location.hostname);
  if (parsed?.productHint) {
    localStorage.setItem('current_product', parsed.productHint);
  }
  return parsed?.cleanTenantSlug ?? parsed?.tenantSlug ?? null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SubdomainRouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubdomainRouterState>(defaultState);

  useEffect(() => {
    const parsed = parseTenantHostname(window.location.hostname);
    const cleanSlug = parsed?.cleanTenantSlug ?? parsed?.tenantSlug ?? null;
    const fullSlug = parsed?.tenantSlug ?? cleanSlug;

    if (!cleanSlug) {
      setState({ subdomain: null, productType: null, tenant: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      try {
        let data: Record<string, unknown> | null = null;
        let error: { message: string } | null = null;

        if (fullSlug && fullSlug !== cleanSlug) {
          const fullResult = await supabaseMaster
            .from('tenant')
            .select('*')
            .eq('subdomain', fullSlug)
            .maybeSingle();
          data = fullResult.data;
          error = fullResult.error;
        }

        if (!data) {
          const cleanResult = await supabaseMaster
            .from('tenant')
            .select('*')
            .eq('subdomain', cleanSlug)
            .maybeSingle();
          data = cleanResult.data;
          error = cleanResult.error;
        }

        if (cancelled) return;
        if (error) throw error;

        if (!data) {
          const inferredFromHost =
            parsed?.pillar === 'siput'
              ? 'siput'
              : parsed?.pillar === 'kuliner'
                ? 'scanbite'
                : parsed?.pillar === 'lms'
                  ? 'lms'
                  : inferProductAppFromInstitutionalSlug(fullSlug || cleanSlug);

          if (inferredFromHost) {
            setState({
              subdomain: cleanSlug,
              productType: inferredFromHost as ProductType,
              tenant: null,
              loading: false,
              error: null,
            });
            return;
          }

          setState({
            subdomain: cleanSlug,
            productType: null,
            tenant: null,
            loading: false,
            error: `Subdomain "${cleanSlug}" tidak ditemukan.`,
          });
          return;
        }

        const productType =
          (data.product_app as ProductType) ||
          inferProductAppFromInstitutionalSlug(fullSlug || cleanSlug) ||
          inferProductFromData(data);

        setState({
          subdomain: cleanSlug,
          productType,
          tenant: data as unknown as MasterRegistration,
          loading: false,
          error: null,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Gagal memuat data tenant.';
        setState({ subdomain: cleanSlug, productType: null, tenant: null, loading: false, error: msg });
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
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
  const subdomain = String(data.subdomain || '');
  const fromSlug = inferProductAppFromInstitutionalSlug(subdomain);
  if (fromSlug) return fromSlug;

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
