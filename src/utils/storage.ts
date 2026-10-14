import {
  BrandSummary,
  CategorySummary,
  ItemTypeSummary,
  MonthlyPerformanceSummary,
  PartnerSummary,
  SaleRecord,
  SalesFilter,
} from '../types/sales';
import { classifyHardware } from './hardwareClassifier';

const STORAGE_KEY = 'distributor_sales_records_fresh_v1';

export const INITIAL_SAMPLE_DATA: SaleRecord[] = [
  {
    id: 'TRX-101',
    date: '2026-10-11T14:30',
    partner: 'Mugen Comp',
    itemType: 'iGame GeForce RTX 5080 Ultra W OC 16G-V',
    brand: 'COLORFUL',
    subBrand: 'iGame',
    category: 'VGA / Graphic Card',
    quantity: 1,
    unit: 'unit',
    unitPrice: 30500000,
    totalAmount: 30500000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Batch seri RTX 5080 baru',
    channel: 'WhatsApp',
    createdAt: Date.now() - 3600000 * 1,
  },
  {
    id: 'TRX-102',
    date: '2026-10-11T14:30',
    partner: 'Mugen Comp',
    itemType: 'iGame GeForce RTX 5080 Ultra OC 16G-V (Black)',
    brand: 'COLORFUL',
    subBrand: 'iGame',
    category: 'VGA / Graphic Card',
    quantity: 1,
    unit: 'unit',
    unitPrice: 30500000,
    totalAmount: 30500000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Batch seri RTX 5080 baru',
    channel: 'WhatsApp',
    createdAt: Date.now() - 3600000 * 1,
  },
  {
    id: 'TRX-103',
    date: '2026-10-11T14:30',
    partner: 'Mugen Comp',
    itemType: 'iGame GeForce RTX 5070 Ultra W OC 12GB-V',
    brand: 'COLORFUL',
    subBrand: 'iGame',
    category: 'VGA / Graphic Card',
    quantity: 2,
    unit: 'unit',
    unitPrice: 15800000,
    totalAmount: 31600000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Kirim via kurir toko',
    channel: 'WhatsApp',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'TRX-104',
    date: '2026-10-11T14:30',
    partner: 'Mugen Comp',
    itemType: 'COLORFUL RTX 5070 GAMING 12GB-V',
    brand: 'COLORFUL',
    subBrand: 'Gaming',
    category: 'VGA / Graphic Card',
    quantity: 3,
    unit: 'unit',
    unitPrice: 15300000,
    totalAmount: 45900000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Pesanan partai toko',
    channel: 'WhatsApp',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'TRX-105',
    date: '2026-10-11T11:15',
    partner: 'GT . Global Sinergi',
    itemType: 'Intel Core i7-14700F Box',
    brand: 'INTEL',
    subBrand: 'Core i7',
    category: 'Processor / CPU',
    quantity: 1,
    unit: 'unit',
    unitPrice: 5850000,
    totalAmount: 5850000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Garansi resmi Intel Indonesia 3 tahun',
    channel: 'WhatsApp',
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'TRX-106',
    date: '2026-10-11T10:00',
    partner: 'Mega Bintang Komputer',
    itemType: 'MSI MAG B650 TOMAHAWK WIFI',
    brand: 'MSI',
    subBrand: 'MAG / Tomahawk',
    category: 'Motherboard',
    quantity: 3,
    unit: 'unit',
    unitPrice: 3850000,
    totalAmount: 11550000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Support Ryzen 7000/8000/9000',
    channel: 'Kunjungan Sales',
    createdAt: Date.now() - 3600000 * 6,
  },
  {
    id: 'TRX-107',
    date: '2026-10-11T09:30',
    partner: 'Mega Bintang Komputer',
    itemType: 'MSI GeForce RTX 4070 SUPER 12G VENTUS 2X OC',
    brand: 'MSI',
    subBrand: 'Ventus',
    category: 'VGA / Graphic Card',
    quantity: 2,
    unit: 'unit',
    unitPrice: 10450000,
    totalAmount: 20900000,
    status: 'terkirim',
    paymentStatus: 'tempo',
    notes: 'Faktur tempo 14 hari',
    channel: 'Kunjungan Sales',
    createdAt: Date.now() - 3600000 * 7,
  },
  {
    id: 'TRX-108',
    date: '2026-10-10T16:00',
    partner: 'CV Techno Utama',
    itemType: 'ASUS TUF GAMING B760-PLUS WIFI DDR5',
    brand: 'ASUS',
    subBrand: 'TUF Gaming',
    category: 'Motherboard',
    quantity: 4,
    unit: 'unit',
    unitPrice: 3450000,
    totalAmount: 13800000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Bundle proci i7',
    channel: 'WhatsApp',
    createdAt: Date.now() - 3600000 * 25,
  },
  {
    id: 'TRX-109',
    date: '2026-10-10T14:20',
    partner: 'PT Sentra Solusi IT',
    itemType: 'ASUS ROG Strix GeForce RTX 4080 SUPER 16GB OC',
    brand: 'ASUS',
    subBrand: 'ROG / Strix',
    category: 'VGA / Graphic Card',
    quantity: 1,
    unit: 'unit',
    unitPrice: 19800000,
    totalAmount: 19800000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Kebutuhan AI workstation kantor',
    channel: 'WhatsApp',
    createdAt: Date.now() - 3600000 * 27,
  },
  {
    id: 'TRX-110',
    date: '2026-10-10T11:00',
    partner: 'Cyber Computer Store',
    itemType: 'AOC 24G2SP 23.8" 165Hz IPS Gaming Monitor',
    brand: 'AOC',
    subBrand: 'Gaming Series',
    category: 'Monitor',
    quantity: 5,
    unit: 'unit',
    unitPrice: 1950000,
    totalAmount: 9750000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Best seller monitor esport',
    channel: 'Toko',
    createdAt: Date.now() - 3600000 * 30,
  },
  {
    id: 'TRX-111',
    date: '2026-10-09T15:40',
    partner: 'GT . Global Sinergi',
    itemType: 'Philips Evnia 27M1N3200Z 27" 170Hz IPS Monitor',
    brand: 'PHILIPS',
    subBrand: 'Evnia Gaming',
    category: 'Monitor',
    quantity: 3,
    unit: 'unit',
    unitPrice: 2850000,
    totalAmount: 8550000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Paket display toko',
    channel: 'WhatsApp',
    createdAt: Date.now() - 3600000 * 50,
  },
  {
    id: 'TRX-112',
    date: '2026-10-09T10:15',
    partner: 'Mugen Comp',
    itemType: 'COLORFUL CVN B760M FROZEN WIFI D5 V20',
    brand: 'COLORFUL',
    subBrand: 'Gaming',
    category: 'Motherboard',
    quantity: 2,
    unit: 'unit',
    unitPrice: 2650000,
    totalAmount: 5300000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'PCB Putih aesthetic',
    channel: 'WhatsApp',
    createdAt: Date.now() - 3600000 * 55,
  },
  // Sample data from previous months to showcase Month-over-Month historical trends
  {
    id: 'TRX-095',
    date: '2026-09-24T14:15',
    partner: 'GT . Global Sinergi',
    itemType: 'iGame GeForce RTX 4070 Ti SUPER Vulcan W OC 16G',
    brand: 'COLORFUL',
    subBrand: 'iGame',
    category: 'VGA / Graphic Card',
    quantity: 2,
    unit: 'unit',
    unitPrice: 17200000,
    totalAmount: 34400000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Order batch September',
    channel: 'WhatsApp',
    createdAt: Date.now() - 86400000 * 18,
  },
  {
    id: 'TRX-094',
    date: '2026-09-18T11:00',
    partner: 'Mugen Comp',
    itemType: 'Intel Core i9-14900K Box',
    brand: 'INTEL',
    subBrand: 'Core i9',
    category: 'Processor / CPU',
    quantity: 2,
    unit: 'unit',
    unitPrice: 9600000,
    totalAmount: 19200000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Batch retail proci September',
    channel: 'Kunjungan Sales',
    createdAt: Date.now() - 86400000 * 24,
  },
  {
    id: 'TRX-093',
    date: '2026-09-12T16:45',
    partner: 'CV Techno Utama',
    itemType: 'MSI GeForce RTX 4060 VENTUS 2X BLACK 8G OC',
    brand: 'MSI',
    subBrand: 'Ventus',
    category: 'VGA / Graphic Card',
    quantity: 5,
    unit: 'unit',
    unitPrice: 5350000,
    totalAmount: 26750000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Pengadaan warnet esport',
    channel: 'WhatsApp',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'TRX-092',
    date: '2026-09-05T09:30',
    partner: 'Cyber Computer Store',
    itemType: 'AOC 27G2SP 27" 165Hz IPS Gaming Monitor',
    brand: 'AOC',
    subBrand: 'Gaming Series',
    category: 'Monitor',
    quantity: 4,
    unit: 'unit',
    unitPrice: 2450000,
    totalAmount: 9800000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Restock monitor 27 inch',
    channel: 'Toko',
    createdAt: Date.now() - 86400000 * 37,
  },
  {
    id: 'TRX-088',
    date: '2026-08-22T13:20',
    partner: 'Mugen Comp',
    itemType: 'iGame GeForce RTX 4070 Ultra W OC 12GB',
    brand: 'COLORFUL',
    subBrand: 'iGame',
    category: 'VGA / Graphic Card',
    quantity: 3,
    unit: 'unit',
    unitPrice: 12200000,
    totalAmount: 36600000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Promo kemerdekaan Agustus',
    channel: 'WhatsApp',
    createdAt: Date.now() - 86400000 * 50,
  },
  {
    id: 'TRX-087',
    date: '2026-08-15T10:40',
    partner: 'PT Sentra Solusi IT',
    itemType: 'ASUS TUF GAMING X670E-PLUS WIFI',
    brand: 'ASUS',
    subBrand: 'TUF Gaming',
    category: 'Motherboard',
    quantity: 3,
    unit: 'unit',
    unitPrice: 5750000,
    totalAmount: 17250000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Proyek kantor server mini',
    channel: 'Telepon',
    createdAt: Date.now() - 86400000 * 57,
  },
  {
    id: 'TRX-086',
    date: '2026-08-08T15:10',
    partner: 'GT . Global Sinergi',
    itemType: 'Intel Core i5-14400 Box',
    brand: 'INTEL',
    subBrand: 'Core i5',
    category: 'Processor / CPU',
    quantity: 6,
    unit: 'unit',
    unitPrice: 3750000,
    totalAmount: 22500000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Best seller office PC',
    channel: 'WhatsApp',
    createdAt: Date.now() - 86400000 * 64,
  },
  {
    id: 'TRX-080',
    date: '2026-07-25T11:30',
    partner: 'Mega Bintang Komputer',
    itemType: 'MSI MAG FORGE 120A AIRFLOW Casing',
    brand: 'MSI',
    subBrand: 'MAG / Tomahawk',
    category: 'Casing / Chassis',
    quantity: 6,
    unit: 'unit',
    unitPrice: 750000,
    totalAmount: 4500000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Bundle casing + fan',
    channel: 'Kunjungan Sales',
    createdAt: Date.now() - 86400000 * 78,
  },
  {
    id: 'TRX-079',
    date: '2026-07-16T14:00',
    partner: 'Mugen Comp',
    itemType: 'COLORFUL Battle-AX GeForce RTX 3050 NB DUO 6GB-V',
    brand: 'COLORFUL',
    subBrand: 'Battle-AX',
    category: 'VGA / Graphic Card',
    quantity: 5,
    unit: 'unit',
    unitPrice: 3200000,
    totalAmount: 16000000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Entry level budget build',
    channel: 'WhatsApp',
    createdAt: Date.now() - 86400000 * 87,
  },
  {
    id: 'TRX-078',
    date: '2026-07-07T09:15',
    partner: 'CV Techno Utama',
    itemType: 'Philips 241V8B 24" 100Hz IPS Monitor',
    brand: 'PHILIPS',
    subBrand: 'V-Line Office',
    category: 'Monitor',
    quantity: 8,
    unit: 'unit',
    unitPrice: 1250000,
    totalAmount: 10000000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Pengadaan lab sekolah',
    channel: 'Toko',
    createdAt: Date.now() - 86400000 * 96,
  },
  {
    id: 'TRX-071',
    date: '2026-06-21T13:45',
    partner: 'GT . Global Sinergi',
    itemType: 'ASUS Dual GeForce RTX 4060 EVO OC 8GB',
    brand: 'ASUS',
    subBrand: 'Dual Series',
    category: 'VGA / Graphic Card',
    quantity: 4,
    unit: 'unit',
    unitPrice: 5600000,
    totalAmount: 22400000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Restock mid tier',
    channel: 'WhatsApp',
    createdAt: Date.now() - 86400000 * 112,
  },
  {
    id: 'TRX-070',
    date: '2026-06-11T10:00',
    partner: 'Cyber Computer Store',
    itemType: 'Intel Core i7-14700K Box',
    brand: 'INTEL',
    subBrand: 'Core i7',
    category: 'Processor / CPU',
    quantity: 2,
    unit: 'unit',
    unitPrice: 7100000,
    totalAmount: 14200000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Kebutuhan streaming setup',
    channel: 'Toko',
    createdAt: Date.now() - 86400000 * 122,
  },
  {
    id: 'TRX-065',
    date: '2026-05-20T15:20',
    partner: 'Mugen Comp',
    itemType: 'iGame GeForce RTX 4060 Ti Ultra W DUO OC 8GB',
    brand: 'COLORFUL',
    subBrand: 'iGame',
    category: 'VGA / Graphic Card',
    quantity: 3,
    unit: 'unit',
    unitPrice: 7450000,
    totalAmount: 22350000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Pre-order awal Mei',
    channel: 'WhatsApp',
    createdAt: Date.now() - 86400000 * 144,
  },
];

