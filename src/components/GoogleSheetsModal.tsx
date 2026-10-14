import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  LogOut,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Code,
  Copy,
  Check,
  Sparkles,
  Send,
  HelpCircle,
  FileCode2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SaleRecord } from '../types/sales';
import {
  initAuth,
  googleSignIn,
  logout,
} from '../utils/googleAuth';
import {
  createSalesSpreadsheet,
  syncToExistingSpreadsheet,
  listUserSpreadsheets,
  importSalesFromSpreadsheet,
  DriveSpreadsheetFile,
} from '../utils/googleSheets';
import { GOOGLE_APPS_SCRIPT_SOURCE } from '../utils/googleAppsScriptCode';
import {
  getSavedWebhookUrl,
  saveWebhookUrl,
  syncSalesViaWebhook,
  fetchSalesViaWebhook,
} from '../utils/googleWebhook';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SaleRecord[];
  onImportData: (importedRecords: SaleRecord[]) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  records,
  onImportData,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'script' | 'webhook' | 'oauth'>('script');

  // Script tab state
  const [copiedScript, setCopiedScript] = useState(false);

  // Webhook tab state
  const [webhookUrl, setWebhookUrl] = useState(() => getSavedWebhookUrl());
  const [isWebhookSyncing, setIsWebhookSyncing] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState<string | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  // OAuth tab state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [sheetTitle, setSheetTitle] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return `Rekap Penjualan Distributor - ${today}`;
  });

  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [recentSheets, setRecentSheets] = useState<DriveSpreadsheetFile[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'oauth') {
      initAuth(
        (u, tok) => {
          setUser(u);
          setToken(tok);
          loadDriveSheets(tok);
        },
        () => {
          setUser(null);
          setToken(null);
        }
      );
    }
  }, [isOpen, activeTab]);

  const loadDriveSheets = async (tok: string) => {
    try {
      const files = await listUserSpreadsheets(tok);
      setRecentSheets(files);
      if (files.length > 0 && !selectedSheetId) {
        setSelectedSheetId(files[0].id);
      }
    } catch (err) {
      console.warn('Could not list drive spreadsheets:', err);
    }
  };

  if (!isOpen) return null;

  // Copy Google Apps Script to clipboard
  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SOURCE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  // Download .gs file
  const handleDownloadGsFile = () => {
    const blob = new Blob([GOOGLE_APPS_SCRIPT_SOURCE], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'distributor_sales_pro.gs';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Webhook Sync
  const handleSyncViaWebhook = async () => {
    if (!webhookUrl.trim()) {
      setWebhookError('Silakan masukkan Web App URL Google Apps Script Anda.');
      return;
    }
    setIsWebhookSyncing(true);
    setWebhookError(null);
    setWebhookMessage(null);
    saveWebhookUrl(webhookUrl);

    try {
      const res = await syncSalesViaWebhook(webhookUrl, records);
      setWebhookMessage(res.message);
    } catch (err: any) {
      setWebhookError(err.message || 'Gagal mengirim data ke Google Sheets.');
    } finally {
      setIsWebhookSyncing(false);
    }
  };

  // Handle Webhook Import
  const handleImportViaWebhook = async () => {
    if (!webhookUrl.trim()) {
      setWebhookError('Silakan masukkan Web App URL Google Apps Script Anda.');
      return;
    }
    setIsWebhookSyncing(true);
    setWebhookError(null);
    setWebhookMessage(null);
    saveWebhookUrl(webhookUrl);

    try {
      const imported = await fetchSalesViaWebhook(webhookUrl);
      if (imported.length === 0) {
        setWebhookError('Tidak ada data transaksi yang ditemukan di Google Sheet.');
      } else {
        onImportData(imported);
        setWebhookMessage(`Berhasil mengimpor ${imported.length} data transaksi dari Google Sheet!`);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      setWebhookError(err.message || 'Gagal mengambil data dari Google Sheets.');
    } finally {
      setIsWebhookSyncing(false);
    }
  };

  // OAuth Sign In
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage('');
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        loadDriveSheets(res.accessToken);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setCreatedUrl(null);
  };

  const handleCreateNewSheet = async () => {
    if (!token) return;
    setIsLoading(true);
    setStatusMessage('Sedang membuat Google Spreadsheet baru & menyalin data...');
    setErrorMessage('');
    try {
      const res = await createSalesSpreadsheet(records, sheetTitle, token);
      setCreatedUrl(res.spreadsheetUrl);
      setStatusMessage(`Berhasil membuat Google Sheet!`);
      loadDriveSheets(token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengekspor ke Google Sheets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSync = async () => {
    if (!token || !selectedSheetId) return;
    setConfirmSyncOpen(false);
    setIsLoading(true);
    setStatusMessage('Sedang memperbarui data ke Google Spreadsheet terpilih...');
    setErrorMessage('');
    try {
      await syncToExistingSpreadsheet(selectedSheetId, records, token);
      setStatusMessage('Data berhasil disinkronkan ke Google Spreadsheet!');
      const target = recentSheets.find(s => s.id === selectedSheetId);
      if (target?.webViewLink) {
        setCreatedUrl(target.webViewLink);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memperbarui Google Spreadsheet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportSheet = async () => {
    if (!token || !selectedSheetId) return;
    setIsLoading(true);
    setStatusMessage('Sedang membaca data dari Google Spreadsheet...');
    setErrorMessage('');
    try {
      const imported = await importSalesFromSpreadsheet(selectedSheetId, token);
      if (imported.length === 0) {
        setErrorMessage('Spreadsheet tidak memiliki data transaksi yang valid.');
      } else {
        onImportData(imported);
        setStatusMessage(`Berhasil mengimpor ${imported.length} data transaksi dari Google Sheets!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengimpor dari Google Sheets.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] animate-slideUp sm:animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Google Sheets & Google Apps Script
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan, rekap bulanan otomatis, dan sinkronisasi cloud
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
        <div className="px-5 pt-3 pb-0 bg-slate-50/50 border-b border-slate-200/70 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('script')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-t-xl border-t border-x flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'script'
                ? 'bg-white text-emerald-800 border-slate-200 border-b-transparent shadow-xs font-bold'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-emerald-600" />
            <span>📜 Script Apps Script (Tinggal Copy)</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-t-xl border-t border-x flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'webhook'
                ? 'bg-white text-emerald-800 border-slate-200 border-b-transparent shadow-xs font-bold'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-blue-600" />
            <span>⚡ Webhook Web App</span>
          </button>

          <button
            onClick={() => setActiveTab('oauth')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-t-xl border-t border-x flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'oauth'
                ? 'bg-white text-emerald-800 border-slate-200 border-b-transparent shadow-xs font-bold'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>🔑 Login Akun Google</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {/* TAB 1: SCRIPT GOOGLE APPS SCRIPT (TINGGAL COPY-PASTE) */}
          {activeTab === 'script' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Highlight Banner */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Script Otomatisasi Google Sheets Siap Pakai</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
                    Kode ini berisi pengaturan header 13 kolom otomatis, format Rupiah, pewarnaan status (Selesai/Pending), rekap bulanan otomatis, menu kustom Google Sheets, dan Webhook API.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      copiedScript
                        ? 'bg-emerald-700 text-white scale-102 ring-2 ring-emerald-400'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white'
                    }`}
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>✓ Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Seluruh Script</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadGsFile}
                    className="p-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    title="Download file .gs"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Step by Step Visual Guide */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <FileCode2 className="w-4 h-4 text-emerald-600" />
                  <span>Langkah Cepat Cara Memasang di Google Sheets:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span className="font-bold text-slate-800">Buka Spreadsheet Baru</span>
                    </div>
                    <p className="text-slate-500 pl-7 text-[11px]">
                      Kunjungi{' '}
                      <a
                        href="https://sheets.new"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-semibold underline inline-flex items-center gap-0.5"
                      >
                        sheets.new <ExternalLink className="w-2.5 h-2.5" />
                      </a>{' '}
                      di browser laptop atau ponsel Anda.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span className="font-bold text-slate-800">Buka Menu Apps Script</span>
                    </div>
                    <p className="text-slate-500 pl-7 text-[11px]">
                      Di menu atas Google Sheets, klik menu: <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span className="font-bold text-slate-800">Tempel (Paste) & Simpan</span>
                    </div>
                    <p className="text-slate-500 pl-7 text-[11px]">
                      Hapus semua kode lama di editor, tekan <strong>Ctrl + V</strong> (Paste), lalu klik ikon Simpan (Ctrl + S).
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        4
                      </span>
                      <span className="font-bold text-slate-800">Refresh Sheet & Gunakan Menu</span>
                    </div>
                    <p className="text-slate-500 pl-7 text-[11px]">
                      Kembali ke tab spreadsheet & refresh. Menu baru <strong>📊 Distributor Sales Pro</strong> siap digunakan!
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Preview Container */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Pratinjau Kode (Code.gs)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ~500 Baris • JavaScript / Apps Script API
                  </span>
                </div>

                <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-inner">
                  <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                      <span className="font-mono text-[11px] text-slate-300 ml-2">google_apps_script.js</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedScript ? 'Disalin' : 'Salin Kode'}</span>
                    </button>
                  </div>

                  <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 sm:max-h-72 overflow-y-auto custom-scrollbar leading-relaxed">
                    {GOOGLE_APPS_SCRIPT_SOURCE}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEBHOOK APPS SCRIPT (TANPA LOGIN, LANGSUNG KIRIM / TARIK) */}
          {activeTab === 'webhook' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Hubungkan Lewat Web App URL Google Apps Script
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jika Anda telah menerapkan (Deploy) script di atas sebagai <strong>Aplikasi Web (Web App)</strong> dengan izin akses <em>"Siapa Saja (Anyone)"</em>, masukkan URL-nya di sini untuk langsung mengirim atau menarik transaksi tanpa perlu login Google di aplikasi.
                </p>
              </div>

              {/* Status messages */}
              {webhookError && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{webhookError}</span>
                </div>
              )}

              {webhookMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{webhookMessage}</span>
                </div>
              )}

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    URL Aplikasi Web Google Apps Script (Berakhiran /exec)
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="w-full px-3 py-2.5 bg-white text-slate-900 text-xs font-mono rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Didapat dari menu: Terapkan (Deploy) &gt; Penerapan baru &gt; Aplikasi Web &gt; Salin URL
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSyncViaWebhook}
                    disabled={isWebhookSyncing}
                    className="w-full sm:flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isWebhookSyncing ? 'Mengirim...' : `Kirim ${records.length} Transaksi ke Sheet`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleImportViaWebhook}
                    disabled={isWebhookSyncing}
                    className="w-full sm:flex-1 py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Tarik Data dari Sheet</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OAUTH DIRECT API */}
          {activeTab === 'oauth' && (
            <div className="space-y-4 animate-fadeIn">
              {!user ? (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Hubungkan ke Google Sheets & Drive
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 max-w-xs mx-auto">
                      Aplikasi akan membuat dan memperbarui spreadsheet penjualan dengan izin resmi dari akun Google Anda.
                    </p>
                  </div>

                  {/* Official Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:scale-98 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>{isLoggingIn ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        {user.email?.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-slate-900 text-xs block leading-tight">
                        {user.displayName || user.email}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Terhubung ke Google Drive
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Keluar"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Feedback messages */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {statusMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {createdUrl && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      Spreadsheet Siap Diakses!
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Data berhasil disinkronkan ke cloud
                    </span>
                  </div>
                  <a
                    href={createdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <span>Buka Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Action 1: Create New Sheet */}
              {user && (
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      1. Buat Google Spreadsheet Baru
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Judul Spreadsheet di Google Drive
                    </label>
                    <input
                      type="text"
                      value={sheetTitle}
                      onChange={e => setSheetTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 text-xs rounded-xl border border-slate-200 outline-none font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateNewSheet}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {isLoading ? 'Menyinkronkan...' : `Ekspor ${records.length} Transaksi ke Sheet Baru`}
                    </span>
                  </button>
                </div>
              )}

              {/* Action 2: Sync to Existing Sheet */}
              {user && recentSheets.length > 0 && (
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      2. Pilih Spreadsheet yang Sudah Ada
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pilih Berkas dari Google Drive Anda
                    </label>
                    <select
                      value={selectedSheetId}
                      onChange={e => setSelectedSheetId(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 text-xs rounded-xl border border-slate-200 outline-none font-medium"
                    >
                      {recentSheets.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmSyncOpen(true)}
                      disabled={isLoading}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                      <span>Perbarui Sheet</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleImportSheet}
                      disabled={isLoading}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>Impor ke App</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmation dialog for OAuth Sheet overwrite */}
        {confirmSyncOpen && (
          <div className="p-4 bg-amber-50 border-t border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Konfirmasi Pembaruan Spreadsheet</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Apakah Anda yakin ingin memperbarui data pada spreadsheet terpilih dengan {records.length} data transaksi saat ini? Data lama di sheet akan digantikan.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmSyncOpen(false)}
                className="px-3 py-1 bg-white border border-amber-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSync}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Ya, Perbarui Sheet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
