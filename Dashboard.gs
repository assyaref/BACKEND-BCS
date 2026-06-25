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
    // LOOP
    // ==========================================

    values.forEach(function(row){

      if (!row[idx.id]) return;

      total++;

      var kategori = String(row[idx.kategori] || "")
        .trim()
        .toUpperCase();

      var status = String(row[idx.status] || "")
        .trim()
        .toUpperCase();

      var tanggal = new Date(row[idx.tanggal]);

      // CATEGORY

      if (kategori === "AC") {

        ac++;

      } else if (kategori === "LISTRIK") {

        listrik++;

      } else {

        gedung++;

      }

      // STATUS

      if (

        status === "OPEN" ||
        status === "WAITING"

      ){

        open++;

      }

      else if (

        status === "PROGRESS" ||
        status === "ON PROGRESS"

      ){

        progress++;

      }

      else if (

        status === "DONE" ||
        status === "COMPLETED" ||
        status === "CLOSED"

      ){

        done++;

      }

      // DATE

      if (!isNaN(tanggal.getTime())) {

        if (

          Utilities.formatDate(

            tanggal,
            String(TIMEZONE),
            "yyyy-MM-dd"

          ) === today

        ){

          todayReport++;

        }

        monthly[tanggal.getMonth()]++;

      }

    });

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

      totalTrend: 0,
      acTrend: 0,
      listrikTrend: 0,
      gedungTrend: 0,

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
 * GET SUMMARY
 * Building Care System Enterprise v4.2 Stable
 * Sprint 9.1 Dashboard Analytics
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

    const data = dashboard.data;
    const reports = reportResponse.data.reports || [];

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

      // ACTIVITY
      activity: data.activity || [],

      // MONTHLY CHART
      monthly: data.monthly || [0,0,0,0,0,0,0,0,0,0,0,0],

      // SERVER
      serverTime: data.serverTime,
      lastUpdate: data.lastUpdate

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
