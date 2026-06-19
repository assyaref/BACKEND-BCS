// =============================
// UPLOAD FOTO
// =============================

function uploadPhoto(base64, fileName) {

  try {

    if (!base64) {
      throw new Error("Data foto kosong.");
    }

    const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);

    const match = base64.match(/^data:(.*);base64,/);

    if (!match) {
      throw new Error("Format Base64 tidak valid.");
    }

    const contentType = match[1];

    const bytes = Utilities.base64Decode(
      base64.split(",")[1]
    );

    const extension = contentType.split("/")[1] || "jpg";

    const safeFileName =
      generateId() + "." + extension;

    const blob = Utilities.newBlob(
      bytes,
      contentType,
      safeFileName
    );

    const file = folder.createFile(blob);

    // Membuat file dapat diakses dengan link
    file.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );

    return {

      success: true,

      url: file.getUrl(),

      fileId: file.getId(),

      fileName: safeFileName

    };

  } catch (err) {

    return {

      success: false,

      message: err.toString()

    };

  }

}
