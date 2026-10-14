import React from 'react';
import {
  Table as TableIcon,
  BarChart3,
  Share2,
  Plus,
  PenSquare,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: 'table' | 'analytics';
  onTabChange: (tab: 'table' | 'analytics') => void;
  onOpenForm: () => void;
  onOpenExport: () => void;
  onScrollToQuickInput: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenForm,
  onOpenExport,
  onScrollToQuickInput,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe shadow-lg">
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto relative">
        {/* Catat Cepat (Scrolls to top / quick text bar) */}
        <button
          onClick={onScrollToQuickInput}
          className="flex flex-col items-center justify-center p-1.5 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <PenSquare className="w-5 h-5 text-slate-600" />
          <span className="text-[10px] font-medium mt-0.5">Input Cepat</span>
        </button>

        {/* Tabel Data Tab */}
        <button
          onClick={() => onTabChange('table')}
          className={`flex flex-col items-center justify-center p-1.5 transition-colors ${
            activeTab === 'table' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <TableIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Tabel Data</span>
        </button>

        {/* Floating Quick Add Button in Center */}
        <div className="relative -top-4">
          <button
            onClick={onOpenForm}
            className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 border-2 border-white cursor-pointer transition-all"
            title="Tambah Catatan Penjualan"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Analisis Tab */}
        <button
          onClick={() => onTabChange('analytics')}
          className={`flex flex-col items-center justify-center p-1.5 transition-colors ${
            activeTab === 'analytics' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Analisis</span>
        </button>

        {/* Ekspor & WA */}
        <button
          onClick={onOpenExport}
          className="flex flex-col items-center justify-center p-1.5 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Ekspor / WA</span>
        </button>
      </div>
    </div>
  );
};
