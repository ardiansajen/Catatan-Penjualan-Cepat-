/**
 * =========================================================================
 * DISTRIBUTOR SALES PRO - GOOGLE APPS SCRIPT (script.gs)
 * Sistem Pencatatan & Sinkronisasi Penjualan Distributor (Komputer / Toko)
 * =========================================================================
 *
 * CARA MENGGUNAKAN (TINGGAL COPY-PASTE):
 * 1. Buka Google Sheets baru di browser: https://sheets.new
 * 2. Di menu atas Google Sheets, klik: Ekstensi (Extensions) > Apps Script
 * 3. Hapus seluruh kode bawaan yang ada di editor, lalu PASTE kode ini seluruhnya.
 * 4. Beri nama proyek (misal: "Sales Tracker GS"), lalu klik Simpan (Ctrl + S atau Cmd + S).
 * 5. Kembali ke tab Google Sheets Anda, lalu REFRESH halaman.
 *    -> Akan muncul Menu Baru di atas: "📊 Distributor Sales Pro"
 *    -> Klik menu "⚙️ Setup Format & Header Tabel" untuk otomatis merapikan tabel!
 *
 * CARA DEPLOY SEBAGAI APLIKASI WEB (WEB APP):
 * 1. Di editor Apps Script, klik tombol biru "Terapkan" (Deploy) > "Penerapan Baru" (New deployment).
 *    (Jika sudah pernah deploy sebelumnya, pilih "Kelola Penerapan" > Edit > Versi: Versi Baru > Terapkan)
 * 2. Klik ikon gerigi di sebelah kiri (Select type) > pilih "Aplikasi Web" (Web app).
 * 3. Konfigurasi:
 *    - Deskripsi: Web App Penjualan Distributor
 *    - Jalankan sebagai (Execute as): "Saya" (Me / email Anda)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone)
 * 4. Klik "Terapkan" (Deploy) dan izinkan akses Google Anda.
 * 5. Buka tautan URL Aplikasi Web yang berakhiran "/exec".
 *    -> Aplikasi Web antarmuka mobile/desktop yang interaktif akan langsung terbuka!
 * =========================================================================
 */

// Konstanta Nama Sheet & Konfigurasi
var SHEET_NAME_SALES = "Data Penjualan";
var SHEET_NAME_SUMMARY = "Rekap Bulanan & Performa";

/**
 * Membuat Menu Kustom otomatis ketika spreadsheet dibuka
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("📊 Distributor Sales Pro")
    .addItem("⚙️ Setup Format & Header Tabel", "setupSheet")
    .addItem("📈 Buat Rekap Bulanan & Pivot Otomatis", "generateMonthlySummary")
    .addSeparator()
    .addItem("📥 Isi Contoh Data (Mugen Comp / PC Part)", "loadDemoData")
    .addItem("📊 Hitung Ulang Total & Statistik", "recalculateStats")
    .addSeparator()
    .addItem("🗑️ Hapus Transaksi Tertentu (via ID)", "promptDeleteTransactionById")
    .addSeparator()
    .addItem("📱 Setup Bot Telegram & Notifikasi", "showTelegramConfigModal")
    .addItem("🚀 Tes Kirim Notifikasi ke Telegram", "testSendTelegramNotification")
    .addItem("📊 Kirim Rekap Hari Ini ke Telegram", "sendTodaySummaryToTelegram")
    .addSeparator()
    .addItem("🧹 Kosongkan Data Transaksi (Mulai Baru)", "clearDataTransactions")
    .addItem("🌐 Buka Web App / Petunjuk Deploy", "showInstructions")
    .addToUi();
}

/**
 * 1. SETUP SHEET DATA PENJUALAN
 * Menyiapkan kolom, styling warna emerald, validasi status, dan format angka Rupiah
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_SALES, 0);
  } else {
    ss.setActiveSheet(sheet);
  }

  // Header 13 Kolom Standar Industri Distribusi Komputer
  var headers = [
    "No ID",
    "Tanggal & Waktu",
    "Nama Partner / Toko",
    "Brand",
    "Sub-Brand / Series",
    "Kategori Komponen",
    "Type Product / Nama Barang",
    "Qty",
    "Satuan",
    "Harga Satuan (Rp)",
    "Total Nominal (Rp)",
    "Status",
    "Catatan"
  ];

  // Tulis Header
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // Desain Header Profesional (Emerald Green Dark #065F46)
  headerRange
    .setBackground("#065F46")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(10)
    .setFontFamily("Arial")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);

  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  var maxRows = Math.max(sheet.getMaxRows(), 500);

  // Format Angka Rupiah Indonesia untuk Kolom 10 & 11
  var currencyFormat = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
  sheet.getRange(2, 10, maxRows - 1, 2).setNumberFormat(currencyFormat);

  // Format Angka Kuantitas Kolom 8
  sheet.getRange(2, 8, maxRows - 1, 1).setNumberFormat("#,##0");

  // Format Tanggal Kolom 2
  sheet.getRange(2, 2, maxRows - 1, 1).setNumberFormat("yyyy-mm-dd hh:mm");

  // Alignment Kolom
  sheet.getRange(2, 1, maxRows - 1, 1).setHorizontalAlignment("center"); // ID
  sheet.getRange(2, 2, maxRows - 1, 1).setHorizontalAlignment("center"); // Tanggal
  sheet.getRange(2, 8, maxRows - 1, 1).setHorizontalAlignment("center"); // Qty
  sheet.getRange(2, 9, maxRows - 1, 1).setHorizontalAlignment("center"); // Satuan
  sheet.getRange(2, 12, maxRows - 1, 1).setHorizontalAlignment("center"); // Status

  // Dropdown Validasi untuk Kolom Status (Kolom 12)
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["SELESAI", "PENDING", "DIKIRIM", "BATAL"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 12, maxRows - 1, 1).setDataValidation(statusRule);

  // Conditional Formatting untuk Status
  applyStatusConditionalFormatting(sheet);

  // Auto-resize lebar kolom
  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
    var colWidth = sheet.getColumnWidth(i);
    if (colWidth < 85) sheet.setColumnWidth(i, 85);
    if (i === 7 && colWidth < 220) sheet.setColumnWidth(i, 240);
    if (i === 13 && colWidth < 180) sheet.setColumnWidth(i, 180);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Sheet 'Data Penjualan' berhasil disiapkan dengan format profesional!",
    "Sukses",
    5
  );
}

/**
 * Memberi warna otomatis (Conditional Formatting) untuk Status Transaksi
 */
function applyStatusConditionalFormatting(sheet) {
  var rules = sheet.getConditionalFormatRules();
  var range = sheet.getRange("L2:L1000");

  var ruleSelesai = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("SELESAI")
    .setBackground("#D1FAE5")
    .setFontColor("#065F46")
    .setBold(true)
    .setRanges([range])
    .build();

  var rulePending = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("PENDING")
    .setBackground("#FEF3C7")
    .setFontColor("#92400E")
    .setBold(true)
    .setRanges([range])
    .build();

  var ruleDikirim = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("DIKIRIM")
    .setBackground("#DBEAFE")
    .setFontColor("#1E40AF")
    .setBold(true)
    .setRanges([range])
    .build();

  var ruleBatal = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("BATAL")
    .setBackground("#FFE4E6")
    .setFontColor("#9F1239")
    .setBold(true)
    .setRanges([range])
    .build();

  rules.push(ruleSelesai, rulePending, ruleDikirim, ruleBatal);
  sheet.setConditionalFormatRules(rules);
}

/**
 * 2. GENERATE REKAP BULANAN & PIVOT OTOMATIS
 */
function generateMonthlySummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var salesSheet = ss.getSheetByName(SHEET_NAME_SALES);

  if (!salesSheet || salesSheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert(
      "Peringatan",
      "Belum ada data di sheet '" + SHEET_NAME_SALES + "'. Silakan isi data terlebih dahulu atau klik menu 'Isi Contoh Data'!",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  var summarySheet = ss.getSheetByName(SHEET_NAME_SUMMARY);
  if (!summarySheet) {
    summarySheet = ss.insertSheet(SHEET_NAME_SUMMARY, 1);
  } else {
    summarySheet.clear();
    ss.setActiveSheet(summarySheet);
  }

  summarySheet.getRange("A1").setValue("RINGKASAN & ANALITIK PENJUALAN DISTRIBUTOR (BULAN KE BULAN)");
  summarySheet.getRange("A1:G1").merge()
    .setBackground("#065F46")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(13)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  summarySheet.setRowHeight(1, 40);

  var lastRow = salesSheet.getLastRow();
  var salesData = salesSheet.getRange(2, 1, lastRow - 1, 13).getValues();

  var monthlyStats = {};
  var brandStats = {};
  var grandTotalAmount = 0;
  var grandTotalQty = 0;
  var grandTotalTrx = 0;

  var monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  for (var i = 0; i < salesData.length; i++) {
    var row = salesData[i];
    var rawDate = row[1];
    var brand = row[3] ? String(row[3]).trim().toUpperCase() : "LAINNYA";
    var qty = Number(row[7]) || 0;
    var totalAmount = Number(row[10]) || 0;
    var status = row[11] ? String(row[11]).trim().toUpperCase() : "";

    if (status === "BATAL") continue;

    var dateObj = rawDate instanceof Date ? rawDate : new Date(rawDate);
    var monthKey = "Lainnya";
    var monthLabel = "Lainnya";

    if (!isNaN(dateObj.getTime())) {
      var y = dateObj.getFullYear();
      var m = dateObj.getMonth();
      monthKey = y + "-" + (m < 9 ? "0" + (m + 1) : (m + 1));
      monthLabel = monthNames[m] + " " + y;
    }

    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = {
        label: monthLabel,
        trxCount: 0,
        qty: 0,
        total: 0
      };
    }
    monthlyStats[monthKey].trxCount += 1;
    monthlyStats[monthKey].qty += qty;
    monthlyStats[monthKey].total += totalAmount;

    if (!brandStats[brand]) {
      brandStats[brand] = { count: 0, qty: 0, total: 0 };
    }
    brandStats[brand].count += 1;
    brandStats[brand].qty += qty;
    brandStats[brand].total += totalAmount;

    grandTotalAmount += totalAmount;
    grandTotalQty += qty;
    grandTotalTrx += 1;
  }

  summarySheet.getRange("A3").setValue("1. TREN PERFORMA PENJUALAN BULANAN").setFontWeight("bold").setFontSize(11);

  var summaryHeaders = [
    "Bulan & Tahun",
    "Jumlah Transaksi",
    "Volume Terjual (Unit)",
    "Total Omzet Penjualan",
    "Rata-rata per Transaksi",
    "Kontribusi Omzet (%)"
  ];
  var sHeaderRange = summarySheet.getRange(4, 1, 1, summaryHeaders.length);
  sHeaderRange.setValues([summaryHeaders])
    .setBackground("#1E293B")
    .setFontColor("#F8FAFC")
    .setFontWeight("bold")
    .setFontSize(9)
    .setHorizontalAlignment("center");
  summarySheet.setRowHeight(4, 28);

  var sortedMonthKeys = Object.keys(monthlyStats).sort().reverse();
  var summaryRows = [];

  for (var k = 0; k < sortedMonthKeys.length; k++) {
    var key = sortedMonthKeys[k];
    var item = monthlyStats[key];
    var avg = item.trxCount > 0 ? (item.total / item.trxCount) : 0;
    var share = grandTotalAmount > 0 ? (item.total / grandTotalAmount) : 0;

    summaryRows.push([
      item.label,
      item.trxCount,
      item.qty,
      item.total,
      avg,
      share
    ]);
  }

  var currentRow = 5;
  if (summaryRows.length > 0) {
    summarySheet.getRange(currentRow, 1, summaryRows.length, 6).setValues(summaryRows);
    var curFormat = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
    summarySheet.getRange(currentRow, 4, summaryRows.length, 2).setNumberFormat(curFormat);
    summarySheet.getRange(currentRow, 6, summaryRows.length, 1).setNumberFormat("0.0%");
    summarySheet.getRange(currentRow, 2, summaryRows.length, 2).setNumberFormat("#,##0");
    summarySheet.getRange(currentRow, 2, summaryRows.length, 2).setHorizontalAlignment("center");
    summarySheet.getRange(currentRow, 6, summaryRows.length, 1).setHorizontalAlignment("center");
    currentRow += summaryRows.length;
  }

  var totalRow = [
    "TOTAL KESELURUHAN",
    grandTotalTrx,
    grandTotalQty,
    grandTotalAmount,
    grandTotalTrx > 0 ? (grandTotalAmount / grandTotalTrx) : 0,
    1.0
  ];
  var totRange = summarySheet.getRange(currentRow, 1, 1, 6);
  totRange.setValues([totalRow])
    .setBackground("#E2E8F0")
    .setFontWeight("bold");
  totRange.getCell(1, 4).setNumberFormat('_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)');
  totRange.getCell(1, 5).setNumberFormat('_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)');
  totRange.getCell(1, 6).setNumberFormat("0.0%");

  currentRow += 3;

  summarySheet.getRange(currentRow, 1).setValue("2. ANALISIS PERFORMA PER BRAND / MERK").setFontWeight("bold").setFontSize(11);
  currentRow += 1;

  var brandHeaders = ["Nama Brand", "Transaksi", "Unit Terjual", "Total Penjualan (Rp)", "Pangsa Pasar (%)"];
  summarySheet.getRange(currentRow, 1, 1, brandHeaders.length)
    .setValues([brandHeaders])
    .setBackground("#1E293B")
    .setFontColor("#F8FAFC")
    .setFontWeight("bold")
    .setFontSize(9)
    .setHorizontalAlignment("center");
  currentRow += 1;

  var sortedBrands = Object.keys(brandStats).sort(function(a, b) {
    return brandStats[b].total - brandStats[a].total;
  });

  var brandRows = [];
  for (var b = 0; b < sortedBrands.length; b++) {
    var bName = sortedBrands[b];
    var bItem = brandStats[bName];
    var bShare = grandTotalAmount > 0 ? (bItem.total / grandTotalAmount) : 0;
    brandRows.push([bName, bItem.count, bItem.qty, bItem.total, bShare]);
  }

  if (brandRows.length > 0) {
    summarySheet.getRange(currentRow, 1, brandRows.length, 5).setValues(brandRows);
    summarySheet.getRange(currentRow, 4, brandRows.length, 1).setNumberFormat('_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)');
    summarySheet.getRange(currentRow, 5, brandRows.length, 1).setNumberFormat("0.0%");
    summarySheet.getRange(currentRow, 2, brandRows.length, 2).setHorizontalAlignment("center");
  }

  for (var col = 1; col <= 6; col++) {
    summarySheet.autoResizeColumn(col);
    if (summarySheet.getColumnWidth(col) < 140) summarySheet.setColumnWidth(col, 150);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Sheet 'Rekap Bulanan & Performa' berhasil diperbarui dengan data terkini!",
    "Analisis Selesai",
    5
  );
}

/**
 * 3. LOAD DATA CONTOH DISTRIBUTOR KOMPUTER
 */
function loadDemoData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);

  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME_SALES);
  }

  var now = new Date();
  var fmt = function(d) {
    return Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd HH:mm");
  };

  var dToday = fmt(now);
  var dYest = fmt(new Date(now.getTime() - 24 * 3600 * 1000));
  var dPrev1 = fmt(new Date(now.getTime() - 2 * 24 * 3600 * 1000));
  var dPrev2 = fmt(new Date(now.getTime() - 5 * 24 * 3600 * 1000));
  var dPrevM = fmt(new Date(now.getTime() - 35 * 24 * 3600 * 1000));

  var sampleRows = [
    ["TX-1001", dToday, "Mugen Comp", "COLORFUL", "Vulcan OC", "GPU / VGA Card", "iGame GeForce RTX 5090 Vulcan OC 24GB", 2, "Unit", 48500000, 97000000, "SELESAI", "Pre-Order Batch 1"],
    ["TX-1002", dToday, "Mugen Comp", "INTEL", "Core i5", "Processor", "Intel Core i5 13400F Tray + Fan", 5, "Pcs", 2450000, 12250000, "SELESAI", "Faktur INV-0881"],
    ["TX-1003", dYest, "Megakom IT", "ASUS", "TUF Gaming", "Motherboard", "Asus TUF Gaming B760M-PLUS WIFI D4", 3, "Unit", 2850000, 8550000, "DIKIRIM", "Kurir Toko"],
    ["TX-1004", dPrev1, "Enter Komputer", "MSI", "MAG Series", "Motherboard", "MSI MAG B650 TOMAHAWK WIFI AM5", 4, "Unit", 3650000, 14600000, "SELESAI", "Lunas Transfer"],
    ["TX-1005", dPrev2, "Nano Komputer", "AOC", "Gaming Monitor", "Monitor", "AOC 24G2SP IPS 165Hz 1ms Gaming", 10, "Unit", 1950000, 19500000, "SELESAI", "Pengiriman Cargo"],
    ["TX-1006", dPrevM, "Mugen Comp", "INTEL", "Core i5", "Processor", "Intel Core i5 13400F Box Resmi", 4, "Unit", 2450000, 9800000, "SELESAI", "Transaksi Bulan Lalu"]
  ];

  var startRow = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(startRow, 1, sampleRows.length, 13).setValues(sampleRows);

  generateMonthlySummary();

  SpreadsheetApp.getActiveSpreadsheet().toast(
    sampleRows.length + " transaksi contoh (Mugen Comp & PC Part) berhasil dimasukkan!",
    "Data Contoh Siap",
    5
  );
}

/**
 * 4. HITUNG ULANG STATISTIK
 */
function recalculateStats() {
  generateMonthlySummary();
}

/**
 * 5. KOSONGKAN DATA TRANSAKSI
 */
function clearDataTransactions() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    "Konfirmasi Pengosongan Data",
    "Apakah Anda yakin ingin MENGHAPUS SEMUA transaksi di sheet 'Data Penjualan'?\n\n(Tindakan ini cocok untuk membuat lembar baru bersih untuk diisi ulang)",
    ui.ButtonSet.YES_NO
  );

  if (confirm === ui.Button.YES) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME_SALES);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).clearContent();
    }
    SpreadsheetApp.getActiveSpreadsheet().toast("Data penjualan telah dikosongkan. Siap diisi ulang!", "Lembar Baru", 5);
  }
}

/**
 * 6. HAPUS TRANSAKSI TERTENTU VIA ID DARI SPREADSHEET
 */
function promptDeleteTransactionById() {
  var ui = SpreadsheetApp.getUi();
  var prompt = ui.prompt(
    "Hapus Transaksi",
    "Masukkan No ID transaksi yang ingin dihapus jika ada kesalahan input (Contoh: TX-1001):",
    ui.ButtonSet.OK_CANCEL
  );

  if (prompt.getSelectedButton() !== ui.Button.OK) return;
  var targetId = prompt.getResponseText().trim();
  if (!targetId) return;

  var result = apiDeleteSale(targetId);
  if (result.status === "success") {
    ui.alert("Berhasil", "Transaksi dengan ID " + targetId + " berhasil dihapus dari sheet dan statistik rekap bulanan telah diperbarui.", ui.ButtonSet.OK);
  } else {
    ui.alert("Tidak Ditemukan", "Transaksi dengan ID " + targetId + " tidak ditemukan di kolom No ID.", ui.ButtonSet.OK);
  }
}

/**
 * 6. TAMPILKAN PETUNJUK PENGGUNAAN & WEB APP
 */
