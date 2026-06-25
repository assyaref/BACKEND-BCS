// =====================================================
// REPORT MODULE
// Building Care System Enterprise v4.0 Stable
// =====================================================

"use strict";

/**
 * =====================================================
 * GET REPORTS
 * Building Care System Enterprise v4.2 Stable
 * Sprint 8.0 - SLA Monitoring
 * =====================================================
 */
function getReports() {
  try {
    const sh = getSheet(SHEET.REPORT);
    const rows = sh.getDataRange().getValues();

    if (rows.length <= 1) {
      return success({ reports: [], total: 0 });
    }

    const reports = rows.slice(1).map(r => {
      const tanggalLapor = r[1];
      const tanggalSelesai = r[10];
      let sla = "OPEN";

      // =====================================
      // HITUNG SLA
      // =====================================
      if (tanggalLapor instanceof Date && tanggalSelesai instanceof Date) {
        const diffHour = (tanggalSelesai - tanggalLapor) / 3600000;
        
        if (diffHour <= 4) {
          sla = "FAST";
        } else if (diffHour <= 24) {
          sla = "NORMAL";
        } else {
          sla = "LATE";
        }
      }

      return {
        // DATA REPORT
        id: r[0] || "",
        tanggal: tanggalLapor ? formatDate(tanggalLapor) : "",
        nama: r[2] || "",
        departemen: r[3] || "",
        lokasi: r[4] || "",
        kategori: r[5] || "",
        deskripsi: r[6] || "",
        foto: r[7] || "",

        // PROGRESS
        status: r[8] || CONFIG.STATUS.OPEN,
        teknisi: r[9] || "",

        // COMPLETION
        tglSelesai: tanggalSelesai ? formatDate(tanggalSelesai) : "",
        catatanTeknisi: r[11] || "",
        durasi: r[12] || "",

        // SLA & SCORE
        sla: sla,
        score: r[14] || 0,

        // WORK ORDER
        workOrder: r[15] || "",

        // APPROVAL
        approvedBy: r[16] || "",
        approvalDate: r[17] ? formatDate(r[17]) : "",
        approvalStatus: r[18] || ""
      };
    });

    // =====================================
    // SORT TERBARU
    // =====================================
    reports.sort((a, b) => {
      return new Date(b.tanggal.replace(" ", "T")) - new Date(a.tanggal.replace(" ", "T"));
    });

    // =====================================
    // SUMMARY COUNTER
    // =====================================
    return success({
      reports: reports,
      total: reports.length,
      summary: {
        total: reports.length,
        open: reports.filter(x => x.status === CONFIG.STATUS.OPEN).length,
        progress: reports.filter(x => x.status === CONFIG.STATUS.PROGRESS).length,
        done: reports.filter(x => x.status === CONFIG.STATUS.DONE).length,
        fast: reports.filter(x => x.sla === "FAST").length,
        normal: reports.filter(x => x.sla === "NORMAL").length,
        late: reports.filter(x => x.sla === "LATE").length
      }
    });

  } catch (err) {
    saveError("getReports()", err.stack || err.toString());
    return failed("Gagal mengambil data laporan.");
  }
}

/**
 * =====================================================
 * GET PLAYERS KPI (TECHNICIAN KPI)
 * Building Care System Enterprise v4.2 Stable
 * Sprint 10.1
 * =====================================================
 */
