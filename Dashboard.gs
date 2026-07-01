// ======================================================
// Building Care System Enterprise v3.3 Stable
// Dashboard.gs
// Radiant Group Duri
// ======================================================

function getDashboard(data) {

  try {

    // ==========================================
    // TIMEZONE
    // ==========================================

    var TIMEZONE = "Asia/Jakarta";

    if (typeof CONFIG !== "undefined") {
      if (
        CONFIG.TIMEZONE &&
        typeof CONFIG.TIMEZONE === "string"
      ) {
        TIMEZONE = CONFIG.TIMEZONE;
      }
    }

    // ==========================================
    // SHEET
    // ==========================================

    var sheet = getSheet("REPORT");

    if (!sheet) {
      return failed("Sheet REPORT tidak ditemukan.");
    }

    var values = sheet.getDataRange().getValues();

    // ==========================================
    // EMPTY DATA
    // ==========================================

    if (values.length <= 1) {

      return success({

        version: "3.3.0",

        total: 0,
        ac: 0,
        listrik: 0,
        gedung: 0,

        open: 0,
        progress: 0,
        done: 0,

        totalTrend: 0,
        acTrend: 0,
        listrikTrend: 0,
        gedungTrend: 0,

        todayReport: 0,
        onlineUser: 1,
        pendingApproval: 0,

        activity: [],

        monthly: [0,0,0,0,0,0,0,0,0,0,0,0],

        serverTime: now(),
        lastUpdate: now()

      });

    }

    // ==========================================
    // HEADER
    // ==========================================

    var headers = values.shift().map(function(item){

      return String(item).trim().toLowerCase();

    });

    var idx = {

      id        : headers.indexOf("id"),
      tanggal   : headers.indexOf("tanggal"),
      lokasi    : headers.indexOf("lokasi"),
      kategori  : headers.indexOf("kategori"),
      status    : headers.indexOf("status")

    };

    if (

      idx.id < 0 ||
      idx.tanggal < 0 ||
      idx.lokasi < 0 ||
      idx.kategori < 0 ||
      idx.status < 0

    ){

      return failed("Header REPORT tidak sesuai.");

    }

    // ==========================================
    // VARIABLE
    // ==========================================

    var total = 0;
    var ac = 0;
    var listrik = 0;
    var gedung = 0;

    var open = 0;
    var progress = 0;
    var done = 0;

    var todayReport = 0;

    var monthly = [0,0,0,0,0,0,0,0,0,0,0,0];

    var today = Utilities.formatDate(

      new Date(),
      String(TIMEZONE),
      "yyyy-MM-dd"

    );

    // ==========================================
    // VARIABLE TREND (MINGGU LALU) - FIXED
    // ==========================================

    var currentDate = new Date();
    var lastWeekStart = new Date(currentDate);
    lastWeekStart.setDate(currentDate.getDate() - 7);
    lastWeekStart.setHours(0,0,0,0);

    var lastWeekEnd = new Date(currentDate);
    lastWeekEnd.setDate(currentDate.getDate() - 1);
    lastWeekEnd.setHours(23,59,59,999);

    var lastWeekTotal = 0;
    var lastWeekAc = 0;
    var lastWeekListrik = 0;
    var lastWeekGedung = 0;

    // ==========================================
    // LOOP
    // ==========================================

    values.forEach(function(row){

      if (!row[idx.id]) return;

      var tanggal = new Date(row[idx.tanggal]);
      var kategori = String(row[idx.kategori] || "")
        .trim()
        .toUpperCase();

      var status = String(row[idx.status] || "")
        .trim()
        .toUpperCase();

      // ==========================================
      // TOTAL & CATEGORY
      // ==========================================

      total++;

      if (kategori === "AC") {
        ac++;
      } else if (kategori === "LISTRIK") {
        listrik++;
      } else {
        gedung++;
      }

      // ==========================================
      // STATUS
      // ==========================================

      if (status === "OPEN" || status === "WAITING") {
        open++;
      } else if (status === "PROGRESS" || status === "ON PROGRESS") {
        progress++;
      } else if (status === "DONE" || status === "COMPLETED" || status === "CLOSED") {
        done++;
      }

      // ==========================================
      // TODAY & MONTHLY
      // ==========================================

      if (!isNaN(tanggal.getTime())) {

        if (Utilities.formatDate(tanggal, String(TIMEZONE), "yyyy-MM-dd") === today) {
          todayReport++;
        }

        monthly[tanggal.getMonth()]++;

      }

      // ==========================================
      // TREND (MINGGU LALU)
      // ==========================================

      if (tanggal >= lastWeekStart && tanggal <= lastWeekEnd) {
        lastWeekTotal++;
        if (kategori === "AC") {
          lastWeekAc++;
        } else if (kategori === "LISTRIK") {
          lastWeekListrik++;
        } else {
          lastWeekGedung++;
        }
      }

    });

    // ==========================================
    // HITUNG TREND
    // ==========================================

    var totalTrend = total - lastWeekTotal;
    var acTrend = ac - lastWeekAc;
    var listrikTrend = listrik - lastWeekListrik;
    var gedungTrend = gedung - lastWeekGedung;

    // ==========================================
    // RECENT ACTIVITY
    // ==========================================

    var activity = values

      .filter(function(row){

        return row[idx.id];

      })

      .sort(function(a,b){

        return new Date(b[idx.tanggal]) -

               new Date(a[idx.tanggal]);

      })

      .slice(0,5)

      .map(function(row){

        var tgl = new Date(row[idx.tanggal]);

        return {

          id: row[idx.id],

          kategori: String(row[idx.kategori]),

          lokasi: String(row[idx.lokasi]),

          status: String(row[idx.status]),

          waktu: Utilities.formatDate(

            tgl,

            String(TIMEZONE),

            "HH:mm"

          ),

          tanggal: Utilities.formatDate(

            tgl,

            String(TIMEZONE),

            "yyyy-MM-dd"

          )

        };

      });

    // ==========================================
    // RESPONSE
    // ==========================================

    return success({

      version: "3.3.0",

      total: total,
      ac: ac,
      listrik: listrik,
      gedung: gedung,

      open: open,
      progress: progress,
      done: done,

      totalTrend: totalTrend,
      acTrend: acTrend,
      listrikTrend: listrikTrend,
      gedungTrend: gedungTrend,

      todayReport: todayReport,

      onlineUser: 1,

      pendingApproval: open,

      activity: activity,

      monthly: monthly,

      serverTime: now(),
      lastUpdate: now()

    });

  }

  catch(err){

    saveError(

      "Dashboard.gs",

      err.toString()

    );

    return failed(err.toString());

  }

}

