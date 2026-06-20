// =====================================================
// Building Care System Enterprise v3.2
// Utils Library
// Radiant Group Duri
// =====================================================

/**
 * =====================================================
 * SPREADSHEET
 * =====================================================
 */

function getSpreadsheet() {

  if (!CONFIG.DATABASE || !CONFIG.DATABASE.SS_ID) {

    throw new Error("Spreadsheet ID belum dikonfigurasi.");

  }

  return SpreadsheetApp.openById(CONFIG.DATABASE.SS_ID);

}

/**
 * =====================================================
 * SHEET
 * =====================================================
 */

function getSheet(sheetName) {

  const sheet = getSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {

    throw new Error("Sheet '" + sheetName + "' tidak ditemukan.");

  }

  return sheet;

}

/**
 * =====================================================
 * JSON RESPONSE
 * =====================================================
 */

function json(data) {

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

}

/**
 * =====================================================
 * SUCCESS RESPONSE
 * =====================================================
 */

function success(data, message) {

  return json({

    success: true,

    message: message || "Success",

    data: data || {},

    serverTime: now()

  });

}

/**
 * =====================================================
 * FAILED RESPONSE
 * =====================================================
 */

function failed(message, data) {

  return json({

    success: false,

    message: message || "Failed",

    data: data || {},

    serverTime: now()

  });

}

/**
 * =====================================================
 * BACKWARD COMPATIBILITY
 * =====================================================
 */

function failure(message, data) {

  return failed(message, data);

}

/**
 * =====================================================
 * TOKEN
 * =====================================================
 */

function generateToken() {

  return Utilities.getUuid();

}

/**
 * =====================================================
 * DATETIME
 * =====================================================
 */

function now() {

  return Utilities.formatDate(

    new Date(),

    CONFIG.TIMEZONE || Session.getScriptTimeZone(),

    "yyyy-MM-dd HH:mm:ss"

  );

}

/**
 * =====================================================
 * HASH PASSWORD
 * =====================================================
 */

function hashPassword(password) {

  const raw = Utilities.computeDigest(

    Utilities.DigestAlgorithm.SHA_256,

    String(password)

  );

  return raw.map(function (b) {

    const value = (b < 0 ? b + 256 : b).toString(16);

    return ("0" + value).slice(-2);

  }).join("");

}

/**
 * =====================================================
 * SAFE HELPER
 * =====================================================
 */

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

/**
 * =====================================================
 * FIND USER BY EMAIL
 * =====================================================
 */

function findUser(email) {

  const sheet = getSheet(SHEET.USERS);

  const data = sheet.getDataRange().getValues();

  email = safeString(email).toLowerCase();

  for (let i = 1; i < data.length; i++) {

    if (

      safeString(data[i][0]).toLowerCase() === email

    ) {

      return {

        row: i + 1,

        email: safeString(data[i][0]),

        nik: safeString(data[i][1]),

        nama: safeString(data[i][2]),

        password: safeString(data[i][3]),

        role: safeString(data[i][4]),

        status: safeString(data[i][5])

      };

    }

  }

  return null;

}

/**
 * =====================================================
 * FIND USER BY NIK
 * =====================================================
 */

function findUserByNik(nik) {

  const sheet = getSheet(SHEET.USERS);

  const data = sheet.getDataRange().getValues();

  nik = safeString(nik);

  for (let i = 1; i < data.length; i++) {

    if (

      safeString(data[i][1]) === nik

    ) {

      return {

        row: i + 1,

        email: safeString(data[i][0]),

        nik: safeString(data[i][1]),

        nama: safeString(data[i][2]),

        password: safeString(data[i][3]),

        role: safeString(data[i][4]),

        status: safeString(data[i][5])

      };

    }

  }

  return null;

}

/**
 * =====================================================
 * SAVE ACTIVITY
 * =====================================================
 */

function saveActivity(email, action, description) {

  try {

    const sheet = getSheet(SHEET.ACTIVITY);

    sheet.appendRow([

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

/**
 * =====================================================
 * SAVE ERROR
 * =====================================================
 */

function saveError(module, message) {

  try {

    const sheet = getSheet(SHEET.ERROR_LOG);

    sheet.appendRow([

      Utilities.getUuid(),

      safeString(module),

      safeString(message),

      now()

    ]);

  } catch (err) {

    Logger.log(err);

  }

}
//tes
function testConfig() {

  Logger.log("CONFIG.TIMEZONE = " + CONFIG.TIMEZONE);
  Logger.log("TYPE = " + typeof CONFIG.TIMEZONE);

}
function testNow(){

  Logger.log(now());

}

function testSheet() {

  Logger.log("===== TEST SHEET =====");

  Logger.log(JSON.stringify(SHEET));

  Logger.log("USERS = " + SHEET.USERS);

  Logger.log("REPORT = " + SHEET.REPORT);

  Logger.log("ACTIVITY = " + SHEET.ACTIVITY);

  Logger.log("ERROR_LOG = " + SHEET.ERROR_LOG);

  Logger.log("USER_SESSION = " + SHEET.USER_SESSION);

}
function testHash() {

  Logger.log(hashPassword("03233"));

}
