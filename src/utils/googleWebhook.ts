import { SaleRecord } from '../types/sales';

const WEBHOOK_STORAGE_KEY = 'google_apps_script_webhook_url';

export function getSavedWebhookUrl(): string {
  try {
    return localStorage.getItem(WEBHOOK_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveWebhookUrl(url: string): void {
  try {
    localStorage.setItem(WEBHOOK_STORAGE_KEY, url.trim());
  } catch (err) {
    console.warn('Could not save webhook url', err);
  }
}

/**
 * Sends sales records to the deployed Google Apps Script Web App
 */
export async function syncSalesViaWebhook(
  webhookUrl: string,
  records: SaleRecord[]
): Promise<{ status: string; message: string; count?: number }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    throw new Error('Masukkan URL Web App Google Apps Script yang valid (berakhiran /exec)');
  }

  const payload = {
    action: 'syncAll',
    data: records,
  };

  // Google Apps Script Web App redirects 302 to googleusercontent, fetch handles this
  const res = await fetch(webhookUrl, {
    method: 'POST',
    mode: 'no-cors', // standard for GAS webhooks from browser if CORS preflight isn't supported
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  // Note: with mode: 'no-cors', res.type is 'opaque', status is 0, which is normal for Apps Script Web App
  return {
    status: 'success',
    message: `Permintaan sinkronisasi ${records.length} transaksi telah dikirim ke Google Sheets!`,
    count: records.length,
  };
}

/**
 * Fetches sales records from the deployed Google Apps Script Web App
 */
export async function fetchSalesViaWebhook(webhookUrl: string): Promise<SaleRecord[]> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    throw new Error('Masukkan URL Web App Google Apps Script yang valid (berakhiran /exec)');
  }

  const fetchUrl = webhookUrl.includes('?')
    ? `${webhookUrl}&action=getSales`
    : `${webhookUrl}?action=getSales`;

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error(`Gagal menghubungi Web App Google: Status ${res.status}`);
  }

  const json = await res.json();
  if (json.records && Array.isArray(json.records)) {
    return json.records;
  }
  throw new Error('Respon dari Google Apps Script tidak memuat daftar transaksi yang valid.');
}