/**
 * =====================================================
 * GET ACTIVE USERS
 * Sprint 19.7 - Online Users from ACTIVITY Sheet
 * =====================================================
 */
function getActiveUsers() {
  try {
    const activitySheet = getSheet(SHEET.ACTIVITY);
    const userSheet = getSheet(SHEET.USERS);

    if (!activitySheet || !userSheet) {
      return { success: false, message: "Sheet tidak ditemukan." };
    }

    const activityRows = activitySheet.getDataRange().getValues();
    const userRows = userSheet.getDataRange().getValues();

    // Build user map (email -> { nama, role, nik })
    const userMap = {};
    userRows.slice(1).forEach(row => {
      const email = String(row[0] || '').trim().toLowerCase();
      const nik = String(row[1] || '').trim();
      const nama = String(row[2] || '').trim();
      const role = String(row[4] || '').trim();
      if (email) {
        userMap[email] = { email, nik, nama, role };
      }
    });

    // Ambil aktivitas 1 jam terakhir
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const activeEmails = {};
    activityRows.slice(1).forEach(row => {
      const email = String(row[1] || '').trim().toLowerCase();
      const waktu = row[4]; // kolom waktu (index 4)
      if (email && waktu instanceof Date && waktu >= oneHourAgo) {
        activeEmails[email] = true;
      }
    });

    // Bangun daftar user aktif
    const activeUsers = Object.keys(activeEmails).map(email => {
      const user = userMap[email] || { email, nama: email.split('@')[0], role: 'User' };
      return {
        email: email,
        nama: user.nama || email.split('@')[0],
        role: user.role || 'User',
        nik: user.nik || '',
        lastActive: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
    });

    return success({
      activeUsers: activeUsers,
      total: activeUsers.length
    });

  } catch (err) {
    saveError("getActiveUsers()", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * GET SUMMARY
 * Building Care System Enterprise v4.2 Stable
 * Sprint 9.1 Dashboard Analytics + Active Users
 * =====================================================
 */
function getSummary() {

  try {

    // ======================================
    // DASHBOARD
    // ======================================
    const dashboard = getDashboard();

    if (!dashboard.success) {
      return dashboard;
    }

    // ======================================
    // REPORT
    // ======================================
    const reportResponse = getReports();

    if (!reportResponse.success) {
      return reportResponse;
    }

    // ======================================
    // ACTIVE USERS
    // ======================================
    const activeUsersResponse = getActiveUsers();

    const data = dashboard.data;
    const reports = reportResponse.data.reports || [];
    const activeUsers = activeUsersResponse.success ? activeUsersResponse.data.activeUsers || [] : [];

    // ======================================
    // SLA COUNTER
    // ======================================
    const fast =
      reports.filter(r => r.sla === "FAST").length;

    const normal =
      reports.filter(r => r.sla === "NORMAL").length;

    const late =
      reports.filter(r => r.sla === "LATE").length;

    // ======================================
    // RESPONSE
    // ======================================
    return success({

      // STATUS
      total: data.total,
      open: data.open,
      progress: data.progress,
      done: data.done,

      // CATEGORY
      ac: data.ac,
      listrik: data.listrik,
      bangunan: data.gedung,

      // SLA
      fast: fast,
      normal: normal,
      late: late,

      // DAILY
      todayReport: data.todayReport,

      // PENDING
      pendingApproval: data.pendingApproval,

      // ACTIVITY (dari report)
      activity: data.activity || [],

      // MONTHLY CHART
      monthly: data.monthly || [0,0,0,0,0,0,0,0,0,0,0,0],

      // SERVER
      serverTime: data.serverTime,
      lastUpdate: data.lastUpdate,

      // TRENDS
      totalTrend: data.totalTrend || 0,
      acTrend: data.acTrend || 0,
      listrikTrend: data.listrikTrend || 0,
      gedungTrend: data.gedungTrend || 0,

      // 🔥 ACTIVE USERS
      activeUsers: activeUsers,
      onlineUser: activeUsers.length

    });

  }

  catch (err) {

    saveError(
      "getSummary()",
      err.stack || err.toString()
    );

    return failed(
      "Gagal mengambil summary."
    );

  }

}

/**
 * =====================================================
 * GET TOP TECHNICIAN
 * Sprint 9.2
 * =====================================================
 */
function getTopTechnician() {

  try {

    const response = getReports();

    if (!response.success) {
      return response;
    }

    const reports = response.data.reports;

    const teknisiMap = {};

    reports.forEach(r => {

      if (
        r.status === CONFIG.STATUS.DONE &&
        r.teknisi
      ) {

        teknisiMap[r.teknisi] =
          (teknisiMap[r.teknisi] || 0) + 1;

      }

    });

    const ranking = Object.keys(teknisiMap)
      .map(nama => ({
        nama: nama,
        total: teknisiMap[nama]
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return success({
      teknisi: ranking
    });

  }

  catch(err){

    saveError(
      "getTopTechnician()",
      err.toString()
    );

    return failed(
      "Gagal mengambil ranking teknisi."
    );

  }

}
