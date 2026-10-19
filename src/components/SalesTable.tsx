import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Copy,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  ExternalLink,
  SlidersHorizontal,
  Cpu,
  Layers,
  Sparkles,
  FilePlus2,
  ClipboardList,
  RotateCcw,
  Plus,
  MessageCircle,
} from 'lucide-react';
import { SaleRecord, SalesFilter } from '../types/sales';
import { formatDateTimeDisplay, formatRupiah, filterAndSortSales } from '../utils/storage';
import { KNOWN_BRANDS, KNOWN_CATEGORIES } from '../utils/hardwareClassifier';

interface SalesTableProps {
  records: SaleRecord[];
  filter: SalesFilter;
  onFilterChange: (newFilter: Partial<SalesFilter>) => void;
  onEdit: (sale: SaleRecord) => void;
  onDelete: (id: string) => void;
  onDuplicate: (sale: SaleRecord) => void;
  onOpenForm?: () => void;
  onLoadMugenComp?: () => void;
  onLoadSampleData?: () => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({
  records,
  filter,
  onFilterChange,
  onEdit,
  onDelete,
  onDuplicate,
  onOpenForm,
  onLoadMugenComp,
  onLoadSampleData,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique brands from records + known brands
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.brand) set.add(r.brand);
    });
    // Add known brands if present
    ['COLORFUL', 'ASUS', 'MSI', 'INTEL', 'AOC', 'PHILIPS', 'AMD'].forEach(b => set.add(b));
    return Array.from(set);
  }, [records]);

  // Extract unique categories
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.category) set.add(r.category);
    });
    KNOWN_CATEGORIES.forEach(c => set.add(c));
    return Array.from(set);
  }, [records]);

  // Extract sub-brands available for currently selected brand
  const availableSubBrands = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.subBrand && r.subBrand !== 'Standard') {
        if (filter.brand === 'ALL' || r.brand === filter.brand) {
          set.add(r.subBrand);
        }
      }
    });
    return Array.from(set).sort();
  }, [records, filter.brand]);

  // Extract unique partners
  const uniquePartners = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.partner));
    return Array.from(set).sort();
  }, [records]);

  // Filtered & sorted records
  const filteredRecords = useMemo(() => {
    return filterAndSortSales(records, filter);
  }, [records, filter]);

  // Aggregate totals of filtered records
  const totalFilteredQty = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.quantity, 0);
  }, [filteredRecords]);

  const totalFilteredAmount = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  }, [filteredRecords]);

  const handleSort = (field: 'date' | 'partner' | 'qty' | 'amount') => {
    if (field === 'date') {
      onFilterChange({
        sortBy: filter.sortBy === 'date-desc' ? 'date-asc' : 'date-desc',
      });
    } else if (field === 'partner') {
      onFilterChange({
        sortBy: filter.sortBy === 'partner-asc' ? 'date-desc' : 'partner-asc',
      });
    } else if (field === 'qty') {
      onFilterChange({
        sortBy: filter.sortBy === 'qty-desc' ? 'qty-asc' : 'qty-desc',
      });
    } else if (field === 'amount') {
      onFilterChange({
        sortBy: filter.sortBy === 'amount-desc' ? 'date-desc' : 'amount-desc',
      });
    }
  };

  const copyRowSummary = (sale: SaleRecord) => {
    const text = `Partner: ${sale.partner} | Brand: ${sale.brand || '-'} | Produk: ${sale.itemType} | Qty: ${sale.quantity} ${sale.unit} | Harga: ${formatRupiah(sale.unitPrice)} | Total: ${formatRupiah(sale.totalAmount)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(sale.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendSaleViaWhatsApp = (sale: SaleRecord) => {
    const text =
      `*NOTA PENJUALAN*\n\n` +
      `🏪 *Partner/Toko:* ${sale.partner}\n` +
      `🏷️ *Brand:* ${sale.brand || '-'}\n` +
      `📦 *Produk:* ${sale.itemType}\n` +
      `🔢 *Jumlah:* ${sale.quantity} ${sale.unit}\n` +
      `💰 *Harga Satuan:* ${formatRupiah(sale.unitPrice)}\n` +
      `💵 *Total Tagihan:* ${formatRupiah(sale.totalAmount)}\n` +
      `📅 *Tanggal:* ${formatDateTimeDisplay(sale.date)}\n` +
      `📌 *Status:* ${sale.status.toUpperCase()}\n` +
      (sale.notes ? `📝 *Catatan:* ${sale.notes}\n\n` : `\n`) +
      `_Terima kasih atas pesanannya!_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getStatusBadge = (status: SaleRecord['status']) => {
    switch (status) {
      case 'selesai':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
          </span>
        );
      case 'terkirim':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50">
            <Truck className="w-3 h-3 text-blue-600" /> Terkirim
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
            <Clock className="w-3 h-3 text-amber-600" /> Pending
          </span>
        );
      case 'dibatalkan':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/50">
            <XCircle className="w-3 h-3 text-rose-600" /> Batal
          </span>
        );
      default:
        return <span className="text-xs text-slate-600 capitalize">{status}</span>;
    }
  };

  const hasActiveDistributorFilter =
    filter.brand !== 'ALL' ||
    filter.subBrand !== 'ALL' ||
    filter.category !== 'ALL' ||
    filter.partner !== 'ALL' ||
    filter.status !== 'ALL';

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
      {/* Table Controls & Filter Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter.search}
              onChange={e => onFilterChange({ search: e.target.value })}
              placeholder="Cari brand (MSI, Asus, Colorful), tipe komponen (VGA, mobo, monitor), partner..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 font-medium"
            />
            {filter.search && (
              <button
                onClick={() => onFilterChange({ search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Actions: Filter Toggle & View Switch */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showFilterDrawer || hasActiveDistributorFilter
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter Lengkap</span>
              {hasActiveDistributorFilter && (
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              )}
            </button>

            {/* View Mode Toggle: Table vs Cards */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Tabel Spreadsheet"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Kartu Ringkas (Mobile)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kartu</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1-Tap Quick Brand Filter Pills (High Mobility for Distributor) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          <span className="text-slate-400 font-semibold text-[11px] whitespace-nowrap mr-1 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-emerald-600" /> Filter Brand:
          </span>
          <button
            onClick={() => onFilterChange({ brand: 'ALL', subBrand: 'ALL' })}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              filter.brand === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Brand
          </button>
          {['COLORFUL', 'MSI', 'ASUS', 'INTEL', 'AOC', 'PHILIPS', 'AMD', 'GIGABYTE'].map(brandName => (
            <button
              key={brandName}
              onClick={() =>
                onFilterChange({
                  brand: filter.brand === brandName ? 'ALL' : brandName,
                  subBrand: 'ALL',
                })
              }
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter.brand === brandName
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {brandName}
            </button>
          ))}
        </div>

        {/* Extended Filter Drawer (Brand, Sub-Brand, Kategori, Partner, Status) */}
        {showFilterDrawer && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fadeIn">
            {/* Filter Brand */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Brand / Merek
              </label>
              <select
                value={filter.brand}
                onChange={e => onFilterChange({ brand: e.target.value, subBrand: 'ALL' })}
                className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs rounded-xl border border-slate-200 outline-none font-medium"
              >
                <option value="ALL">Semua Brand</option>
                {availableBrands.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Sub-Brand / Series */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Sub-Brand / Series {filter.brand !== 'ALL' && `(${filter.brand})`}
              </label>
              <select
                value={filter.subBrand}
                onChange={e => onFilterChange({ subBrand: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs rounded-xl border border-slate-200 outline-none font-medium"
              >
                <option value="ALL">Semua Sub-Brand / Series</option>
                {availableSubBrands.map(sb => (
                  <option key={sb} value={sb}>
                    {sb}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kategori Komponen */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Kategori Komponen
              </label>
              <select
                value={filter.category}
                onChange={e => onFilterChange({ category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs rounded-xl border border-slate-200 outline-none font-medium"
              >
                <option value="ALL">Semua Kategori (VGA, Mobo, Proci...)</option>
                {availableCategories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Partner */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Partner / Toko
              </label>
              <select
                value={filter.partner}
                onChange={e => onFilterChange({ partner: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs rounded-xl border border-slate-200 outline-none font-medium"
              >
                <option value="ALL">Semua Partner</option>
                {uniquePartners.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Status Order
              </label>
              <select
                value={filter.status}
                onChange={e => onFilterChange({ status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs rounded-xl border border-slate-200 outline-none font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="selesai">Selesai</option>
                <option value="terkirim">Terkirim</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Periode Waktu */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Periode Waktu
              </label>
              <select
                value={filter.dateRange}
                onChange={e => onFilterChange({ dateRange: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs rounded-xl border border-slate-200 outline-none font-medium"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
                <option value="last7days">7 Hari Terakhir</option>
                <option value="thisMonth">Bulan Ini</option>
              </select>
            </div>

            {hasActiveDistributorFilter && (
              <div className="sm:col-span-2 lg:col-span-2 flex items-center justify-end pt-3">
                <button
                  onClick={() =>
                    onFilterChange({
                      brand: 'ALL',
                      subBrand: 'ALL',
                      category: 'ALL',
                      partner: 'ALL',
                      status: 'ALL',
                      search: '',
                      dateRange: 'all',
                    })
                  }
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content: Table View or Cards View */}
      {records.length === 0 ? (
        <div className="py-12 px-4 sm:px-8 text-center max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
            <FilePlus2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> Lembar Baru Siap Diisi
            </div>
            <h4 className="font-extrabold text-slate-900 text-lg sm:text-xl">
              Lembar Catatan Penjualan Masih Bersih
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Tabel siap untuk diisi ulang dengan pesanan nyata distributor Anda. Gunakan form pencatatan, tempel pesan chat WhatsApp di bar atas, atau coba langsung dengan contoh data pesanan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            {onOpenForm && (
              <button
                type="button"
                onClick={onOpenForm}
                className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-white">Input Transaksi Baru</span>
                  <span className="text-[11px] text-emerald-100 block">Buka form partner, produk, & harga</span>
                </div>
              </button>
            )}

            {onLoadMugenComp && (
              <button
                type="button"
                onClick={onLoadMugenComp}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-white">Isi Contoh Mugen Comp</span>
                  <span className="text-[11px] text-slate-300 block">4 Item RTX 5080 & 5070</span>
                </div>
              </button>
            )}
          </div>

          {onLoadSampleData && (
            <div className="pt-2 flex items-center justify-center gap-4 text-xs">
              <button
                type="button"
                onClick={onLoadSampleData}
                className="hover:text-slate-900 font-semibold inline-flex items-center gap-1.5 cursor-pointer underline text-slate-500"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Muat Sampel Multi-Bulan (Demo Analisis Lengkap)
              </button>
            </div>
          )}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm sm:text-base">
            Tidak ada transaksi komponen yang cocok
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Coba pilih "Semua Brand" atau ubah filter kategori komponen untuk melihat data distributor lainnya.
          </p>
          <button
            type="button"
            onClick={() =>
              onFilterChange({
                brand: 'ALL',
                subBrand: 'ALL',
                category: 'ALL',
                partner: 'ALL',
                status: 'ALL',
                search: '',
                dateRange: 'all',
              })
            }
            className="mt-3 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Full Spreadsheet Analysis Table View */
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200/80 text-[11px] sm:text-xs tracking-wide uppercase">
                <th className="py-3 px-3 w-10 text-center text-slate-400">#</th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal & Waktu</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('partner')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Partner / Toko</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3.5">Rincian Komponen & Brand</th>
                <th className="py-3 px-3.5 text-right">Harga Satuan</th>
                <th
                  onClick={() => handleSort('qty')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Qty</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('amount')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Nominal</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center w-40">Aksi (Revisi / Hapus)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((sale, index) => (
                <tr
                  key={sale.id}
                  className="hover:bg-slate-50/70 transition-colors group text-slate-700"
                >
                  <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                    {index + 1}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-800">
                    {formatDateTimeDisplay(sale.date)}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {sale.partner}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-bold text-slate-900 block">{sale.itemType}</span>
                    {/* Unboxed Brand, Sub-Brand, and Category Metadata */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 font-medium">
                      {sale.brand && (
                        <span className="text-emerald-700 font-bold">{sale.brand}</span>
                      )}
                      {sale.subBrand && sale.subBrand !== 'Standard' && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-slate-700">{sale.subBrand}</span>
                        </>
                      )}
                      {sale.category && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-slate-500">{sale.category}</span>
                        </>
                      )}
                    </div>
                    {sale.notes && (
                      <span className="block text-[11px] text-slate-400 italic truncate max-w-xs mt-0.5">
                        {sale.notes}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono text-slate-700">
                    {sale.unitPrice ? formatRupiah(sale.unitPrice) : '—'}
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <span className="font-mono font-bold text-emerald-700 text-sm sm:text-base">
                      {sale.quantity.toLocaleString('id-ID')}
                    </span>{' '}
                    <span className="text-xs text-slate-500 font-medium">{sale.unit}</span>
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                    {sale.totalAmount ? formatRupiah(sale.totalAmount) : '—'}
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    {getStatusBadge(sale.status)}
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onEdit(sale)}
                        className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Revisi / Ubah Data Transaksi Ini (Klik untuk mengedit)"
                      >
                        <Edit2 className="w-3 h-3 text-amber-700" />
                        <span>Revisi</span>
                      </button>
                      <button
                        onClick={() => onDelete(sale.id)}
                        className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Hapus Transaksi Ini (Jika Ada Kesalahan)"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Hapus</span>
                      </button>
                      <button
                        onClick={() => sendSaleViaWhatsApp(sale)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Kirim Nota ke WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicate(sale)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Catat Ulang (Repeat Order)"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => copyRowSummary(sale)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Salin Rincian"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Summary Footer */}
            <tfoot>
              <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-200">
                <td colSpan={5} className="py-3.5 px-3.5 text-right text-xs uppercase tracking-wide">
                  Total Rekap Terfilter ({filteredRecords.length} Transaksi):
                </td>
                <td className="py-3.5 px-3.5 text-right text-emerald-800 font-mono text-sm sm:text-base">
                  {totalFilteredQty.toLocaleString('id-ID')} unit
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono text-sm sm:text-base">
                  {totalFilteredAmount > 0 ? formatRupiah(totalFilteredAmount) : '—'}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* Mobile Ergonomic Cards View (1-Thumb Friendly) */
        <div className="p-3 sm:p-4 grid grid-cols-1 gap-2.5">
          {filteredRecords.map(sale => (
            <div
              key={sale.id}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-all shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {sale.partner}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {formatDateTimeDisplay(sale.date)}
                  </p>
                </div>
                {getStatusBadge(sale.status)}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg mb-2.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{sale.itemType}</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      {sale.brand && (
                        <span className="text-emerald-700 font-bold">{sale.brand}</span>
                      )}
                      {sale.subBrand && sale.subBrand !== 'Standard' && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-slate-600">{sale.subBrand}</span>
                        </>
                      )}
                      {sale.category && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-slate-500">{sale.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Qty</span>
                    <span className="font-mono font-bold text-emerald-700 text-base">
                      {sale.quantity.toLocaleString('id-ID')}{' '}
                      <span className="text-xs font-normal text-slate-600">{sale.unit}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Harga Satuan:</span>
                    <span className="font-mono font-medium text-slate-700">
                      {sale.unitPrice ? formatRupiah(sale.unitPrice) : '—'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Total Nominal:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {sale.totalAmount ? formatRupiah(sale.totalAmount) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {sale.notes && (
                <p className="text-xs text-slate-500 italic mb-2.5 px-1">
                  "{sale.notes}"
                </p>
              )}

              {/* Action buttons on card */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">ID: {sale.id}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => sendSaleViaWhatsApp(sale)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs"
                    title="Kirim Nota ke WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => copyRowSummary(sale)}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs"
                    title="Salin"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDuplicate(sale)}
                    className="px-2 py-1 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Pesan Ulang
                  </button>
                  <button
                    onClick={() => onEdit(sale)}
                    className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Revisi Data Transaksi"
                  >
                    <Edit2 className="w-3 h-3 text-amber-700" />
                    <span>Revisi</span>
                  </button>
                  <button
                    onClick={() => onDelete(sale.id)}
                    className="px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Hapus Transaksi"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Mobile Total Bar */}
          <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900 mt-2">
            <span>Total Rekap Terfilter ({filteredRecords.length} data):</span>
            <span className="text-emerald-800 text-sm font-mono">
              {totalFilteredQty.toLocaleString('id-ID')} unit
            </span>
          </div>
        </div>
      )}

      {/* Copy Toast Indicator */}
      {copiedId && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3.5 py-2 rounded-full shadow-lg z-50">
          Rincian disalin ke clipboard!
        </div>
      )}
    </div>
  );
};
