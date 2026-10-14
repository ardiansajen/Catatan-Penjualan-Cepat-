import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  FileSpreadsheet,
  Copy,
  Check,
  RefreshCw,
  Upload,
  Database,
  Smartphone,
  Trash2,
  Send,
} from 'lucide-react';
import { SaleRecord } from '../types/sales';
import { exportToCSV, generateWhatsAppReport } from '../utils/storage';

interface ExportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SaleRecord[];
  onResetSampleData: () => void;
  onClearAllData?: () => void;
  onImportData: (importedRecords: SaleRecord[]) => void;
  onOpenGoogleSheets?: () => void;
  onOpenMessaging?: () => void;
}

export const ExportShareModal: React.FC<ExportShareModalProps> = ({
  isOpen,
  onClose,
  records,
  onResetSampleData,
  onClearAllData,
  onImportData,
  onOpenGoogleSheets,
  onOpenMessaging,
}) => {
  const [copiedWA, setCopiedWA] = useState(false);
  const [previewText, setPreviewText] = useState(() => generateWhatsAppReport(records));

  if (!isOpen) return null;

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppReport(records);
    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  const handleExportCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    exportToCSV(records, `laporan_penjualan_${today}.csv`);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_penjualan_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onImportData(json);
          setFeedback({ text: `Berhasil memulihkan ${json.length} data transaksi!` });
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setFeedback({ text: 'Format file JSON tidak sesuai.', isError: true });
        }
      } catch (err) {
        setFeedback({ text: 'Gagal membaca file JSON.', isError: true });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-slideUp sm:animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Ekspor & Bagikan Laporan
              </h3>
              <p className="text-xs text-slate-500">
                Unduh spreadsheet atau sinkronkan langsung ke Google Sheets
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

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.isError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Google Sheets Integration Card */}
          {onOpenGoogleSheets && (
            <div className="p-4 bg-emerald-50/90 border border-emerald-300/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Google Sheets & Google Apps Script
                  </h4>
                  <p className="text-xs text-slate-600">
                    Script otomatisasi tinggal copy-paste, rekap bulanan, dan sinkronisasi cloud
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenGoogleSheets();
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors whitespace-nowrap"
              >
                <span>Buka Script & Sheet</span> ➔
              </button>
            </div>
          )}

          {/* WhatsApp Share Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Laporan Siap Kirim (WhatsApp / Telegram)
                </h4>
              </div>
              <button
                onClick={handleCopyWhatsApp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                {copiedWA ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Salin Pesan
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Format teks rapi dengan partner, brand, komponen, dan kuantitas siap dikirimkan via chat.
            </p>
            <pre className="p-3 bg-white text-[11px] font-mono text-slate-800 rounded-xl border border-slate-200 max-h-28 overflow-y-auto whitespace-pre-wrap custom-scrollbar">
              {generateWhatsAppReport(records)}
            </pre>

            {onOpenMessaging && (
              <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-200/60">
                <span className="text-[11px] text-slate-500">
                  Ingin notifikasi otomatis & bot chat langsung ke grup?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMessaging();
                  }}
                  className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <Send className="w-3 h-3 text-sky-600" />
                  <span>Koneksi Bot Telegram & WA</span>
                </button>
              </div>
            )}
          </div>

          {/* Excel / CSV Download */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Download Format Excel (CSV)</h4>
                <p className="text-xs text-slate-500">
                  Kompatibel dengan Microsoft Excel & Google Sheets
                </p>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" /> Unduh .CSV
            </button>
          </div>

          {/* Backup & Restore JSON */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-700" />
              <h4 className="font-bold text-slate-900 text-sm">Cadangkan Data (Backup & Restore)</h4>
            </div>
            <p className="text-xs text-slate-500">
              Simpan berkas cadangan offline agar data transaksi penjualan Anda selalu aman dan dapat dipindahkan antar perangkat ponsel/laptop.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleDownloadJSON}
                className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Cadangan JSON
              </button>
              <label className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Pulihkan Data
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset & Clear Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            {onClearAllData && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Kosongkan semua transaksi sekarang agar lembar kerja menjadi baru untuk diisi ulang?')) {
                    onClearAllData();
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Kosongkan Data (Mulai Baru)
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm('Kembalikan data ke contoh simulasi awal? Data yang Anda buat akan ditimpa.')) {
                  onResetSampleData();
                  onClose();
                }
              }}
              className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer py-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset ke Data Contoh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
