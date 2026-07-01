// =====================================================
// Building Care System Enterprise v3.5
// Utils.gs
// Radiant Group Duri
// =====================================================

"use strict";

function getSpreadsheet() {
  if (!CONFIG.DATABASE || !CONFIG.DATABASE.SS_ID) {
    throw new Error("Spreadsheet ID belum dikonfigurasi.");
  }
  return SpreadsheetApp.openById(CONFIG.DATABASE.SS_ID);
}

function getSheet(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Sheet '" + sheetName + "' tidak ditemukan.");
  }
  return sheet;
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

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

function failure(message, data) {
  return failed(message, data);
}

function generateToken() {
  return Utilities.getUuid();
}

function generateId() {
  const sheet = getSheet(SHEET.REPORT);
  const lastRow = sheet.getLastRow();
  const number = String(lastRow).padStart(3, "0");
  const date = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd");
  return "BCS-" + date + "-" + number;
}

function generateWO() {
  return "WO-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");
}

function generatePMId() {
  return "PM-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");
}

function generateAssetId() {
  return "AST-" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");
}

function now() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, CONFIG.DATE_FORMAT.DATETIME);
}

function formatDate(date) {
  if (!date) return "";
  return Utilities.formatDate(new Date(date), CONFIG.TIMEZONE, CONFIG.DATE_FORMAT.DATETIME);
}

function hashPassword(password) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password));
  return raw.map(b => {
    const value = (b < 0 ? b + 256 : b).toString(16);
    return ("0" + value).slice(-2);
  }).join("");
}

function safeString(value) {
  return String(value || "").trim();
}

function safeNumber(value) {
  const number = Number(value);
  return isNaN(number) ? 0 : number;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function findUser(email) {
  const sheet = getSheet(SHEET.USERS);
  const rows = sheet.getDataRange().getValues();
  email = safeString(email).toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    if (safeString(rows[i][0]).toLowerCase() === email) {
      return {
        row: i + 1,
        email: rows[i][0],
        nik: rows[i][1],
        nama: rows[i][2],
        password: rows[i][3],
        role: rows[i][4],
        status: rows[i][5]
      };
    }
  }
  return null;
}

function findUserByNik(nik) {
  const sheet = getSheet(SHEET.USERS);
  const rows = sheet.getDataRange().getValues();
  nik = safeString(nik);

  for (let i = 1; i < rows.length; i++) {
    if (safeString(rows[i][1]) === nik) {
      return {
        row: i + 1,
        email: rows[i][0],
        nik: rows[i][1],
        nama: rows[i][2],
        password: rows[i][3],
        role: rows[i][4],
        status: rows[i][5]
      };
    }
  }
  return null;
}

function saveActivity(email, action, description) {
  try {
    getSheet(SHEET.ACTIVITY).appendRow([
      Utilities.getUuid(),
      safeString(email),
      safeString(action),
      safeString(description),
      now()
    ]);
  } catch (err) {
    Logger.log(err);
  }
}

function saveError(module, message) {
  try {
    getSheet(SHEET.ERROR_LOG).appendRow([
      Utilities.getUuid(),
      safeString(module),
      safeString(message),
      now()
    ]);
  } catch (err) {
    Logger.log(err);
  }
}

// TEST FUNCTIONS
function testNow() {
  Logger.log(now());
}

function testGenerateId() {
  Logger.log(generateId());
}

function testGenerateWO() {
  Logger.log(generateWO());
}

function testSheet() {
  Logger.log(JSON.stringify(SHEET));
}

function testHash() {
  Logger.log(hashPassword("03233"));
}