export const SAMPLE_DATA_TEMPLATE: SaleRecord[] = INITIAL_SAMPLE_DATA;

// Exact 4-item order from user prompt 1 (Mugen Comp)
export const MUGEN_COMP_SAMPLE_DATA: Omit<SaleRecord, 'id' | 'createdAt'>[] = [
  {
    date: new Date().toISOString().slice(0, 16),
    partner: 'Mugen Comp',
    itemType: 'iGame GeForce RTX 5080 Ultra W OC 16G-V',
    brand: 'COLORFUL',
    subBrand: 'iGame',
    category: 'VGA / Graphic Card',
    quantity: 1,
    unit: 'unit',
    unitPrice: 30500000,
    totalAmount: 30500000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Batch seri RTX 5080 White Ultra OC',
    channel: 'WhatsApp',
  },
  {
    date: new Date().toISOString().slice(0, 16),
    partner: 'Mugen Comp',
    itemType: 'iGame GeForce RTX 5080 Ultra OC 16G-V (Black)',
    brand: 'COLORFUL',
    subBrand: 'iGame',
    category: 'VGA / Graphic Card',
    quantity: 1,
    unit: 'unit',
    unitPrice: 30500000,
    totalAmount: 30500000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Batch seri RTX 5080 Black Ultra OC',
    channel: 'WhatsApp',
  },
  {
    date: new Date().toISOString().slice(0, 16),
    partner: 'Mugen Comp',
    itemType: 'iGame GeForce RTX 5070 Ultra W OC 12GB-V',
    brand: 'COLORFUL',
    subBrand: 'iGame',
    category: 'VGA / Graphic Card',
    quantity: 2,
    unit: 'unit',
    unitPrice: 15800000,
    totalAmount: 31600000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Batch seri RTX 5070 White Ultra W OC',
    channel: 'WhatsApp',
  },
  {
    date: new Date().toISOString().slice(0, 16),
    partner: 'Mugen Comp',
    itemType: 'COLORFUL RTX 5070 GAMING 12GB-V',
    brand: 'COLORFUL',
    subBrand: 'Gaming',
    category: 'VGA / Graphic Card',
    quantity: 3,
    unit: 'unit',
    unitPrice: 15300000,
    totalAmount: 45900000,
    status: 'selesai',
    paymentStatus: 'lunas',
    notes: 'Batch seri COLORFUL RTX 5070 Gaming',
    channel: 'WhatsApp',
  },
];

