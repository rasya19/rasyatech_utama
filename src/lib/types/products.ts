/**
 * Central type registry for all 5 Rasyatech SaaS product pillars.
 * Used by the subdomain router, client factory, and registration gate.
 */

// ─── Product Identifier ───────────────────────────────────────────────────────

export type ProductType =
  | 'lms'          // Armilla LMS  – PKBM / Kesetaraan
  | 'siput'        // SIPUT        – PAUD / TK / E-Rapor
  | 'scanbite'     // Scanbite     – Smart Restaurant & Song Request
  | 'instafood'    // Instafood    – Home Catering Pre-Order
  | 'resto';       // Resto        – Hybrid POS Premium

export const PRODUCT_LABELS: Record<ProductType, string> = {
  lms:       'Armilla LMS',
  siput:     'SIPUT PAUD',
  scanbite:  'Scanbite',
  instafood: 'Instafood',
  resto:     'Resto POS',
};

// ─── Master Registration (single table, all products) ────────────────────────

export interface MasterRegistration {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  business_name: string;
  product_type: ProductType;
  subdomain: string;          // e.g. "armillanusa" → armillanusa.rsch.my.id
  package: 'silver' | 'gold' | 'platinum' | 'custom';
  status: 'pending' | 'active' | 'suspended';
  is_approved: boolean;
  meta_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Armilla LMS – PKBM / Kesetaraan ─────────────────────────────────────────

export interface LmsSchool {
  id: string;
  registration_id: string;
  name: string;
  npsn: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  logo_url?: string;
  subdomain: string;
  created_at: string;
}

export interface LmsStudent {
  id: string;
  school_id: string;
  name: string;
  nisn: string;
  grade_level: string;           // e.g. "Paket A", "Paket B", "Paket C"
  gender: 'L' | 'P';
  dob: string;
  created_at: string;
}

export interface LmsTeacher {
  id: string;
  school_id: string;
  name: string;
  nip?: string;
  subject: string;
  email?: string;
  created_at: string;
}

export interface LmsCourse {
  id: string;
  school_id: string;
  name: string;
  grade_level: string;
  teacher_id: string;
  created_at: string;
}

export interface LmsGrade {
  id: string;
  student_id: string;
  course_id: string;
  period: string;                // e.g. "Semester 1 2025/2026"
  score: number;
  notes?: string;
  created_at: string;
}

// ─── SIPUT – PAUD / TK / E-Rapor ─────────────────────────────────────────────

export interface SiputSchool {
  id: string;
  registration_id: string;
  name: string;
  npsn: string;
  address: string;
  kecamatan: string;
  contact_email: string;
  contact_phone: string;
  subdomain: string;
  created_at: string;
}

export interface SiputStudent {
  id: string;
  school_id: string;
  name: string;
  nik?: string;
  dob: string;
  gender: 'L' | 'P';
  parent_name: string;
  created_at: string;
}

export interface SiputAssessment {
  id: string;
  student_id: string;
  period: string;
  aspect: string;                // e.g. "Nilai Agama & Moral", "Fisik Motorik"
  score: 'BSH' | 'BSB' | 'MB' | 'BB'; // PAUD grading
  notes?: string;
  created_at: string;
}

export interface SiputRaport {
  id: string;
  student_id: string;
  period: string;
  generated_at: string;
  signed_by?: string;
  pdf_url?: string;
}

// ─── Scanbite – Smart Restaurant & Song Request ───────────────────────────────

export interface ScanbiteOutlet {
  id: string;
  registration_id: string;
  name: string;
  address: string;
  contact_phone: string;
  table_count: number;
  subdomain: string;
  created_at: string;
}

export interface ScanbiteTable {
  id: string;
  outlet_id: string;
  number: string;
  capacity: number;
  qr_code_url?: string;
  status: 'available' | 'occupied' | 'reserved';
}

export interface ScanbiteMenu {
  id: string;
  outlet_id: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  created_at: string;
}

export interface ScanbiteOrder {
  id: string;
  outlet_id: string;
  table_id: string;
  items: Array<{ menu_id: string; name: string; qty: number; price: number }>;
  total: number;
  status: 'pending' | 'preparing' | 'served' | 'paid';
  created_at: string;
}

export interface ScanbiteSongRequest {
  id: string;
  outlet_id: string;
  table_id?: string;
  song_title: string;
  artist?: string;
  requester_name?: string;
  status: 'queued' | 'playing' | 'done';
  created_at: string;
}

// ─── Instafood – Home Catering Pre-Order ─────────────────────────────────────

export interface InstafoodSeller {
  id: string;
  registration_id: string;
  brand_name: string;
  owner_name: string;
  address: string;
  contact_phone: string;
  subdomain: string;
  created_at: string;
}

export interface InstafoodMenu {
  id: string;
  seller_id: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  min_order: number;
  lead_days: number;             // preparation days needed
  image_url?: string;
  is_available: boolean;
  created_at: string;
}

export interface InstafoodOrder {
  id: string;
  seller_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: Array<{ menu_id: string; name: string; qty: number; price: number }>;
  total: number;
  delivery_date: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'dp_paid' | 'paid';
  notes?: string;
  created_at: string;
}

// ─── Resto – Hybrid POS Premium ──────────────────────────────────────────────

export interface RestoOutlet {
  id: string;
  registration_id: string;
  name: string;
  address: string;
  contact_phone: string;
  table_count: number;
  subdomain: string;
  created_at: string;
}

export interface RestoMenu {
  id: string;
  outlet_id: string;
  category: string;
  name: string;
  price: number;
  hpp: number;                   // harga pokok penjualan (COGS)
  image_url?: string;
  is_available: boolean;
  created_at: string;
}

export interface RestoOrder {
  id: string;
  outlet_id: string;
  type: 'dine_in' | 'takeaway' | 'delivery' | 'online';
  table_number?: string;
  customer_name?: string;
  items: Array<{ menu_id: string; name: string; qty: number; price: number; hpp: number }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';
  payment_method?: 'cash' | 'qris' | 'transfer' | 'card';
  created_at: string;
}

export interface RestoInventory {
  id: string;
  outlet_id: string;
  item_name: string;
  unit: string;
  stock: number;
  min_stock: number;
  last_updated: string;
}

export interface RestoStaff {
  id: string;
  outlet_id: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier' | 'kitchen' | 'waiter';
  pin?: string;
  created_at: string;
}
