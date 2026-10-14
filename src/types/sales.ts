export interface SaleRecord {
  id: string;
  date: string; // ISO date string YYYY-MM-DD or YYYY-MM-DDTHH:mm
  partner: string; // Nama Partner / Pelanggan / Toko
  itemType: string; // Tipe Barang / Nama Produk (e.g. iGame GeForce RTX 5080 Ultra W OC 16G-V)
  brand?: string; // Brand (e.g. COLORFUL, ASUS, MSI, INTEL, AOC, PHILIPS, dll)
  subBrand?: string; // Sub-Brand / Series (e.g. iGame, ROG, TUF, MAG, Evnia)
  category?: string; // Kategori Komponen (e.g. VGA / Graphic Card, Motherboard, Processor, Monitor, RAM)
  quantity: number; // Qty barang
  unit: string; // unit, pcs, box, set, dll
  unitPrice?: number; // Harga per unit (opsional)
  totalAmount?: number; // Total nominal penjualan
  status: 'selesai' | 'terkirim' | 'pending' | 'dibatalkan';
  paymentStatus?: 'lunas' | 'tempo' | 'belum_bayar';
  notes?: string;
  channel?: string; // WhatsApp, Kunjungan Sales, Toko, Telepon, dsb
  createdAt: number;
}

export interface SalesFilter {
  search: string;
  dateRange: 'all' | 'today' | 'last7days' | 'thisMonth' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  partner: string;
  brand: string; // Filter Brand (e.g. 'ALL' or 'COLORFUL', 'MSI', 'ASUS')
  subBrand: string; // Filter Sub-Brand / Series (e.g. 'ALL' or 'iGame', 'TUF')
  category: string; // Filter Kategori Komponen (e.g. 'ALL' or 'VGA / Graphic Card', 'Motherboard')
  itemType: string;
  status: string;
  sortBy: 'date-desc' | 'date-asc' | 'qty-desc' | 'qty-asc' | 'partner-asc' | 'amount-desc';
}

export interface PartnerSummary {
  partner: string;
  totalTransactions: number;
  totalQty: number;
  totalAmount: number;
  lastTransactionDate: string;
  topItem: string;
}

export interface ItemTypeSummary {
  itemType: string;
  totalTransactions: number;
  totalQty: number;
  totalAmount: number;
  topPartner: string;
  percentage: number;
}

export interface BrandSummary {
  brand: string;
  totalTransactions: number;
  totalQty: number;
  totalAmount: number;
  percentage: number;
  topCategory: string;
  subBrands: Record<string, number>;
}

export interface CategorySummary {
  category: string;
  totalTransactions: number;
  totalQty: number;
  totalAmount: number;
  percentage: number;
  topBrand: string;
}

export interface MonthlyPerformanceSummary {
  monthKey: string; // e.g. '2026-10'
  monthLabel: string; // e.g. 'Okt 2026'
  year: number;
  month: number; // 1-12
  totalTransactions: number;
  totalQty: number;
  totalAmount: number;
  topBrand: string;
  topCategory: string;
  topPartner: string;
  growthRateAmount?: number; // Growth % compared to previous month
  growthRateQty?: number; // Growth % qty compared to previous month
}

