import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Minus, Building2, Package, Hash, DollarSign, Calendar, Clock, FileText, ChevronRight } from 'lucide-react';
import { SaleRecord } from '../types/sales';
import { formatRupiah } from '../utils/storage';
import { classifyHardware, KNOWN_BRANDS, KNOWN_CATEGORIES } from '../utils/hardwareClassifier';

interface SaleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sale: Omit<SaleRecord, 'id' | 'createdAt'>, editingId?: string) => void;
  initialData?: Partial<SaleRecord> | null;
  editingId?: string | null;
  existingPartners: string[];
  existingItemTypes: string[];
}

const COMMON_UNITS = [
  'unit',
  'pcs',
  'box',
  'set',
  'karton',
  'sak',
  'kg',
  'pak',
];

export const SaleFormModal: React.FC<SaleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  editingId,
  existingPartners,
  existingItemTypes,
}) => {
  const [partner, setPartner] = useState('');
  const [itemType, setItemType] = useState('');
  const [brand, setBrand] = useState('COLORFUL');
  const [subBrand, setSubBrand] = useState('Standard');
  const [category, setCategory] = useState('VGA / Graphic Card');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('unit');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'selesai' | 'terkirim' | 'pending' | 'dibatalkan'>('selesai');
  const [paymentStatus, setPaymentStatus] = useState<'lunas' | 'tempo' | 'belum_bayar'>('lunas');
  const [notes, setNotes] = useState('');
  const [channel, setChannel] = useState('WhatsApp');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const defaultDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

      if (initialData) {
        setPartner(initialData.partner || '');
        setItemType(initialData.itemType || '');
        setBrand(initialData.brand || 'COLORFUL');
        setSubBrand(initialData.subBrand || 'Standard');
        setCategory(initialData.category || 'VGA / Graphic Card');
        setQuantity(initialData.quantity || 1);
        setUnit(initialData.unit || 'unit');
        setUnitPrice(initialData.unitPrice ? initialData.unitPrice.toString() : '');
        setDate(initialData.date || defaultDate);
        setStatus(initialData.status || 'selesai');
        setPaymentStatus(initialData.paymentStatus || 'lunas');
        setNotes(initialData.notes || '');
        setChannel(initialData.channel || 'WhatsApp');
      } else {
        setPartner('');
        setItemType('');
        setBrand('COLORFUL');
        setSubBrand('Standard');
        setCategory('VGA / Graphic Card');
        setQuantity(1);
        setUnit('unit');
        setUnitPrice('');
        setDate(defaultDate);
        setStatus('selesai');
        setPaymentStatus('lunas');
        setNotes('');
        setChannel('WhatsApp');
      }
    }
  }, [isOpen, initialData]);

  // Auto-detect brand & category when itemType is typed
  const handleItemTypeChange = (val: string) => {
    setItemType(val);
    if (val.trim().length > 2) {
      const detected = classifyHardware(val);
      if (detected.brand !== 'LAINNYA') {
        setBrand(detected.brand);
        setSubBrand(detected.subBrand);
      }
      if (detected.category !== 'Aksesoris / Lainnya') {
        setCategory(detected.category);
      }
    }
  };

  if (!isOpen) return null;

  const parsedPrice = unitPrice ? parseFloat(unitPrice.replace(/[^\d]/g, '')) : undefined;
  const calculatedTotal = parsedPrice ? quantity * parsedPrice : undefined;

  const handleQtyAdjust = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner.trim()) {
      alert('Mohon isi nama partner / pelanggan!');
      return;
    }
    if (!itemType.trim()) {
      alert('Mohon isi jenis / nama tipe barang!');
      return;
    }
    if (quantity <= 0) {
      alert('Jumlah (Qty) minimal 1!');
      return;
    }

    const hardwareInfo = classifyHardware(itemType.trim());

    onSubmit(
      {
        date: date || new Date().toISOString().slice(0, 16),
        partner: partner.trim(),
        itemType: itemType.trim(),
        brand: brand || hardwareInfo.brand,
        subBrand: subBrand || hardwareInfo.subBrand,
        category: category || hardwareInfo.category,
        quantity: Math.max(1, quantity),
        unit: unit.trim() || 'unit',
        unitPrice: parsedPrice,
        totalAmount: calculatedTotal,
        status,
        paymentStatus,
        notes: notes.trim(),
        channel,
      },
      editingId || undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-slideUp sm:animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              {editingId ? '✎' : '+'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingId ? 'Ubah Catatan Penjualan' : 'Form Lapor Penjualan Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi partner, tipe barang, dan jumlah kuantitas
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {/* Tanggal & Waktu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal & Jam Transaksi
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              required
            />
          </div>

          {/* Nama Partner */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Nama Partner / Toko / Pelanggan *
              </label>
            </div>
            <input
              type="text"
              value={partner}
              onChange={e => setPartner(e.target.value)}
              placeholder="Contoh: GT . Global Sinergi / Mega Bintang Komputer"
              className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-slate-900 text-sm font-medium rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              required
            />
            {/* Quick Partner chips */}
            {existingPartners.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                <span className="text-[11px] text-slate-400">Pernah dicatat:</span>
                {existingPartners.slice(0, 4).map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPartner(p)}
                    className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-md transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tipe Barang */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" /> Type Product / Tipe Barang *
              </label>
            </div>
            <input
              type="text"
              value={itemType}
              onChange={e => handleItemTypeChange(e.target.value)}
              placeholder="Contoh: iGame RTX 5080 / TUF B760 / i7-14700F"
              className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-slate-900 text-sm font-medium rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              required
            />
            {/* Quick Item chips */}
            {existingItemTypes.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                <span className="text-[11px] text-slate-400">Paling sering:</span>
                {existingItemTypes.slice(0, 4).map((it, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleItemTypeChange(it)}
                    className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-md transition-colors cursor-pointer"
                  >
                    {it}
                  </button>
                ))}
              </div>
            )}

            {/* Auto-detected notification banner */}
            {itemType.trim().length > 2 && (
              <div className="mt-2 py-1 px-2.5 bg-emerald-50 rounded-lg border border-emerald-200/80 flex items-center justify-between text-[11px] text-emerald-800">
                <span className="flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Terdeteksi Otomatis:
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {brand} {subBrand !== 'Standard' ? `(${subBrand})` : ''} • {category}
                </span>
              </div>
            )}

            {/* Brand & Category classification grid */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Brand (Otomatis)
                </label>
                <select
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 text-slate-900 text-xs rounded-lg border border-slate-200 outline-none font-semibold"
                >
                  {KNOWN_BRANDS.map(b => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Kategori Komponen
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 text-slate-900 text-xs rounded-lg border border-slate-200 outline-none font-medium"
                >
                  {KNOWN_CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Qty & Satuan (Ergonomic for High Mobile Use) */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
            <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-600" /> Jumlah (Qty) & Satuan Barang *
            </label>

            <div className="grid grid-cols-12 gap-2 items-center">
              {/* Stepper Input */}
              <div className="col-span-7 flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleQtyAdjust(-1)}
                  className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center font-bold text-base transition-all cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full text-center font-bold text-base text-slate-900 bg-transparent outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleQtyAdjust(1)}
                  className="w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center font-bold text-base transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Unit Selector */}
              <div className="col-span-5">
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white text-slate-900 text-sm font-medium rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                >
                  {COMMON_UNITS.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Quick Touch Stepper Shortcuts */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Tambah cepat:</span>
              {[+5, +10, +50, +100].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQtyAdjust(val)}
                  className="px-2 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Harga Satuan & Total (Opsional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Harga Satuan (Rp)
                <span className="text-[10px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={unitPrice}
                onChange={e => {
                  const val = e.target.value.replace(/[^\d]/g, '');
                  setUnitPrice(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                }}
                placeholder="Misal: 50.000"
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Estimasi Penjualan
              </label>
              <div className="px-3.5 py-2.5 bg-slate-100 rounded-xl text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>{calculatedTotal ? formatRupiah(calculatedTotal) : '—'}</span>
                {calculatedTotal && (
                  <span className="text-[10px] text-emerald-600 font-medium">Otomatis dihitung</span>
                )}
              </div>
            </div>
          </div>

          {/* Status & Channel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Order</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none font-medium"
              >
                <option value="selesai">Selesai (Lunas/Diterima)</option>
                <option value="terkirim">Terkirim (Dalam Perjalanan)</option>
                <option value="pending">Pending (Menunggu)</option>
                <option value="dibatalkan">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kanal Penjualan</label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none font-medium"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Kunjungan Sales">Kunjungan Sales</option>
                <option value="Toko">Toko / Gerai</option>
                <option value="Telepon">Telepon</option>
                <option value="Marketplace">Marketplace / Online</option>
              </select>
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Catatan Tambahan (opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Titip di satpam / kirim armada truk pagi"
              className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-200 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingId ? 'Simpan Perubahan' : 'Catat Penjualan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
