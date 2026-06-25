// ======================================================
// Building Care System Enterprise v3.3 Stable
// Config.gs
// Radiant Group Duri
// ======================================================

const CONFIG = {

// ====================================================
// APPLICATION
// ====================================================

APP: {


NAME: "Building Care System",

VERSION: "3.3.0",

COMPANY: "Radiant Group Duri"

},

// ====================================================
// DATABASE
// ====================================================

DATABASE: {


// GANTI DENGAN SPREADSHEET ID ANDA
SS_ID: "1ksOLFDFIq7S1-U2Juhot9CffyEMWwVHsBE4eDj2143c"


},

// ====================================================
// GOOGLE DRIVE
// ====================================================

DRIVE: {


// GANTI DENGAN FOLDER ID UNTUK FOTO REPORT
FOLDER_ID: "1TjBR_FODBqgwTtWMQxfG7zTeBBZcu7o0"


},

// ====================================================
// TIMEZONE
// ====================================================

TIMEZONE: "Asia/Jakarta",

// ====================================================
// DATE FORMAT
// ====================================================

DATE_FORMAT: {


DATE: "yyyy-MM-dd",

DATETIME: "yyyy-MM-dd HH:mm:ss",

TIME: "HH:mm:ss"


},

// ====================================================
// REPORT STATUS
// ====================================================

STATUS: {


OPEN: "OPEN",

PROGRESS: "PROGRESS",

DONE: "DONE"


},

// ====================================================
// REPORT CATEGORY
// ====================================================

CATEGORY: {


AC: "AC",

LISTRIK: "LISTRIK",

GEDUNG: "GEDUNG"


},

// ====================================================
// SESSION
// ====================================================

SESSION: {

EXPIRED_HOURS: 8


},

// ====================================================
// DASHBOARD
// ====================================================

DASHBOARD: {

RECENT_ACTIVITY_LIMIT: 5,

MONTH_COUNT: 12,

DEFAULT_ONLINE_USER: 1


}

};

// ======================================================
// SHEET CONFIGURATION
// ======================================================

const SHEET = {

  USERS: "USERS",

  REPORT: "REPORT",

  ACTIVITY: "ACTIVITY",

  ERROR_LOG: "ERROR_LOG",

  USER_SESSION: "USER_SESSION"

};

CONFIG.SHEET = {

  USERS: SHEET.USERS,

  REPORT: SHEET.REPORT,

  ACTIVITY: SHEET.ACTIVITY,

  ERROR_LOG: SHEET.ERROR_LOG,

  USER_SESSION: SHEET.USER_SESSION

};

// ======================================================
// COLUMN INDEX REPORT
// ======================================================

const REPORT_COLUMN = {

ID: 0,

TANGGAL: 1,

NAMA: 2,

DEPARTEMEN: 3,

LOKASI: 4,

KATEGORI: 5,

DESKRIPSI: 6,

FOTO: 7,

STATUS: 8,

PIC: 9,

UPDATE_AT: 10

};

// ======================================================
// SECURITY
// ======================================================

const SECURITY = {

HASH: "SHA-256",

TOKEN_LENGTH: 36

};

// ======================================================
// CACHE
// ======================================================

const CACHE = {

DASHBOARD_KEY: "BCS_DASHBOARD",

EXPIRE: 60 // detik

};

// ======================================================
// END CONFIG
// ======================================================
