// =============================
// UPLOAD FOTO
// =============================
function uploadPhoto(base64, fileName) {

  try {

    if (!base64) {
      throw new Error("Data foto kosong.");
    }

    const folder = DriveApp.getFolderById(
      CONFIG.DRIVE.FOLDER_ID
    );

    let bytes;
    let contentType = "image/jpeg";

    // --------------------------------
    // Format : data:image/png;base64,...
    // --------------------------------
    if (base64.indexOf("data:") === 0) {

      const match = base64.match(
        /^data:(.*);base64,/
      );

      if (!match) {
        throw new Error(
          "Format Base64 tidak valid."
        );
      }

      contentType = match[1];

      bytes = Utilities.base64Decode(
        base64.split(",")[1]
      );

    }

    // --------------------------------
    // Format : iVBORw0KGgo...
    // --------------------------------
    else {

      bytes = Utilities.base64Decode(
        base64
      );

    }

    // --------------------------------
    // Tentukan extension
    // --------------------------------
    const extension =
      contentType.split("/")[1] || "jpg";

    // --------------------------------
    // Nama file
    // --------------------------------
    const safeFileName =
      fileName
        ? generateId() + "_" + fileName
        : generateId() + "." + extension;

    // --------------------------------
    // Blob
    // --------------------------------
    const blob = Utilities.newBlob(
      bytes,
      contentType,
      safeFileName
    );

    // --------------------------------
    // Upload ke Drive
    // --------------------------------
    const file = folder.createFile(blob);

    // --------------------------------
    // Share file
    // --------------------------------
    file.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );

    const fileId = file.getId();

    // --------------------------------
    // Return
    // --------------------------------
    return {

      success: true,

      message: "Upload berhasil",

      fileId: fileId,

      fileName: safeFileName,

      mimeType: contentType,

      url:
        "https://drive.google.com/uc?export=view&id=" +
        fileId,

      downloadUrl:
        "https://drive.google.com/uc?export=download&id=" +
        fileId

    };

  }

  catch (err) {

    try {

      saveError(
        "uploadPhoto()",
        err.toString()
      );

    } catch (e) {

      Logger.log(e);

    }

    return {

      success: false,

      message: err.toString()

    };

  }

}