function showInstructions() {
  var ui = SpreadsheetApp.getUi();
  var msg =
    "=== DISTRIBUTOR SALES PRO - PETUNJUK WEB APP ===\n\n" +
    "1. Membuka / Deploy Web App:\n" +
    "   - Klik tombol 'Terapkan' (Deploy) di kanan atas editor Apps Script.\n" +
    "   - Pilih 'Penerapan Baru' (New Deployment) atau 'Kelola Penerapan' > Edit > Versi Baru.\n" +
    "   - Pilih jenis 'Aplikasi Web' (Web App).\n" +
    "   - 'Jalankan sebagai': 'Saya' (email Anda).\n" +
    "   - 'Siapa yang memiliki akses': 'Siapa saja' (Anyone).\n" +
    "   - Klik 'Terapkan' lalu buka URL Web App Anda!\n\n" +
    "2. Antarmuka Web App akan langsung tampil lengkap di HP / Laptop Anda tanpa perlu server lain!";
  ui.alert("Petunjuk Aplikasi Web", msg, ui.ButtonSet.OK);
}

/**
 * =========================================================================
 * WEB APP & REST API HANDLER (doGet & doPost)
 * =========================================================================
 */

/**
 * Endpoint GET:
 * 1. Jika diakses via browser -> Menampilkan Web App antarmuka interaktif!
 * 2. Jika dipanggil dengan ?format=json atau ?action=read -> Mengembalikan JSON data transaksi
 */
function doGet(e) {
  // Cek jika request secara khusus meminta JSON API
  if (e && e.parameter && (e.parameter.format === "json" || e.parameter.action === "read" || e.parameter.action === "api")) {
    return handleGetJsonApi(e);
  }

  // Jika dibuka di browser sebagai Web App:
  // Coba ambil dari file HTML bernama 'index' jika user menambahkannya di project
  try {
    return HtmlService.createTemplateFromFile("index")
      .evaluate()
      .setTitle("Catatan Penjualan Cepat (Mobile Sales Tracker)")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    // Jika user TIDAK membuat file terpisah (hanya paste 1 file script.gs ini),
    // kita sajikan langsung tampilan Web App mandiri (embedded)!
    return HtmlService.createHtmlOutput(getEmbeddedWebAppHtml())
      .setTitle("Catatan Penjualan Cepat (Mobile Sales Tracker)")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Handler pengembalian data JSON jika dipanggil via ?format=json
 */
function handleGetJsonApi(e) {
  try {
    var records = apiGetSales();
    return createJsonResponse({
      status: "success",
      total: records.length,
      records: records
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Endpoint POST untuk webhook eksternal
 */
function doPost(e) {
  try {
    var contents = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var payload = JSON.parse(contents);

    // 1. DETEKSI WEBHOOK TELEGRAM BOT (Jika pesan dikirim oleh user di chat Telegram)
    if (payload.message && (payload.message.text || payload.message.caption)) {
      return handleTelegramWebhook(payload);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME_SALES);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME_SALES);
    }

    var action = payload.action || "addSale";

    if (action === "addSale" && payload.data) {
      apiSaveSale(payload.data);
      return createJsonResponse({
        status: "success",
        message: "Transaksi berhasil dicatat ke Google Sheets",
        id: payload.data.id
      });
    }

    if (action === "bulkAdd" && Array.isArray(payload.data)) {
      var rows = payload.data.map(formatSaleRecordToRow);
      if (rows.length > 0) {
        var startRow = Math.max(sheet.getLastRow() + 1, 2);
        sheet.getRange(startRow, 1, rows.length, 13).setValues(rows);
      }
      return createJsonResponse({
        status: "success",
        message: rows.length + " transaksi berhasil ditambahkan",
        count: rows.length
      });
    }

    if (action === "syncAll" && Array.isArray(payload.data)) {
      apiSyncAll(payload.data);
      return createJsonResponse({
        status: "success",
        message: "Sinkronisasi berhasil!",
        count: payload.data.length
      });
    }

    if (action === "updateSale" && payload.data) {
      var updateResult = apiUpdateSale(payload.data);
      return createJsonResponse({
        status: "success",
        message: "Transaksi ID " + payload.data.id + " berhasil diperbarui di Google Sheets!",
        id: payload.data.id
      });
    }

    if (action === "deleteSale" && (payload.id || (payload.data && payload.data.id))) {
      var targetId = payload.id || payload.data.id;
      var deleteResult = apiDeleteSale(targetId);
      return createJsonResponse({
        status: "success",
        message: "Transaksi ID " + targetId + " berhasil dihapus dari Google Sheets!",
        id: targetId
      });
    }

    if (action === "clearSheet") {
      apiClearAllSales();
      return createJsonResponse({
        status: "success",
        message: "Sheet transaksi berhasil dikosongkan"
      });
    }

    return createJsonResponse({
      status: "error",
      message: "Aksi tidak dikenali: " + action
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * =========================================================================
 * RPC SERVER FUNCTIONS UNTUK GOOGLE APPS SCRIPT WEB APP (google.script.run)
 * =========================================================================
 */

/**
 * Mengambil semua data transaksi langsung dari Sheet
 */
function apiGetSales() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME_SALES);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, 13).getValues();
  var records = [];

  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (!r[0] && !r[2] && !r[6]) continue;

    var dateVal = r[1];
    var dateStr = "";
    if (dateVal instanceof Date) {
      dateStr = Utilities.formatDate(dateVal, "GMT+7", "yyyy-MM-dd'T'HH:mm");
    } else {
      dateStr = String(dateVal || new Date().toISOString().slice(0, 16));
    }

    records.push({
      id: String(r[0] || ("TX-" + (i + 1))),
      date: dateStr,
      partner: String(r[2] || ""),
      brand: String(r[3] || ""),
      subBrand: String(r[4] || ""),
      category: String(r[5] || ""),
      itemType: String(r[6] || ""),
      quantity: Number(r[7]) || 1,
      unit: String(r[8] || "Unit"),
      unitPrice: Number(r[9]) || 0,
      totalAmount: Number(r[10]) || 0,
      status: String(r[11] || "SELESAI").toLowerCase(),
      notes: String(r[12] || "")
    });
  }

  return records;
}

/**
 * Menyimpan 1 transaksi baru ke Google Sheets
 */
function apiSaveSale(record) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME_SALES);
  }
  var row = formatSaleRecordToRow(record);
  sheet.appendRow(row);

  // Otomatis kirim notifikasi ke Telegram (jika bot dikonfigurasi)
  try {
    sendTelegramNotification(record);
  } catch (err) {
    Logger.log("Telegram notif error: " + err);
  }

  return { status: "success", id: record.id };
}

/**
 * Merevisi / Mengubah data transaksi yang sudah tersimpan di Google Sheets berdasarkan No ID
 */
function apiUpdateSale(record) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME_SALES);
  }

  if (sheet.getLastRow() < 2) {
    return apiSaveSale(record);
  }

  var targetId = String(record.id || "").trim();
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();

  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === targetId) {
      var rowNum = i + 2;
      var updatedRow = formatSaleRecordToRow(record);
      sheet.getRange(rowNum, 1, 1, 13).setValues([updatedRow]);

      try {
        generateMonthlySummary();
      } catch (err) {
        Logger.log("Recalculate summary error: " + err);
      }

      return { status: "success", id: targetId, row: rowNum, message: "Transaksi berhasil diperbarui" };
    }
  }

  // Jika ID tidak ditemukan (misal data baru), simpan sebagai baris baru
  return apiSaveSale(record);
}

/**
 * Menghapus transaksi berdasarkan ID
 */
function apiDeleteSale(saleId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (!sheet || sheet.getLastRow() < 2) return { status: "not_found" };

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(saleId)) {
      sheet.deleteRow(i + 2);
      try {
        generateMonthlySummary();
      } catch (err) {}
      return { status: "success", id: saleId };
    }
  }
  return { status: "not_found" };
}

/**
 * Mengosongkan data transaksi
 */
function apiClearAllSales() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (sheet && sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).clearContent();
  }
  return { status: "success" };
}

/**
 * Mengisi data demo dari Web App
 */
function apiLoadDemoData() {
  loadDemoData();
  return apiGetSales();
}

/**
 * Sinkronisasi semua transaksi
 */
function apiSyncAll(records) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME_SALES);
  }

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).clearContent();
  }

  var allRows = records.map(formatSaleRecordToRow);
  if (allRows.length > 0) {
    sheet.getRange(2, 1, allRows.length, 13).setValues(allRows);
  }

  try {
    generateMonthlySummary();
  } catch (err) {}

  return { status: "success", count: allRows.length };
}

/**
 * Helper format objek ke baris sheet
 */
function formatSaleRecordToRow(record) {
  var id = record.id || ("TX-" + Utilities.getUuid().slice(0, 6).toUpperCase());
  var dateStr = record.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm");
  var partner = record.partner || "";
  var brand = record.brand || "";
  var subBrand = record.subBrand || "";
  var category = record.category || "";
  var itemType = record.itemType || "";
  var qty = Number(record.quantity) || 1;
  var unit = record.unit || "Unit";
  var unitPrice = Number(record.unitPrice) || 0;
  var total = Number(record.totalAmount) || (qty * unitPrice);
  var status = String(record.status || "SELESAI").toUpperCase();
  var notes = record.notes || "";

  return [
    id,
    dateStr,
    partner,
    brand,
    subBrand,
    category,
    itemType,
    qty,
    unit,
    unitPrice,
    total,
    status,
    notes
  ];
}

/**
 * Helper JSON Response
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * =========================================================================
 * EMBEDDED WEB APP HTML
 * Dijalankan langsung jika user hanya menempelkan 1 file script.gs tanpa membuat index.html
 * =========================================================================
 */
