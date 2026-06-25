// =====================================================
// Monitoring.gs
// Building Care System Enterprise v4.3 Stable
// Sprint 19 Monitoring Center
// Radiant Group Duri
// =====================================================

"use strict";

/**
 * =====================================================
 * MONITORING DASHBOARD
 * Sprint 19.1
 * =====================================================
 */
function getMonitoringDashboard() {
  try {
    const report = JSON.parse(getSummary().getContent()).data;
    const sla = JSON.parse(getSLAAnalytics().getContent()).data;
    const kpi = JSON.parse(getTechnicianKPI().getContent()).data;
    const pm = JSON.parse(getPMDashboard().getContent()).data;
    const asset = JSON.parse(getAssets().getContent()).data;

    // Asset Statistics menggunakan satu kali looping reduce
    const assetStats = (asset.assets || []).reduce((acc, curr) => {
      if (curr.status === "ACTIVE") {
        acc.active++;
      } else {
        acc.inactive++;
      }
      return acc;
    }, { active: 0, inactive: 0 });

    return success({
      report,
      sla,
      kpi: kpi.teknisi || [],
      pm,
      asset: {
        total: asset.total || 0,
        active: assetStats.active,
        inactive: assetStats.inactive
      }
    });

  } catch (err) {
    saveError("getMonitoringDashboard()", err.stack || err.toString());
    return failed("Gagal mengambil dashboard monitoring.");
  }
}

/**
 * =====================================================
 * RECENT ACTIVITY
 * Sprint 19.2
 * =====================================================
 */
function getRecentActivity(limit = 10) {
  try {
    const sh = getSheet(SHEET.ACTIVITY);
    const rows = sh.getDataRange().getValues();

    const activity = rows
      .slice(1)
      .reverse()
      .slice(0, limit)
      .map(r => ({
        id: r[0] || "",
        user: r[1] || "",
        action: r[2] || "",
        description: r[3] || "",
        waktu: r[4] ? formatDate(r[4]) : ""
      }));

    return success({
      activity,
      total: activity.length
    });

  } catch (err) {
    saveError("getRecentActivity()", err.stack || err.toString());
    return failed("Gagal mengambil activity.");
  }
}

/**
 * =====================================================
 * RECENT ERRORS
 * Sprint 19.3
 * =====================================================
 */
function getRecentErrors(limit = 10) {
  try {
    const sh = getSheet(SHEET.ERROR_LOG);
    const rows = sh.getDataRange().getValues();

    const errors = rows
      .slice(1)
      .reverse()
      .slice(0, limit)
      .map(r => ({
        id: r[0] || "",
        module: r[1] || "",
        message: r[2] || "",
        waktu: r[3] ? formatDate(r[3]) : ""
      }));

    return success({
      errors,
      total: errors.length
    });

  } catch (err) {
    saveError("getRecentErrors()", err.stack || err.toString());
    return failed("Gagal mengambil error log.");
  }
}

/**
 * =====================================================
 * TOP TECHNICIAN
 * Sprint 19.4
 * =====================================================
 */
function getTopTechnician() {
  try {
    const response = JSON.parse(getTechnicianKPI().getContent());

    if (!response.success) {
      return failed(response.message);
    }

    const ranking = (response.data.teknisi || []).slice(0, 5);

    return success({
      ranking,
      total: ranking.length
    });

  } catch (err) {
    saveError("getTopTechnician()", err.stack || err.toString());
    return failed("Gagal mengambil ranking teknisi.");
  }
}

/**
 * =====================================================
 * SYSTEM HEALTH
 * Sprint 19.5
 * =====================================================
 */
function getSystemHealth() {
  try {
    return success({
      api: "ONLINE",
      database: "ONLINE",
      drive: "ONLINE",
      version: CONFIG.APP.VERSION,
      serverTime: now()
    });

  } catch (err) {
    saveError("getSystemHealth()", err.stack || err.toString());
    return failed("System Health Error");
  }
}

/**
 * =====================================================
 * MONITORING OVERVIEW
 * Sprint 19.5
 * =====================================================
 */
function getMonitoringOverview() {
  try {
    const dashboard = JSON.parse(getMonitoringDashboard().getContent()).data;
    const activity = JSON.parse(getRecentActivity(5).getContent()).data;
    const errors = JSON.parse(getRecentErrors(5).getContent()).data;
    const technician = JSON.parse(getTopTechnician().getContent()).data;
    const health = JSON.parse(getSystemHealth().getContent()).data;

    return success({
      dashboard,
      activity: activity.activity || [],
      errors: errors.errors || [],
      technician: technician.ranking || [],
      health
    });

  } catch (err) {
    saveError("getMonitoringOverview()", err.stack || err.toString());
    return failed("Gagal mengambil monitoring overview.");
  }
}

/**
 * =====================================================
 * TEST MONITORING & LOGGING FUNCTIONS
 * =====================================================
 */
function testMonitoring() { Logger.log(getMonitoringDashboard().getContent()); }
function testRecentActivity() { Logger.log(getRecentActivity().getContent()); }
function testRecentErrors() { Logger.log(getRecentErrors().getContent()); }
function testTopTechnician() { Logger.log(getTopTechnician().getContent()); }
function testSystemHealth() { Logger.log(getSystemHealth().getContent()); }
function testMonitoringOverview() { Logger.log(getMonitoringOverview().getContent()); }
