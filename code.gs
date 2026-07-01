// =====================================================
// Building Care System Enterprise v3.6
// Code.gs - Main Router API (Updated for JSONP Login)
// Radiant Group Duri
// =====================================================

/**
 * =====================================================
 * DOOPTIONS - Handle CORS Preflight (JSONP Only)
 * =====================================================
 */
function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * =====================================================
 * DOGET - Handle GET Requests (JSONP Only)
 * =====================================================
 */
function doGet(e) {
  try {
    e = e || {};
    e.parameter = e.parameter || {};

    var action = String(e.parameter.action || "health");
    var callback = String(e.parameter.callback || "");
    var result;

    switch (action) {
      case "version":
        result = {
          success: true,
          data: {
            build: "20-06-2026-09:30",
            app: CONFIG.APP.NAME,
            version: CONFIG.APP.VERSION,
            company: CONFIG.APP.COMPANY,
            sheet: SHEET,
            timezone: CONFIG.TIMEZONE,
            serverTime: now()
          }
        };
        break;

      case "health":
        result = {
          success: true,
          data: {
            app: CONFIG.APP.NAME,
            version: CONFIG.APP.VERSION,
            company: CONFIG.APP.COMPANY,
            status: "ONLINE",
            serverTime: now()
          }
        };
        break;

      // ========== TAMBAHAN UNTUK LOGIN VIA JSONP ==========
      case "login":
        var loginData = {};
        try {
          loginData = JSON.parse(e.parameter.data || "{}");
        } catch (err) {
          loginData.username = e.parameter.username || "";
          loginData.password = e.parameter.password || "";
        }
        result = login(loginData);
        break;
      // =====================================================

      case "getReport":
        var id = String(e.parameter.id || "");
        if (id) {
          result = getReport({ id: id });
        } else {
          result = { success: false, message: "ID laporan tidak ditemukan." };
        }
        break;

      case "getReports":
        result = getReports({});
        break;

      case "getDashboard":
        result = getDashboard({});
        break;

      case "getSummary":
        result = getSummary({});
        break;

      case "getPendingApproval":
        result = getPendingApproval({});
        break;

      case "getMonitoringOverview":
        result = getMonitoringOverview({});
        break;

      default:
        result = {
          success: false,
          message: "Action tidak ditemukan : " + action
        };
        break;
    }

    return jsonpResponse(result, callback);

  } catch (err) {
    try {
      saveError("Code.gs", err.toString());
    } catch (e) {}
    return jsonpResponse({
      success: false,
      message: err.toString()
    }, "");
  }
}

/**
 * =====================================================
 * DOPOST - Handle POST Requests (JSONP & JSON)
 * =====================================================
 */
function doPost(e) {
  try {
    if (!e || !e.postData) {
      return jsonpResponse({
        success: false,
        message: "Request tidak valid."
      }, "");
    }

    var request = {};
    try {
      request = JSON.parse(e.postData.contents || "{}");
    } catch (err) {
      return jsonpResponse({
        success: false,
        message: "Format JSON tidak valid."
      }, "");
    }

    var action = String(request.action || "");
    var data = request.data || {};
    var callback = String(request.callback || "");
    var result;

    switch (action) {
      // AUTH
      case "login":
        result = login(data);
        break;
      case "logout":
        result = logout(data);
        break;
      case "verifySession":
        result = verifySession(data);
        break;

      // DASHBOARD
      case "getDashboard":
        result = getDashboard(data);
        break;
      case "getSummary":
        result = getSummary(data);
        break;
      case "getRecentActivity":
        result = getRecentActivity(data);
        break;
      case "getTopTechnician":
        result = getTopTechnician(data);
        break;

      // REPORT
      case "getReports":
        result = getReports(data);
        break;
      case "getReport":
        result = getReport(data);
        break;
      case "saveReport":
        result = saveReport(data);
        break;
      case "updateReport":
        result = updateReport(data);
        break;
      case "uploadPhoto":
        result = uploadPhoto(data);
        break;

      // MONITORING
      case "getMonitoringOverview":
        result = getMonitoringOverview(data);
        break;

      // APPROVAL
      case "getPendingApproval":
        result = getPendingApproval(data);
        break;
      case "approveReport":
        result = approveReport(data);
        break;
      case "rejectReport":
        result = rejectReport(data);
        break;

      // VERSION
      case "version":
        result = version(data);
        break;

      default:
        result = {
          success: false,
          message: "Action tidak ditemukan : " + action
        };
        break;
    }

    return jsonpResponse(result, callback);

  } catch (err) {
    try {
      saveError("Code.gs", err.toString());
    } catch (e) {}
    return jsonpResponse({
      success: false,
      message: err.toString()
    }, "");
  }
}

/**
 * =====================================================
 * JSONP RESPONSE - Tanpa Header Manual
 * =====================================================
 */