function getEmbeddedWebAppHtml() {
  return '<!DOCTYPE html>\n' +
'<html lang="id">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">\n' +
'  <title>Catatan Penjualan Cepat (Mobile Sales Tracker) - Google Web App</title>\n' +
'  <script src="https://cdn.tailwindcss.com"></script>\n' +
'  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n' +
'  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">\n' +
'  <style>\n' +
'    body { font-family: "Plus Jakarta Sans", sans-serif; }\n' +
'    .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }\n' +
'    .custom-scroll::-webkit-scrollbar-track { background: #0f172a; }\n' +
'    .custom-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }\n' +
'  </style>\n' +
'</head>\n' +
'<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white">\n' +
'\n' +
'  <!-- TOP HEADER -->\n' +
'  <header class="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 py-3">\n' +
'    <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">\n' +
'      <div class="flex items-center gap-3">\n' +
'        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">\n' +
'          <i class="fa-solid fa-cube"></i>\n' +
'        </div>\n' +
'        <div>\n' +
'          <div class="flex items-center gap-2">\n' +
'            <h1 class="font-bold text-slate-100 text-base md:text-lg tracking-tight">Catatan Penjualan Cepat</h1>\n' +
'            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">\n' +
'              <i class="fa-solid fa-cloud-arrow-up text-[9px] mr-1"></i> GOOGLE SHEETS LIVE\n' +
'            </span>\n' +
'          </div>\n' +
'          <p class="text-xs text-slate-400 hidden sm:block">Aplikasi Web Penjualan Distributor Komputer & Toko</p>\n' +
'        </div>\n' +
'      </div>\n' +
'\n' +
'      <div class="flex items-center gap-2">\n' +
'        <button onclick="refreshDataFromGas()" id="refreshBtn" title="Muat Ulang Data dari Google Sheets" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition">\n' +
'          <i class="fa-solid fa-rotate text-emerald-400" id="refreshIcon"></i>\n' +
'          <span class="hidden sm:inline">Refresh Sheet</span>\n' +
'        </button>\n' +
'        <button onclick="resetDataPrompt()" title="Kosongkan lembar kerja untuk diisi ulang dari awal" class="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-medium border border-red-800/40 flex items-center gap-1.5 transition">\n' +
'          <i class="fa-regular fa-file"></i>\n' +
'          <span>Lembar Baru</span>\n' +
'        </button>\n' +
'        <button onclick="exportCsv()" title="Download CSV" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition">\n' +
'          <i class="fa-solid fa-file-csv text-emerald-400"></i>\n' +
'          <span class="hidden sm:inline">CSV</span>\n' +
'        </button>\n' +
'      </div>\n' +
'    </div>\n' +
'  </header>\n' +
'\n' +
'  <!-- MAIN CONTAINER -->\n' +
'  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">\n' +
'\n' +
'    <!-- CONNECTION BANNER -->\n' +
'    <div class="bg-emerald-950/40 border border-emerald-700/50 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300">\n' +
'      <div class="flex items-center gap-2">\n' +
'        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>\n' +
'        <span id="connBannerText">Terhubung langsung ke Google Sheets. Data otomatis tersimpan ke spreadsheet Anda.</span>\n' +
'      </div>\n' +
'      <span class="text-[11px] text-emerald-400/80 font-mono hidden md:inline">Google Apps Script Web App</span>\n' +
'    </div>\n' +
'\n' +
'    <!-- QUICK STATS CARDS -->\n' +
'    <section class="grid grid-cols-2 md:grid-cols-4 gap-3">\n' +
'      <div class="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">\n' +
'        <div class="flex items-center justify-between text-slate-400 text-xs mb-1"><span>Total Omzet</span><i class="fa-solid fa-wallet text-emerald-400"></i></div>\n' +
'        <div id="statTotalAmount" class="text-lg md:text-xl font-bold font-mono text-emerald-400">Rp 0</div>\n' +
'        <div class="text-[10px] text-slate-400 mt-1">Akumulasi Penjualan</div>\n' +
'      </div>\n' +
'      <div class="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">\n' +
'        <div class="flex items-center justify-between text-slate-400 text-xs mb-1"><span>Total Transaksi</span><i class="fa-solid fa-receipt text-blue-400"></i></div>\n' +
'        <div id="statTotalCount" class="text-lg md:text-xl font-bold font-mono text-blue-400">0</div>\n' +
'        <div class="text-[10px] text-slate-400 mt-1">Baris Transaksi Tercatat</div>\n' +
'      </div>\n' +
'      <div class="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">\n' +
'        <div class="flex items-center justify-between text-slate-400 text-xs mb-1"><span>Volume Unit</span><i class="fa-solid fa-box text-amber-400"></i></div>\n' +
'        <div id="statTotalQty" class="text-lg md:text-xl font-bold font-mono text-amber-400">0 Unit</div>\n' +
'        <div class="text-[10px] text-slate-400 mt-1">Total Unit Terjual</div>\n' +
'      </div>\n' +
'      <div class="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">\n' +
'        <div class="flex items-center justify-between text-slate-400 text-xs mb-1"><span>Top Brand</span><i class="fa-solid fa-chart-pie text-purple-400"></i></div>\n' +
'        <div id="statTopBrand" class="text-base md:text-lg font-bold text-purple-400 truncate">-</div>\n' +
'        <div class="text-[10px] text-slate-400 mt-1" id="statTopBrandSub">Kontribusi Tertinggi</div>\n' +
'      </div>\n' +
'    </section>\n' +
'\n' +
'    <!-- FORM INPUT CEPAT -->\n' +
'    <section class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">\n' +
'      <div class="flex items-center justify-between mb-4">\n' +
'        <div class="flex items-center gap-2">\n' +
'          <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">\n' +
'            <i class="fa-solid fa-bolt"></i>\n' +
'          </div>\n' +
'          <h2 class="font-bold text-slate-100 text-sm md:text-base">Input Transaksi Cepat</h2>\n' +
'        </div>\n' +
'        <button type="button" onclick="fillDemoQuick()" class="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition flex items-center gap-1">\n' +
'          <i class="fa-regular fa-lightbulb"></i><span>Contoh Demo</span>\n' +
'        </button>\n' +
'      </div>\n' +
'\n' +
'      <form id="salesForm" onsubmit="handleFormSubmit(event)" class="space-y-4">\n' +
'        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">\n' +
'          <div>\n' +
'            <label class="block text-xs font-medium text-slate-300 mb-1">Nama Partner / Toko *</label>\n' +
'            <input type="text" id="partnerInput" required placeholder="Misal: Mugen Comp, Megakom" list="partnerList"\n' +
'              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500">\n' +
'            <datalist id="partnerList"><option value="Mugen Comp"><option value="Megakom IT"><option value="Enter Komputer"><option value="Nano Komputer"></datalist>\n' +
'          </div>\n' +
'          <div class="sm:col-span-1 lg:col-span-2">\n' +
'            <label class="block text-xs font-medium text-slate-300 mb-1">Nama Barang / Type Product *</label>\n' +
'            <input type="text" id="itemTypeInput" required placeholder="Contoh: Asus Dual RTX 4060 White 8GB" oninput="autoDetectBrandCategory(this.value)"\n' +
'              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500">\n' +
'          </div>\n' +
'          <div>\n' +
'            <label class="block text-xs font-medium text-slate-300 mb-1">Brand *</label>\n' +
'            <select id="brandInput" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500">\n' +
'              <option value="ASUS">ASUS</option><option value="COLORFUL">COLORFUL</option><option value="MSI">MSI</option><option value="INTEL">INTEL</option><option value="AOC">AOC</option><option value="SAMSUNG">SAMSUNG</option><option value="CORSAIR">CORSAIR</option><option value="LAINNYA">LAINNYA</option>\n' +
'            </select>\n' +
'          </div>\n' +
'        </div>\n' +
'\n' +
'        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">\n' +
'          <div class="col-span-2 sm:col-span-2 lg:col-span-1">\n' +
'            <label class="block text-xs font-medium text-slate-300 mb-1">Kategori</label>\n' +
'            <select id="categoryInput" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500">\n' +
'              <option value="VGA / Graphic Card">VGA Card</option><option value="Motherboard">Motherboard</option><option value="Processor">Processor</option><option value="Monitor">Monitor</option><option value="Storage / SSD">Storage / SSD</option><option value="RAM / Memory">RAM</option><option value="Aksesoris">Aksesoris</option>\n' +
'            </select>\n' +
'          </div>\n' +
'          <div>\n' +
'            <label class="block text-xs font-medium text-slate-300 mb-1">Qty (Unit) *</label>\n' +
'            <input type="number" id="qtyInput" min="1" value="1" required oninput="calculateSubtotal()" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono text-center focus:outline-none focus:border-emerald-500">\n' +
'          </div>\n' +
'          <div>\n' +
'            <label class="block text-xs font-medium text-slate-300 mb-1">Harga Satuan (Rp) *</label>\n' +
'            <input type="number" id="priceInput" min="0" step="1000" placeholder="0" required oninput="calculateSubtotal()" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono text-right focus:outline-none focus:border-emerald-500">\n' +
'          </div>\n' +
'          <div>\n' +
'            <label class="block text-xs font-medium text-slate-300 mb-1">Status</label>\n' +
'            <select id="statusInput" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500">\n' +
'              <option value="selesai">SELESAI</option><option value="pending">PENDING</option><option value="dikirim">DIKIRIM</option><option value="batal">BATAL</option>\n' +
'            </select>\n' +
'          </div>\n' +
'          <div class="col-span-2 sm:col-span-4 lg:col-span-1">\n' +
'            <label class="block text-xs font-medium text-slate-300 mb-1">Catatan</label>\n' +
'            <input type="text" id="notesInput" placeholder="No PO / Invoice" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500">\n' +
'          </div>\n' +
'        </div>\n' +
'\n' +
'        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">\n' +
'          <div class="flex items-baseline gap-2 w-full sm:w-auto">\n' +
'            <span class="text-xs text-slate-400">Subtotal Estimasi:</span>\n' +
'            <span id="calculatedTotalDisplay" class="text-base sm:text-lg font-bold font-mono text-emerald-400">Rp 0</span>\n' +
'          </div>\n' +
'          <button type="submit" id="saveSubmitBtn" class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95">\n' +
'            <i class="fa-solid fa-plus"></i><span id="saveBtnText">Simpan Transaksi</span>\n' +
'          </button>\n' +
'        </div>\n' +
'      </form>\n' +
'    </section>\n' +
'\n' +
'    <!-- RINGKASAN TREN BULANAN -->\n' +
'    <section class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">\n' +
'      <div class="flex items-center justify-between">\n' +
'        <div class="flex items-center gap-2">\n' +
'          <div class="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs"><i class="fa-solid fa-chart-line"></i></div>\n' +
'          <h2 class="font-bold text-slate-100 text-sm md:text-base">Ringkasan Tren Performa Bulanan</h2>\n' +
'        </div>\n' +
'        <span class="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"><i class="fa-regular fa-calendar-check mr-1 text-emerald-400"></i> Auto Rekap</span>\n' +
'      </div>\n' +
'      <div class="overflow-x-auto custom-scroll rounded-xl border border-slate-800">\n' +
'        <table class="w-full text-left text-xs text-slate-300">\n' +
'          <thead class="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">\n' +
'            <tr><th class="py-2.5 px-3">Bulan & Tahun</th><th class="py-2.5 px-3 text-right">Total Transaksi</th><th class="py-2.5 px-3 text-right">Volume (Unit)</th><th class="py-2.5 px-3 text-right">Total Omzet Penjualan</th><th class="py-2.5 px-3 text-right">Rata-rata / Trx</th><th class="py-2.5 px-3 text-center">Tren Visual</th></tr>\n' +
'          </thead>\n' +
'          <tbody id="monthlySummaryBody" class="divide-y divide-slate-800/60 bg-slate-900/40 font-mono"></tbody>\n' +
'        </table>\n' +
'      </div>\n' +
'    </section>\n' +
'\n' +
'    <!-- TABEL TRANSAKSI -->\n' +
'    <section class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">\n' +
'      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">\n' +
'        <div class="flex items-center gap-2">\n' +
'          <div class="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs"><i class="fa-solid fa-list-check"></i></div>\n' +
'          <h2 class="font-bold text-slate-100 text-sm md:text-base">Daftar Transaksi Penjualan</h2>\n' +
'          <span id="recordCount" class="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">0</span>\n' +
'        </div>\n' +
'        <div class="flex items-center gap-2">\n' +
'          <input type="text" id="searchFilter" oninput="renderTable()" placeholder="Cari partner, item, brand..." class="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500">\n' +
'          <select id="statusFilter" onchange="renderTable()" class="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500">\n' +
'            <option value="all">Semua Status</option><option value="selesai">Selesai</option><option value="pending">Pending</option><option value="dikirim">Dikirim</option><option value="batal">Batal</option>\n' +
'          </select>\n' +
'        </div>\n' +
'      </div>\n' +
'      <div class="overflow-x-auto custom-scroll rounded-xl border border-slate-800">\n' +
'        <table class="w-full text-left text-xs text-slate-300">\n' +
'          <thead class="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">\n' +
'            <tr><th class="py-3 px-3">No ID</th><th class="py-3 px-3">Waktu</th><th class="py-3 px-3">Partner</th><th class="py-3 px-3">Brand</th><th class="py-3 px-3">Nama Produk</th><th class="py-3 px-3 text-center">Qty</th><th class="py-3 px-3 text-right">Harga Satuan</th><th class="py-3 px-3 text-right">Total Nominal</th><th class="py-3 px-3 text-center">Status</th><th class="py-3 px-3 text-center">Aksi</th></tr>\n' +
'          </thead>\n' +
'          <tbody id="salesTableBody" class="divide-y divide-slate-800/60 bg-slate-900/40"></tbody>\n' +
'        </table>\n' +
'      </div>\n' +
'    </section>\n' +
'  </main>\n' +
'\n' +
'  <div id="toast" class="fixed bottom-5 right-5 z-50 transform translate-y-20 opacity-0 transition-all duration-300 bg-slate-900 border border-emerald-500 text-slate-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">\n' +
'    <i class="fa-solid fa-circle-check text-emerald-400" id="toastIcon"></i><span id="toastMsg">Data berhasil disimpan!</span>\n' +
'  </div>\n' +
'\n' +
'  <script>\n' +
'    const STORAGE_KEY = "distributor_sales_pro_records";\n' +
'    let salesRecords = [];\n' +
'    const isGasEnvironment = (typeof google !== "undefined" && google.script && google.script.run);\n' +
'\n' +
'    function showToast(msg, isError) {\n' +
'      const toast = document.getElementById("toast");\n' +
'      document.getElementById("toastMsg").textContent = msg;\n' +
'      toast.className = isError ? "fixed bottom-5 right-5 z-50 transform translate-y-0 opacity-100 transition-all duration-300 bg-red-950 border border-red-500 text-slate-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2" : "fixed bottom-5 right-5 z-50 transform translate-y-0 opacity-100 transition-all duration-300 bg-slate-900 border border-emerald-500 text-slate-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2";\n' +
'      setTimeout(() => { toast.classList.add("translate-y-20", "opacity-0"); toast.classList.remove("translate-y-0", "opacity-100"); }, 3500);\n' +
'    }\n' +
'\n' +
'    function initData() {\n' +
'      if (isGasEnvironment) {\n' +
'        google.script.run.withSuccessHandler(function(serverRecords) {\n' +
'          salesRecords = serverRecords || [];\n' +
'          renderTable();\n' +
'          updateStats();\n' +
'        }).withFailureHandler(function() { loadLocalFallback(); }).apiGetSales();\n' +
'      } else {\n' +
'        loadLocalFallback();\n' +
'      }\n' +
'    }\n' +
'\n' +
'    function loadLocalFallback() {\n' +
'      try { const s = localStorage.getItem(STORAGE_KEY); salesRecords = s ? JSON.parse(s) : []; } catch(e){ salesRecords = []; }\n' +
'      renderTable(); updateStats();\n' +
'    }\n' +
'\n' +
'    function refreshDataFromGas() {\n' +
'      if (isGasEnvironment) {\n' +
'        google.script.run.withSuccessHandler(function(serverRecords) {\n' +
'          salesRecords = serverRecords || [];\n' +
'          renderTable(); updateStats(); showToast("Data berhasil disegarkan dari Google Sheets!");\n' +
'        }).apiGetSales();\n' +
'      } else { loadLocalFallback(); showToast("Data disegarkan"); }\n' +
'    }\n' +
'\n' +
'    function autoDetectBrandCategory(val) {\n' +
'      const upper = val.toUpperCase();\n' +
'      const b = document.getElementById("brandInput");\n' +
'      const c = document.getElementById("categoryInput");\n' +
'      if (upper.includes("IGAME") || upper.includes("COLORFUL") || upper.includes("VULCAN") || upper.includes("NEPTUNE")) b.value = "COLORFUL";\n' +
'      else if (upper.includes("ROG") || upper.includes("TUF") || upper.includes("ASUS") || upper.includes("DUAL") || upper.includes("PRIME")) b.value = "ASUS";\n' +
'      else if (upper.includes("MAG") || upper.includes("MSI") || upper.includes("TOMAHAWK") || upper.includes("VENTUS")) b.value = "MSI";\n' +
'      else if (upper.includes("INTEL") || upper.includes("CORE I") || upper.includes("14700") || upper.includes("13400") || upper.includes("14400") || upper.includes("14600") || upper.includes("14900")) b.value = "INTEL";\n' +
'      else if (upper.includes("RYZEN") || upper.includes("AMD") || upper.includes("7800X3D")) b.value = "AMD";\n' +
'      else if (upper.includes("AOC") || upper.includes("AGON") || upper.includes("24G2")) b.value = "AOC";\n' +
'      else if (upper.includes("GIGABYTE") || upper.includes("AORUS")) b.value = "GIGABYTE";\n' +
'      if (upper.includes("RTX") || upper.includes("GTX") || upper.includes("VGA") || upper.includes("5090") || upper.includes("5080") || upper.includes("5070") || upper.includes("4090") || upper.includes("4080") || upper.includes("4070") || upper.includes("4060")) c.value = "VGA / Graphic Card";\n' +
'      else if (upper.includes("B760") || upper.includes("Z790") || upper.includes("B650") || upper.includes("MAINBOARD") || upper.includes("MOTHERBOARD")) c.value = "Motherboard";\n' +
'      else if (upper.includes("CORE I") || upper.includes("RYZEN") || upper.includes("PROCESSOR") || upper.includes("14700") || upper.includes("13400") || upper.includes("7800X3D")) c.value = "Processor";\n' +
'      else if (upper.includes("MONITOR") || upper.includes("DISPLAY") || upper.includes("24G2")) c.value = "Monitor";\n' +
'      else if (upper.includes("SSD") || upper.includes("NVME") || upper.includes("STORAGE")) c.value = "Storage / SSD";\n' +
'      else if (upper.includes("RAM") || upper.includes("DDR5") || upper.includes("DDR4") || upper.includes("MEMORY")) c.value = "RAM / Memory";\n' +
'    }\n' +
'\n' +
'    function calculateSubtotal() {\n' +
'      const q = Number(document.getElementById("qtyInput").value) || 1;\n' +
'      const p = Number(document.getElementById("priceInput").value) || 0;\n' +
'      document.getElementById("calculatedTotalDisplay").textContent = formatRupiah(q * p);\n' +
'    }\n' +
'\n' +
'    function formatRupiah(n) { return "Rp " + Number(n || 0).toLocaleString("id-ID"); }\n' +
'\n' +
'    function fillDemoQuick() {\n' +
'      document.getElementById("partnerInput").value = "Mugen Comp";\n' +
'      document.getElementById("itemTypeInput").value = "iGame GeForce RTX 5090 Vulcan OC 24GB";\n' +
'      document.getElementById("brandInput").value = "COLORFUL";\n' +
'      document.getElementById("categoryInput").value = "VGA / Graphic Card";\n' +
'      document.getElementById("qtyInput").value = "2";\n' +
'      document.getElementById("priceInput").value = "48500000";\n' +
'      document.getElementById("statusInput").value = "selesai";\n' +
'      document.getElementById("notesInput").value = "PO-MUGEN-001";\n' +
'      calculateSubtotal();\n' +
'    }\n' +
'\n' +
'    let editingRecordId = null;\n' +
'\n' +
'    function editRecord(id) {\n' +
'      const r = salesRecords.find(x => x.id === id);\n' +
'      if (!r) return;\n' +
'      editingRecordId = id;\n' +
'      document.getElementById("partnerInput").value = r.partner || "";\n' +
'      document.getElementById("itemTypeInput").value = r.itemType || "";\n' +
'      document.getElementById("brandInput").value = r.brand || "COLORFUL";\n' +
'      document.getElementById("categoryInput").value = r.category || "VGA / Graphic Card";\n' +
'      document.getElementById("qtyInput").value = r.quantity || 1;\n' +
'      document.getElementById("priceInput").value = r.unitPrice || "";\n' +
'      document.getElementById("statusInput").value = (r.status || "selesai").toLowerCase();\n' +
'      document.getElementById("notesInput").value = r.notes || "";\n' +
'      calculateSubtotal();\n' +
'      const btnText = document.getElementById("saveBtnText");\n' +
'      if (btnText) btnText.textContent = "Simpan Revisi #" + id;\n' +
'      document.getElementById("salesForm").scrollIntoView({ behavior: "smooth" });\n' +
'      showToast("Data transaksi " + id + " siap direvisi.");\n' +
'    }\n' +
'\n' +
'    function handleFormSubmit(e) {\n' +
'      e.preventDefault();\n' +
'      const q = Number(document.getElementById("qtyInput").value) || 1;\n' +
'      const p = Number(document.getElementById("priceInput").value) || 0;\n' +
'      const partner = document.getElementById("partnerInput").value.trim();\n' +
'      const itemType = document.getElementById("itemTypeInput").value.trim();\n' +
'      const brand = document.getElementById("brandInput").value.trim() || "LAINNYA";\n' +
'      const category = document.getElementById("categoryInput").value.trim();\n' +
'      const status = document.getElementById("statusInput").value;\n' +
'      const notes = document.getElementById("notesInput").value.trim();\n' +
'\n' +
'      if (editingRecordId) {\n' +
'        const idx = salesRecords.findIndex(x => x.id === editingRecordId);\n' +
'        if (idx !== -1) {\n' +
'          salesRecords[idx] = {\n' +
'            ...salesRecords[idx],\n' +
'            partner: partner,\n' +
'            itemType: itemType,\n' +
'            brand: brand,\n' +
'            category: category,\n' +
'            quantity: q,\n' +
'            unitPrice: p,\n' +
'            totalAmount: q * p,\n' +
'            status: status,\n' +
'            notes: notes\n' +
'          };\n' +
'          const updated = salesRecords[idx];\n' +
'          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(salesRecords)); } catch(err){}\n' +
'          renderTable(); updateStats();\n' +
'          const targetId = editingRecordId;\n' +
'          editingRecordId = null;\n' +
'          document.getElementById("saveBtnText").textContent = "Simpan Transaksi";\n' +
'          document.getElementById("itemTypeInput").value = "";\n' +
'          document.getElementById("qtyInput").value = "1";\n' +
'          document.getElementById("priceInput").value = "";\n' +
'          document.getElementById("notesInput").value = "";\n' +
'          calculateSubtotal();\n' +
'          if (isGasEnvironment) {\n' +
'            google.script.run.withSuccessHandler(function() {\n' +
'              showToast("Revisi transaksi " + targetId + " berhasil disimpan ke Sheets!");\n' +
'            }).apiUpdateSale(updated);\n' +
'          } else { showToast("Revisi berhasil disimpan!"); }\n' +
'          return;\n' +
'        }\n' +
'      }\n' +
'\n' +
'      const rec = {\n' +
'        id: "TX-" + Math.floor(1000 + Math.random() * 9000),\n' +
'        date: new Date().toISOString().slice(0, 16),\n' +
'        partner: partner,\n' +
'        itemType: itemType,\n' +
'        brand: brand,\n' +
'        category: category,\n' +
'        quantity: q,\n' +
'        unitPrice: p,\n' +
'        totalAmount: q * p,\n' +
'        status: status,\n' +
'        notes: notes\n' +
'      };\n' +
'      salesRecords.unshift(rec);\n' +
'      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(salesRecords)); } catch(err){}\n' +
'      renderTable(); updateStats();\n' +
'      document.getElementById("itemTypeInput").value = "";\n' +
'      document.getElementById("qtyInput").value = "1";\n' +
'      document.getElementById("priceInput").value = "";\n' +
'      document.getElementById("notesInput").value = "";\n' +
'      calculateSubtotal();\n' +
'      if (isGasEnvironment) {\n' +
'        const btnText = document.getElementById("saveBtnText");\n' +
'        btnText.textContent = "Menyimpan...";\n' +
'        google.script.run.withSuccessHandler(function() {\n' +
'          btnText.textContent = "Simpan Transaksi";\n' +
'          showToast("Tersimpan di Google Sheets & Web App!");\n' +
'        }).apiSaveSale(rec);\n' +
'      } else { showToast("Transaksi berhasil dicatat!"); }\n' +
'    }\n' +
'\n' +
'    function deleteRecord(id) {\n' +
'      if (confirm("Hapus transaksi ini dari Google Sheets?")) {\n' +
'        salesRecords = salesRecords.filter(r => r.id !== id);\n' +
'        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(salesRecords)); } catch(err){}\n' +
'        renderTable(); updateStats();\n' +
'        if (isGasEnvironment) { google.script.run.apiDeleteSale(id); showToast("Dihapus dari Google Sheets!"); }\n' +
'        else { showToast("Dihapus"); }\n' +
'      }\n' +
'    }\n' +
'\n' +
'    function resetDataPrompt() {\n' +
'      if (confirm("Kosongkan semua data dan buat lembar baru yang bersih?")) {\n' +
'        salesRecords = [];\n' +
'        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(salesRecords)); } catch(err){}\n' +
'        renderTable(); updateStats();\n' +
'        if (isGasEnvironment) { google.script.run.apiClearAllSales(); showToast("Google Sheets dikosongkan!"); }\n' +
'        else { showToast("Lembar baru siap diisi!"); }\n' +
'      }\n' +
'    }\n' +
'\n' +
'    function renderTable() {\n' +
'      const s = (document.getElementById("searchFilter").value || "").toLowerCase();\n' +
'      const st = document.getElementById("statusFilter").value;\n' +
'      const flt = salesRecords.filter(r => {\n' +
'        const mS = !s || (r.partner && r.partner.toLowerCase().includes(s)) || (r.itemType && r.itemType.toLowerCase().includes(s)) || (r.brand && r.brand.toLowerCase().includes(s));\n' +
'        const mSt = st === "all" || r.status === st;\n' +
'        return mS && mSt;\n' +
'      });\n' +
'      document.getElementById("recordCount").textContent = flt.length;\n' +
'      const tbody = document.getElementById("salesTableBody");\n' +
'      if (flt.length === 0) {\n' +
'        tbody.innerHTML = "<tr><td colspan=\\"10\\" class=\\"py-12 text-center text-slate-500\\">Belum ada data transaksi. Silakan input atau klik Contoh Demo.</td></tr>";\n' +
'        return;\n' +
'      }\n' +
'      tbody.innerHTML = flt.map(r => {\n' +
'        const badge = r.status === "selesai" ? "<span class=\\"px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20\\">SELESAI</span>" : (r.status === "pending" ? "<span class=\\"px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20\\">PENDING</span>" : "<span class=\\"px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20\\">DIKIRIM</span>");\n' +
'        return "<tr class=\\"hover:bg-slate-800/40 transition\\"><td class=\\"py-2.5 px-3 font-mono text-[11px] text-slate-400\\">" + r.id + "</td><td class=\\"py-2.5 px-3 text-[11px] text-slate-400\\">" + (r.date||"").replace("T"," ") + "</td><td class=\\"py-2.5 px-3 font-medium text-slate-200\\">" + r.partner + "</td><td class=\\"py-2.5 px-3\\"><span class=\\"px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700\\">" + r.brand + "</span></td><td class=\\"py-2.5 px-3 text-slate-200 font-medium\\">" + r.itemType + "</td><td class=\\"py-2.5 px-3 text-center font-mono text-slate-300\\">" + r.quantity + "</td><td class=\\"py-2.5 px-3 text-right font-mono text-slate-400\\">" + formatRupiah(r.unitPrice) + "</td><td class=\\"py-2.5 px-3 text-right font-mono font-bold text-emerald-400\\">" + formatRupiah(r.totalAmount) + "</td><td class=\\"py-2.5 px-3 text-center\\">" + badge + "</td><td class=\\"py-2.5 px-3 text-center whitespace-nowrap\\"><button onclick=\\"editRecord(\'" + r.id + "\')\\" title=\\"Revisi Transaksi\\" class=\\"text-amber-400 hover:text-amber-300 font-bold p-1 mr-2 text-[11px] cursor-pointer\\"><i class=\\"fa-solid fa-pen-to-square\\"></i> Revisi</button><button onclick=\\"deleteRecord(\'" + r.id + "\')\\" title=\\"Hapus Transaksi\\" class=\\"text-rose-400 hover:text-rose-300 p-1 rounded transition cursor-pointer\\"><i class=\\"fa-regular fa-trash-can\\"></i></button></td></tr>";\n' +
'      }).join("");\n' +
'    }\n' +
'\n' +
'    function updateStats() {\n' +
'      const totAmt = salesRecords.reduce((s, r) => s + (Number(r.totalAmount)||0), 0);\n' +
'      const totQty = salesRecords.reduce((s, r) => s + (Number(r.quantity)||0), 0);\n' +
'      document.getElementById("statTotalAmount").textContent = formatRupiah(totAmt);\n' +
'      document.getElementById("statTotalCount").textContent = salesRecords.length.toLocaleString("id-ID");\n' +
'      document.getElementById("statTotalQty").textContent = totQty.toLocaleString("id-ID") + " Unit";\n' +
'      const bCounts = {};\n' +
'      salesRecords.forEach(r => { const b = r.brand || "LAINNYA"; bCounts[b] = (bCounts[b] || 0) + (Number(r.totalAmount) || 0); });\n' +
'      let topB = "-", maxB = 0;\n' +
'      for (const [k, v] of Object.entries(bCounts)) { if (v > maxB) { maxB = v; topB = k; } }\n' +
'      document.getElementById("statTopBrand").textContent = topB;\n' +
'      document.getElementById("statTopBrandSub").textContent = maxB > 0 ? formatRupiah(maxB) : "Kontribusi Tertinggi";\n' +
'      updateMonthlySummary();\n' +
'    }\n' +
'\n' +
'    function updateMonthlySummary() {\n' +
'      const mMap = {};\n' +
'      const mNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];\n' +
'      salesRecords.forEach(r => {\n' +
'        if (!r.date) return;\n' +
'        const d = new Date(r.date);\n' +
'        if (isNaN(d.getTime())) return;\n' +
'        const k = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");\n' +
'        if (!mMap[k]) mMap[k] = { label: mNames[d.getMonth()] + " " + d.getFullYear(), count: 0, qty: 0, total: 0 };\n' +
'        mMap[k].count++; mMap[k].qty += Number(r.quantity)||0; mMap[k].total += Number(r.totalAmount)||0;\n' +
'      });\n' +
'      const arr = Object.values(mMap).reverse();\n' +
'      const tbody = document.getElementById("monthlySummaryBody");\n' +
'      if (arr.length === 0) { tbody.innerHTML = "<tr><td colspan=\\"6\\" class=\\"py-4 text-center text-slate-500 font-sans\\">Belum ada riwayat bulanan.</td></tr>"; return; }\n' +
'      const max = Math.max(...arr.map(m => m.total), 1);\n' +
'      tbody.innerHTML = arr.map(m => {\n' +
'        const pct = Math.min(100, Math.round((m.total/max)*100));\n' +
'        return "<tr class=\\"hover:bg-slate-800/40 transition\\"><td class=\\"py-2 px-3 font-sans font-semibold text-slate-200\\">" + m.label + "</td><td class=\\"py-2 px-3 text-right text-blue-400\\">" + m.count + " trx</td><td class=\\"py-2 px-3 text-right text-amber-400\\">" + m.qty + " Unit</td><td class=\\"py-2 px-3 text-right text-emerald-400 font-bold\\">" + formatRupiah(m.total) + "</td><td class=\\"py-2 px-3 text-right text-slate-400\\">" + formatRupiah(m.count > 0 ? Math.round(m.total/m.count) : 0) + "</td><td class=\\"py-2 px-3 text-center\\"><div class=\\"w-20 bg-slate-800 h-2 rounded-full overflow-hidden mx-auto\\"><div class=\\"bg-emerald-400 h-full rounded-full\\" style=\\"width:" + pct + "%\\"></div></div></td></tr>";\n' +
'      }).join("");\n' +
'    }\n' +
'\n' +
'    function exportCsv() {\n' +
'      if (salesRecords.length === 0) { alert("Tidak ada data transaksi!"); return; }\n' +
'      const rows = salesRecords.map(r => [r.id, r.date, r.partner, r.brand, r.itemType, r.quantity, r.unitPrice, r.totalAmount, r.status, r.notes]);\n' +
'      const csv = "data:text/csv;charset=utf-8,ID,Tanggal,Partner,Brand,Produk,Qty,Harga,Total,Status,Catatan\\n" + rows.map(e => e.join(",")).join("\\n");\n' +
'      const a = document.createElement("a"); a.href = encodeURI(csv); a.download = "penjualan.csv"; document.body.appendChild(a); a.click(); document.body.removeChild(a);\n' +
'    }\n' +
'\n' +
'    window.addEventListener("DOMContentLoaded", () => { initData(); });\n' +
'  </script>\n' +
'</body>\n' +
'</html>';
}

