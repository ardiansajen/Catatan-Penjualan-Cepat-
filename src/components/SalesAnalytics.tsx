import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  BadgeDollarSign,
  BarChart3,
  Calendar,
  Layers,
  Cpu,
  Monitor,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
} from 'recharts';
import { SaleRecord } from '../types/sales';
import {
  computePartnerSummaries,
  computeBrandSummaries,
  computeCategorySummaries,
  computeMonthlySummaries,
  formatRupiah,
} from '../utils/storage';

interface SalesAnalyticsProps {
  records: SaleRecord[];
}

export const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ records }) => {
  const [period, setPeriod] = useState<'all' | 'today' | 'last7days' | 'thisMonth'>('all');
  const [activeAnalysisView, setActiveAnalysisView] = useState<'monthly' | 'brand' | 'category' | 'partner'>('monthly');
  const [chartMetric, setChartMetric] = useState<'both' | 'amount' | 'qty'>('both');

  // Filter records by period for standard tabs
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (period === 'today') {
      return records.filter(r => r.date.startsWith(todayStr));
    }
    if (period === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const minIso = sevenDaysAgo.toISOString().slice(0, 10);
      return records.filter(r => r.date.slice(0, 10) >= minIso);
    }
    if (period === 'thisMonth') {
      const monthStr = now.toISOString().slice(0, 7);
      return records.filter(r => r.date.startsWith(monthStr));
    }
    return records;
  }, [records, period]);

  // Overall statistics for current period
  const totalTransactions = filteredRecords.length;
  const totalQty = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.quantity, 0), [filteredRecords]);
  const totalAmount = useMemo(() => filteredRecords.reduce((sum, r) => sum + (r.totalAmount || 0), 0), [filteredRecords]);

  // Monthly performance summaries across all historical data
  const monthlySummaries = useMemo(() => computeMonthlySummaries(records), [records]);

  // Brand summaries
  const brandSummaries = useMemo(() => computeBrandSummaries(filteredRecords), [filteredRecords]);
  const topBrand = brandSummaries[0];

  // Category summaries
  const categorySummaries = useMemo(() => computeCategorySummaries(filteredRecords), [filteredRecords]);
  const topCategory = categorySummaries[0];

  // Partner summaries
  const partnerSummaries = useMemo(() => computePartnerSummaries(filteredRecords), [filteredRecords]);
  const topPartner = partnerSummaries[0];

  // Prepared data for Recharts
  const chartData = useMemo(() => {
    return monthlySummaries.map(m => ({
      monthKey: m.monthKey,
      name: m.monthLabel,
      omset: m.totalAmount,
      omsetJuta: Number((m.totalAmount / 1_000_000).toFixed(1)),
      unit: m.totalQty,
      transaksi: m.totalTransactions,
      topBrand: m.topBrand,
      topCategory: m.topCategory,
      topPartner: m.topPartner,
      growthAmount: m.growthRateAmount,
      growthQty: m.growthRateQty,
    }));
  }, [monthlySummaries]);

  // Current month & previous month comparison
  const latestMonth = monthlySummaries[monthlySummaries.length - 1];
  const previousMonth = monthlySummaries.length > 1 ? monthlySummaries[monthlySummaries.length - 2] : null;

  // Custom Tooltip Component for Recharts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700/60 text-xs min-w-[210px] space-y-2 z-50">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-sm text-emerald-400">{label}</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
              {data.transaksi} transaksi
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                Total Omset:
              </span>
              <span className="font-mono font-bold text-white">
                {formatRupiah(data.omset)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                Volume Terjual:
              </span>
              <span className="font-mono font-bold text-blue-300">
                {data.unit.toLocaleString('id-ID')} unit
              </span>
            </div>

            {data.growthAmount !== undefined && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">Pertumbuhan (MoM):</span>
                <span
                  className={`font-semibold flex items-center gap-0.5 font-mono ${
                    data.growthAmount > 0
                      ? 'text-emerald-400'
                      : data.growthAmount < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {data.growthAmount > 0 ? '+' : ''}
                  {data.growthAmount}%
                </span>
              </div>
            )}
          </div>

          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
            <div>
              Brand Teratas: <strong className="text-slate-200">{data.topBrand}</strong>
            </div>
            <div>
              Kategori Terlaris: <strong className="text-slate-200">{data.topCategory}</strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200 shadow-2xs space-y-4 max-w-md mx-auto my-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100">
          <BarChart3 className="w-7 h-7 text-emerald-600" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">
            Lembar Baru: Belum Ada Data Analitik
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Data transaksi saat ini kosong dan siap diisi ulang. Masukkan catatan penjualan distributor di tab <strong>Tabel Data</strong> untuk melihat grafik tren bulanan, rekap brand, dan performa kategori komponen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Period Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
              Rekap & Analisis Distributor
            </h3>
            <p className="text-[11px] text-slate-500">
              Tren bulanan, klasifikasi otomatis brand, sub-brand & kategori komponen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          {[
            { id: 'all', label: 'Semua Waktu' },
            { id: 'today', label: 'Hari Ini' },
            { id: 'last7days', label: '7 Hari' },
            { id: 'thisMonth', label: 'Bulan Ini' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                period === p.id
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Transaksi */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Transaksi</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-bold text-slate-900">
            {totalTransactions}
          </p>
          <span className="text-[11px] text-slate-400">Order tercatat ({period})</span>
        </div>

        {/* Total Qty Barang */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Unit Terjual</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-bold text-emerald-700">
            {totalQty.toLocaleString('id-ID')}
          </p>
          <span className="text-[11px] text-slate-400">Kuantitas komponen</span>
        </div>

        {/* Estimasi Omset */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Omset</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-mono font-bold text-slate-900 truncate">
            {totalAmount > 0 ? formatRupiah(totalAmount) : '—'}
          </p>
          <span className="text-[11px] text-slate-400">Akumulasi nilai transaksi</span>
        </div>

        {/* Brand Aktif */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Brand Terdistribusi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-bold text-slate-900">
            {brandSummaries.length}
          </p>
          <span className="text-[11px] text-slate-400">Brand aktif bergerak</span>
        </div>
      </div>

      {/* View Selector: Bulanan vs Brand vs Kategori vs Partner */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap items-center gap-1">
        <button
          onClick={() => setActiveAnalysisView('monthly')}
          className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeAnalysisView === 'monthly'
              ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Tren Bulanan ({monthlySummaries.length} Bulan)</span>
        </button>

        <button
          onClick={() => setActiveAnalysisView('brand')}
          className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeAnalysisView === 'brand'
              ? 'bg-white text-slate-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-600" />
          <span>Brand & Sub-Brand ({brandSummaries.length})</span>
        </button>

        <button
          onClick={() => setActiveAnalysisView('category')}
          className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeAnalysisView === 'category'
              ? 'bg-white text-slate-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Monitor className="w-4 h-4 text-blue-600" />
          <span>Kategori Komponen ({categorySummaries.length})</span>
        </button>

        <button
          onClick={() => setActiveAnalysisView('partner')}
          className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeAnalysisView === 'partner'
              ? 'bg-white text-slate-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-amber-600" />
          <span>Partner / Toko ({partnerSummaries.length})</span>
        </button>
      </div>

      {/* Main Analysis Views */}
      {activeAnalysisView === 'monthly' ? (
        /* Ringkasan Laporan Bulanan & Trend Chart Recharts */
        <div className="space-y-6">
          {/* Main Chart Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                      Tren Performa Penjualan Bulan ke Bulan (MoM)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Visualisasi grafik tren omset transaksi dan volume unit barang terdistribusi
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart Metric Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs">
                <button
                  onClick={() => setChartMetric('both')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    chartMetric === 'both' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Semua (Omset & Unit)
                </button>
                <button
                  onClick={() => setChartMetric('amount')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    chartMetric === 'amount' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Hanya Omset
                </button>
                <button
                  onClick={() => setChartMetric('qty')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    chartMetric === 'qty' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Hanya Unit
                </button>
              </div>
            </div>

            {/* Recharts Chart Container */}
            <div className="w-full h-72 sm:h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="omsetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  {/* Left Axis: Omset (Juta Rupiah) */}
                  {(chartMetric === 'both' || chartMetric === 'amount') && (
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      tick={{ fontSize: 10, fill: '#059669' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={value => `${value}Jt`}
                    />
                  )}
                  {/* Right Axis: Unit Terjual */}
                  {(chartMetric === 'both' || chartMetric === 'qty') && (
                    <YAxis
                      yAxisId={chartMetric === 'qty' ? 'left' : 'right'}
                      orientation={chartMetric === 'qty' ? 'left' : 'right'}
                      tick={{ fontSize: 10, fill: '#2563eb' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={value => `${value} u`}
                    />
                  )}
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                    formatter={value => {
                      if (value === 'omsetJuta') return <span className="text-emerald-800 font-semibold">Omset (Juta Rp)</span>;
                      if (value === 'unit') return <span className="text-blue-700 font-semibold">Volume Unit Terjual</span>;
                      return value;
                    }}
                  />

                  {/* Omset as Area / Bar */}
                  {(chartMetric === 'both' || chartMetric === 'amount') && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="omsetJuta"
                      name="omsetJuta"
                      fill="url(#omsetGradient)"
                      stroke="#059669"
                      strokeWidth={3}
                      activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  )}

                  {/* Unit Qty as Bar or Line */}
                  {(chartMetric === 'both' || chartMetric === 'qty') && (
                    <Bar
                      yAxisId={chartMetric === 'qty' ? 'left' : 'right'}
                      dataKey="unit"
                      name="unit"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Chart Key Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[11px] text-slate-500 font-medium block">Bulan Terakhir</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-bold text-slate-900 text-base">{latestMonth?.monthLabel || '-'}</span>
                  {latestMonth?.growthRateAmount !== undefined && (
                    <span
                      className={`text-xs font-semibold flex items-center ${
                        latestMonth.growthRateAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {latestMonth.growthRateAmount >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 inline" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 inline" />
                      )}
                      {latestMonth.growthRateAmount}% MoM
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                  {formatRupiah(latestMonth?.totalAmount)}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[11px] text-slate-500 font-medium block">Rata-rata Penjualan / Bulan</span>
                <span className="font-mono font-bold text-slate-900 text-base block mt-0.5">
                  {monthlySummaries.length > 0
                    ? formatRupiah(
                        Math.round(
                          monthlySummaries.reduce((sum, m) => sum + m.totalAmount, 0) /
                            monthlySummaries.length
                        )
                      )
                    : '-'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  ~
                  {monthlySummaries.length > 0
                    ? Math.round(
                        monthlySummaries.reduce((sum, m) => sum + m.totalQty, 0) /
                          monthlySummaries.length
                      )
                    : 0}{' '}
                  unit / bulan
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[11px] text-slate-500 font-medium block">Bulan Penjualan Tertinggi (Peak)</span>
                {(() => {
                  const peakMonth = [...monthlySummaries].sort((a, b) => b.totalAmount - a.totalAmount)[0];
                  return (
                    <>
                      <span className="font-bold text-slate-900 text-base block mt-0.5">
                        {peakMonth ? peakMonth.monthLabel : '-'}
                      </span>
                      <span className="text-[11px] font-mono text-violet-700 font-semibold">
                        {peakMonth ? `${formatRupiah(peakMonth.totalAmount)} (${peakMonth.totalQty} unit)` : '-'}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Table Breakdown of Monthly Summaries */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" /> Rincian Rekap Performa Bulan ke Bulan
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tabel komparasi performa omset, volume unit, pertumbuhan, dan brand unggulan tiap periode bulan
                </p>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 rounded-l-lg">Bulan</th>
                    <th className="py-2.5 px-3 text-right">Total Omset (Rp)</th>
                    <th className="py-2.5 px-3 text-center">Tren MoM</th>
                    <th className="py-2.5 px-3 text-right">Volume (Unit)</th>
                    <th className="py-2.5 px-3 text-center">Transaksi</th>
                    <th className="py-2.5 px-3">Brand Utama</th>
                    <th className="py-2.5 px-3">Kategori Dominan</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Top Partner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...monthlySummaries].reverse().map(m => (
                    <tr key={m.monthKey} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {m.monthLabel}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(m.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {m.growthRateAmount !== undefined ? (
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              m.growthRateAmount > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : m.growthRateAmount < 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {m.growthRateAmount > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : m.growthRateAmount < 0 ? (
                              <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Minus className="w-3 h-3 text-slate-400" />
                            )}
                            {m.growthRateAmount > 0 ? '+' : ''}
                            {m.growthRateAmount}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-700">
                        {m.totalQty.toLocaleString('id-ID')} unit
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {m.totalTransactions}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[11px] border border-emerald-200">
                          {m.topBrand}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {m.topCategory}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {m.topPartner}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeAnalysisView === 'brand' ? (
        /* Breakdown per Brand & Sub-Brand */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600" /> Rekap Penjualan Tiap Brand & Sub-Brand
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Memetakan rincian produk yang keluar per brand (contoh: MSI motherboard/VGA, Colorful iGame/VGA, Asus, Intel, AOC, Philips)
              </p>
            </div>
            {topBrand && (
              <span className="hidden sm:inline-flex text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Paling Laris: {topBrand.brand} ({topBrand.totalQty} Unit)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brandSummaries.map((bs, idx) => {
              const maxQty = brandSummaries[0]?.totalQty || 1;
              const barWidth = Math.max(6, Math.round((bs.totalQty / maxQty) * 100));

              return (
                <div
                  key={bs.brand}
                  className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-200/70 space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h5 className="font-extrabold text-slate-900 text-base">{bs.brand}</h5>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700 text-base block">
                        {bs.totalQty.toLocaleString('id-ID')} Unit
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatRupiah(bs.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Volume Bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>

                  {/* Sub-Brands / Series Breakdown for this Brand */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Sub-Brand & Seri yang Terdistribusi:
                    </span>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {Object.entries(bs.subBrands).map(([sub, count]) => (
                        <span
                          key={sub}
                          className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-xs rounded-md font-medium"
                        >
                          {sub}: <strong className="text-emerald-700 font-mono">{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Kategori dominan: <strong className="text-slate-800">{bs.topCategory}</strong></span>
                    <span>{bs.totalTransactions} transaksi ({bs.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeAnalysisView === 'category' ? (
        /* Breakdown per Kategori Komponen */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" /> Rekap per Kategori Komponen Komputer
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan pergerakan komponen (VGA, Motherboard, Processor, Monitor, RAM, SSD)
              </p>
            </div>
            {topCategory && (
              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                Kategori Terbanyak: {topCategory.category}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {categorySummaries.map((cs, idx) => (
              <div
                key={cs.category}
                className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200/60"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 font-mono font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{cs.category}</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {cs.totalQty.toLocaleString('id-ID')} unit
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatRupiah(cs.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(6, cs.percentage)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Brand utama penggerak: <strong className="text-slate-800">{cs.topBrand}</strong></span>
                  <span>{cs.totalTransactions} transaksi ({cs.percentage}% pangsa)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Breakdown per Partner */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" /> Rekap Pengambilan per Partner / Toko
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Peringkat toko/partner berdasarkan kuantitas komponen yang dipesan
              </p>
            </div>
            {topPartner && (
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                Partner Terbesar: {topPartner.partner}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {partnerSummaries.map((ps, idx) => (
              <div
                key={ps.partner}
                className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200/60"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-mono font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{ps.partner}</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {ps.totalQty.toLocaleString('id-ID')} unit
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatRupiah(ps.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Produk dominan: <strong className="text-slate-800">{ps.topItem}</strong></span>
                  <span>{ps.totalTransactions} pesanan</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
