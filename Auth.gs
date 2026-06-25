// =====================================================
// Building Care System Enterprise v3.4 Stable
// Auth.gs
// Radiant Group Duri
// =====================================================

/**
 * =====================================================
 * LOGIN
 * =====================================================
 */
function login(data) {
  try {
    data = data || {};
    const nik = String(data.nik || "").trim();
    const password = String(data.password || "").trim();

    if (!nik || !password) {
      return failed("NIK dan Password wajib diisi.");
    }

    // ==========================================
    // FIND USER
    // ==========================================
    const user = findUserByNik(nik);

    if (!user) {
      saveActivity(nik, "LOGIN_FAILED", "User tidak ditemukan");
      return failed("NIK atau Password salah.");
    }

    // ==========================================
    // STATUS
    // ==========================================
    if (String(user.status).toUpperCase() !== "ACTIVE") {
      saveActivity(nik, "LOGIN_FAILED", "Akun tidak aktif");
      return failed("Akun tidak aktif.");
    }

    // ==========================================
    // PASSWORD CHECK
    // ==========================================
    const passwordMatch = user.password === password || user.password === hashPassword(password);

    if (!passwordMatch) {
      saveActivity(nik, "LOGIN_FAILED", "Password salah");
      return failed("NIK atau Password salah.");
    }

    // ==========================================
    // AUTO MIGRATION SHA256
    // ==========================================
    if (user.password === password) {
      getSheet(SHEET.USERS).getRange(user.row, 4).setValue(hashPassword(password));
    }

    // ==========================================
    // TOKEN
    // ==========================================
    const token = generateToken();
    createSession(user.email, token);
    saveActivity(user.email, "LOGIN", "Login berhasil");

    // ==========================================
    // RESPONSE v3.4
    // ==========================================
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
    saveError("Auth.gs", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * LOGOUT
 * =====================================================
 */
function logout(data) {
  try {
    data = data || {};
    const token = String(data.token || "");

    if (!token) {
      return failed("Token kosong.");
    }

    if (typeof SHEET.USER_SESSION === "undefined") {
      return success({}, "Logout berhasil");
    }

    const sheet = getSheet(SHEET.USER_SESSION);
    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][2]) === token) {
        sheet.getRange(i + 1, 8).setValue("INACTIVE");
        saveActivity(values[i][1], "LOGOUT", "Logout berhasil");
        break;
      }
    }

    return success({}, "Logout berhasil");

  } catch (err) {
    saveError("Auth.gs", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * VERIFY SESSION
 * =====================================================
 */
function verifySession(data) {
  try {
    data = data || {};
    const token = String(data.token || "");

    if (!token) {
      return failed("Session Expired");
    }

    if (typeof SHEET.USER_SESSION === "undefined") {
      return success({ valid: true });
    }

    const sheet = getSheet(SHEET.USER_SESSION);
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

    return failed("Session Expired");

  } catch (err) {
    saveError("Auth.gs", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * CREATE SESSION
 * =====================================================
 */
function createSession(email, token) {
  try {
    if (typeof SHEET.USER_SESSION === "undefined") {
      return true;
    }

    const sheet = getSheet(SHEET.USER_SESSION);
    sheet.appendRow([
      Utilities.getUuid(), // A ID
      email,                // B Email
      token,                // C Token
      now(),                // D Login Time
      now(),                // E Last Activity
      now(),                // F Created At
      email,                // G Created By
      "ACTIVE"              // H Status
    ]);

  } catch (err) {
    Logger.log(err);
  }
}

// =====================================================
// TEST
// =====================================================
function testFindUser() {
  const user = findUserByNik("03233");
  Logger.log(JSON.stringify(user));
}

function testGetUserSheet() {
  const sheet = getSheet(SHEET.USERS);
  Logger.log(sheet.getName());
}
