import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  MessageCircle,
  Smartphone,
  Check,
  Copy,
  ExternalLink,
  Bot,
  Zap,
  Info,
  ShieldCheck,
  BellRing,
  Code2,
  Share2,
} from 'lucide-react';
import { SaleRecord } from '../types/sales';
import { formatRupiah, generateWhatsAppReport } from '../utils/storage';

interface MessagingIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SaleRecord[];
}

export const MessagingIntegrationModal: React.FC<MessagingIntegrationModalProps> = ({
  isOpen,
  onClose,
  records,
}) => {
  const [activeTab, setActiveTab] = useState<'telegram' | 'whatsapp' | 'gas_script'>('telegram');

  // Telegram settings in localStorage
  const [botToken, setBotToken] = useState(() => localStorage.getItem('tg_bot_token') || '');
  const [chatId, setChatId] = useState(() => localStorage.getItem('tg_chat_id') || '');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; msg?: string }>({
    loading: false,
  });

  // WhatsApp quick send state
  const [waTargetPhone, setWaTargetPhone] = useState('');
  const [waCopied, setWaCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    localStorage.setItem('tg_bot_token', botToken);
  }, [botToken]);

  useEffect(() => {
    localStorage.setItem('tg_chat_id', chatId);
  }, [chatId]);

  if (!isOpen) return null;

  // Calculate today summary for test
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter(r => r.date.startsWith(todayStr));
  const todayQty = todayRecords.reduce((sum, r) => sum + r.quantity, 0);
  const todayNominal = todayRecords.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  // Send real test message to Telegram
  const handleTestTelegram = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setTestStatus({
        loading: false,
        success: false,
        msg: 'Mohon isi Bot Token dan Chat ID Telegram terlebih dahulu.',
      });
      return;
    }

    setTestStatus({ loading: true });

    const messageText =
      `🚀 *TES KONEKSI DISTRIBUTOR SALES PRO*\n\n` +
      `✅ *Status:* Terhubung dengan sukses!\n` +
      `📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n` +
      `📊 *Total Transaksi Hari Ini:* ${todayRecords.length} transaksi (${todayQty} unit)\n` +
      `💰 *Estimasi Omset Hari Ini:* ${formatRupiah(todayNominal)}\n\n` +
      `_Bot ini siap mengirimkan notifikasi penjualan otomatis & menerima input transaksi via chat!_`;

    try {
      const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text: messageText,
          parse_mode: 'Markdown',
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setTestStatus({
          loading: false,
          success: true,
          msg: 'Pesan tes berhasil terkirim ke Telegram! Periksa chat/grup Telegram Anda.',
        });
      } else {
        setTestStatus({
          loading: false,
          success: false,
          msg: `Gagal dari Telegram: ${data.description || 'Token atau Chat ID tidak valid'}`,
        });
      }
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        msg: `Koneksi gagal: ${err.message || 'Cek koneksi internet Anda'}`,
      });
    }
  };

  // Generate WhatsApp Direct URL
  const handleOpenWhatsAppDirect = () => {
    let cleanPhone = waTargetPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const reportText = generateWhatsAppReport(records);
    const encoded = encodeURIComponent(reportText);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
  };

  const copyWhatsAppText = () => {
    const text = generateWhatsAppReport(records);
    navigator.clipboard.writeText(text);
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 2000);
  };

  const telegramGASCode = `// KODE INTEGRASI TELEGRAM BOT DI GOOGLE APPS SCRIPT (script.gs)
var TELEGRAM_BOT_TOKEN = "${botToken || 'PASTE_BOT_TOKEN_DISINI'}";
var TELEGRAM_CHAT_ID = "${chatId || 'PASTE_CHAT_ID_DISINI'}";

/**
 * Kirim Notifikasi Penjualan Baru Otomatis ke Telegram
 */
function sendTelegramNotification(sale) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.includes('PASTE')) return;
  var text = "🔔 *PENJUALAN BARU DICATAT!*\n\n" +
             "🏪 *Partner:* " + (sale.partner || '-') + "\n" +
             "🏷️ *Brand:* " + (sale.brand || '-') + "\n" +
             "📦 *Produk:* " + (sale.itemType || '-') + "\n" +
             "🔢 *Qty:* " + sale.quantity + " " + (sale.unit || 'unit') + "\n" +
             "💰 *Harga Satuan:* Rp " + Number(sale.pricePerUnit || 0).toLocaleString('id-ID') + "\n" +
             "💵 *Total:* Rp " + Number(sale.totalAmount || 0).toLocaleString('id-ID') + "\n" +
             "📅 *Waktu:* " + (sale.date || '-') + "\n" +
             "📌 *Status:* " + (sale.status || 'SELESAI');

  var url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: "Markdown"
    }),
    muteHttpExceptions: true
  });
}

/**
 * Daftarkan Webhook Telegram agar Bot bisa menerima chat & perintah /rekap
 * Jalankan fungsi ini 1x di Apps Script setelah Deploy Web App!
 */
function setTelegramWebhook() {
  var webAppUrl = ScriptApp.getService().getUrl();
  var url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/setWebhook?url=" + encodeURIComponent(webAppUrl);
  var res = UrlFetchApp.fetch(url);
  Logger.log(res.getContentText());
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-slideUp sm:animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Koneksi WhatsApp & Telegram
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  BISA BANGET!
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Notifikasi otomatis, chat bot, dan kirim nota penjualan instan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/40 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('telegram')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'telegram'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Telegram Bot (Gratis & Otomatis)</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp (Share & Gateway)</span>
          </button>
          <button
            onClick={() => setActiveTab('gas_script')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'gas_script'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Script Google Sheets</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-slate-800 text-xs sm:text-sm">
          {/* TAB 1: TELEGRAM */}
          {activeTab === 'telegram' && (
            <div className="space-y-4">
              {/* Highlight Banner */}
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sky-950 text-xs sm:text-sm">
                    Telegram adalah opsi TERMUDAH, 100% GRATIS selamanya, dan tanpa batas kuota!
                  </p>
                  <p className="text-[11px] sm:text-xs text-sky-800 leading-relaxed">
                    Anda bisa membuat Bot sendiri dalam 2 menit. Bot bisa kirim notifikasi penjualan baru ke grup toko, merespons perintah <code className="bg-sky-200/70 px-1 rounded text-sky-900 font-mono">/rekap</code> atau <code className="bg-sky-200/70 px-1 rounded text-sky-900 font-mono">/omset</code>, bahkan mencatat penjualan langsung dari pesan chat Telegram.
                  </p>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Cara Membuat Bot Telegram (Hanya 3 Langkah Mudah):
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
                  <li>
                    Buka Telegram, cari akun resmi <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-600 font-bold underline">@BotFather</a>, lalu ketik <code className="bg-slate-200 px-1 rounded font-mono">/newbot</code>.
                  </li>
                  <li>
                    Beri nama bot Anda (misal: <em>SalesDistributorBot</em>). Anda akan langsung mendapatkan <strong>Bot API Token</strong> (contoh: <code className="text-slate-900 font-mono text-[10px]">123456789:ABCdefGhI...</code>).
                  </li>
                  <li>
                    Untuk mengetahui <strong>Chat ID</strong> Anda atau Grup Toko:
                    <ul className="list-disc list-inside ml-4 mt-1 text-[11px] text-slate-600">
                      <li>Buka bot <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-sky-600 font-medium underline">@userinfobot</a> di Telegram, dia akan langsung menampilkan ID angka Anda (misal: <code className="font-mono">987654321</code>).</li>
                      <li>Jika untuk grup, undang bot Anda ke grup tersebut, lalu jadikan admin.</li>
                    </ul>
                  </li>
                </ol>
              </div>

              {/* Form Input Token & Chat ID */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-sky-600" />
                  Konfigurasi & Uji Coba Langsung (Live Test):
                </h4>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Telegram Bot API Token (dari @BotFather):
                    </label>
                    <input
                      type="text"
                      value={botToken}
                      onChange={e => setBotToken(e.target.value)}
                      placeholder="Contoh: 7123456789:AAFlq... (disimpan di browser Anda)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:border-sky-500 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Telegram Chat ID atau Group ID:
                    </label>
                    <input
                      type="text"
                      value={chatId}
                      onChange={e => setChatId(e.target.value)}
                      placeholder="Contoh: 123456789 atau -100123456789 untuk grup"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:border-sky-500 focus:bg-white outline-none"
                    />
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      onClick={handleTestTelegram}
                      disabled={testStatus.loading}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{testStatus.loading ? 'Mengirim...' : '🚀 Tes Kirim Pesan Sekarang'}</span>
                    </button>
                    <p className="text-[11px] text-slate-500">
                      Mengirim pesan tes langsung dari browser ke Telegram Anda
                    </p>
                  </div>

                  {testStatus.msg && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                        testStatus.success
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {testStatus.success ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{testStatus.msg}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bot Commands Reference */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <p className="font-bold text-slate-800 text-xs">Perintah Bot Telegram yang Didukung:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <strong className="text-sky-700 font-mono">/rekap</strong> atau <strong className="text-sky-700 font-mono">/omset</strong>
                    <p className="text-slate-600 mt-0.5">Meminta laporan ringkas omset & unit terjual hari ini.</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <strong className="text-emerald-700 font-mono">Ketik nama barang & harga</strong>
                    <p className="text-slate-600 mt-0.5">Contoh: <em>iGame RTX 5080 30500000 1unit</em>, bot langsung simpan ke Sheets!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              {/* WhatsApp Option 1: 1-Click Direct Share (No API / 100% Free) */}
              <div className="bg-emerald-50/70 border border-emerald-300/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Metode 1: 1-Klik Kirim Nota & Rekap ke WhatsApp (100% Gratis)
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Tanpa perlu biaya langganan API atau server, langsung membuka WhatsApp dengan format nota siap kirim.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nomor WhatsApp Tujuan (Opsional, kosongkan untuk pilih kontak di WA):
                    </label>
                    <input
                      type="text"
                      value={waTargetPhone}
                      onChange={e => setWaTargetPhone(e.target.value)}
                      placeholder="Contoh: 08123456789 atau 628123456789"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={handleOpenWhatsAppDirect}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka WhatsApp & Kirim Rekap Hari Ini</span>
                    </button>
                    <button
                      onClick={copyWhatsAppText}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      {waCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{waCopied ? 'Teks Disalin!' : 'Salin Teks Nota'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* WhatsApp Option 2: Auto Notification via Gateway (Fonnte / Wablas) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-slate-700" />
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Metode 2: Notifikasi Otomatis ke Grup WA via Gateway (Fonnte)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  WhatsApp resmi (Meta Cloud API) membatasi pesan promosi/notifikasi bisnis berbayar. Namun, di Indonesia cara paling populer dan murah adalah menggunakan gateway seperti <strong>Fonnte (fonnte.com)</strong>:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700">
                  <li>Daftar akun gratis di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline">fonnte.com</a>.</li>
                  <li>Scan QR nomor WhatsApp Anda (bisa nomor toko/pribadi).</li>
                  <li>Salin <strong>API Token Fonnte</strong> Anda dan masukkan ke kode <code className="bg-slate-200 px-1 rounded font-mono">script.gs</code>.</li>
                  <li>Setiap ada penjualan baru dicatat di Web App atau Sheet, Google Apps Script otomatis mengirim pesan ke grup WhatsApp tim sales!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE APPS SCRIPT CODE */}
          {activeTab === 'gas_script' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Kode Integrasi Otomatis untuk Google Apps Script (script.gs)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Kode ini sudah kami sertakan di dalam file <code className="font-mono bg-slate-100 px-1 rounded">script.gs</code> aplikasi!
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(telegramGASCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Disalin!' : 'Salin Kode'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-3.5 bg-slate-950 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 custom-scrollbar border border-slate-800">
                  {telegramGASCode}
                </pre>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">💡 Tips Praktis:</p>
                <p>
                  Jika Anda ingin notifikasi langsung jalan tanpa ribet daftar gateway berbayar, gunakan opsi <strong>Telegram Bot</strong> terlebih dahulu karena 100% instan, gratis, dan stabil!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 hidden sm:inline">
            Distributor Sales Pro • Integrasi Multi-Platform
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer ml-auto"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