function jsonpResponse(data, callback) {
  var jsonString = JSON.stringify(data);

  if (callback && callback.trim() !== "") {
    var response = callback + "(" + jsonString + ");";
    return ContentService
      .createTextOutput(response)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * =====================================================
 * VERSION API
 * =====================================================
 */
function version() {
  return {
    success: true,
    data: {
      build: "20-06-2026-09:30",
      app: CONFIG.APP.NAME,
      version: CONFIG.APP.VERSION,
      company: CONFIG.APP.COMPANY,
      sheet: SHEET,
      timezone: CONFIG.TIMEZONE,
      serverTime: now()
    }
  };
}

// =====================================================
// FUNGSI PENDUKUNG UNTUK SAVE REPORT
// (DITAMBAHKAN AGAR TIDAK DEPENDENSI FILE LAIN)
// =====================================================

/**
 * RESPONSE HELPERS
 */
function success(data, message) {
  return {
    success: true,
    message: message || "Success",
    data: data || {},
    serverTime: now()
  };
}

function failed(message, data) {
  return {
    success: false,
    message: message || "Failed",
    data: data || {},
    serverTime: now()
  };
}

/**
 * DATE TIME
 */
function now() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, CONFIG.DATE_FORMAT.DATETIME);
}

/**
 * GET SHEET
 */
function getSheet(sheetName) {
  var ss = SpreadsheetApp.openById(CONFIG.DATABASE.SS_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Sheet '" + sheetName + "' tidak ditemukan.");
  }
  return sheet;
}

/**
 * UPLOAD FOTO
 */
function uploadPhoto(base64, fileName) {
  try {
    if (!base64) {
      throw new Error("Data foto kosong.");
    }

    var folder = DriveApp.getFolderById(CONFIG.DRIVE.FOLDER_ID);
    var bytes;
    var contentType = "image/jpeg";

    if (base64.startsWith("data:")) {
      var match = base64.match(/^data:(.*);base64,/);
      if (!match) {
        throw new Error("Format Base64 tidak valid.");
      }
      contentType = match[1];
      bytes = Utilities.base64Decode(base64.split(",")[1]);
    } else {
      bytes = Utilities.base64Decode(base64);
    }

    var extension = contentType.split("/")[1] || "jpg";
    var safeName = fileName
      ? fileName.replace(/[^\w.\-]/g, "_")
      : "photo_" + new Date().getTime() + "." + extension;

    var blob = Utilities.newBlob(bytes, contentType, safeName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileId = file.getId();

    var thumbnailUrl = "https://lh3.googleusercontent.com/d/" + fileId;

    return {
      success: true,
      message: "Upload berhasil",
      fileId: fileId,
      fileName: safeName,
      url: thumbnailUrl,
      previewUrl: thumbnailUrl,
      downloadUrl: "https://drive.google.com/uc?export=download&id=" + fileId,
      driveUrl: "https://drive.google.com/file/d/" + fileId + "/view"
    };

  } catch (err) {
    try {
      saveError("uploadPhoto()", err.toString());
    } catch (e) {}
    return {
      success: false,
      message: err.toString()
    };
  }
}

/**
 * SAVE ERROR LOG
 */
function saveError(module, message) {
  try {
    var sheet = getSheet(SHEET.ERROR_LOG);
    sheet.appendRow([
      new Date().toISOString(),
      module,
      message
    ]);
  } catch (e) {
    Logger.log(e);
  }
}

// =====================================================
// SAVE REPORT - Direct Implementation
// =====================================================
function saveReport(data) {
  try {
    // Validasi
    if (!data) return failed("Data report tidak ditemukan.");

    var required = ["nama", "departemen", "lokasi", "kategori", "deskripsi"];
    for (var i = 0; i < required.length; i++) {
      if (!data[required[i]]) {
        return failed(required[i] + " wajib diisi.");
      }
    }

    // Ambil sheet REPORT
    var sh = getSheet(SHEET.REPORT);
    var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

    var createdAt = now();
    var reportId = "BCS-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");

    // Upload foto jika ada
    var photoUrl = "";
    if (data.photo) {
      var upload = uploadPhoto(data.photo, data.filename);
      if (!upload.success) {
        return failed("Upload foto gagal: " + upload.message);
      }
      photoUrl = upload.url;
    }

    // Buat record
    var record = {
      "ID": reportId,
      "Tanggal": createdAt,
      "Pelapor": data.nama || "",
      "Departemen": data.departemen || "",
      "Lokasi": data.lokasi || "",
      "Kategori": data.kategori || "",
      "Prioritas": data.prioritas || "NORMAL",
      "Deskripsi": data.deskripsi || "",
      "Foto": photoUrl,
      "Status": "OPEN",
      "Last Update": createdAt,
      "Teknisi": "",
      "Catatan Teknisi": "",
      "Tgl Selesai": "",
      "Durasi": "",
      "SLA": ""
    };

    // Buat baris sesuai header
    var rowData = headers.map(function(h) {
      return record[h] || "";
    });

    sh.appendRow(rowData);
    SpreadsheetApp.flush();

    return success({
      reportId: reportId,
      status: "OPEN",
      createdAt: createdAt,
      photoUrl: photoUrl
    }, "Report berhasil disimpan");

  } catch (err) {
    try {
      saveError("saveReport()", err.toString());
    } catch (e) {}
    return failed(err.toString());
  }
}

// =====================================================
// AKHIR CODE.GS
// =====================================================