/**
 * =========================================================================
 * 📱 INTEGRASI TELEGRAM BOT & WHATSAPP GATEWAY (script.gs)
 * =========================================================================
 */

/**
 * Mendapatkan konfigurasi Telegram dari ScriptProperties
 */
function getTelegramConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    botToken: props.getProperty("TELEGRAM_BOT_TOKEN") || "",
    chatId: props.getProperty("TELEGRAM_CHAT_ID") || "",
    fonnteToken: props.getProperty("FONNTE_TOKEN") || ""
  };
}

/**
 * Menyimpan konfigurasi Telegram
 */
function setTelegramConfig(botToken, chatId, fonnteToken) {
  var props = PropertiesService.getScriptProperties();
  if (botToken !== undefined) props.setProperty("TELEGRAM_BOT_TOKEN", String(botToken).trim());
  if (chatId !== undefined) props.setProperty("TELEGRAM_CHAT_ID", String(chatId).trim());
  if (fonnteToken !== undefined) props.setProperty("FONNTE_TOKEN", String(fonnteToken).trim());
  return { status: "success" };
}

/**
 * Modal konfigurasi Telegram di Google Sheets UI
 */
function showTelegramConfigModal() {
  var ui = SpreadsheetApp.getUi();
  var config = getTelegramConfig();

  var tokenPrompt = ui.prompt(
    "1. Konfigurasi Telegram Bot Token",
    "Masukkan Token Bot dari @BotFather:\n(Saat ini: " + (config.botToken ? config.botToken.substring(0, 10) + "..." : "Belum diisi") + ")",
    ui.ButtonSet.OK_CANCEL
  );

  if (tokenPrompt.getSelectedButton() !== ui.Button.OK) return;
  var tokenVal = tokenPrompt.getResponseText().trim() || config.botToken;

  var chatPrompt = ui.prompt(
    "2. Konfigurasi Chat ID / Grup ID Telegram",
    "Masukkan Chat ID tujuan notifikasi (dapat dicek via @userinfobot):\n(Saat ini: " + (config.chatId || "Belum diisi") + ")",
    ui.ButtonSet.OK_CANCEL
  );

  if (chatPrompt.getSelectedButton() !== ui.Button.OK) return;
  var chatVal = chatPrompt.getResponseText().trim() || config.chatId;

  setTelegramConfig(tokenVal, chatVal);

  ui.alert(
    "Konfigurasi Berhasil Disimpan!",
    "Token dan Chat ID Telegram berhasil disimpan ke sistem.\n\n" +
    "Silakan klik menu '🚀 Tes Kirim Notifikasi ke Telegram' untuk memastikan pesan terkirim!",
    ui.ButtonSet.OK
  );
}