export function loadSales(): SaleRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Default to empty array so the workspace starts clean and brand new for user input
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Ensure all records have brand and category
    return parsed.map(r => {
      if (!r.brand || !r.category) {
        const info = classifyHardware(r.itemType);
        return {
          ...r,
          brand: r.brand || info.brand,
          subBrand: r.subBrand || info.subBrand,
          category: r.category || info.category,
        };
      }
      return r;
    });
  } catch (e) {
    console.error('Failed to load sales from storage', e);
    return [];
  }
}

export function saveSales(records: SaleRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save sales to storage', e);
  }
}

/**
 * Resets storage to completely clean / brand new state for refilling
 */
export function clearAllSales(): SaleRecord[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear sales storage', e);
  }
  return [];
}

/**
 * Loads the Mugen Comp order sample for quick testing
 */
export function loadMugenCompDemo(): SaleRecord[] {
  const now = Date.now();
  const records: SaleRecord[] = MUGEN_COMP_SAMPLE_DATA.map((item, idx) => ({
    ...item,
    id: `TRX-${101 + idx}`,
    createdAt: now + idx,
  }));
  saveSales(records);
  return records;
}

/**
 * Resets to the rich multi-month demonstration dataset
 */
export function resetToSampleData(): SaleRecord[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DATA_TEMPLATE));
  return SAMPLE_DATA_TEMPLATE;
}