function getTechnicianKPI() {
  try {
    const response = getReports();

    if (!response.success) {
      return response;
    }

    const reports = response.data.reports || [];
    const teknisiMap = {};

    reports.forEach(r => {
      if (r.status === CONFIG.STATUS.DONE && r.teknisi) {
        if (!teknisiMap[r.teknisi]) {
          teknisiMap[r.teknisi] = {
            nama: r.teknisi,
            total: 0,
            fast: 0,
            normal: 0,
            late: 0,
            totalScore: 0
          };
        }

        teknisiMap[r.teknisi].total++;
        teknisiMap[r.teknisi].totalScore += Number(r.score || 0);

        if (r.sla === "FAST") {
          teknisiMap[r.teknisi].fast++;
        } else if (r.sla === "NORMAL") {
          teknisiMap[r.teknisi].normal++;
        } else if (r.sla === "LATE") {
          teknisiMap[r.teknisi].late++;
        }
      }
    });

    const ranking = Object.values(teknisiMap)
      .map(x => ({
        nama: x.nama,
        total: x.total,
        fast: x.fast,
        normal: x.normal,
        late: x.late,
        averageScore: x.total > 0 ? Math.round(x.totalScore / x.total) : 0
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    return success({ teknisi: ranking });

  } catch (err) {
    saveError("getTechnicianKPI()", err.stack || err.toString());
    return failed("Gagal mengambil KPI Teknisi.");
  }
}

/**
 * =====================================================
 * UPDATE REPORT
 * Building Care System Enterprise v4.2 Stable
 * Sprint 10.0 KPI + SLA
 * =====================================================
 */
function updateReport(data) {
  try {
    if (!data || !data.id) {
      return failed("ID laporan kosong.");
    }

    const sh = getSheet(SHEET.REPORT);
    const rows = sh.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == data.id) {
        const row = i + 1;
        const tanggalLapor = new Date(rows[i][1]);

        // =====================================
        // UPDATE DATA UTAMA
        // =====================================
        sh.getRange(row, 9).setValue(data.status || CONFIG.STATUS.OPEN);
        sh.getRange(row, 10).setValue(safeString(data.teknisi));
        sh.getRange(row, 12).setValue(safeString(data.catatan));

        // =====================================
        // STATUS DONE
        // =====================================
        if (data.status === CONFIG.STATUS.DONE) {
          let tanggalSelesai = rows[i][10];

          if (!tanggalSelesai) {
            tanggalSelesai = new Date();
            sh.getRange(row, 11).setValue(tanggalSelesai); // Kolom K
          } else {
            tanggalSelesai = new Date(tanggalSelesai);
          }

          // HITUNG DURASI
          const diffMs = tanggalSelesai - tanggalLapor;
          const totalMenit = Math.floor(diffMs / 60000);
          const hari = Math.floor(totalMenit / (24 * 60));
          const jam = Math.floor((totalMenit % (24 * 60)) / 60);
          const menit = totalMenit % 60;

          let durasi = "";
          if (hari > 0) durasi += hari + " Hari ";
          if (jam > 0) durasi += jam + " Jam ";
          durasi += menit + " Menit";

          sh.getRange(row, 13).setValue(durasi.trim()); // Kolom M

          // HITUNG SLA + SCORE
          const diffHour = diffMs / 3600000;
          let sla = "";
          let score = 0;

          if (diffHour <= 4) {
            sla = "FAST";
            score = 100;
          } else if (diffHour <= 24) {
            sla = "NORMAL";
            score = 80;
          } else {
            sla = "LATE";
            score = 50;
          }

          sh.getRange(row, 14).setValue(sla);   // Kolom N
          sh.getRange(row, 15).setValue(score); // Kolom O

          // WORK ORDER (Kolom P = 16)
          if (!rows[i][15]) {
            sh.getRange(row, 16).setValue(generateWO());
          }

          // APPROVAL STATUS (Kolom S = 19)
          if (!rows[i][18]) {
            sh.getRange(row, 19).setValue("PENDING");
          }

        } else {
          // =====================================
          // STATUS OPEN / PROGRESS
          // =====================================
          sh.getRange(row, 11).clearContent(); // K
          sh.getRange(row, 13).clearContent(); // M
          sh.getRange(row, 14).clearContent(); // N
          sh.getRange(row, 15).clearContent(); // O
          sh.getRange(row, 16).clearContent(); // P
          sh.getRange(row, 17).clearContent(); // Q
          sh.getRange(row, 18).clearContent(); // R
          sh.getRange(row, 19).clearContent(); // S
        }

        SpreadsheetApp.flush();

        // ACTIVITY LOG
        try {
          saveActivity(data.teknisi || "SYSTEM", "UPDATE_REPORT", data.id);
        } catch (e) {
          Logger.log(e);
        }

        return success({
          id: data.id,
          status: data.status,
          teknisi: data.teknisi || ""
        }, "Status berhasil diperbarui.");
      }
    }

    return failed("Laporan tidak ditemukan.");

  } catch (err) {
    saveError("updateReport()", err.stack || err.toString());
    return failed("Gagal memperbarui laporan.");
  }
}

/**
 * =====================================================
 * GET SLA ANALYTICS
 * Sprint 10.2
 * =====================================================
 */
function getSLAAnalytics() {
  try {
    const response = getReports();

    if (!response.success) {
      return response;
    }

    const reports = response.data.reports;
    const totalDone = reports.filter(r => r.status === CONFIG.STATUS.DONE).length;
    const fast = reports.filter(r => r.sla === "FAST").length;
    const normal = reports.filter(r => r.sla === "NORMAL").length;
    const late = reports.filter(r => r.sla === "LATE").length;

    return success({
      total: totalDone,
      fast: fast,
      normal: normal,
      late: late,
      fastPercent: totalDone ? Math.round(fast / totalDone * 100) : 0,
      normalPercent: totalDone ? Math.round(normal / totalDone * 100) : 0,
      latePercent: totalDone ? Math.round(late / totalDone * 100) : 0
    });

  } catch (err) {
    saveError("getSLAAnalytics()", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * APPROVE REPORT
 * Sprint 11.1
 * =====================================================
 */
function approveReport(data) {
  try {
    if (!data || !data.id) {
      return failed("ID laporan kosong.");
    }

    const sh = getSheet(SHEET.REPORT);
    const rows = sh.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == data.id) {
        const row = i + 1;

        sh.getRange(row, 17).setValue(safeString(data.approvedBy)); // Q = Approved By
        sh.getRange(row, 18).setValue(new Date());                 // R = Approval Date
        sh.getRange(row, 19).setValue("APPROVED");                 // S = Approval Status

        SpreadsheetApp.flush();
        saveActivity(data.approvedBy, "APPROVE_REPORT", data.id);

        return success({}, "Report berhasil diapprove.");
      }
    }

    return failed("Report tidak ditemukan.");

  } catch (err) {
    saveError("approveReport()", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * REJECT REPORT
 * Sprint 11.1
 * =====================================================
 */
function rejectReport(data) {
  try {
    if (!data || !data.id) {
      return failed("ID laporan kosong.");
    }

    const sh = getSheet(SHEET.REPORT);
    const rows = sh.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == data.id) {
        const row = i + 1;

        sh.getRange(row, 17).setValue(safeString(data.approvedBy)); // Q = Approved By
        sh.getRange(row, 18).setValue(new Date());                 // R = Approval Date
        sh.getRange(row, 19).setValue("REJECTED");                 // S = Approval Status

        SpreadsheetApp.flush();
        saveActivity(data.approvedBy, "REJECT_REPORT", data.id);

        return success({}, "Report ditolak.");
      }
    }

    return failed("Report tidak ditemukan.");

  } catch (err) {
    saveError("rejectReport()", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * GET APPROVAL SUMMARY
 * Sprint 11.1
 * =====================================================
 */
function getApprovalSummary() {
  try {
    const response = getReports();

    if (!response.success) {
      return response;
    }

    const reports = response.data.reports;

    return success({
      pending: reports.filter(x => x.approvalStatus === "PENDING").length,
      approved: reports.filter(x => x.approvalStatus === "APPROVED").length,
      rejected: reports.filter(x => x.approvalStatus === "REJECTED").length
    });

  } catch (err) {
    saveError("getApprovalSummary()", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * GET WORK ORDER LIST
 * Sprint 11.2
 * =====================================================
 */
function getWorkOrderList() {
  try {
    const response = getReports();

    if (!response.success) {
      return response;
    }

    const reports = response.data.reports;
    const wo = reports
      .filter(r => r.workOrder)
      .map(r => ({
        workOrder: r.workOrder,
        reportId: r.id,
        kategori: r.kategori,
        lokasi: r.lokasi,
        teknisi: r.teknisi,
        status: r.status,
        sla: r.sla,
        score: r.score,
        approvalStatus: r.approvalStatus,
        approvedBy: r.approvedBy,
        approvalDate: r.approvalDate
      }));

    return success({
      workOrders: wo,
      total: wo.length
    });

  } catch (err) {
    saveError("getWorkOrderList()", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * GET WORK ORDER DETAIL
 * Sprint 11.3
 * =====================================================
 */
function getWorkOrder(workOrder) {
  try {
    const response = getReports();

    if (!response.success) {
      return response;
    }

    const reports = response.data.reports;
    const wo = reports.find(r => r.workOrder == workOrder);

    if (!wo) {
      return failed("Work Order tidak ditemukan.");
    }

    return success({ workOrder: wo });

  } catch (err) {
    saveError("getWorkOrder()", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * GET PENDING APPROVAL
 * Sprint 11.4
 * =====================================================
 */
function getPendingApproval() {
  try {
    const response = getReports();

    if (!response.success) {
      return response;
    }

    const reports = response.data.reports;
    const pending = reports.filter(r => r.status === CONFIG.STATUS.DONE && r.approvalStatus === "PENDING");

    return success({
      reports: pending,
      total: pending.length
    });

  } catch (err) {
    saveError("getPendingApproval()", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * GET NOTIFICATION CENTER
 * Sprint 12.0
 * =====================================================
 */
function getNotifications() {
  try {
    const response = getReports();

    if (!response.success) {
      return response;
    }

    const reports = response.data.reports;

    return success({
      pendingApproval: reports.filter(r => r.approvalStatus === "PENDING").length,
      lateReport: reports.filter(r => r.sla === "LATE").length,
      openReport: reports.filter(r => r.status === CONFIG.STATUS.OPEN).length,
      progressReport: reports.filter(r => r.status === CONFIG.STATUS.PROGRESS).length
    });

  } catch (err) {
    saveError("getNotifications()", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * GET BEST TECHNICIAN
 * Sprint 12.1
 * =====================================================
 */
function getBestTechnician() {
  try {
    const response = getTechnicianKPI();

    if (!response.success) {
      return response;
    }

    const ranking = response.data.teknisi;

    return success({
      technician: ranking.length > 0 ? ranking[0] : null
    });

  } catch (err) {
    saveError("getBestTechnician()", err.toString());
    return failed(err.toString());
  }
}

/**
 * =====================================================
 * GET MONTHLY REPORT
 * Sprint 12.2
 * =====================================================
 */
function getMonthlyAnalytics() {
  try {
    const response = getReports();

    if (!response.success) {
      return response;
    }

    const reports = response.data.reports;
    const monthly = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    reports.forEach(r => {
      if (r.tanggal) {
        const month = new Date(r.tanggal).getMonth();
        monthly[month]++;
      }
    });

    return success({ monthly: monthly });

  } catch (err) {
    saveError("getMonthlyAnalytics()", err.toString());
    return failed(err.toString());
  }
}
/**
 * =====================================================
 * GET MY TASK
 * Sprint 16.0 Mobile Technician
 * =====================================================
 */
function getMyTask(teknisi) {

  try {

    const response = getReports();

    if (!response.success) {
      return response;
    }

    const reports = response.data.reports.filter(r =>

      r.teknisi === teknisi &&

      r.status !== CONFIG.STATUS.DONE

    );

    return success({

      reports: reports,

      total: reports.length

    });

  }

  catch(err){

    saveError(
      "getMyTask()",
      err.toString()
    );

    return failed(
      "Gagal mengambil task teknisi."
    );

  }

}
/**
 * =====================================================
 * GET MY WORK ORDER
 * Sprint 16.1 Mobile Technician
 * =====================================================
 */
function getMyWorkOrder(teknisi) {

  try {

    const response = getReports();

    if (!response.success) {
      return response;
    }

    const workOrders = response.data.reports.filter(r =>

      r.teknisi === teknisi &&

      r.workOrder

    );

    return success({

      workOrders: workOrders,

      total: workOrders.length

    });

  }

  catch(err){

    saveError(
      "getMyWorkOrder()",
      err.toString()
    );

    return failed(
      "Gagal mengambil Work Order teknisi."
    );

  }

}
/**
 * =====================================================
 * UPLOAD AFTER PHOTO
 * Sprint 16.2
 * =====================================================
 */
function uploadAfterPhoto(data) {

  try {

    if (!data.id || !data.photo) {
      return failed("Data tidak lengkap.");
    }

    const sh = getSheet(SHEET.REPORT);
    const rows = sh.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {

      if (rows[i][0] == data.id) {

        const upload = uploadPhoto(
          data.photo,
          data.filename
        );

        if (!upload.success) {
          return upload;
        }

        // T = 20
        sh.getRange(i + 1, 20)
          .setValue(upload.url);

        SpreadsheetApp.flush();

        return success({
          afterPhoto: upload.url
        });

      }

    }

    return failed("Report tidak ditemukan.");

  }

  catch(err){

    saveError(
      "uploadAfterPhoto()",
      err.toString()
    );

    return failed(err.toString());

  }

}
/**
 * =====================================================
 * BACKWARD COMPATIBILITY
 * =====================================================
 */
function getReport(data) {
  return getReports();
}
