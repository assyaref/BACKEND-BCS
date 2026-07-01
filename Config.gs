// =====================================================
// Building Care System Enterprise v3.5
// Config.gs
// Radiant Group Duri
// =====================================================

const CONFIG = {
  APP: {
    NAME: "Building Care System",
    VERSION: "3.5.0",
    COMPANY: "Radiant Group Duri"
  },

  DATABASE: {
    SS_ID: "1ksOLFDFIq7S1-U2Juhot9CffyEMWwVHsBE4eDj2143c"
  },

  DRIVE: {
    FOLDER_ID: "1TjBR_FODBqgwTtWMQxfG7zTeBBZcu7o0"
  },

  TIMEZONE: "Asia/Jakarta",

  DATE_FORMAT: {
    DATE: "yyyy-MM-dd",
    DATETIME: "yyyy-MM-dd HH:mm:ss",
    TIME: "HH:mm:ss"
  },

  STATUS: {
    OPEN: "OPEN",
    PROGRESS: "PROGRESS",
    DONE: "DONE"
  },

  CATEGORY: {
    AC: "AC",
    LISTRIK: "LISTRIK",
    GEDUNG: "GEDUNG"
  },

  SESSION: {
    EXPIRED_HOURS: 8
  },

  DASHBOARD: {
    RECENT_ACTIVITY_LIMIT: 5,
    MONTH_COUNT: 12,
    DEFAULT_ONLINE_USER: 1
  }
};

const SHEET = {
  USERS: "USERS",
  REPORT: "REPORT",
  ACTIVITY: "ACTIVITY",
  ERROR_LOG: "ERROR_LOG",
  USER_SESSION: "SESSION"
};

CONFIG.SHEET = {
  USERS: SHEET.USERS,
  REPORT: SHEET.REPORT,
  ACTIVITY: SHEET.ACTIVITY,
  ERROR_LOG: SHEET.ERROR_LOG,
  USER_SESSION: SHEET.USER_SESSION
};

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

const SECURITY = {
  HASH: "SHA-256",
  TOKEN_LENGTH: 36
};

const CACHE = {
  DASHBOARD_KEY: "BCS_DASHBOARD",
  EXPIRE: 60
};
