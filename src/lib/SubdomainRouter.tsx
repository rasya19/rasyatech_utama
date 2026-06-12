/**
 * Rasyatech Dynamic Subdomain Router
 *
 * How it works:
 *  1. Reads window.location.hostname to extract the subdomain.
 *  2. Looks up the subdomain in the master `registrations` table to get
 *     product_type and tenant metadata.
 *  3. Provides a <SubdomainRouterContext> consumed by App and child routes
 *     to render the correct product dashboard.
 *
 * Subdomain conventions:
 *  Main domain  → rasyatech.rsch.my.id   → Landing page (no subdomain)
 *  LMS tenant   → armillanusa.rsch.my.id → LMS dashboard
 *  SIPUT tenant → paudmelati.rsch.my.id  → SIPUT dashboard
 *  Scanbite     → warungbahagia.rsch.my.id → Scanbite dashboard
 *  etc.
 *
 * To add a new product pillar:
 *  1. Add its ProductType to src/lib/types/products.ts
 *  2. Add a case in the switch below
 *  3. Import and render your new <ProductDashboard> in App.tsx
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
  /** Raw subdomain string, e.g. "armillanusa". Null on main domain. */
  subdomain: string | null;
  /** Which product pillar owns this subdomain. Null on main domain. */
  productType: ProductType | null;
  /** Full tenant record from the registrations table. */
  tenant: MasterRegistration | null;
  /** True while the DB lookup is in progress. */
  loading: boolean;
  /** Error message if the lookup failed or subdomain is not registered. */
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

  const parts = hostname.split('.');
  // Main domain patterns: rasyatech.rsch.my.id or www.rsch.my.id
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
      // Main domain — no lookup needed
      setState({ subdomain: null, productType: null, tenant: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      try {
        const { data, error } = await supabaseMaster
          .from('registrations')
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
            error: `Subdomain "${subdomain}" tidak ditemukan. Silakan hubungi admin Rasyatech.`,
          });
          return;
        }

        const productType = (data.product_type as ProductType) || inferProductFromData(data);

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSubdomainRouter(): SubdomainRouterState {
  return useContext(SubdomainRouterContext);
}

// ─── Legacy compatibility hook ────────────────────────────────────────────────

/**
 * Drop-in replacement for the old useSubdomain() hook.
 * Returns null on main domain, or the subdomain string on tenant domains.
 */
export function useSubdomain(): string | null {
  return useContext(SubdomainRouterContext).subdomain;
}

// ─── Utility: resolve product from legacy data ────────────────────────────────

/**
 * Infers the product type from legacy registration rows that pre-date the
 * product_type column. Checks product_name / school_name heuristics.
 */
function inferProductFromData(data: Record<string, unknown>): ProductType {
  const name = (
    String(data.product_name || data.school_name || data.business_name || '')
  ).toLowerCase();

  if (name.includes('siput') || name.includes('paud') || name.includes('tk')) return 'siput';
  if (name.includes('scanbite')) return 'scanbite';
  if (name.includes('instafood') || name.includes('katering')) return 'instafood';
  if (name.includes('resto') || name.includes('pos')) return 'resto';
  return 'lms'; // default for PKBM/LMS tenants
}

// ─── Route guard component ────────────────────────────────────────────────────

interface ProductRouteProps {
  /** Render when the detected product matches one of these types */
  for: ProductType | ProductType[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children only when the current subdomain belongs
 * to the specified product type(s).
 *
 * Usage:
 *   <ProductRoute for="lms">
 *     <TenantDashboard />
 *   </ProductRoute>
 */
export function ProductRoute({ for: products, children, fallback = null }: ProductRouteProps) {
  const { productType, loading } = useSubdomainRouter();
  if (loading) return null;
  const allowed = Array.isArray(products) ? products : [products];
  return <>{allowed.includes(productType as ProductType) ? children : fallback}</>;
}
