// =====================================================
// Building Care System Enterprise v3.9 FINAL
// Auth.gs - Complete with monitoring support
// Radiant Group Duri
// =====================================================

"use strict";

// =====================================================
// HELPER: Get session sheet (try multiple names)
// =====================================================
function getSessionSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.DATABASE.SS_ID);
  const possibleNames = ['SESSION', 'USER_SESSION', 'Sessions'];
  for (const name of possibleNames) {
    const sheet = ss.getSheetByName(name);
    if (sheet) return sheet;
  }
  const sheet = ss.insertSheet('SESSION');
  sheet.appendRow(['ID', 'EMAIL', 'TOKEN', 'LOGIN_AT', 'LAST_ACTIVITY', 'EXPIRED_AT', 'CREATED_BY', 'STATUS']);
  return sheet;
}

// =====================================================
// GET SHEET (standar)
// =====================================================
function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.DATABASE.SS_ID);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Sheet "${name}" tidak ditemukan.`);
  return sheet;
}

function now() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, CONFIG.DATE_FORMAT.DATETIME);
}

function generateToken() {
  return Utilities.getUuid() + Utilities.getUuid();
}

function hashPassword(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return digest.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

function success(data, message) {
  return { success: true, message: message || "OK", data: data || {} };
}

function failed(message) {
  return { success: false, message: message || "Failed" };
}

function saveError(tag, errorMsg) {
  try {
    const sheet = getSheet(SHEET.ERROR_LOG);
    sheet.appendRow([now(), tag, errorMsg]);
  } catch (e) {
    Logger.log("Gagal simpan error: " + e);
  }
}

// =====================================================
// SAVE ACTIVITY (4 parameters)
// =====================================================
function saveActivity(email, action, module, description) {
  try {
    const sheet = getSheet(SHEET.ACTIVITY);
    const row = [
      Utilities.getUuid(),
      email || "",
      action || "",
      module || "",
      description || "",
      now()
    ];
    sheet.appendRow(row);
    Logger.log("✅ Activity saved: " + JSON.stringify(row));
  } catch (e) {
    Logger.log("❌ Gagal simpan aktivitas: " + e);
  }
}

// =====================================================
// DEACTIVATE OLD SESSIONS (by token, saat login)
// =====================================================
function deactivateOtherSessions(email, currentToken) {
  try {
    const sheet = getSessionSheet();
    const values = sheet.getDataRange().getValues();
    let deactivated = 0;
    for (let i = 1; i < values.length; i++) {
      const token = String(values[i][2]);
      const status = String(values[i][7]);
      const userEmail = String(values[i][1]);
      if (status === "ACTIVE" && token !== currentToken && userEmail === email) {
        sheet.getRange(i + 1, 8).setValue("INACTIVE");
        deactivated++;
      }
    }
    if (deactivated > 0) {
      console.log(`✅ ${deactivated} old session(s) deactivated for ${email}`);
    }
  } catch (e) {
    Logger.log("Gagal deaktivasi session lama: " + e);
  }
}

// =====================================================
// DEACTIVATE ALL SESSIONS FOR EMAIL (by email)
// =====================================================
function deactivateSessionsByEmail(email) {
  try {
    const sheet = getSessionSheet();
    const values = sheet.getDataRange().getValues();
    let deactivated = 0;
    for (let i = 1; i < values.length; i++) {
      const userEmail = String(values[i][1]);
      const status = String(values[i][7]);
      if (status === "ACTIVE" && userEmail === email) {
        sheet.getRange(i + 1, 8).setValue("INACTIVE");
        deactivated++;
      }
    }
    if (deactivated > 0) {
      console.log(`✅ ${deactivated} session(s) deactivated for ${email}`);
    }
    return deactivated;
  } catch (e) {
    Logger.log("Gagal deaktivasi session by email: " + e);
    return 0;
  }
}

// =====================================================
// CLEANUP EXPIRED SESSIONS
// =====================================================
function cleanupExpiredSessions() {
  try {
    const sheet = getSessionSheet();
    const values = sheet.getDataRange().getValues();
    const nowDate = new Date();
    let cleaned = 0;
    for (let i = 1; i < values.length; i++) {
      const status = String(values[i][7]);
      const expiredAtStr = String(values[i][5]);
      if (status === "ACTIVE" && expiredAtStr) {
        try {
          const expiredDate = new Date(expiredAtStr);
          if (expiredDate < nowDate) {
            sheet.getRange(i + 1, 8).setValue("INACTIVE");
            cleaned++;
          }
        } catch (e) {}
      }
    }
    Logger.log(`🧹 Cleanup complete: ${cleaned} expired sessions deactivated.`);
    return cleaned;
  } catch (e) {
    Logger.log("Gagal cleanup session: " + e);
    return 0;
  }
}

// =====================================================
// FIND USER BY NIK
// =====================================================
function findUserByNik(nik) {
  try {
    const sheet = getSheet(SHEET.USERS);
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return null;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][1]) === nik) {
        return {
          row: i + 1,
          email: values[i][0],
          nik: values[i][1],
          nama: values[i][2],
          password: values[i][3],
          role: values[i][4],
          status: values[i][5]
        };
      }
    }
    return null;
  } catch (e) {
    saveError("findUserByNik", e.toString());
    return null;
  }
}

// =====================================================
// FIND USER BY EMAIL (untuk monitoring)
// =====================================================
function findUserByEmail(email) {
  try {
    const sheet = getSheet(SHEET.USERS);
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === email) {
        return {
          row: i + 1,
          email: values[i][0],
          nik: values[i][1],
          nama: values[i][2],
          password: values[i][3],
          role: values[i][4],
          status: values[i][5]
        };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// =====================================================
// CREATE SESSION
// =====================================================
function createSession(email, token) {
  try {
    const sheet = getSessionSheet();
    const expired = new Date();
    expired.setHours(expired.getHours() + (CONFIG.SESSION.EXPIRED_HOURS || 24));
    sheet.appendRow([
      Utilities.getUuid(),
      email,
      token,
      now(),
      now(),
      Utilities.formatDate(expired, CONFIG.TIMEZONE, CONFIG.DATE_FORMAT.DATETIME),
      email,
      "ACTIVE"
    ]);
    return true;
  } catch (e) {
    Logger.log(e);
    return false;
  }
}

// =====================================================
// LOGIN
// =====================================================
function login(data) {
  try {
    data = data || {};
    const nik = String(data.nik || "").trim();
    const password = String(data.password || "").trim();

    if (!nik || !password) {
      return failed("NIK dan Password wajib diisi.");
    }

    const user = findUserByNik(nik);
    if (!user) {
      saveActivity("", "LOGIN_FAILED", "Login", "User tidak ditemukan - NIK: " + nik);
      return failed("NIK atau Password salah.");
    }

    if (String(user.status).toUpperCase() !== "ACTIVE") {
      saveActivity(user.email, "LOGIN_FAILED", "Login", "Akun tidak aktif");
      return failed("Akun tidak aktif.");
    }

    const passwordMatch = (user.password === password) || (user.password === hashPassword(password));

    if (!passwordMatch) {
      saveActivity(user.email, "LOGIN_FAILED", "Login", "Password salah");
      return failed("NIK atau Password salah.");
    }

    if (user.password === password) {
      const hashed = hashPassword(password);
      getSheet(SHEET.USERS).getRange(user.row, 4).setValue(hashed);
    }

    const token = generateToken();
    deactivateOtherSessions(user.email, token);
    createSession(user.email, token);
    saveActivity(user.email, "LOGIN", "Login", "Login berhasil");

    return success({
      token: token,
      user: {
        email: user.email,
        nik: user.nik,
        nama: user.nama,
        role: user.role,
        status: user.status,
        lastLogin: now()
      }
    }, "Login berhasil");

  } catch (err) {
    saveError("login", err.toString());
    return failed(err.toString());
  }
}

// =====================================================
// LOGOUT - FORCE DEACTIVATE BY EMAIL IF TOKEN NOT FOUND
// =====================================================
function logout(data) {
  try {
    data = data || {};
    const token = String(data.token || "");
    const clientEmail = String(data.email || "").trim();

    console.log("📤 Logout. Token:", token ? token.substring(0,12)+"..." : "EMPTY", "Email:", clientEmail);

    let email = clientEmail || "unknown";
    let found = false;

    // 1. Coba nonaktifkan berdasarkan token
    if (token) {
      try {
        const sheet = getSessionSheet();
        const values = sheet.getDataRange().getValues();
        for (let i = 1; i < values.length; i++) {
          if (String(values[i][2]) === token) {
            sheet.getRange(i + 1, 8).setValue("INACTIVE");
            email = values[i][1] || clientEmail || "unknown";
            found = true;
            console.log("✅ Session deactivated by token for", email);
            break;
          }
        }
      } catch (e) {
        console.warn("⚠️ Gagal update session by token:", e);
      }
    }

    // 2. Jika token tidak ditemukan, nonaktifkan semua session berdasarkan email
    if (!found && clientEmail) {
      const count = deactivateSessionsByEmail(clientEmail);
      if (count > 0) {
        email = clientEmail;
        found = true;
        console.log(`✅ ${count} session(s) deactivated by email for ${clientEmail}`);
      } else {
        console.log("ℹ️ Tidak ada session aktif untuk email:", clientEmail);
      }
    }

    // 3. Jika masih belum ditemukan, catat sebagai unknown
    if (!found && !clientEmail) {
      console.warn("⚠️ Tidak ada token dan email, tidak bisa deaktivasi.");
    }

    // 4. Catat activity
    let description = "Logout berhasil";
    if (!found) {
      description = clientEmail ? "Token tidak ditemukan, deaktivasi by email" : "Token tidak ditemukan, tidak ada email";
    }
    saveActivity(email, "LOGOUT", "Logout", description);

    return success({}, "Logout berhasil");

  } catch (err) {
    console.error("❌ Logout error:", err);
    saveError("logout", err.toString());
    return failed(err.toString());
  }
}

// =====================================================
// VERIFY SESSION
// =====================================================
function verifySession(data) {
  try {
    data = data || {};
    const token = String(data.token || "");
    if (!token) return failed("Session Expired");

    try {
      const sheet = getSessionSheet();
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][2]) === token && String(values[i][7]) === "ACTIVE") {
          sheet.getRange(i + 1, 5).setValue(now());
          return success({
            valid: true,
            email: values[i][1]
          });
        }
      }
    } catch (e) {
      return success({ valid: true });
    }
    return failed("Session Expired");

  } catch (err) {
    saveError("verifySession", err.toString());
    return failed(err.toString());
  }
}

// =====================================================
// GET ACTIVE SESSIONS (untuk monitoring)
// =====================================================
function getActiveSessions() {
  try {
    const sheet = getSessionSheet();
    const values = sheet.getDataRange().getValues();
    const activeUsers = [];
    for (let i = 1; i < values.length; i++) {
      const status = String(values[i][7]);
      if (status === "ACTIVE") {
        const email = String(values[i][1]);
        // Cari user berdasarkan email
        let user = findUserByEmail(email);
        if (user) {
          activeUsers.push({
            email: email,
            nama: user.nama || email.split('@')[0],
            role: user.role || 'User',
            nik: user.nik || '',
            lastActive: values[i][4] || values[i][3] // LAST_ACTIVITY atau LOGIN_AT
          });
        } else {
          activeUsers.push({
            email: email,
            nama: email.split('@')[0],
            role: 'User',
            nik: '',
            lastActive: values[i][4] || values[i][3]
          });
        }
      }
    }
    return success(activeUsers, "Active sessions retrieved");
  } catch (e) {
    saveError("getActiveSessions", e.toString());
    return failed(e.toString());
  }
}

// =====================================================
// MANUAL CLEANUP
// =====================================================
function manualCleanup() {
  const count = cleanupExpiredSessions();
  Logger.log(`✅ Manual cleanup selesai: ${count} session dinonaktifkan.`);
  return count;
}

// =====================================================
// FORCE DEACTIVATE OLD SESSIONS (lebih dari 8 jam)
// =====================================================
function forceDeactivateOldSessions() {
  try {
    const sheet = getSessionSheet();
    const values = sheet.getDataRange().getValues();
    const nowDate = new Date();
    let deactivated = 0;
    for (let i = 1; i < values.length; i++) {
      const status = String(values[i][7]);
      if (status === "ACTIVE") {
        const loginAtStr = String(values[i][3]);
        if (loginAtStr) {
          try {
            const loginDate = new Date(loginAtStr);
            const diffHours = (nowDate - loginDate) / (1000 * 60 * 60);
            if (diffHours > 8) {
              sheet.getRange(i + 1, 8).setValue("INACTIVE");
              deactivated++;
              console.log(`🕒 Deactivated session for ${values[i][1]} (login: ${loginAtStr})`);
            }
          } catch (e) {}
        }
      }
    }
    Logger.log(`✅ Force deactivated ${deactivated} old sessions (based on LOGIN_AT > 8 hours).`);
    return deactivated;
  } catch (e) {
    Logger.log("❌ Gagal force deactivate: " + e);
    return 0;
  }
}

// =====================================================
// TEST FUNCTIONS (optional)
// =====================================================
function testFindUser() {
  const user = findUserByNik("03233");
  Logger.log(JSON.stringify(user));
}

function testLogin() {
  const result = login({ nik: "03233", password: "your_password" });
  Logger.log(JSON.stringify(result));
}

function testLogout() {
  try {
    const sheet = getSessionSheet();
    const values = sheet.getDataRange().getValues();
    if (values.length > 1) {
      const token = String(values[1][2]);
      const result = logout({ token: token });
      Logger.log(JSON.stringify(result));
    } else {
      Logger.log("Tidak ada session aktif");
    }
  } catch (e) {
    Logger.log(e);
  }
}

function testGetActiveSessions() {
  const result = getActiveSessions();
  Logger.log(JSON.stringify(result));
}
