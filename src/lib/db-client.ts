import { supabase } from './supabase';
import { supabaseKuliner } from './supabase-kuliner';

export type ProductType = 'lms' | 'scanbite' | 'restoran_asli' | 'siput' | 'instafood';

const KULINER_PRODUCTS: ProductType[] = ['scanbite', 'restoran_asli', 'instafood'];

export function getClient(productType: ProductType) {
  return KULINER_PRODUCTS.includes(productType) ? supabaseKuliner : supabase;
}

export function isKulinerProduct(productType: ProductType) {
  return KULINER_PRODUCTS.includes(productType);
}