import { classifyHardware } from './hardwareClassifier';

export interface ParsedSaleResult {
  partner: string;
  itemType: string;
  brand?: string;
  subBrand?: string;
  category?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalAmount?: number;
  notes?: string;
  status: 'selesai' | 'terkirim' | 'pending';
  confidence: 'high' | 'medium' | 'low';
}

const COMMON_UNITS = [
  'unit',
  'pcs',
  'box',
  'dus',
  'karton',
  'sak',
  'karung',
  'kg',
  'liter',
  'pak',
  'pack',
  'bungkus',
  'lusin',
  'rim',
  'set',
  'roll',
  'botol',
  'kaleng',
  'buah',
];

/**
 * Universal Batch Sales Text Parser
 * Handles:
 *
 * Case A (Unstructured Natural / Direct Paste like User):
 * Mugen Comp
 *
 * iGame GeForce RTX 5080 Ultra W OC 16G-V  Rp30,500,000 1unit
 *
 * iGame GeForce RTX 5080 Ultra OC 16G-V (Black)
 * Rp30,500,000 1unit
 *
 * iGame GeForce RTX 5070 Ultra W OC 12GB-V Rp15,800,000 2unit
 *
 * COLORFUL RTX 5070 GAMING 12GB-V Rp15,300,000 3unit
 *
 * Case B (Tagged format):
 * GT . Global Sinergi (nama partner)
 * (type product ) i7-14700F (harga) Rp 5.850.000 (qty)1unit
 */
export function parseBatchSalesText(input: string): ParsedSaleResult[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const rawLines = trimmed
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return [];

  // 1. Identify Partner
  let detectedPartner = 'Pelanggan Umum';
  let startIndex = 0;

  const firstLine = rawLines[0];
  const hasPriceInFirstLine = /(?:rp\.?|@|\(harga\))\s*[\d.,]+/i.test(firstLine);

  if (!hasPriceInFirstLine) {
    // First line is the partner!
    detectedPartner = firstLine
      .replace(/\(nama partner\)/gi, '')
      .replace(/\(partner\)/gi, '')
      .replace(/\(toko\)/gi, '')
      .replace(/\(pelanggan\)/gi, '')
      .trim()
      .replace(/[-:]+$/, '')
      .trim();
    startIndex = 1;
  }

  // 2. Group product lines (handle multi-line where product name is on line N and Price/Qty on line N+1)
  const remainingLines = rawLines.slice(startIndex);
  const groupedProductStrings: string[] = [];

  for (let i = 0; i < remainingLines.length; i++) {
    const currentLine = remainingLines[i];
    const isPriceOnlyLine = /^(?:rp\.?|@|\(harga\))\s*[\d.,]+/i.test(currentLine);

    if (isPriceOnlyLine && groupedProductStrings.length > 0) {
      // Merge with previous line!
      const lastIdx = groupedProductStrings.length - 1;
      groupedProductStrings[lastIdx] = `${groupedProductStrings[lastIdx]} ${currentLine}`;
    } else {
      groupedProductStrings.push(currentLine);
    }
  }

  // 3. Parse each grouped product string
  const results: ParsedSaleResult[] = [];

  for (const itemStr of groupedProductStrings) {
    const parsed = parseSingleProductString(itemStr, detectedPartner);
    if (parsed) {
      results.push(parsed);
    }
  }

  if (results.length > 0) {
    return results;
  }

  // Fallback to single parser
  return [parseSalesText(input)];
}

/**
 * Parses a single product entry with or without tags
 */
