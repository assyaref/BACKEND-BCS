// =====================================================
// UPLOAD FOTO
// Building Care System Enterprise v3.3.3 Stable
// =====================================================
function uploadPhoto(base64, fileName) {
  try {
    if (!base64) {
      throw new Error("Data foto kosong.");
    }

    const folder = DriveApp.getFolderById(CONFIG.DRIVE.FOLDER_ID);
    let bytes;
    let contentType = "image/jpeg";

    // ==========================================
    // DECODE BASE64 (DATA URI vs MURNI)
    // ==========================================
    if (base64.startsWith("data:")) {
      const match = base64.match(/^data:(.*);base64,/);
      if (!match) {
        throw new Error("Format Base64 tidak valid.");
      }
      contentType = match[1];
      bytes = Utilities.base64Decode(base64.split(",")[1]);
    } else {
      bytes = Utilities.base64Decode(base64);
    }

    // ==========================================
    // EXTENSION & FILE NAMING
    // ==========================================
    const extension = contentType.split("/")[1] || "jpg";
    const safeName = fileName
      ? fileName.replace(/[^\w.\-]/g, "_")
      : generateId() + "." + extension;

    const finalName = generateId() + "_" + safeName;

    // ==========================================
    // CREATE FILE & SET SHARING
    // ==========================================
    const blob = Utilities.newBlob(bytes, contentType, finalName);
    const file = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileId = file.getId();

    // ==========================================
    // GENERATE URLS
    // ==========================================
    const thumbnailUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    const previewUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    const downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
    const driveUrl = "https://drive.google.com/file/d/" + fileId + "/view";

    // ==========================================
    // RESPONSE SUCCESS
    // ==========================================
    return {
      success: true,
      message: "Upload berhasil",
      fileId,
      fileName: finalName,
      mimeType: contentType,
      size: blob.getBytes().length,
      url: thumbnailUrl,
      previewUrl,
      downloadUrl,
      driveUrl
    };

  } catch (err) {
    try {
      saveError("uploadPhoto()", err.toString());
    } catch (e) {
      Logger.log(e);
    }

    return {
      success: false,
      message: err.toString()
    };
  }
}
