import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ClipboardPaste,
  FileText,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { parseBatchSalesText, ParsedSaleResult } from '../utils/salesParser';
import { SaleRecord } from '../types/sales';
import { formatRupiah } from '../utils/storage';
import { classifyHardware } from '../utils/hardwareClassifier';

interface QuickInputBarProps {
  onAddSale: (sale: Omit<SaleRecord, 'id' | 'createdAt'>) => void;
  onAddBatchSales?: (sales: Omit<SaleRecord, 'id' | 'createdAt'>[]) => void;
  onOpenDetailedForm: (initialData?: Partial<SaleRecord>) => void;
  existingPartners: string[];
  existingItemTypes: string[];
}

export const QuickInputBar: React.FC<QuickInputBarProps> = ({
  onAddSale,
  onAddBatchSales,
  onOpenDetailedForm,
  existingPartners,
  existingItemTypes,
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedSaleResult[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Speech Recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'id-ID';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Update parsed items in real time
  useEffect(() => {
    if (text.trim().length > 3) {
      const items = parseBatchSalesText(text);
      setParsedItems(items);
    } else {
      setParsedItems([]);
    }
  }, [text]);

  const toggleVoice = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Fitur suara tidak didukung di browser ini. Anda bisa langsung mengetik atau menempelkan format laporan penjualan.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    const items = parsedItems.length > 0 ? parsedItems : parseBatchSalesText(text);
    if (items.length === 0) return;

    const now = new Date();
    const isoString = now.toISOString().slice(0, 16);

    const recordsToAdd = items.map(res => {
      const hw = classifyHardware(res.itemType);
      const finalBrand = res.brand && res.brand !== 'LAINNYA' ? res.brand : hw.brand;
      const finalSubBrand = res.subBrand && res.subBrand !== 'Standard' ? res.subBrand : hw.subBrand;
      const finalCategory = res.category && res.category !== 'Aksesoris / Lainnya' ? res.category : hw.category;

      return {
        date: isoString,
        partner: res.partner,
        itemType: res.itemType,
        brand: finalBrand,
        subBrand: finalSubBrand,
        category: finalCategory,
        quantity: res.quantity,
        unit: res.unit || 'unit',
        unitPrice: res.unitPrice,
        totalAmount: res.totalAmount,
        status: res.status,
        paymentStatus: 'lunas' as const,
        notes: res.notes || `Brand: ${finalBrand} • ${finalCategory}`,
        channel: 'Format Laporan',
      };
    });

    if (recordsToAdd.length > 1 && onAddBatchSales) {
      onAddBatchSales(recordsToAdd);
      setToastMessage(`${recordsToAdd.length} transaksi penjualan berhasil dicatat sekaligus!`);
    } else {
      recordsToAdd.forEach(r => onAddSale(r));
      setToastMessage(
        recordsToAdd.length === 1
          ? `Penjualan ${recordsToAdd[0].partner} (${recordsToAdd[0].brand}: ${recordsToAdd[0].itemType}) berhasil dicatat!`
          : `${recordsToAdd.length} transaksi berhasil dicatat!`
      );
    }

    setText('');
    setParsedItems([]);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
  };

  const handleDetailedEdit = (item: ParsedSaleResult) => {
    const now = new Date();
    const hw = classifyHardware(item.itemType);
    const finalBrand = item.brand && item.brand !== 'LAINNYA' ? item.brand : hw.brand;
    const finalSubBrand = item.subBrand && item.subBrand !== 'Standard' ? item.subBrand : hw.subBrand;
    const finalCategory = item.category && item.category !== 'Aksesoris / Lainnya' ? item.category : hw.category;

    onOpenDetailedForm({
      date: now.toISOString().slice(0, 16),
      partner: item.partner,
      itemType: item.itemType,
      brand: finalBrand,
      subBrand: finalSubBrand,
      category: finalCategory,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalAmount: item.totalAmount,
      status: item.status,
    });
    setText('');
    setParsedItems([]);
  };

  const handleInsertUserTemplate = () => {
    const sample = `GT . Global Sinergi (nama partner)\n\n(type product ) i7-14700F (harga) Rp 5.850.000 (qty)1unit`;
    setText(sample);
  };

  const handleInsertMugenCompTemplate = () => {
    const mugenSample = `Mugen Comp\n\niGame GeForce RTX 5080 Ultra W OC 16G-V  Rp30,500,000 1unit \n\niGame GeForce RTX 5080 Ultra OC 16G-V (Black)  \nRp30,500,000 1unit \n\niGame GeForce RTX 5070 Ultra W OC 12GB-V Rp15,800,000 2unit\n\nCOLORFUL RTX 5070 GAMING 12GB-V Rp15,300,000 3unit`;
    setText(mugenSample);
  };

  const handleInsertMultiItemTemplate = () => {
    const multiSample = `GT . Global Sinergi (nama partner)\n\n(type product ) i7-14700F (harga) Rp 5.850.000 (qty)1unit\n(type product ) RTX 4060 Ti 8GB (harga) Rp 6.250.000 (qty)2unit`;
    setText(multiSample);
  };

  const isMultiLine = text.includes('\n') || text.length > 50;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 mb-6 transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Lapor & Catat Penjualan Otomatis
            </h2>
            <p className="text-xs text-slate-500">
              Tempel / ketik format partner, type product, harga & qty
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {speechSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={isListening ? 'Mendengarkan...' : 'Suara'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-slate-600" />}
              <span className="hidden sm:inline">{isListening ? 'Merekam' : 'Suara'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleInsertUserTemplate}
            className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title="Muat contoh format laporan Anda"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Format Anda</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Line Input Area */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="space-y-2">
          <div className="relative">
            <textarea
              rows={isMultiLine ? 4 : 2}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Format laporan Anda:\nGT . Global Sinergi (nama partner)\n(type product ) i7-14700F (harga) Rp 5.850.000 (qty)1unit`}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 font-mono leading-relaxed"
            />
            {text && (
              <button
                type="button"
                onClick={() => {
                  setText('');
                  setParsedItems([]);
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded bg-slate-200/60 cursor-pointer"
              >
                Bersihkan
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">Contoh format:</span>
              <button
                type="button"
                onClick={handleInsertMugenCompTemplate}
                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border border-emerald-200"
              >
                Mugen Comp (RTX 5080/5070)
              </button>
              <button
                type="button"
                onClick={handleInsertUserTemplate}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
              >
                GT . Global Sinergi (i7)
              </button>
              <button
                type="button"
                onClick={handleInsertMultiItemTemplate}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
              >
                Format Tagged
              </button>
            </div>

            <button
              type="submit"
              disabled={!text.trim()}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              <span>
                {parsedItems.length > 1
                  ? `Catat Semua (${parsedItems.length} Item)`
                  : 'Catat Otomatis'}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Real-time Parsed Preview Cards */}
      {parsedItems.length > 0 && (
        <div className="mt-3.5 p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/80 text-xs sm:text-sm text-slate-800 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Format Terdeteksi ({parsedItems.length} Item Siap Dicatat):
            </span>
            {parsedItems.length === 1 && (
              <button
                type="button"
                onClick={() => handleDetailedEdit(parsedItems[0])}
                className="text-emerald-700 hover:text-emerald-900 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                Edit di Form <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            {parsedItems.map((item, index) => {
              const hw = classifyHardware(item.itemType);
              const displayBrand = item.brand && item.brand !== 'LAINNYA' ? item.brand : hw.brand;
              const displaySubBrand = item.subBrand && item.subBrand !== 'Standard' ? item.subBrand : hw.subBrand;
              const displayCategory = item.category && item.category !== 'Aksesoris / Lainnya' ? item.category : hw.category;

              return (
                <div
                  key={index}
                  className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 py-2.5 px-3 bg-white rounded-xl border border-emerald-100 shadow-2xs items-center"
                >
                  <div className="sm:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Partner / Toko
                    </span>
                    <span className="font-bold text-slate-900 truncate block text-xs">
                      {item.partner}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Produk & Brand Otomatis
                    </span>
                    <span className="font-bold text-slate-900 truncate block text-xs">
                      {item.itemType}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                        Brand: {displayBrand}
                      </span>
                      {displaySubBrand && displaySubBrand !== 'Standard' && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {displaySubBrand}
                        </span>
                      )}
                      {displayCategory && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {displayCategory}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Harga Satuan
                    </span>
                    <span className="font-mono font-semibold text-slate-800 text-xs">
                      {item.unitPrice ? formatRupiah(item.unitPrice) : '—'}
                    </span>
                  </div>

                  <div className="sm:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Qty
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">
                      {item.quantity} {item.unit}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Total
                      </span>
                      <span className="font-mono font-bold text-emerald-800 text-xs sm:text-sm">
                        {formatRupiah(item.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {parsedItems.length > 1 && (
            <div className="mt-2.5 p-2.5 bg-emerald-100/70 rounded-lg flex items-center justify-between text-xs font-bold text-slate-900 border border-emerald-200">
              <span>Akumulasi ({parsedItems.length} Produk):</span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-800 font-mono">
                  {parsedItems.reduce((s, it) => s + it.quantity, 0)} Unit
                </span>
                <span className="font-mono text-slate-900">
                  {formatRupiah(parsedItems.reduce((s, it) => s + (it.totalAmount || 0), 0))}
                </span>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-slate-600 text-[11px] pt-1">
            <span>
              Tekan tombol <strong>"Catat Semua"</strong> untuk langsung memasukkan ke tabel data.
            </span>
            <span className="text-emerald-700 font-semibold">Tersimpan ke tabel otomatis</span>
          </div>
        </div>
      )}

      {/* Success Notification Feedback */}
      {showSuccessToast && (
        <div className="mt-3 p-3 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg shadow-emerald-600/20 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
          <span className="text-xs text-emerald-100 font-mono">ID otomatis diterbitkan</span>
        </div>
      )}
    </div>
  );
};
