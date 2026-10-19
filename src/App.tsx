import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { QuickInputBar } from './components/QuickInputBar';
import { SalesTable } from './components/SalesTable';
import { SalesAnalytics } from './components/SalesAnalytics';
import { SaleFormModal } from './components/SaleFormModal';
import { ExportShareModal } from './components/ExportShareModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { MessagingIntegrationModal } from './components/MessagingIntegrationModal';
import { BottomNav } from './components/BottomNav';
import { SaleRecord, SalesFilter } from './types/sales';
import {
  loadSales,
  saveSales,
  resetToSampleData,
  clearAllSales,
  loadMugenCompDemo,
  formatRupiah,
} from './utils/storage';
import {
  TrendingUp,
  Package,
  Users,
  Smartphone,
  CheckCircle2,
  Calendar,
  Sparkles,
  Trash2,
  FilePlus,
} from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<SaleRecord[]>(() => loadSales());
  const [activeTab, setActiveTab] = useState<'table' | 'analytics'>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<Partial<SaleRecord> | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const [filter, setFilter] = useState<SalesFilter>({
    search: '',
    dateRange: 'all',
    partner: 'ALL',
    brand: 'ALL',
    subBrand: 'ALL',
    category: 'ALL',
    itemType: 'ALL',
    status: 'ALL',
    sortBy: 'date-desc',
  });

  const quickInputRef = useRef<HTMLDivElement>(null);

  // Sync to local storage
  useEffect(() => {
    saveSales(records);
  }, [records]);

  // Unique list of partners & items for autocomplete
  const existingPartners = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.partner));
    return Array.from(set);
  }, [records]);

  const existingItemTypes = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.itemType));
    return Array.from(set);
  }, [records]);

  // Quick stats for today
  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRecords = records.filter(r => r.date.startsWith(todayStr));
    const qty = todayRecords.reduce((sum, r) => sum + r.quantity, 0);
    const amount = todayRecords.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    return {
      count: todayRecords.length,
      qty,
      amount,
    };
  }, [records]);

  // Handlers
  const handleAddSale = (newSale: Omit<SaleRecord, 'id' | 'createdAt'>) => {
    const id = `TRX-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullRecord: SaleRecord = {
      ...newSale,
      id,
      createdAt: Date.now(),
    };
    setRecords(prev => [fullRecord, ...prev]);
  };

  const handleAddBatchSales = (newSales: Omit<SaleRecord, 'id' | 'createdAt'>[]) => {
    const fullRecords: SaleRecord[] = newSales.map((item, idx) => ({
      ...item,
      id: `TRX-${Math.floor(1000 + Math.random() * 9000) + idx}`,
      createdAt: Date.now() + idx,
    }));
    setRecords(prev => [...fullRecords, ...prev]);
  };

  const handleFormSubmit = (saleData: Omit<SaleRecord, 'id' | 'createdAt'>, editId?: string) => {
    if (editId) {
      setRecords(prev =>
        prev.map(r => (r.id === editId ? { ...r, ...saleData } : r))
      );
      showToast(`✅ Revisi berhasil disimpan! Data transaksi partner "${saleData.partner}" telah diperbarui.`);
    } else {
      handleAddSale(saleData);
      showToast(`✅ Catatan penjualan partner "${saleData.partner}" berhasil dicatat!`);
    }
    setEditingId(null);
    setInitialFormData(null);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SaleRecord | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleEditClick = (sale: SaleRecord) => {
    setEditingId(sale.id);
    setInitialFormData(sale);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const target = records.find(r => r.id === id);
    if (!target) return;
    setDeleteTarget(target);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      setRecords(prev => prev.filter(r => r.id !== deleteTarget.id));
      showToast(`Catatan penjualan "${deleteTarget.partner}" berhasil dihapus.`);
      setDeleteTarget(null);
    }
  };

  const handleDuplicateClick = (sale: SaleRecord) => {
    const now = new Date().toISOString().slice(0, 16);
    handleAddSale({
      ...sale,
      date: now,
      notes: `Duplikat order dari ${sale.id}`,
    });
    showToast(`Catatan penjualan dari "${sale.partner}" berhasil diduplikasi ke tanggal sekarang!`);
  };

  const handleResetSample = () => {
    const samples = resetToSampleData();
    setRecords(samples);
    showToast('Data demo simulasi multi-bulan berhasil dimuat!');
  };

  const handleClearAllSales = () => {
    const cleared = clearAllSales();
    setRecords(cleared);
    setIsClearConfirmOpen(false);
    showToast('Lembar kerja berhasil dikosongkan! Siap untuk diisi ulang.');
  };

  const handleLoadMugenComp = () => {
    const demo = loadMugenCompDemo();
    setRecords(demo);
    showToast('Contoh pesanan Mugen Comp (RTX 5080 & 5070) berhasil dicatat ke tabel!');
  };

  const handleImport = (imported: SaleRecord[]) => {
    setRecords(imported);
  };

  const handleScrollToQuickInput = () => {
    if (quickInputRef.current) {
      quickInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Focus the input inside
      const input = quickInputRef.current.querySelector('input');
      input?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-sans pb-24 md:pb-12 antialiased">
      {/* Top Navigation Bar */}
      <Header
        totalRecords={records.length}
        todayCount={todayStats.count}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenForm={() => {
          setEditingId(null);
          setInitialFormData(null);
          setIsFormOpen(true);
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
        onOpenMessaging={() => setIsMessagingOpen(true)}
        onOpenClearModal={() => setIsClearConfirmOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 space-y-4">
        {/* Today Snapshot Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Aplikasi Penjualan Siaga
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Akses Cepat Kapan Saja via Ponsel
            </h2>
            <p className="text-xs text-slate-400">
              Data tersimpan otomatis di perangkat. Tabel diperbarui seketika setiap kali Anda melapor.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 self-start sm:self-auto border border-white/10">
            <div>
              <span className="text-[10px] text-slate-300 block uppercase font-semibold">
                Hari Ini
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-emerald-400">
                {todayStats.count} Transaksi
              </span>
            </div>
            <div className="w-px h-7 bg-white/20"></div>
            <div>
              <span className="text-[10px] text-slate-300 block uppercase font-semibold">
                Qty Terjual
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-white">
                {todayStats.qty.toLocaleString('id-ID')} unit
              </span>
            </div>
          </div>
        </div>

        {/* Quick Input Bar (Text / Voice / Smart Extraction) */}
        <div ref={quickInputRef}>
          <QuickInputBar
            onAddSale={handleAddSale}
            onAddBatchSales={handleAddBatchSales}
            onOpenDetailedForm={data => {
              setEditingId(null);
              setInitialFormData(data || null);
              setIsFormOpen(true);
            }}
            existingPartners={existingPartners}
            existingItemTypes={existingItemTypes}
          />
        </div>

        {/* Content View: Table or Analytics */}
        {activeTab === 'table' ? (
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Format Tabel Data Penjualan
                </h3>
                <p className="text-xs text-slate-500">
                  Data siap dianalisis dengan sorting kolom, pencarian instan, dan filter terperinci.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {records.length} Baris Data
              </span>
            </div>

            <SalesTable
              records={records}
              filter={filter}
              onFilterChange={newF => setFilter(prev => ({ ...prev, ...newF }))}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onDuplicate={handleDuplicateClick}
              onOpenForm={() => {
                setEditingId(null);
                setInitialFormData(null);
                setIsFormOpen(true);
              }}
              onLoadMugenComp={handleLoadMugenComp}
              onLoadSampleData={handleResetSample}
            />
          </div>
        ) : (
          <SalesAnalytics records={records} />
        )}
      </main>

      {/* Sale Add / Edit Modal Drawer */}
      <SaleFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingId(null);
          setInitialFormData(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={initialFormData}
        editingId={editingId}
        existingPartners={existingPartners}
        existingItemTypes={existingItemTypes}
        onDelete={handleDeleteClick}
      />

      {/* Export & WhatsApp Share Modal */}
      <ExportShareModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        records={records}
        onResetSampleData={handleResetSample}
        onClearAllData={handleClearAllSales}
        onImportData={handleImport}
        onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
        onOpenMessaging={() => setIsMessagingOpen(true)}
      />

      {/* Google Sheets Sync & Import Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        records={records}
        onImportData={handleImport}
      />

      {/* WhatsApp & Telegram Messaging Integration Modal */}
      <MessagingIntegrationModal
        isOpen={isMessagingOpen}
        onClose={() => setIsMessagingOpen(false)}
        records={records}
      />

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenForm={() => {
          setEditingId(null);
          setInitialFormData(null);
          setIsFormOpen(true);
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onScrollToQuickInput={handleScrollToQuickInput}
      />

      {/* Floating In-App Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slideDown">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Touch-Friendly Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleIn">
            <h4 className="font-bold text-slate-900 text-base">Hapus Catatan Penjualan?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan menghapus transaksi partner{' '}
              <strong className="text-slate-900">{deleteTarget.partner}</strong> (
              {deleteTarget.itemType} - {deleteTarget.quantity} {deleteTarget.unit}).
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Records / Start Fresh Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Buat Lembar Kerja Baru?</h4>
                <p className="text-xs text-slate-500">Kosongkan data untuk diisi ulang dari awal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Tindakan ini akan <strong>membersihkan seluruh catatan penjualan</strong> yang ada di lembar saat ini, sehingga tabel menjadi baru dan bersih untuk diisi ulang dengan catatan transaksi distributor Anda.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearAllSales}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm shadow-rose-600/30"
              >
                Ya, Kosongkan & Mulai Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
