import { SaleRecord } from '../types/sales';
import { formatDateTimeDisplay } from './storage';
import { classifyHardware } from './hardwareClassifier';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Creates a new Google Sheet on user's Google Drive and populates it with sales records
 */
export async function createSalesSpreadsheet(
  records: SaleRecord[],
  title: string,
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `Rekap Penjualan Distributor - ${new Date().toISOString().slice(0, 10)}`,
      },
      sheets: [
        {
          properties: {
            title: 'Data Penjualan',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const sheetName = sheetData.sheets?.[0]?.properties?.title || 'Data Penjualan';

  // 2. Prepare headers and rows
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
    'Catatan',
  ];

  const rows = records.map(r => [
    r.id,
    formatDateTimeDisplay(r.date),
    r.partner,
    r.brand || '',
    r.subBrand || '',
    r.category || '',
    r.itemType,
    r.quantity,
    r.unit,
    r.unitPrice || '',
    r.totalAmount || '',
    r.status.toUpperCase(),
    r.notes || '',
  ]);

  const values = [headers, ...rows];

  // 3. Populate rows
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetName
    )}!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal mengisi data ke Google Spreadsheet');
  }

  // 4. Format Header Row (Bold & Emerald Background)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetData.sheets?.[0]?.properties?.sheetId || 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.06, green: 0.6, blue: 0.38 }, // emerald green
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      }),
    });
  } catch (styleErr) {
    console.warn('Styling header optional step failed:', styleErr);
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Updates an existing Google Spreadsheet with current sales records
 */
export async function syncToExistingSpreadsheet(
  spreadsheetId: string,
  records: SaleRecord[],
  accessToken: string
): Promise<void> {
  // First fetch metadata to get first sheet title
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    throw new Error('Gagal mengakses metadata Google Spreadsheet');
  }

  const meta = await metaRes.json();
  const firstSheetName = meta.sheets?.[0]?.properties?.title || 'Sheet1';

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
    'Catatan',
  ];

  const rows = records.map(r => [
    r.id,
    formatDateTimeDisplay(r.date),
    r.partner,
    r.brand || '',
    r.subBrand || '',
    r.category || '',
    r.itemType,
    r.quantity,
    r.unit,
    r.unitPrice || '',
    r.totalAmount || '',
    r.status.toUpperCase(),
    r.notes || '',
  ]);

  const values = [headers, ...rows];

  // Clear existing content and rewrite
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      firstSheetName
    )}!A1:Z1000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      firstSheetName
    )}!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal memperbarui Google Spreadsheet');
  }
}

/**
 * Lists user's recent Google Spreadsheets from Google Drive
 */
export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google.apps.spreadsheet' and trashed=false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime%20desc&pageSize=15&fields=files(id,name,modifiedTime,webViewLink)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal memuat daftar Google Spreadsheet dari Drive');
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Imports sales records from a Google Spreadsheet
 */
export async function importSalesFromSpreadsheet(
  spreadsheetId: string,
  accessToken: string
): Promise<SaleRecord[]> {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    throw new Error('Gagal membuka spreadsheet Google');
  }

  const meta = await metaRes.json();
  const firstSheetName = meta.sheets?.[0]?.properties?.title || 'Sheet1';

  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      firstSheetName
    )}!A1:Z500`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!readRes.ok) {
    throw new Error('Gagal membaca baris data spreadsheet Google');
  }

  const data = await readRes.json();
  const rows: any[][] = data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  // Row 0 is header, rows 1..N are data
  const importedRecords: SaleRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const id = row[0] || `TRX-${1000 + i}`;
    const dateStr = row[1] || new Date().toISOString().slice(0, 16);
    const partner = row[2] || 'Pelanggan Umum';
    const itemType = row[6] || row[3] || 'Komponen';
    const qty = parseFloat(String(row[7]).replace(/[^\d.,]/g, '').replace(',', '.')) || 1;
    const unit = row[8] || 'unit';
    const rawPrice = String(row[9] || '').replace(/[^\d]/g, '');
    const unitPrice = rawPrice ? parseInt(rawPrice, 10) : undefined;
    const totalAmount = unitPrice ? qty * unitPrice : undefined;
    const statusRaw = String(row[11] || '').toLowerCase();
    const status = statusRaw.includes('terkirim')
      ? 'terkirim'
      : statusRaw.includes('pending')
      ? 'pending'
      : 'selesai';
    const notes = row[12] || 'Diimpor dari Google Sheets';

    const info = classifyHardware(itemType);

    importedRecords.push({
      id,
      date: dateStr,
      partner,
      itemType,
      brand: row[3] || info.brand,
      subBrand: row[4] || info.subBrand,
      category: row[5] || info.category,
      quantity: qty,
      unit,
      unitPrice,
      totalAmount,
      status,
      paymentStatus: 'lunas',
      notes,
      channel: 'Google Sheets',
      createdAt: Date.now() - i * 60000,
    });
  }

  return importedRecords;
}
