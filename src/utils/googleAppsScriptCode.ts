/**
 * Script Google Apps Script untuk Aplikasi Catatan Penjualan Distributor
 * Siap langsung di-copy paste ke Google Sheets (Ekstensi > Apps Script).
 */

export const GOOGLE_APPS_SCRIPT_SOURCE = `/**
 * =========================================================================
 * DISTRIBUTOR SALES PRO - GOOGLE APPS SCRIPT
 * Sistem Pencatatan & Sinkronisasi Penjualan Distributor (Komputer / Toko)
 * =========================================================================
 *
 * CARA MENGGUNAKAN (TINGGAL COPY-PASTE):
 * 1. Buka Google Sheets baru di browser Anda: https://sheets.new
 * 2. Di menu atas Google Sheets, klik: Ekstensi (Extensions) > Apps Script
 * 3. Hapus seluruh kode bawaan yang ada di editor, lalu PASTE kode ini seluruhnya.
 * 4. Klik ikon Simpan (Ctrl + S atau Cmd + S).
 * 5. Kembali ke tab Google Sheets Anda, lalu REFRESH halaman.
 *    -> Akan muncul Menu Baru di atas: "📊 Distributor Sales Pro"
 *    -> Klik menu "⚙️ Setup Format & Header Tabel" untuk otomatis merapikan tabel!
 *
 * (OPSIONAL) JADIKAN SEBAGAI WEB API / WEBHOOK (Untuk kirim otomatis dari Web App):
 * 1. Di editor Apps Script, klik tombol biru "Terapkan" (Deploy) > "Penerapan Baru" (New deployment).
 * 2. Klik ikon gerigi (Select type) > pilih "Aplikasi Web" (Web app).
 * 3. Isi:
 *    - Deskripsi: API Penjualan Distributor
 *    - Jalankan sebagai: "Saya (email Anda)"
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone)
 * 4. Klik "Terapkan" (Deploy) dan setujui izin akun Google Anda.
 * 5. Salin URL Aplikasi Web yang berakhiran "/exec", lalu paste ke aplikasi web ini!
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
    .addItem("🧹 Kosongkan Data Transaksi (Mulai Baru)", "clearDataTransactions")
    .addItem("ℹ️ Petunjuk Penggunaan & Webhook API", "showInstructions")
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

  // Header 13 Kolom standar aplikasi
  var headers = [
    "No ID",
    "Tanggal & Waktu",
    "Nama Partner",
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

  // Set nilai header
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // Styling Header (Emerald Dark Theme)
  headerRange
    .setBackground("#065F46")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(10)
    .setFontFamily("Segoe UI")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);

  sheet.setRowHeight(1, 36);
  sheet.setFrozenRows(1);

  var maxRows = Math.max(sheet.getMaxRows(), 500);

  // Format Angka Rupiah untuk Kolom J (Harga) & Kolom K (Total)
  var currencyFormat = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
  sheet.getRange(2, 10, maxRows - 1, 2).setNumberFormat(currencyFormat);

  // Format Angka Qty (Kolom H)
  sheet.getRange(2, 8, maxRows - 1, 1).setNumberFormat("#,##0");

  // Alignment kolom
  sheet.getRange(2, 1, maxRows - 1, 1).setHorizontalAlignment("center"); // ID
  sheet.getRange(2, 2, maxRows - 1, 1).setHorizontalAlignment("center"); // Tanggal
  sheet.getRange(2, 8, maxRows - 1, 2).setHorizontalAlignment("center"); // Qty & Satuan
  sheet.getRange(2, 12, maxRows - 1, 1).setHorizontalAlignment("center"); // Status

  // Dropdown Validasi Status pada Kolom L (Status)
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
    if (i === 7 && colWidth < 220) sheet.setColumnWidth(i, 240); // Nama barang lebih lebar
    if (i === 13 && colWidth < 180) sheet.setColumnWidth(i, 180); // Catatan
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
 * 2. REKAP BULANAN & DASHBOARD PERFORMA
 * Membuat sheet baru dengan tabel rekap otomatis per bulan, per brand, dan KPI card
 */
function generateMonthlySummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var salesSheet = ss.getSheetByName(SHEET_NAME_SALES);

  if (!salesSheet || salesSheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert(
      "Belum ada data di sheet 'Data Penjualan'. Masukkan data transaksi terlebih dahulu."
    );
    return;
  }

  var summarySheet = ss.getSheetByName(SHEET_NAME_SUMMARY);
  if (!summarySheet) {
    summarySheet = ss.insertSheet(SHEET_NAME_SUMMARY, 1);
  } else {
    summarySheet.clear();
  }

  summarySheet.setTabColor("#065F46");
  summarySheet.showSheet();

  // Title
  summarySheet.getRange("A1").setValue("RINGKASAN & ANALITIK PENJUALAN DISTRIBUTOR");
  summarySheet.getRange("A1:G1").merge()
    .setBackground("#065F46")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(14)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  summarySheet.setRowHeight(1, 44);

  // KPI Cards
  summarySheet.getRange("A3").setValue("TOTAL OMZET");
  summarySheet.getRange("A4").setFormula("=SUM('" + SHEET_NAME_SALES + "'!K2:K)");

  summarySheet.getRange("C3").setValue("TOTAL UNIT TERJUAL");
  summarySheet.getRange("C4").setFormula("=SUM('" + SHEET_NAME_SALES + "'!H2:H)");

  summarySheet.getRange("E3").setValue("JUMLAH TRANSAKSI");
  summarySheet.getRange("E4").setFormula("=COUNTA('" + SHEET_NAME_SALES + "'!A2:A)");

  summarySheet.getRange("G3").setValue("TRANSAKSI SELESAI");
  summarySheet.getRange("G4").setFormula("=COUNTIF('" + SHEET_NAME_SALES + "'!L2:L, \\"SELESAI\\")");

  var kpiHeaderRange = summarySheet.getRange("A3:H3");
  kpiHeaderRange
    .setFontSize(9)
    .setFontColor("#64748B")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  var kpiValueRange = summarySheet.getRange("A4:H4");
  kpiValueRange
    .setFontSize(14)
    .setFontWeight("bold")
    .setFontColor("#0F172A")
    .setHorizontalAlignment("center");

  summarySheet.getRange("A4").setNumberFormat('_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)');
  summarySheet.getRange("C4").setNumberFormat('#,##0 "Unit"');
  summarySheet.getRange("E4").setNumberFormat('#,##0 "Transaksi"');
  summarySheet.getRange("G4").setNumberFormat('#,##0 "Transaksi"');

  // Style KPI boxes
  ["A3:B4", "C3:D4", "E3:F4", "G3:H4"].forEach(function(box) {
    summarySheet.getRange(box)
      .setBorder(true, true, true, true, false, false, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID)
      .setBackground("#F8FAFC");
  });

  // Ambil data penjualan untuk kalkulasi tabel dinamis
  var salesData = salesSheet.getRange(2, 1, salesSheet.getLastRow() - 1, 13).getValues();

  var monthlyMap = {};
  var brandMap = {};
  var partnerMap = {};

  for (var i = 0; i < salesData.length; i++) {
    var row = salesData[i];
    var rawDate = row[1];
    var partner = row[2] || "Lainnya";
    var brand = row[3] || "NON-BRAND";
    var qty = Number(row[7]) || 0;
    var totalAmount = Number(row[10]) || 0;

    var monthKey = "Bulan Berjalan";
    if (rawDate) {
      var d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        var year = d.getFullYear();
        var mNum = d.getMonth() + 1;
        var mStr = (mNum < 10 ? "0" : "") + mNum;
        monthKey = year + "-" + mStr;
      } else if (typeof rawDate === "string" && rawDate.length >= 7) {
        monthKey = rawDate.slice(0, 7);
      }
    }

    // Monthly aggregation
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { txCount: 0, qty: 0, omzet: 0 };
    monthlyMap[monthKey].txCount += 1;
    monthlyMap[monthKey].qty += qty;
    monthlyMap[monthKey].omzet += totalAmount;

    // Brand aggregation
    if (!brandMap[brand]) brandMap[brand] = { txCount: 0, qty: 0, omzet: 0 };
    brandMap[brand].txCount += 1;
    brandMap[brand].qty += qty;
    brandMap[brand].omzet += totalAmount;

    // Partner aggregation
    if (!partnerMap[partner]) partnerMap[partner] = { txCount: 0, qty: 0, omzet: 0 };
    partnerMap[partner].txCount += 1;
    partnerMap[partner].qty += qty;
    partnerMap[partner].omzet += totalAmount;
  }

  // --- TABEL 1: REKAP BULANAN ---
  summarySheet.getRange("A7").setValue("📅 Tren Performa Penjualan Per Bulan");
  summarySheet.getRange("A7:D7").merge()
    .setBackground("#0F766E")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(10);

  var monthHeaders = ["Periode Bulan", "Jumlah Transaksi", "Total Qty (Unit)", "Total Omzet (Rp)"];
  summarySheet.getRange(8, 1, 1, 4).setValues([monthHeaders])
    .setBackground("#E2E8F0").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");

  var sortedMonths = Object.keys(monthlyMap).sort();
  var monthRows = [];
  for (var m = 0; m < sortedMonths.length; m++) {
    var k = sortedMonths[m];
    monthRows.push([k, monthlyMap[k].txCount, monthlyMap[k].qty, monthlyMap[k].omzet]);
  }

  if (monthRows.length > 0) {
    var mRange = summarySheet.getRange(9, 1, monthRows.length, 4);
    mRange.setValues(monthRows);
    summarySheet.getRange(9, 1, monthRows.length, 1).setHorizontalAlignment("center");
    summarySheet.getRange(9, 2, monthRows.length, 2).setHorizontalAlignment("center");
    summarySheet.getRange(9, 4, monthRows.length, 1).setNumberFormat('_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)');
  }

  // --- TABEL 2: PERFORMA BRAND ---
  summarySheet.getRange("F7").setValue("🏷️ Rekap Penjualan Berdasarkan Brand");
  summarySheet.getRange("F7:I7").merge()
    .setBackground("#1E40AF")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(10);

  var brandHeaders = ["Nama Brand", "Transaksi", "Total Unit", "Total Omzet (Rp)"];
  summarySheet.getRange(8, 6, 1, 4).setValues([brandHeaders])
    .setBackground("#E2E8F0").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");

  var sortedBrands = Object.keys(brandMap).sort(function(a, b) {
    return brandMap[b].omzet - brandMap[a].omzet;
  });
  var brandRows = [];
  for (var b = 0; b < sortedBrands.length; b++) {
    var br = sortedBrands[b];
    brandRows.push([br, brandMap[br].txCount, brandMap[br].qty, brandMap[br].omzet]);
  }

  if (brandRows.length > 0) {
    var bRange = summarySheet.getRange(9, 6, brandRows.length, 4);
    bRange.setValues(brandRows);
    summarySheet.getRange(9, 6, brandRows.length, 1).setFontWeight("bold");
    summarySheet.getRange(9, 7, brandRows.length, 2).setHorizontalAlignment("center");
    summarySheet.getRange(9, 9, brandRows.length, 1).setNumberFormat('_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)');
  }

  // Auto-resize
  for (var c = 1; c <= 10; c++) {
    summarySheet.autoResizeColumn(c);
  }

  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(summarySheet);
  SpreadsheetApp.getActiveSpreadsheet().toast("Rekap bulanan & performa brand berhasil diperbarui!", "Analitik Siap", 5);
}

/**
 * 3. ISI CONTOH DATA DEMO (MUGEN COMP & PART PC)
 */
function loadDemoData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME_SALES);
  }

  var nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm");

  var sampleRows = [
    [
      "TX-" + Utilities.getUuid().slice(0, 6).toUpperCase(),
      nowStr,
      "Mugen Comp",
      "ASUS",
      "Dual OC White Edition",
      "GPU / VGA Card",
      "VGA Asus Dual RTX 4060 White 8GB",
      3,
      "Unit",
      5650000,
      16950000,
      "SELESAI",
      "Order Toko Fisik via WA"
    ],
    [
      "TX-" + Utilities.getUuid().slice(0, 6).toUpperCase(),
      nowStr,
      "Mugen Comp",
      "INTEL",
      "Core i5 Series",
      "Processor (CPU)",
      "Proc Intel Core i5 13400F Tray + Fan",
      5,
      "Pcs",
      2450000,
      12250000,
      "SELESAI",
      "Stok toko akhir pekan"
    ],
    [
      "TX-" + Utilities.getUuid().slice(0, 6).toUpperCase(),
      nowStr,
      "Mugen Comp",
      "CORSAIR",
      "Vengeance Series",
      "RAM / Memory",
      "RAM Corsair Vengeance RGB DDR5 32GB 6000MHz",
      4,
      "Kit",
      1850000,
      7400000,
      "SELESAI",
      "Garansi distributor resmi"
    ],
    [
      "TX-" + Utilities.getUuid().slice(0, 6).toUpperCase(),
      nowStr,
      "Mugen Comp",
      "SAMSUNG",
      "980 PRO",
      "Storage (SSD / HDD)",
      "SSD Samsung 980 Pro 1TB NVMe Gen4",
      5,
      "Pcs",
      1420000,
      7100000,
      "SELESAI",
      "Promo bundle weekend"
    ],
    [
      "TX-" + Utilities.getUuid().slice(0, 6).toUpperCase(),
      nowStr,
      "Enterkomputer",
      "MSI",
      "MAG Series",
      "Motherboard (MOBO)",
      "Motherboard MSI MAG B760M Mortar WiFi",
      2,
      "Unit",
      2750000,
      5500000,
      "DIKIRIM",
      "Kurir toko pick up jam 14:00"
    ],
    [
      "TX-" + Utilities.getUuid().slice(0, 6).toUpperCase(),
      nowStr,
      "Nano Komputer",
      "GIGABYTE",
      "Gaming OC",
      "GPU / VGA Card",
      "VGA Gigabyte RTX 4070 Super 12GB Gaming OC",
      1,
      "Unit",
      10950000,
      10950000,
      "PENDING",
      "Menunggu konfirmasi transfer bank"
    ]
  ];

  var startRow = sheet.getLastRow() + 1;
  if (startRow <= 1) startRow = 2;

  sheet.getRange(startRow, 1, sampleRows.length, 13).setValues(sampleRows);
  SpreadsheetApp.getActiveSpreadsheet().toast("Berhasil menambahkan 6 data contoh transaksi!", "Sukses", 5);
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
    "Konfirmasi Bersihkan Lembar Kerja",
    "Apakah Anda yakin ingin mengosongkan semua baris data transaksi pada sheet 'Data Penjualan'? Header tabel akan tetap dipertahankan.",
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
 * 6. TAMPILKAN PETUNJUK PENGGUNAAN
 */
function showInstructions() {
  var ui = SpreadsheetApp.getUi();
  var msg =
    "=== DISTRIBUTOR SALES PRO - PETUNJUK PENGGUNAAN ===\\n\\n" +
    "1. Menu 'Setup Format & Header Tabel':\\n" +
    "   Menyiapkan sheet 'Data Penjualan' lengkap dengan warna status, format Rp, dan dropdown status.\\n\\n" +
    "2. Menu 'Buat Rekap Bulanan & Pivot Otomatis':\\n" +
    "   Membuat sheet 'Rekap Bulanan & Performa' yang otomatis menghitung omzet bulanan dan performa brand.\\n\\n" +
    "3. Integrasi Webhook / Web App (Kirim dari Aplikasi Web):\\n" +
    "   Klik tombol 'Terapkan' (Deploy) > 'Penerapan Baru' (New Deployment) > Pilih 'Aplikasi Web' (Web App).\\n" +
    "   Set 'Siapa yang memiliki akses' ke 'Siapa saja' (Anyone).\\n" +
    "   Salin URL Web App dan tempelkan ke aplikasi web.";
  ui.alert("Petunjuk Aplikasi", msg, ui.ButtonSet.OK);
}

/**
 * =========================================================================
 * WEBHOOK & REST API HANDLER (doPost & doGet)
 * Menerima kiriman data langsung dari Web Application
 * =========================================================================
 */

/**
 * Endpoint POST untuk menerima data transaksi baru atau sinkronisasi massal
 */
function doPost(e) {
  try {
    var contents = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var payload = JSON.parse(contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME_SALES);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME_SALES);
    }

    var action = payload.action || "addSale";

    // 1. TAMBAH 1 TRANSAKSI
    if (action === "addSale" && payload.data) {
      var row = formatSaleRecordToRow(payload.data);
      sheet.appendRow(row);
      return createJsonResponse({
        status: "success",
        message: "Transaksi berhasil dicatat ke Google Sheets",
        id: payload.data.id
      });
    }

    // 2. TAMBAH BANYAK TRANSAKSI SEKALIGUS (BULK)
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

    // 3. SINKRONISASI LENGKAP (REPLACE ALL DENGAN DATA DARI WEB APP)
    if (action === "syncAll" && Array.isArray(payload.data)) {
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).clearContent();
      }
      var allRows = payload.data.map(formatSaleRecordToRow);
      if (allRows.length > 0) {
        sheet.getRange(2, 1, allRows.length, 13).setValues(allRows);
      }
      // Otomatis refresh rekap bulanan jika ada data
      try {
        generateMonthlySummary();
      } catch (err) {}

      return createJsonResponse({
        status: "success",
        message: "Sinkronisasi berhasil! " + allRows.length + " transaksi disimpan ke Google Sheets",
        count: allRows.length
      });
    }

    // 4. KOSONGKAN DATA
    if (action === "clearSheet") {
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).clearContent();
      }
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
 * Endpoint GET untuk membaca data transaksi dari Google Sheets ke format JSON
 */
function doGet(e) {
  if (e && e.parameter && (e.parameter.format === "json" || e.parameter.action === "read" || e.parameter.action === "api")) {
    return handleGetJsonApi(e);
  }

  try {
    return HtmlService.createTemplateFromFile("index")
      .evaluate()
      .setTitle("Catatan Penjualan Cepat (Mobile Sales Tracker)")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput(getEmbeddedWebAppHtml())
      .setTitle("Catatan Penjualan Cepat (Mobile Sales Tracker)")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

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

function apiSaveSale(record) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME_SALES);
  }
  var row = formatSaleRecordToRow(record);
  sheet.appendRow(row);
  return { status: "success", id: record.id };
}

function apiDeleteSale(saleId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (!sheet || sheet.getLastRow() < 2) return { status: "not_found" };

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(saleId)) {
      sheet.deleteRow(i + 2);
      return { status: "success" };
    }
  }
  return { status: "not_found" };
}

function apiClearAllSales() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_SALES);
  if (sheet && sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).clearContent();
  }
  return { status: "success" };
}

function apiLoadDemoData() {
  loadDemoData();
  return apiGetSales();
}

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

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getEmbeddedWebAppHtml() {
  return '<!DOCTYPE html>\\n' +
'<html lang="id">\\n' +
'<head>\\n' +
'  <meta charset="UTF-8">\\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">\\n' +
'  <title>Catatan Penjualan Cepat (Mobile Sales Tracker) - Google Web App</title>\\n' +
'  <script src="https://cdn.tailwindcss.com"></script>\\n' +
'  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\\n' +
'  <link rel="preconnect" href="https://fonts.googleapis.com">\\n' +
'  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\\n' +
'  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">\\n' +
'  <style>\\n' +
'    body { font-family: "Plus Jakarta Sans", sans-serif; }\\n' +
'    .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }\\n' +
'    .custom-scroll::-webkit-scrollbar-track { background: #0f172a; }\\n' +
'    .custom-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }\\n' +
'  </style>\\n' +
'</head>\\n' +
'<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white">\\n' +
'  <header class="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 py-3">\\n' +
'    <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">\\n' +
'      <div class="flex items-center gap-3">\\n' +
'        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl"><i class="fa-solid fa-cube"></i></div>\\n' +
'        <div><div class="flex items-center gap-2"><h1 class="font-bold text-slate-100 text-base md:text-lg">Catatan Penjualan Cepat</h1><span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">GOOGLE SHEETS LIVE</span></div><p class="text-xs text-slate-400 hidden sm:block">Aplikasi Web Penjualan Distributor Komputer & Toko</p></div>\\n' +
'      </div>\\n' +
'      <div class="flex items-center gap-2">\\n' +
'        <button onclick="refreshDataFromGas()" id="refreshBtn" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"><i class="fa-solid fa-rotate text-emerald-400" id="refreshIcon"></i><span class="hidden sm:inline">Refresh Sheet</span></button>\\n' +
'        <button onclick="resetDataPrompt()" class="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-medium border border-red-800/40 flex items-center gap-1.5 transition"><i class="fa-regular fa-file"></i><span>Lembar Baru</span></button>\\n' +
'      </div>\\n' +
'    </div>\\n' +
'  </header>\\n' +
'  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">\\n' +
'    <div class="bg-emerald-950/40 border border-emerald-700/50 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300">\\n' +
'      <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>Terhubung langsung ke Google Sheets. Data otomatis tersimpan ke spreadsheet Anda.</span></div>\\n' +
'      <span class="text-[11px] text-emerald-400/80 font-mono hidden md:inline">Google Apps Script Web App</span>\\n' +
'    </div>\\n' +
'    <section class="grid grid-cols-2 md:grid-cols-4 gap-3">\\n' +
'      <div class="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5"><div class="text-slate-400 text-xs mb-1">Total Omzet</div><div id="statTotalAmount" class="text-lg md:text-xl font-bold font-mono text-emerald-400">Rp 0</div></div>\\n' +
'      <div class="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5"><div class="text-slate-400 text-xs mb-1">Total Transaksi</div><div id="statTotalCount" class="text-lg md:text-xl font-bold font-mono text-blue-400">0</div></div>\\n' +
'      <div class="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5"><div class="text-slate-400 text-xs mb-1">Volume Unit</div><div id="statTotalQty" class="text-lg md:text-xl font-bold font-mono text-amber-400">0 Unit</div></div>\\n' +
'      <div class="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5"><div class="text-slate-400 text-xs mb-1">Top Brand</div><div id="statTopBrand" class="text-base md:text-lg font-bold text-purple-400 truncate">-</div></div>\\n' +
'    </section>\\n' +
'    <section class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">\\n' +
'      <div class="flex items-center justify-between mb-2"><h2 class="font-bold text-slate-100 text-sm md:text-base">Input Transaksi Cepat</h2><button type="button" onclick="fillDemoQuick()" class="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">Contoh Demo</button></div>\\n' +
'      <form id="salesForm" onsubmit="handleFormSubmit(event)" class="space-y-4">\\n' +
'        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">\\n' +
'          <div><label class="block text-xs font-medium text-slate-300 mb-1">Partner / Toko *</label><input type="text" id="partnerInput" required placeholder="Mugen Comp" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"></div>\\n' +
'          <div class="sm:col-span-1 lg:col-span-2"><label class="block text-xs font-medium text-slate-300 mb-1">Nama Barang / Produk *</label><input type="text" id="itemTypeInput" required placeholder="Asus Dual RTX 4060" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"></div>\\n' +
'          <div><label class="block text-xs font-medium text-slate-300 mb-1">Brand *</label><select id="brandInput" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"><option value="ASUS">ASUS</option><option value="COLORFUL">COLORFUL</option><option value="MSI">MSI</option><option value="INTEL">INTEL</option><option value="AOC">AOC</option><option value="LAINNYA">LAINNYA</option></select></div>\\n' +
'        </div>\\n' +
'        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">\\n' +
'          <div class="col-span-2 sm:col-span-2 lg:col-span-1"><label class="block text-xs font-medium text-slate-300 mb-1">Kategori</label><select id="categoryInput" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"><option value="VGA / Graphic Card">VGA Card</option><option value="Motherboard">Motherboard</option><option value="Processor">Processor</option><option value="Monitor">Monitor</option><option value="Storage / SSD">Storage</option></select></div>\\n' +
'          <div><label class="block text-xs font-medium text-slate-300 mb-1">Qty (Unit) *</label><input type="number" id="qtyInput" min="1" value="1" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono text-center"></div>\\n' +
'          <div><label class="block text-xs font-medium text-slate-300 mb-1">Harga Satuan (Rp) *</label><input type="number" id="priceInput" min="0" step="1000" placeholder="0" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono text-right"></div>\\n' +
'          <div><label class="block text-xs font-medium text-slate-300 mb-1">Status</label><select id="statusInput" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"><option value="selesai">SELESAI</option><option value="pending">PENDING</option><option value="dikirim">DIKIRIM</option><option value="batal">BATAL</option></select></div>\\n' +
'          <div class="col-span-2 sm:col-span-4 lg:col-span-1"><label class="block text-xs font-medium text-slate-300 mb-1">Catatan</label><input type="text" id="notesInput" placeholder="No PO" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"></div>\\n' +
'        </div>\\n' +
'        <div class="flex items-center justify-between pt-3 border-t border-slate-800">\\n' +
'          <button type="submit" id="saveSubmitBtn" class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2"><i class="fa-solid fa-plus"></i><span id="saveBtnText">Simpan Transaksi</span></button>\\n' +
'        </div>\\n' +
'      </form>\\n' +
'    </section>\\n' +
'    <section class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">\\n' +
'      <div class="flex items-center justify-between"><h2 class="font-bold text-slate-100 text-sm md:text-base">Daftar Transaksi Penjualan</h2><span id="recordCount" class="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">0</span></div>\\n' +
'      <div class="overflow-x-auto custom-scroll rounded-xl border border-slate-800"><table class="w-full text-left text-xs text-slate-300"><thead class="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800"><tr><th class="py-3 px-3">No ID</th><th class="py-3 px-3">Waktu</th><th class="py-3 px-3">Partner</th><th class="py-3 px-3">Brand</th><th class="py-3 px-3">Produk</th><th class="py-3 px-3 text-center">Qty</th><th class="py-3 px-3 text-right">Harga</th><th class="py-3 px-3 text-right">Total</th><th class="py-3 px-3 text-center">Status</th><th class="py-3 px-3 text-center">Aksi</th></tr></thead><tbody id="salesTableBody" class="divide-y divide-slate-800/60 bg-slate-900/40"></tbody></table></div>\\n' +
'    </section>\\n' +
'  </main>\\n' +
'  <div id="toast" class="fixed bottom-5 right-5 z-50 transform translate-y-20 opacity-0 transition-all duration-300 bg-slate-900 border border-emerald-500 text-slate-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2"><i class="fa-solid fa-circle-check text-emerald-400" id="toastIcon"></i><span id="toastMsg">Data berhasil disimpan!</span></div>\\n' +
'  <script>\\n' +
'    const STORAGE_KEY = "distributor_sales_pro_records"; let salesRecords = [];\\n' +
'    const isGasEnvironment = (typeof google !== "undefined" && google.script && google.script.run);\\n' +
'    function showToast(msg, isError) { const t = document.getElementById("toast"); document.getElementById("toastMsg").textContent = msg; t.className = isError ? "fixed bottom-5 right-5 z-50 transform translate-y-0 opacity-100 transition-all duration-300 bg-red-950 border border-red-500 text-slate-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2" : "fixed bottom-5 right-5 z-50 transform translate-y-0 opacity-100 transition-all duration-300 bg-slate-900 border border-emerald-500 text-slate-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2"; setTimeout(() => { t.classList.add("translate-y-20", "opacity-0"); t.classList.remove("translate-y-0", "opacity-100"); }, 3500); }\\n' +
'    function initData() { if (isGasEnvironment) { google.script.run.withSuccessHandler(function(s) { salesRecords = s || []; renderTable(); updateStats(); }).apiGetSales(); } else { try { const s = localStorage.getItem(STORAGE_KEY); salesRecords = s ? JSON.parse(s) : []; } catch(e){} renderTable(); updateStats(); } }\\n' +
'    function refreshDataFromGas() { if (isGasEnvironment) { google.script.run.withSuccessHandler(function(s) { salesRecords = s || []; renderTable(); updateStats(); showToast("Disegarkan dari Google Sheets!"); }).apiGetSales(); } else { showToast("Data lokal disegarkan"); } }\\n' +
'    function formatRupiah(n) { return "Rp " + Number(n || 0).toLocaleString("id-ID"); }\\n' +
'    function fillDemoQuick() { document.getElementById("partnerInput").value = "Mugen Comp"; document.getElementById("itemTypeInput").value = "iGame GeForce RTX 5090 Vulcan OC 24GB"; document.getElementById("brandInput").value = "COLORFUL"; document.getElementById("qtyInput").value = "2"; document.getElementById("priceInput").value = "48500000"; }\\n' +
'    function handleFormSubmit(e) { e.preventDefault(); const q = Number(document.getElementById("qtyInput").value) || 1; const p = Number(document.getElementById("priceInput").value) || 0; const rec = { id: "TX-" + Math.floor(1000 + Math.random() * 9000), date: new Date().toISOString().slice(0, 16), partner: document.getElementById("partnerInput").value.trim(), itemType: document.getElementById("itemTypeInput").value.trim(), brand: document.getElementById("brandInput").value.trim() || "LAINNYA", category: document.getElementById("categoryInput").value.trim(), quantity: q, unitPrice: p, totalAmount: q * p, status: document.getElementById("statusInput").value, notes: document.getElementById("notesInput").value.trim() }; salesRecords.unshift(rec); renderTable(); updateStats(); if (isGasEnvironment) { google.script.run.withSuccessHandler(function() { showToast("Tersimpan di Google Sheets & Web App!"); }).apiSaveSale(rec); } else { showToast("Tersimpan!"); } }\\n' +
'    function deleteRecord(id) { if (confirm("Hapus transaksi ini?")) { salesRecords = salesRecords.filter(r => r.id !== id); renderTable(); updateStats(); if (isGasEnvironment) google.script.run.apiDeleteSale(id); showToast("Dihapus"); } }\\n' +
'    function resetDataPrompt() { if (confirm("Kosongkan semua data dan buat lembar baru?")) { salesRecords = []; renderTable(); updateStats(); if (isGasEnvironment) google.script.run.apiClearAllSales(); showToast("Dikosongkan"); } }\\n' +
'    function renderTable() { const tbody = document.getElementById("salesTableBody"); document.getElementById("recordCount").textContent = salesRecords.length; if (salesRecords.length === 0) { tbody.innerHTML = "<tr><td colspan=\\"10\\" class=\\"py-8 text-center text-slate-500\\">Belum ada transaksi. Silakan input atau klik Contoh Demo.</td></tr>"; return; } tbody.innerHTML = salesRecords.map(r => "<tr class=\\"hover:bg-slate-800/40\\"><td class=\\"py-2 px-3 font-mono text-slate-400\\">" + r.id + "</td><td class=\\"py-2 px-3 text-slate-400\\">" + (r.date||"").replace("T"," ") + "</td><td class=\\"py-2 px-3 font-medium text-slate-200\\">" + r.partner + "</td><td class=\\"py-2 px-3 text-slate-300\\">" + r.brand + "</td><td class=\\"py-2 px-3 text-slate-200\\">" + r.itemType + "</td><td class=\\"py-2 px-3 text-center\\">" + r.quantity + "</td><td class=\\"py-2 px-3 text-right font-mono\\">" + formatRupiah(r.unitPrice) + "</td><td class=\\"py-2 px-3 text-right font-mono font-bold text-emerald-400\\">" + formatRupiah(r.totalAmount) + "</td><td class=\\"py-2 px-3 text-center\\">" + r.status + "</td><td class=\\"py-2 px-3 text-center\\"><button onclick=\\"deleteRecord(\'" + r.id + "\')\\" class=\\"text-rose-400\\"><i class=\\"fa-regular fa-trash-can\\"></i></button></td></tr>").join(""); }\\n' +
'    function updateStats() { const totAmt = salesRecords.reduce((s, r) => s + (Number(r.totalAmount)||0), 0); const totQty = salesRecords.reduce((s, r) => s + (Number(r.quantity)||0), 0); document.getElementById("statTotalAmount").textContent = formatRupiah(totAmt); document.getElementById("statTotalCount").textContent = salesRecords.length; document.getElementById("statTotalQty").textContent = totQty + " Unit"; }\\n' +
'    window.addEventListener("DOMContentLoaded", () => { initData(); });\\n' +
'  </script>\\n' +
'</body>\\n' +
'</html>';
}
`;