export function parseSingleProductString(
  line: string,
  defaultPartner: string
): ParsedSaleResult | null {
  const cleanLine = line.trim();
  if (!cleanLine) return null;

  // A. Try explicit tagged format first:
  // e.g. (type product ) i7-14700F (harga) Rp 5.850.000 (qty)1unit
  const taggedRegex = /(?:\(type\s*product\s*\)|\(tipe\s*produk\s*\)|\(tipe\s*barang\s*\)|\(produk\s*\))?\s*(.*?)\s*(?:\(harga\s*\)|\(price\s*\))\s*(?:rp\.?\s*)?([0-9.,]+)\s*(?:\(qty\s*\)|\(kuantitas\s*\)|\(jumlah\s*\))\s*([0-9.,]+)\s*([a-zA-Z]+)?/i;
  const taggedMatch = cleanLine.match(taggedRegex);

  if (taggedMatch && taggedMatch[1] && taggedMatch[2]) {
    let itemType = taggedMatch[1].trim();
    itemType = itemType
      .replace(/^\(type\s*product\s*\)/i, '')
      .replace(/^\(type\s*barang\s*\)/i, '')
      .replace(/^[:\-]/, '')
      .trim();

    const unitPrice = parseNumericPrice(taggedMatch[2]);
    const quantity = parseFloat(taggedMatch[3].replace(',', '.')) || 1;
    const unit = (taggedMatch[4] || 'unit').toLowerCase();

    const hardwareInfo = classifyHardware(itemType);

    return {
      partner: defaultPartner,
      itemType: itemType || 'Produk',
      brand: hardwareInfo.brand,
      subBrand: hardwareInfo.subBrand,
      category: hardwareInfo.category,
      quantity: Math.max(1, quantity),
      unit,
      unitPrice,
      totalAmount: unitPrice ? quantity * unitPrice : undefined,
      status: 'selesai',
      confidence: 'high',
    };
  }

  // B. Natural format with Price & Qty:
  // e.g. "iGame GeForce RTX 5080 Ultra W OC 16G-V Rp30,500,000 1unit"
  // e.g. "COLORFUL RTX 5070 GAMING 12GB-V Rp15,300,000 3unit"
  const priceRegex = /(?:rp\.?|@)\s*([0-9.,]+(?:\s*(?:k|rb|ribu|jt|juta))?)/i;
  const priceMatch = cleanLine.match(priceRegex);

  const qtyRegex = /(?:\(qty\s*\)|qty|kuantitas|jumlah)?\s*(\d+(?:[.,]\d+)?)\s*(unit|pcs|box|dus|karton|sak|kg|set|pak|pack|buah)\b/i;
  const qtyMatch = cleanLine.match(qtyRegex);

  if (priceMatch || qtyMatch) {
    let itemType = cleanLine;
    let unitPrice: number | undefined;
    let quantity = 1;
    let unit = 'unit';

    if (priceMatch) {
      unitPrice = parseNumericPrice(priceMatch[1]);
      itemType = itemType.replace(priceMatch[0], ' ');
    }

    if (qtyMatch) {
      quantity = parseFloat(qtyMatch[1].replace(',', '.')) || 1;
      if (qtyMatch[2]) {
        unit = qtyMatch[2].toLowerCase();
      }
      itemType = itemType.replace(qtyMatch[0], ' ');
    }

    // Clean leftovers in itemType
    itemType = itemType
      .replace(/\(type\s*product\s*\)/gi, '')
      .replace(/\(type\s*barang\s*\)/gi, '')
      .replace(/\(harga\s*\)/gi, '')
      .replace(/\(qty\s*\)/gi, '')
      .replace(/[\-:]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    const hardwareInfo = classifyHardware(itemType);

    return {
      partner: defaultPartner,
      itemType: itemType || 'Produk',
      brand: hardwareInfo.brand,
      subBrand: hardwareInfo.subBrand,
      category: hardwareInfo.category,
      quantity: Math.max(1, quantity),
      unit,
      unitPrice,
      totalAmount: unitPrice ? quantity * unitPrice : undefined,
      status: 'selesai',
      confidence: 'high',
    };
  }

  // C. Fallback
  const fallbackInfo = classifyHardware(cleanLine);
  return {
    partner: defaultPartner,
    itemType: cleanLine,
    brand: fallbackInfo.brand,
    subBrand: fallbackInfo.subBrand,
    category: fallbackInfo.category,
    quantity: 1,
    unit: 'unit',
    status: 'selesai',
    confidence: 'low',
  };
}

function parseNumericPrice(priceStr: string): number | undefined {
  if (!priceStr) return undefined;
  const raw = priceStr.toLowerCase().trim();

  let multiplier = 1;
  let cleanNumber = raw;

  if (raw.includes('jt') || raw.includes('juta')) {
    multiplier = 1000000;
    cleanNumber = raw.replace(/(jt|juta)/g, '').trim();
  } else if (raw.includes('rb') || raw.includes('ribu') || raw.includes('k')) {
    multiplier = 1000;
    cleanNumber = raw.replace(/(rb|ribu|k)/g, '').trim();
  }

  cleanNumber = cleanNumber.replace(/[,.]/g, '');
  const parsed = parseFloat(cleanNumber);
  if (!isNaN(parsed)) {
    return parsed * multiplier;
  }
  return undefined;
}

export function parseSalesText(input: string): ParsedSaleResult {
  const batch = parseBatchSalesText(input);
  if (batch.length > 0) {
    return batch[0];
  }

  const hardwareInfo = classifyHardware(input);
  return {
    partner: 'Pelanggan Umum',
    itemType: input.trim(),
    brand: hardwareInfo.brand,
    subBrand: hardwareInfo.subBrand,
    category: hardwareInfo.category,
    quantity: 1,
    unit: 'unit',
    status: 'selesai',
    confidence: 'low',
  };
}
