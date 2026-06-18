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
import { getProductClient, supabaseMaster } from './supabase-hub';
import {
  parseTenantHostname,
  inferProductAppFromInstitutionalSlug,
  routeTenantSlugFromHostnameSubdomain,
} from './tenant-host-parser';
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

const PRODUCT_CLIENT_ORDER: ProductType[] = ['siput', 'lms', 'scanbite', 'resto', 'instafood'];

function pillarToProductType(pillar: string | undefined): ProductType | null {
  if (pillar === 'siput') return 'siput';
  if (pillar === 'lms') return 'lms';
  if (pillar === 'kuliner') return 'scanbite';
  return null;
}

async function queryTenantBySubdomain(
  client: ReturnType<typeof getProductClient>,
  slug: string
): Promise<Record<string, unknown> | null> {
  const normalized = routeTenantSlugFromHostnameSubdomain(slug);
  const { data, error } = await client
    .from('tenant')
    .select('*')
    .eq('subdomain', normalized)
    .maybeSingle();

  if (error) {
    if (error.message.includes('Could not find the table')) return null;
    throw error;
  }
  return data;
}

async function queryTenantBySubdomainHost(
  client: ReturnType<typeof getProductClient>,
  hostname: string
): Promise<Record<string, unknown> | null> {
  const host = hostname.split(':')[0].toLowerCase();
  const { data, error } = await client
    .from('tenant')
    .select('*')
    .eq('subdomain_host', host)
    .maybeSingle();

  if (error) {
    if (error.message.includes('Could not find the table')) return null;
    if (error.message.includes('column') && error.message.includes('subdomain_host')) {
      return null;
    }
    throw error;
  }
  return data;
}

async function resolveTenantFromDatabases(
  routeSlug: string,
  hostname: string,
  preferredProduct: ProductType | null
): Promise<Record<string, unknown> | null> {
  const clients: Array<{ product: ProductType; client: ReturnType<typeof getProductClient> }> = [];
  const seen = new Set<string>();

  const addClient = (product: ProductType) => {
    const client = getProductClient(product);
    const cacheKey = product;
    if (!seen.has(cacheKey)) {
      seen.add(cacheKey);
      clients.push({ product, client });
    }
  };

  if (preferredProduct) addClient(preferredProduct);
  for (const product of PRODUCT_CLIENT_ORDER) addClient(product);

  for (const { client } of clients) {
    const byHost = await queryTenantBySubdomainHost(client, hostname);
    if (byHost) return byHost;
  }

  for (const { client } of clients) {
    const bySlug = await queryTenantBySubdomain(client, routeSlug);
    if (bySlug) return bySlug;
  }

  const fromMaster = await queryTenantBySubdomain(supabaseMaster, routeSlug);
  if (fromMaster) return fromMaster;

  return null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SubdomainRouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubdomainRouterState>(defaultState);

  useEffect(() => {
    const hostname = window.location.hostname;
    const parsed = parseTenantHostname(hostname);
    const routeSlug =
      parsed?.routeTenantSlug ??
      (parsed?.tenantSlug ? routeTenantSlugFromHostnameSubdomain(parsed.tenantSlug) : null);

    if (!routeSlug) {
      setState({ subdomain: null, productType: null, tenant: null, loading: false, error: null });
      return;
    }

    if (parsed?.productHint) {
      localStorage.setItem('current_product', parsed.productHint);
    }

    let cancelled = false;

    const resolve = async () => {
      try {
        const preferredProduct =
          pillarToProductType(parsed?.pillar) ||
          (inferProductAppFromInstitutionalSlug(parsed?.tenantSlug || routeSlug) as ProductType | null);

        const data = await resolveTenantFromDatabases(routeSlug, hostname, preferredProduct);

        if (cancelled) return;

        if (!data) {
          const inferredFromHost =
            preferredProduct ||
            inferProductAppFromInstitutionalSlug(parsed?.tenantSlug || routeSlug);

          if (inferredFromHost) {
            setState({
              subdomain: routeSlug,
              productType: inferredFromHost as ProductType,
              tenant: null,
              loading: false,
              error: null,
            });
            return;
          }

          setState({
            subdomain: routeSlug,
            productType: null,
            tenant: null,
            loading: false,
            error: `Subdomain "${routeSlug}" tidak ditemukan.`,
          });
          return;
        }

        const productType =
          (data.product_app as ProductType) ||
          inferProductAppFromInstitutionalSlug(String(data.subdomain || routeSlug)) ||
          inferProductFromData(data);

        setState({
          subdomain: routeSlug,
          productType,
          tenant: data as unknown as MasterRegistration,
          loading: false,
          error: null,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Gagal memuat data tenant.';
        setState({ subdomain: routeSlug, productType: null, tenant: null, loading: false, error: msg });
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

  const name = String(data.school_name || data.tenant_name || '').toLowerCase();
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