export function filterAndSortSales(records: SaleRecord[], filter: SalesFilter): SaleRecord[] {
  let list = [...records];

  // Search filter
  if (filter.search.trim()) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      r =>
        r.partner.toLowerCase().includes(q) ||
        r.itemType.toLowerCase().includes(q) ||
        (r.brand && r.brand.toLowerCase().includes(q)) ||
        (r.subBrand && r.subBrand.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        r.id.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q))
    );
  }

  // Date filter
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (filter.dateRange === 'today') {
    list = list.filter(r => r.date.startsWith(todayStr));
  } else if (filter.dateRange === 'last7days') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const minIso = sevenDaysAgo.toISOString().slice(0, 10);
    list = list.filter(r => r.date.slice(0, 10) >= minIso);
  } else if (filter.dateRange === 'thisMonth') {
    const monthStr = now.toISOString().slice(0, 7);
    list = list.filter(r => r.date.startsWith(monthStr));
  } else if (filter.dateRange === 'custom') {
    if (filter.customStartDate) {
      list = list.filter(r => r.date.slice(0, 10) >= filter.customStartDate!);
    }
    if (filter.customEndDate) {
      list = list.filter(r => r.date.slice(0, 10) <= filter.customEndDate!);
    }
  }

  // Brand filter
  if (filter.brand && filter.brand !== 'ALL') {
    list = list.filter(r => (r.brand || '').toLowerCase() === filter.brand.toLowerCase());
  }

  // SubBrand filter
  if (filter.subBrand && filter.subBrand !== 'ALL') {
    list = list.filter(r => (r.subBrand || '').toLowerCase() === filter.subBrand.toLowerCase());
  }

  // Category filter
  if (filter.category && filter.category !== 'ALL') {
    list = list.filter(r => (r.category || '').toLowerCase() === filter.category.toLowerCase());
  }

  // Partner filter
  if (filter.partner && filter.partner !== 'ALL') {
    list = list.filter(r => r.partner.toLowerCase() === filter.partner.toLowerCase());
  }

  // Item type filter
  if (filter.itemType && filter.itemType !== 'ALL') {
    list = list.filter(r => r.itemType.toLowerCase() === filter.itemType.toLowerCase());
  }

  // Status filter
  if (filter.status && filter.status !== 'ALL') {
    list = list.filter(r => r.status === filter.status);
  }

  // Sorting
  list.sort((a, b) => {
    switch (filter.sortBy) {
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'qty-desc':
        return b.quantity - a.quantity;
      case 'qty-asc':
        return a.quantity - b.quantity;
      case 'partner-asc':
        return a.partner.localeCompare(b.partner);
      case 'amount-desc':
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  return list;
}

export function computeBrandSummaries(records: SaleRecord[]): BrandSummary[] {
  const map = new Map<
    string,
    { qty: number; count: number; amount: number; categories: Record<string, number>; subBrands: Record<string, number> }
  >();
  let grandTotalQty = 0;

  records.forEach(r => {
    const brand = r.brand || 'LAINNYA';
    grandTotalQty += r.quantity;

    if (!map.has(brand)) {
      map.set(brand, { qty: 0, count: 0, amount: 0, categories: {}, subBrands: {} });
    }
    const entry = map.get(brand)!;
    entry.qty += r.quantity;
    entry.count += 1;
    entry.amount += r.totalAmount || 0;

    const cat = r.category || 'Lainnya';
    entry.categories[cat] = (entry.categories[cat] || 0) + r.quantity;

    const sub = r.subBrand || 'Standard';
    entry.subBrands[sub] = (entry.subBrands[sub] || 0) + r.quantity;
  });

  const results: BrandSummary[] = [];
  map.forEach((data, brand) => {
    let topCategory = '-';
    let maxCatQty = 0;
    Object.entries(data.categories).forEach(([cat, q]) => {
      if (q > maxCatQty) {
        maxCatQty = q;
        topCategory = cat;
      }
    });

    const percentage = grandTotalQty > 0 ? Math.round((data.qty / grandTotalQty) * 100) : 0;

    results.push({
      brand,
      totalTransactions: data.count,
      totalQty: data.qty,
      totalAmount: data.amount,
      percentage,
      topCategory,
      subBrands: data.subBrands,
    });
  });

  return results.sort((a, b) => b.totalQty - a.totalQty);
}

export function computeCategorySummaries(records: SaleRecord[]): CategorySummary[] {
  const map = new Map<string, { qty: number; count: number; amount: number; brands: Record<string, number> }>();
  let grandTotalQty = 0;

  records.forEach(r => {
    const cat = r.category || 'Aksesoris / Lainnya';
    grandTotalQty += r.quantity;

    if (!map.has(cat)) {
      map.set(cat, { qty: 0, count: 0, amount: 0, brands: {} });
    }
    const entry = map.get(cat)!;
    entry.qty += r.quantity;
    entry.count += 1;
    entry.amount += r.totalAmount || 0;

    const b = r.brand || 'Lainnya';
    entry.brands[b] = (entry.brands[b] || 0) + r.quantity;
  });

  const results: CategorySummary[] = [];
  map.forEach((data, category) => {
    let topBrand = '-';
    let maxBrandQty = 0;
    Object.entries(data.brands).forEach(([b, q]) => {
      if (q > maxBrandQty) {
        maxBrandQty = q;
        topBrand = b;
      }
    });

    const percentage = grandTotalQty > 0 ? Math.round((data.qty / grandTotalQty) * 100) : 0;

    results.push({
      category,
      totalTransactions: data.count,
      totalQty: data.qty,
      totalAmount: data.amount,
      percentage,
      topBrand,
    });
  });

  return results.sort((a, b) => b.totalQty - a.totalQty);
}

export function computePartnerSummaries(records: SaleRecord[]): PartnerSummary[] {
  const map = new Map<string, { qty: number; count: number; amount: number; lastDate: string; items: Record<string, number> }>();

  records.forEach(r => {
    const p = r.partner.trim();
    if (!map.has(p)) {
      map.set(p, { qty: 0, count: 0, amount: 0, lastDate: r.date, items: {} });
    }
    const entry = map.get(p)!;
    entry.qty += r.quantity;
    entry.count += 1;
    entry.amount += r.totalAmount || 0;
    if (new Date(r.date) > new Date(entry.lastDate)) {
      entry.lastDate = r.date;
    }
    entry.items[r.itemType] = (entry.items[r.itemType] || 0) + r.quantity;
  });

  const results: PartnerSummary[] = [];
  map.forEach((data, partner) => {
    let topItem = '-';
    let maxItemQty = 0;
    Object.entries(data.items).forEach(([item, q]) => {
      if (q > maxItemQty) {
        maxItemQty = q;
        topItem = item;
      }
    });

    results.push({
      partner,
      totalTransactions: data.count,
      totalQty: data.qty,
      totalAmount: data.amount,
      lastTransactionDate: data.lastDate,
      topItem,
    });
  });

  return results.sort((a, b) => b.totalQty - a.totalQty);
}

export function computeItemTypeSummaries(records: SaleRecord[]): ItemTypeSummary[] {
  const map = new Map<string, { qty: number; count: number; amount: number; partners: Record<string, number> }>();
  let grandTotalQty = 0;

  records.forEach(r => {
    const item = r.itemType.trim();
    grandTotalQty += r.quantity;
    if (!map.has(item)) {
      map.set(item, { qty: 0, count: 0, amount: 0, partners: {} });
    }
    const entry = map.get(item)!;
    entry.qty += r.quantity;
    entry.count += 1;
    entry.amount += r.totalAmount || 0;
    entry.partners[r.partner] = (entry.partners[r.partner] || 0) + r.quantity;
  });

  const results: ItemTypeSummary[] = [];
  map.forEach((data, itemType) => {
    let topPartner = '-';
    let maxPartnerQty = 0;
    Object.entries(data.partners).forEach(([p, q]) => {
      if (q > maxPartnerQty) {
        maxPartnerQty = q;
        topPartner = p;
      }
    });

    const percentage = grandTotalQty > 0 ? Math.round((data.qty / grandTotalQty) * 100) : 0;

    results.push({
      itemType,
      totalTransactions: data.count,
      totalQty: data.qty,
      totalAmount: data.amount,
      topPartner,
      percentage,
    });
  });

  return results.sort((a, b) => b.totalQty - a.totalQty);
}

export function exportToCSV(records: SaleRecord[], filename = 'data_penjualan_distributor.csv'): void {
  const headers = [
    'No ID',
    'Tanggal & Waktu',
    'Nama Partner',
    'Brand',
    'Sub-Brand / Series',
    'Kategori Komponen',
    'Type Product / Nama Barang',
    'Qty',
    'Satuan',
    'Harga Satuan (Rp)',
    'Total Nominal (Rp)',
    'Status',
    'Metode Bayar',
    'Catatan',
  ];

  const rows = records.map(r => [
    `"${r.id}"`,
    `"${formatDateTimeDisplay(r.date)}"`,
    `"${r.partner.replace(/"/g, '""')}"`,
    `"${(r.brand || '').replace(/"/g, '""')}"`,
    `"${(r.subBrand || '').replace(/"/g, '""')}"`,
    `"${(r.category || '').replace(/"/g, '""')}"`,
    `"${r.itemType.replace(/"/g, '""')}"`,
    r.quantity,
    `"${r.unit}"`,
    r.unitPrice || '',
    r.totalAmount || '',
    `"${r.status}"`,
    `"${r.paymentStatus || 'lunas'}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateWhatsAppReport(records: SaleRecord[], title = 'Laporan Rekap Distributor'): string {
  if (records.length === 0) {
    return `📋 *${title.toUpperCase()}*\n(Belum ada data penjualan tercatat)`;
  }

  const totalQty = records.reduce((sum, r) => sum + r.quantity, 0);
  const totalNominal = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const todayDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let text = `📋 *${title.toUpperCase()}*\n📅 Tanggal: ${todayDate}\n----------------------------------\n`;

  records.slice(0, 25).forEach((r, idx) => {
    const formattedPrice = r.unitPrice ? ` (@ Rp ${r.unitPrice.toLocaleString('id-ID')})` : '';
    const brandInfo = r.brand ? ` [${r.brand} · ${r.category || 'Komponen'}]` : '';
    text += `${idx + 1}. *${r.partner}*\n   📦 ${r.itemType}${brandInfo}\n   Qty: *${r.quantity} ${r.unit}*${formattedPrice}\n`;
  });

  if (records.length > 25) {
    text += `... dan ${records.length - 25} transaksi lainnya\n`;
  }

  text += `----------------------------------\n`;
  text += `📊 *Ringkasan Rekap Data:*\n`;
  text += `• Total Transaksi: *${records.length} transaksi*\n`;
  text += `• Total Barang Terjual: *${totalQty.toLocaleString('id-ID')} unit*\n`;
  if (totalNominal > 0) {
    text += `• Total Nilai Transaksi: *Rp ${totalNominal.toLocaleString('id-ID')}*\n`;
  }
  text += `\n_Dicatat otomatis via Mobile Sales Tracker Distributor_`;

  return text;
}

export function formatRupiah(amount?: number): string {
  if (amount === undefined || amount === null) return '-';
  return 'Rp ' + amount.toLocaleString('id-ID');
}

export function formatDateTimeDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateOnlyDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function computeMonthlySummaries(records: SaleRecord[]): MonthlyPerformanceSummary[] {
  const monthMap = new Map<
    string,
    {
      year: number;
      month: number;
      monthLabel: string;
      totalTransactions: number;
      totalQty: number;
      totalAmount: number;
      brands: Record<string, number>;
      categories: Record<string, number>;
      partners: Record<string, number>;
    }
  >();

  const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  records.forEach(r => {
    let key = '';
    let year = 2026;
    let month = 10;
    try {
      const d = new Date(r.date);
      if (!isNaN(d.getTime())) {
        year = d.getFullYear();
        month = d.getMonth() + 1; // 1-indexed
      } else if (r.date.length >= 7) {
        const parts = r.date.split('-');
        year = parseInt(parts[0], 10) || 2026;
        month = parseInt(parts[1], 10) || 10;
      }
    } catch {
      year = 2026;
      month = 10;
    }

    const monthPadded = String(month).padStart(2, '0');
    key = `${year}-${monthPadded}`;
    const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, {
        year,
        month,
        monthLabel,
        totalTransactions: 0,
        totalQty: 0,
        totalAmount: 0,
        brands: {},
        categories: {},
        partners: {},
      });
    }

    const entry = monthMap.get(key)!;
    entry.totalTransactions += 1;
    entry.totalQty += r.quantity;
    entry.totalAmount += r.totalAmount || 0;

    const brand = r.brand || 'Lainnya';
    entry.brands[brand] = (entry.brands[brand] || 0) + r.quantity;

    const category = r.category || 'Komponen';
    entry.categories[category] = (entry.categories[category] || 0) + r.quantity;

    const partner = r.partner || 'Toko';
    entry.partners[partner] = (entry.partners[partner] || 0) + r.quantity;
  });

  // Sort chronologically ascending
  const sortedKeys = Array.from(monthMap.keys()).sort();

  const results: MonthlyPerformanceSummary[] = [];

  sortedKeys.forEach((key, index) => {
    const data = monthMap.get(key)!;

    // Determine top brand
    let topBrand = '-';
    let maxBrandQty = 0;
    Object.entries(data.brands).forEach(([b, q]) => {
      if (q > maxBrandQty) {
        maxBrandQty = q;
        topBrand = b;
      }
    });

    // Determine top category
    let topCategory = '-';
    let maxCatQty = 0;
    Object.entries(data.categories).forEach(([c, q]) => {
      if (q > maxCatQty) {
        maxCatQty = q;
        topCategory = c;
      }
    });

    // Determine top partner
    let topPartner = '-';
    let maxPartnerQty = 0;
    Object.entries(data.partners).forEach(([p, q]) => {
      if (q > maxPartnerQty) {
        maxPartnerQty = q;
        topPartner = p;
      }
    });

    // Compute month-over-month growth rate if previous month exists
    let growthRateAmount: number | undefined;
    let growthRateQty: number | undefined;

    if (index > 0) {
      const prevKey = sortedKeys[index - 1];
      const prevData = monthMap.get(prevKey)!;
      if (prevData.totalAmount > 0) {
        growthRateAmount = Math.round(((data.totalAmount - prevData.totalAmount) / prevData.totalAmount) * 100);
      }
      if (prevData.totalQty > 0) {
        growthRateQty = Math.round(((data.totalQty - prevData.totalQty) / prevData.totalQty) * 100);
      }
    }

    results.push({
      monthKey: key,
      monthLabel: data.monthLabel,
      year: data.year,
      month: data.month,
      totalTransactions: data.totalTransactions,
      totalQty: data.totalQty,
      totalAmount: data.totalAmount,
      topBrand,
      topCategory,
      topPartner,
      growthRateAmount,
      growthRateQty,
    });
  });

  return results;
}

