// =====================================================
// Building Care System Enterprise v3.3 Stable
// Code.gs
// Main Router API
// Radiant Group Duri
// =====================================================

/**
 * =====================================================
 * GET ROUTER
 * =====================================================
 */
function doGet(e) {

  try {

    e = e || {};
    e.parameter = e.parameter || {};

    const action = String(e.parameter.action || "health");

    switch (action) {

      case "version":

        return success({

          build: "20-06-2026-09:30",

          app: CONFIG.APP.NAME,

          version: CONFIG.APP.VERSION,

          company: CONFIG.APP.COMPANY,

          sheet: SHEET,

          timezone: CONFIG.TIMEZONE,

          serverTime: now()

        });

      case "getDashboard":

        return getDashboard({});

      case "health":

      default:

        return success({

          app: CONFIG.APP.NAME,

          version: CONFIG.APP.VERSION,

          company: CONFIG.APP.COMPANY,

          status: "ONLINE",

          serverTime: now()

        });

    }

  } catch (err) {

    try {
      saveError("Code.gs", err.toString());
    } catch (e) {}

    return failed(err.toString());

  }

}

/**
 * =====================================================
 * POST ROUTER
 * =====================================================
 */
function doPost(e) {

  try {

    if (!e || !e.postData) {

      return failed("Request tidak valid.");

    }

    let request = {};

    try {

      request = JSON.parse(

        e.postData.contents || "{}"

      );

    } catch (err) {

      return failed("Format JSON tidak valid.");

    }

    const action = String(request.action || "");

    const data = request.data || {};

    switch (action) {

      case "login":

        return login(data);

      case "logout":

        return logout(data);

      case "verifySession":

        return verifySession(data);

      case "getDashboard":

        return getDashboard(data);
      
      case "getMonitoringOverview":

  return getMonitoringOverview(data);

      case "saveReport":

        return saveReport(data);

      case "getReport":

        return getReport(data);

      case "updateReport":

        return updateReport(data);

      case "uploadPhoto":

        return uploadPhoto(data);

      case "version":

        return version();

      default:

        return failed(

          "Action tidak ditemukan : " + action

        );

    }

  } catch (err) {

    try {
      saveError("Code.gs", err.toString());
    } catch (e) {}

    return failed(err.toString());

  }

}
/**
 * =====================================================
 * SAVE REPORT
 * Building Care System Enterprise v3.3.3 Stable
 * Smart Header Mapping + Auto Upload Photo
 * =====================================================
 */
function saveReport(data) {
  try {
    // ==========================================
    // VALIDASI DATA
    // ==========================================
    if (!data) return failed("Data report tidak ditemukan.");

    const requiredFields = [
      { field: "nama", message: "Nama pelapor wajib diisi." },
      { field: "departemen", message: "Departemen wajib diisi." },
      { field: "lokasi", message: "Lokasi kerusakan wajib diisi." },
      { field: "kategori", message: "Kategori wajib dipilih." },
      { field: "deskripsi", message: "Deskripsi kerusakan wajib diisi." }
    ];

    for (const item of requiredFields) {
      if (!data[item.field]) return failed(item.message);
    }

    // ==========================================
    // SHEET & HEADER
    // ==========================================
    const sh = getSheet(SHEET.REPORT);
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

    // ==========================================
    // TIMESTAMP & DEFAULT VALUE
    // ==========================================
    const createdAt = now();
    const status = "OPEN";
    const prioritas = data.prioritas || "NORMAL";
    const reportId = "BCS-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");

    // ==========================================
    // UPLOAD FOTO
    // ==========================================
    let photoUrl = "";
    let photoDownloadUrl = "";
    let photoDriveUrl = "";

    if (data.photo) {
      const uploadResult = uploadPhoto(data.photo, data.filename);

      if (!uploadResult.success) {
        return failed("Upload foto gagal: " + uploadResult.message);
      }

      // Gunakan URL yang kompatibel dengan History.js
      photoUrl = uploadResult.url;
      photoDownloadUrl = uploadResult.downloadUrl || "";
      photoDriveUrl = uploadResult.driveUrl || "";
    }

    // ==========================================
    // RECORD OBJECT
    // ==========================================
    const record = {
      "ID": reportId,
      "Tanggal": createdAt,
      "Pelapor": data.nama || "",
      "Departemen": data.departemen || "",
      "Lokasi": data.lokasi || "",
      "Kategori": data.kategori || "",
      "Prioritas": prioritas,
      "Deskripsi": data.deskripsi || "",
      "Foto": photoUrl,
      "Status": status,
      "Last Update": createdAt,
      "Teknisi": "",
      "Catatan Teknisi": "",
      "Tgl Selesai": "",
      "Durasi": "",
      "SLA": ""
    };

    // ==========================================
    // BUILD ROW BY HEADER & SAVE
    // ==========================================
    const rowData = headers.map(header => record[header] || "");
    const nextRow = sh.getLastRow() + 1;

    sh.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
    SpreadsheetApp.flush();

    // ==========================================
    // RESPONSE
    // ==========================================
    return success({
      reportId,
      status,
      createdAt,
      photoUrl,
      downloadUrl: photoDownloadUrl,
      driveUrl: photoDriveUrl,
      message: "Report berhasil disimpan"
    });

  } catch (err) {
    try {
      saveError("saveReport()", err.stack || err.toString());
    } catch (e) {
      Logger.log(e);
    }
    return failed(err.toString());
  }
}
/**
 * =====================================================
 * VERSION API
 * =====================================================
 */
function version() {

  return success({

    build: "20-06-2026-09:30",

    app: CONFIG.APP.NAME,

    version: CONFIG.APP.VERSION,

    company: CONFIG.APP.COMPANY,

    sheet: SHEET,

    timezone: CONFIG.TIMEZONE,

    serverTime: now()

  });

}

/**
 * =====================================================
 * TEST ROUTER
 * =====================================================
 */
function testVersion() {

  Logger.log(

    version().getContent()

  );

}

function testHealth() {

  Logger.log(

    doGet({

      parameter: {

        action: "health"

      }

    }).getContent()

  );

}

//  Tes 
function testPost() {

  const e = {
    postData: {
      contents: JSON.stringify({
        action: "version",
        data: {}
      })
    }
  };


  Logger.log(
    doPost(e).getContent()
  );

}
function testSaveReportAPI() {

  const e = {
    postData: {
      contents: JSON.stringify({
        action: "saveReport",
        data: {
          nama: "TEST",
          departemen: "IT",
          lokasi: "SERVER ROOM",
          kategori: "LISTRIK",
          deskripsi: "TEST"
        }
      })
    }
  };

  const result = doPost(e);

  Logger.log(result);

}
