import React from 'react';
import {
  Plus,
  Table as TableIcon,
  BarChart3,
  Share2,
  Package,
  Smartphone,
  FileSpreadsheet,
  FilePlus,
  Send,
} from 'lucide-react';

interface HeaderProps {
  totalRecords: number;
  todayCount: number;
  activeTab: 'table' | 'analytics';
  onTabChange: (tab: 'table' | 'analytics') => void;
  onOpenForm: () => void;
  onOpenExport: () => void;
  onOpenGoogleSheets: () => void;
  onOpenClearModal: () => void;
  onOpenMessaging?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalRecords,
  todayCount,
  activeTab,
  onTabChange,
  onOpenForm,
  onOpenExport,
  onOpenGoogleSheets,
  onOpenClearModal,
  onOpenMessaging,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-tight">
                Distributor Sales
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                <Smartphone className="w-3 h-3 text-emerald-600" /> Komponen PC
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Rekap otomatis partner, brand, sub-brand & kuantitas
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => onTabChange('table')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabel Data ({totalRecords})</span>
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analisis Brand & Rekap</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mulai Baru / Kosongkan Lembar */}
          <button
            onClick={onOpenClearModal}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Kosongkan data untuk buat lembar baru yang bersih"
          >
            <FilePlus className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Lembar Baru</span>
          </button>

          {/* Google Sheets Sync Button */}
          <button
            onClick={onOpenGoogleSheets}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sinkronisasi ke Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Google Sheets</span>
          </button>

          {/* WA & Telegram Integration Button */}
          {onOpenMessaging && (
            <button
              onClick={onOpenMessaging}
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sambungkan ke WhatsApp atau Telegram"
            >
              <Send className="w-4 h-4 text-sky-600" />
              <span className="hidden md:inline">WA & Telegram</span>
            </button>
          )}

          <button
            onClick={onOpenExport}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ekspor CSV atau Salin ke WhatsApp"
          >
            <Share2 className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline">Ekspor</span>
          </button>

          <button
            onClick={onOpenForm}
            className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Catat Penjualan</span>
            <span className="xs:hidden">Catat</span>
          </button>
        </div>
      </div>
    </header>
  );
};