/**
 * Mengirim pesan langsung ke Telegram
 */
function sendTelegramDirectMessage(chatId, messageText) {
  var config = getTelegramConfig();
  var token = config.botToken;
  var targetChatId = chatId || config.chatId;

  if (!token || !targetChatId) {
    Logger.log("Telegram Bot Token atau Chat ID belum disetel.");
    return false;
  }

  var url = "https://api.telegram.org/bot" + token + "/sendMessage";
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: targetChatId,
      text: messageText,
      parse_mode: "Markdown"
    }),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var resJson = JSON.parse(response.getContentText());
    return resJson.ok;
  } catch (e) {
    Logger.log("Gagal kirim pesan ke Telegram: " + e.toString());
    return false;
  }
}

/**
 * Mengirim Notifikasi Transaksi Baru ke Telegram
 */
function sendTelegramNotification(sale, customChatId) {
  var config = getTelegramConfig();
  if (!config.botToken) return;

  var qty = Number(sale.quantity) || 1;
  var price = Number(sale.pricePerUnit || sale.unitPrice) || 0;
  var total = Number(sale.totalAmount) || (qty * price);

  var text =
    "🔔 *PENJUALAN BARU DICATAT!*\n\n" +
    "🏪 *Partner:* " + (sale.partner || "-") + "\n" +
    "🏷️ *Brand:* " + (sale.brand || "-") + "\n" +
    "📦 *Produk:* " + (sale.itemType || "-") + "\n" +
    "🔢 *Qty:* " + qty + " " + (sale.unit || "Unit") + "\n" +
    "💰 *Harga Satuan:* Rp " + price.toLocaleString("id-ID") + "\n" +
    "💵 *Total Transaksi:* Rp " + total.toLocaleString("id-ID") + "\n" +
    "📅 *Waktu:* " + (sale.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm")) + "\n" +
    "📌 *Status:* " + String(sale.status || "SELESAI").toUpperCase() +
    (sale.notes ? ("\n📝 *Catatan:* " + sale.notes) : "");

  sendTelegramDirectMessage(customChatId || config.chatId, text);
}

/**
 * Tes kirim notifikasi dari Spreadsheet
 */
function testSendTelegramNotification() {
  var config = getTelegramConfig();
  if (!config.botToken || !config.chatId) {
    SpreadsheetApp.getUi().alert(
      "Bot Belum Disetel",
      "Silakan klik menu '📱 Setup Bot Telegram & Notifikasi' terlebih dahulu untuk memasukkan Token dan Chat ID.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  var success = sendTelegramDirectMessage(
    config.chatId,
    "🚀 *TES NOTIFIKASI TELEGRAM BERHASIL!*\n\n" +
    "Sistem Distributor Sales Pro telah terhubung dengan bot Telegram Anda.\n" +
    "Setiap penjualan baru akan otomatis dilaporkan ke sini!"
  );

  if (success) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Pesan tes berhasil terkirim ke Telegram!", "Sukses", 5);
  } else {
    SpreadsheetApp.getUi().alert("Gagal Mengirim", "Periksa kembali Token dan Chat ID Anda.", SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Kirim Rekap Hari Ini ke Telegram
 */
function sendTodaySummaryToTelegram() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (!sheet || sheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert("Belum ada data transaksi di sheet 'Data Penjualan'.");
    return;
  }

  var todayPrefix = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getValues();

  var count = 0;
  var totalQty = 0;
  var totalNominal = 0;
  var brandBreakdown = {};

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var dateVal = row[1];
    var dateStr = dateVal instanceof Date ? Utilities.formatDate(dateVal, "GMT+7", "yyyy-MM-dd") : String(dateVal);

    if (dateStr.indexOf(todayPrefix) !== -1) {
      count++;
      var q = Number(row[7]) || 0;
      var tot = Number(row[10]) || 0;
      var br = String(row[3] || "Lainnya");

      totalQty += q;
      totalNominal += tot;
      brandBreakdown[br] = (brandBreakdown[br] || 0) + tot;
    }
  }

  var text =
    "📊 *REKAP PENJUALAN HARI INI*\n" +
    "📅 Tanggal: " + Utilities.formatDate(new Date(), "GMT+7", "EEEE, dd MMMM yyyy") + "\n\n" +
    "🛒 *Total Transaksi:* " + count + " transaksi\n" +
    "📦 *Total Unit Terjual:* " + totalQty.toLocaleString("id-ID") + " unit\n" +
    "💰 *Total Omset:* Rp " + totalNominal.toLocaleString("id-ID") + "\n\n" +
    "🏷️ *Rincian per Brand:*";

  var brands = Object.keys(brandBreakdown);
  if (brands.length > 0) {
    for (var b = 0; b < brands.length; b++) {
      text += "\n• " + brands[b] + ": Rp " + brandBreakdown[brands[b]].toLocaleString("id-ID");
    }
  } else {
    text += "\n(Belum ada transaksi pada hari ini)";
  }

  var success = sendTelegramDirectMessage(null, text);
  if (success) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Rekap hari ini terkirim ke Telegram!", "Terkirim", 5);
  }
}

/**
 * Handle Webhook Masuk dari Telegram (Saat user chat ke bot)
 */
function handleTelegramWebhook(payload) {
  try {
    var msg = payload.message;
    var chatId = msg.chat.id;
    var rawText = (msg.text || msg.caption || "").trim();
    var fromName = msg.from ? (msg.from.first_name || "Partner") : "Partner";

    // 1. Perintah /start atau /help
    if (rawText === "/start" || rawText.indexOf("/help") === 0 || rawText.indexOf("/bantuan") === 0) {
      var welcome =
        "👋 *Halo " + fromName + "!*\n" +
        "Selamat datang di *Bot Distributor Sales Pro*.\n\n" +
        "📌 *Perintah yang Tersedia:*\n" +
        "• `/rekap` atau `/omset` - Melihat ringkasan penjualan hari ini\n" +
        "• `/id` - Cek Chat ID Telegram Anda ini\n\n" +
        "✍️ *Input Transaksi Langsung Lewat Chat:*\n" +
        "Anda bisa langsung mencatat penjualan dengan format:\n" +
        "`Mugen Comp, iGame RTX 5080, 2unit, 30500000`\n" +
        "atau cukup:\n" +
        "`i7-14700F Rp5.850.000 1pcs`\n\n" +
        "_Bot akan otomatis mendeteksi brand, produk, nominal, dan mencatatnya ke Google Sheets!_";
      sendTelegramDirectMessage(chatId, welcome);
      return createJsonResponse({ status: "ok" });
    }

    // 2. Perintah /id
    if (rawText === "/id") {
      sendTelegramDirectMessage(chatId, "🆔 *Chat ID Anda:* `" + chatId + "`\n\nGunakan ID ini untuk konfigurasi notifikasi.");
      return createJsonResponse({ status: "ok" });
    }

    // 3. Perintah /rekap atau /omset
    if (rawText === "/rekap" || rawText === "/omset" || rawText.indexOf("/laporan") === 0) {
      sendTodaySummaryToTelegramDirect(chatId);
      return createJsonResponse({ status: "ok" });
    }

    // 4. Input Transaksi Otomatis dari Teks Chat
    if (rawText.length >= 4) {
      var parsedSale = parseChatTextToSale(rawText, fromName);
      apiSaveSale(parsedSale);

      var confirmation =
        "✅ *TRANSAKSI BERHASIL DICATAT KE GOOGLE SHEETS!*\n\n" +
        "🆔 *ID:* `" + parsedSale.id + "`\n" +
        "🏪 *Partner:* " + parsedSale.partner + "\n" +
        "🏷️ *Brand:* " + parsedSale.brand + "\n" +
        "📦 *Produk:* " + parsedSale.itemType + "\n" +
        "🔢 *Qty:* " + parsedSale.quantity + " " + parsedSale.unit + "\n" +
        "💰 *Harga:* Rp " + Number(parsedSale.unitPrice).toLocaleString("id-ID") + "\n" +
        "💵 *Total:* Rp " + Number(parsedSale.totalAmount).toLocaleString("id-ID") + "\n" +
        "📅 *Waktu:* " + parsedSale.date + "\n\n" +
        "Status: *SELESAI*";

      sendTelegramDirectMessage(chatId, confirmation);
      return createJsonResponse({ status: "ok", id: parsedSale.id });
    }

    return createJsonResponse({ status: "ignored" });
  } catch (err) {
    Logger.log("handleTelegramWebhook error: " + err);
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

/**
 * Kirim ringkasan ke chat tertentu
 */
function sendTodaySummaryToTelegramDirect(chatId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (!sheet || sheet.getLastRow() < 2) {
    sendTelegramDirectMessage(chatId, "ℹ️ Belum ada transaksi penjualan di sistem.");
    return;
  }

  var todayPrefix = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getValues();

  var count = 0, totalQty = 0, totalNominal = 0;
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var dateVal = row[1];
    var dateStr = dateVal instanceof Date ? Utilities.formatDate(dateVal, "GMT+7", "yyyy-MM-dd") : String(dateVal);
    if (dateStr.indexOf(todayPrefix) !== -1) {
      count++;
      totalQty += Number(row[7]) || 0;
      totalNominal += Number(row[10]) || 0;
    }
  }

  var text =
    "📊 *REKAP PENJUALAN HARI INI*\n" +
    "📅 " + Utilities.formatDate(new Date(), "GMT+7", "dd MMMM yyyy HH:mm") + "\n\n" +
    "🛒 Transaksi: *" + count + "*\n" +
    "📦 Unit Terjual: *" + totalQty.toLocaleString("id-ID") + " Unit*\n" +
    "💰 Total Omset: *Rp " + totalNominal.toLocaleString("id-ID") + "*";

  sendTelegramDirectMessage(chatId, text);
}

/**
 * Parser teks dari chat Telegram ke objek Transaksi Penjualan
 */
function parseChatTextToSale(text, senderName) {
  var upper = text.toUpperCase();
  var partner = "Telegram (" + senderName + ")";

  // 1. Ekstrak Partner jika ada format "Partner, Produk, Qty, Harga"
  var parts = text.split(/,|\n/);
  var cleanItem = text;
  if (parts.length >= 3) {
    partner = parts[0].trim();
    cleanItem = parts.slice(1).join(" ");
  }

  // 2. Ekstrak Kuantitas
  var qty = 1;
  var qtyMatch = text.match(/(\d+)\s*(?:unit|pcs|pc|set|dus|buah)/i) || text.match(/qty\s*:?\s*(\d+)/i);
  if (qtyMatch) {
    qty = parseInt(qtyMatch[1], 10);
  }

  // 3. Ekstrak Harga
  var price = 0;
  var priceMatch = text.match(/(?:rp\.?|idr)\s*([\d\.,]{4,})/i) || text.match(/(\d{6,10})/);
  if (priceMatch) {
    var rawNum = priceMatch[1].replace(/[^\d]/g, "");
    price = parseInt(rawNum, 10) || 0;
  }

  // 4. Deteksi Brand
  var brand = "OTHER";
  var subBrand = "-";
  var category = "Hardware";

  if (upper.includes("IGAME") || upper.includes("COLORFUL") || upper.includes("BATTLE-AX")) {
    brand = "COLORFUL"; category = "GPU / VGA Card";
  } else if (upper.includes("ASUS") || upper.includes("ROG") || upper.includes("TUF")) {
    brand = "ASUS"; category = "Motherboard";
  } else if (upper.includes("MSI") || upper.includes("VENTUS") || upper.includes("MAG")) {
    brand = "MSI"; category = "Motherboard";
  } else if (upper.includes("GIGABYTE") || upper.includes("AORUS") || upper.includes("WINDFORCE")) {
    brand = "GIGABYTE"; category = "GPU / VGA Card";
  } else if (upper.includes("INTEL") || upper.includes("CORE I") || upper.includes("I3-") || upper.includes("I5-") || upper.includes("I7-") || upper.includes("I9-")) {
    brand = "INTEL"; category = "Processor";
  } else if (upper.includes("AMD") || upper.includes("RYZEN")) {
    brand = "AMD"; category = "Processor";
  } else if (upper.includes("AOC") || upper.includes("MONITOR")) {
    brand = "AOC"; category = "Monitor";
  }

  // Bersihkan nama item dari nominal harga
  cleanItem = cleanItem.replace(/(?:rp\.?|idr)\s*[\d\.,]+/gi, "")
                       .replace(/\d+\s*(?:unit|pcs|pc|set|dus)/gi, "")
                       .trim();
  if (cleanItem.length < 3) cleanItem = text;

  var total = price * qty;
  var id = "TX-" + Math.floor(1000 + Math.random() * 9000);
  var dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm");

  return {
    id: id,
    date: dateStr,
    partner: partner,
    brand: brand,
    subBrand: subBrand,
    category: category,
    itemType: cleanItem,
    quantity: qty,
    unit: "Unit",
    pricePerUnit: price,
    unitPrice: price,
    totalAmount: total,
    status: "SELESAI",
    notes: "Dicatat via Telegram Bot"
  };
}

/**
 * Daftarkan Webhook Telegram secara otomatis
 * Jalankan 1x di Apps Script setelah melakukan Deploy Web App!
 */
function setTelegramWebhook() {
  var config = getTelegramConfig();
  if (!config.botToken) {
    throw new Error("Bot Token belum disetel. Jalankan showTelegramConfigModal()");
  }

  var webAppUrl = ScriptApp.getService().getUrl();
  var url = "https://api.telegram.org/bot" + config.botToken + "/setWebhook?url=" + encodeURIComponent(webAppUrl);
  var res = UrlFetchApp.fetch(url);
  Logger.log(res.getContentText());
  return res.getContentText();
}

