/**
 * SISTEM MEMBACA EKSTENSIF BERTINGKAT (MEB) - BACKEND API TERPADU (UJI LATIHAN)
 * Menggabungkan Sisi Admin (v0.6.0-alpha) & Sisi User (Fase 1: Leitner System)
 * Versi Uji: Penambahan Fitur Latihan & Peningkatan Pemetaan Kosakata
 */

// ==========================================
// 0. KONFIGURASI GLOBAL & DATABASE
// ==========================================
const SPREADSHEET_ID = "1pGpSgMVJKpdlA8xQz84f9OkUQ4SEjGrsDI_fwK0Cc1g";
const SS_ID = "1pGpSgMVJKpdlA8xQz84f9OkUQ4SEjGrsDI_fwK0Cc1g"; 

function getDb() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSpreadsheet() {
  if (SS_ID === "") {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  return SpreadsheetApp.openById(SS_ID);
}

// ==========================================
// 1. GATEWAY API TERPADU (doGet & doPost)
// ==========================================

/**
 * Handle HTTP GET Requests (Unified)
 */
function doGet(e) {
  initDatabaseStructure();
  
  const action = e && e.parameter && e.parameter.action;
  
  if (action) {
    let responseData = { success: false, error: "Aksi tidak dikenal atau parameter kurang" };
    try {
      // Sisi User
      if (action === "initDatabase") {
        responseData = initUserDatabase();
      } 
      // Sisi Admin
      else if (action === "getAdminData") {
        responseData = { success: true, data: getAdminData() };
      } else if (action === "getPustaka") {
        responseData = { success: true, data: getPustaka() };
      }
    } catch (err) {
      responseData = { success: false, error: err.toString() };
    }
    return ContentService.createTextOutput(JSON.stringify(responseData))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Default GET: Menarik Seluruh Database Utama (Diperlukan oleh Front-End User)
  try {
    const payload = getDatabasePayload();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: payload
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle HTTP POST Requests (Unified)
 */
function doPost(e) {
  initDatabaseStructure();
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(30000);
    
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const ss = getSpreadsheet();
    const userId = requestData.userId;
    
    // --- ROUTING LOGIKA ADMIN (Sifat Kembalian Dipertahankan) ---
    if (action === "saveText") {
      const sheet = ss.getSheetByName("Pustaka_Bacaan");
      const response = savePustaka(sheet, requestData.data);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        result: response,
        database: getDatabasePayload()
      })).setMimeType(ContentService.MimeType.JSON);
    } 
    
    else if (action === "saveVocab") {
      const response = saveVocabularyMapping(ss, requestData.data);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        result: response,
        database: getDatabasePayload()
      })).setMimeType(ContentService.MimeType.JSON);
    } 

    // --- TAMBAHAN ADMIN LATIHAN ---
    else if (action === "saveLatihan") {
      const response = saveLatihan(requestData.data);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        result: response,
        database: getDatabasePayload()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- ROUTING LOGIKA USER & ADMIN MAPPING ---
    let responseData = { success: false, error: "Aksi backend tidak dikenali." };

    if (action === "registerUser") {
      responseData = registerUser(requestData.username, requestData.password);
    } else if (action === "loginUser") {
      responseData = loginUser(requestData.username, requestData.password);
    } else if (action === "getUserKamus") {
      responseData = getUserKamus(requestData.userId);
    } else if (action === "updateReadingProgress") {
      responseData = updateReadingProgress(requestData.userId, requestData.textId, requestData.isFinished);
    } else if (action === "addWordToKamus") {
      responseData = addWordToKamus(requestData.userId, requestData.idKataInduk, requestData.kataPolos, requestData.artiKustom);
    } else if (action === "reviewWord") {
      responseData = reviewWord(requestData.userId, requestData.idUserWord, requestData.isCorrect);
    } else if (action === "saveMapping") {
      responseData = saveMapping(requestData.data);
    } else if (action === "duplicateSeries") {
      responseData = duplicateSeries(requestData.sourceId, requestData.newName, requestData.newId);
    } else if (action === "deleteScripture" || action === "deleteText") {
      const idToDelete = requestData.idTeks || (requestData.data && requestData.data.ID_Teks);
      responseData = deleteScripture(idToDelete);
    } else if (action === "deleteVocab") {
      const idVocab = requestData.ID_Kosakata || requestData.ID_Kata_Induk;
      responseData = deleteVocab(idVocab, requestData.jenis_kata);
    } else if (action === "deleteLatihan") {
      responseData = deleteLatihan(requestData.idHimpunan, requestData.nomorSoal);
    } else if (action === "deleteMultipleLatihan") {
      responseData = deleteMultipleLatihan(requestData.targets);
    } else if (action === "bulkReviewWords") {
      responseData = handleBulkReviewWords(userId, requestData.reviews);
    } else if (action === "uploadBackupToDrive") {
      responseData = uploadBackupToDrive(requestData.userId, requestData.backupData);
    } else if (action === "getLatestBackupFromDrive") {
      responseData = getLatestBackupFromDrive(requestData.userId);
    } else if (action === "getLatihanQuestions") {
      responseData = getLatihanQuestions(requestData.setId);
    } else if (action === "saveExerciseResults") {
      responseData = saveExerciseResults(userId, requestData.setId, requestData.results);
    } else if (action === "getExerciseScoreHistory") {
      responseData = getExerciseScoreHistory(userId, requestData.setId);
    } else {
      throw new Error("Aksi backend tidak dikenali: " + action);
    }

    return ContentService.createTextOutput(JSON.stringify(responseData))
                         .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}


// ==========================================
// 2. BASIS LOGIKA ADMIN
// ==========================================

function initDatabaseStructure() {
  const ss = getSpreadsheet();
  const sheets = {
    "Pustaka_Bacaan": ["ID_Teks", "Tanggal_Rilis", "Seri", "Judul_Teks", "Judul_Teks_Arab", "Terjemah_Judul_Indonesia", "Konten_Arab", "Terjemah_Indonesia", "Tingkat_Kesulitan"],
    "Peta_Kosakata": ["ID_Kosakata", "ID_Teks", "Kata_Teks", "Kata_Teks_Polos", "Arti_Kata_Teks", "ID_Kata_Induk", "Sambungan_Awal_1", "Sambungan_Awal_2", "Sambungan_Awal_3", "Sambungan_Akhir_1", "Sambungan_Akhir_2", "Sambungan_Akhir_3"],
    "Kata_Induk": ["ID_Kata_Induk", "Kata_Induk", "Kata_Induk_Polos", "Arti_Kata_Induk", "Kategori"],
    "Sambungan": ["ID_Sambungan", "Bentuk_Sambungan", "Letak_Sambungan", "Jenis_Sambungan", "Fungsi_Sambungan", "Keterangan"],
    "Pustaka_Latihan": ["ID_Himpunan_Latihan", "ID_No_Soal", "Judul_Himpunan_Latihan", "Nomor_Soal", "Teks_Soal", "Pilihan_A", "Pilihan_B", "Pilihan_C", "Pilihan_D", "Pilihan_E", "Jawaban_Benar", "Feedback_Jawaban_Benar", "Feedback_Jawaban_Salah"],
    "Judul_Himpunan_Latihan": ["ID_Himpunan_Latihan", "Judul_Himpunan_Latihan", "Jumlah_Soal_Terdaftar"].concat(Array.from({length: 100}, (_, i) => `ID_Soal_${i+1}`)),
    "Progres_Latihan_User": ["ID_Progres_Latihan", "ID_User", "ID_Himpunan_Latihan", "ID_No_Soal", "Jawaban_User", "Status_Benar", "Tanggal_Mengerjakan"]
  };

  for (let sheetName in sheets) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      sheet.getRange(1, 1, 1, sheets[sheetName].length).setFontWeight("bold").setBackground("#f3f4f6");
    }
  }
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function getDatabasePayload() {
  const ss = getSpreadsheet();
  return {
    pustaka: sheetToObjects(ss.getSheetByName("Pustaka_Bacaan")),
    peta_kosakata: sheetToObjects(ss.getSheetByName("Peta_Kosakata")),
    kata_induk: sheetToObjects(ss.getSheetByName("Kata_Induk")),
    sambungan: sheetToObjects(ss.getSheetByName("Sambungan")),
    pustaka_latihan: sheetToObjects(ss.getSheetByName("Pustaka_Latihan")),
    judul_himpunan_latihan: sheetToObjects(ss.getSheetByName("Judul_Himpunan_Latihan"))
  };
}

function getAdminData() {
  const db = getDb();
  const sheet = db.getSheetByName("Peta_Kosakata");
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  return values.slice(1); 
}

function getPustaka() {
  const db = getDb();
  const sheet = db.getSheetByName("Pustaka_Bacaan");
  if (!sheet) return [];
  return sheet.getDataRange().getValues().slice(1);
}

/**
 * Menghapus naskah dari Pustaka_Bacaan dan Peta_Kosakata terkait
 */
function deleteScripture(idTeks) {
  if (!idTeks) return { success: false, error: "ID Teks tidak valid" };
  const ss = getSpreadsheet();
  
  const sheetPustaka = ss.getSheetByName("Pustaka_Bacaan");
  const dataP = sheetPustaka.getDataRange().getValues();
  for (let i = dataP.length - 1; i >= 1; i--) {
    if (dataP[i][0] === idTeks) {
      sheetPustaka.deleteRow(i + 1);
    }
  }

  const sheetPeta = ss.getSheetByName("Peta_Kosakata");
  const dataV = sheetPeta.getDataRange().getValues();
  for (let i = dataV.length - 1; i >= 1; i--) {
    if (dataV[i][1] === idTeks) {
      sheetPeta.deleteRow(i + 1);
    }
  }

  return { success: true, message: `Naskah ${idTeks} dan pemetaannya dihapus.` };
}

/**
 * Menghapus baris kosakata (Peta atau Induk)
 */
function deleteVocab(id, jenis) {
  const ss = getSpreadsheet();
  const sheetName = (jenis === "Induk") ? "Kata_Induk" : "Peta_Kosakata";
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const idCol = 0; 

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: `${jenis} ID ${id} berhasil dihapus.` };
    }
  }
  return { success: false, error: "Data tidak ditemukan." };
}

function savePustaka(sheet, data) {
  const newRow = [
    data.ID_Teks,
    data.Tanggal_Rilis,
    data.Seri,
    data.Judul_Teks,
    data.Judul_Teks_Arab,
    data.Terjemah_Judul_Indonesia,
    data.Konten_Arab,
    data.Terjemah_Indonesia,
    data.Tingkat_Kesulitan
  ];
  sheet.appendRow(newRow);
  return { id_teks: data.ID_Teks, message: "Pustaka Bacaan berhasil ditambahkan." };
}

function saveVocabularyMapping(ss, data) {
  const isIndukOnly = data.jenis_kata === "Induk";
  
  if (isIndukOnly) {
    const sheetInduk = ss.getSheetByName("Kata_Induk");
    const values = sheetInduk.getDataRange().getValues();
    const headers = values[0];
    const polosCol = headers.indexOf("Kata_Induk_Polos");

    // Syarat 1: Cek duplikasi Kata_Induk_Polos
    for (let i = 1; i < values.length; i++) {
      if (values[i][polosCol].toString().trim() === data.Kata_Induk_Polos.trim()) {
        return { type: "induk_exists", id_induk: values[i][0] };
      }
    }

    // Syarat 2: Generate ID IND-{5digit} berurutan (ID tertinggi + 1)
    let nextNum = 1;
    if (values.length > 1) {
      const currentIds = values.slice(1).map(row => {
        const match = row[0].toString().match(/IND-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      const maxId = Math.max(...currentIds, 0);
      nextNum = maxId + 1;
    }
    const newIndukId = "IND-" + nextNum.toString().padStart(5, '0');
    
    const newIndukRow = [
      newIndukId,
      data.Kata_Induk,
      data.Kata_Induk_Polos,
      data.Arti_Kata_Induk,
      data.Kategori // Menggunakan kategori yang dikirim dari frontend
    ];
    sheetInduk.appendRow(newIndukRow);
    return { type: "induk_created", id_induk: newIndukId };
    
  } else {
    const sheetPeta = ss.getSheetByName("Peta_Kosakata");
    const petaDataRaw = sheetPeta.getDataRange().getValues();
    const headers = petaDataRaw[0];
    const cleanWordIndex = headers.indexOf("Kata_Teks_Polos");
    
    let targetRowIndex = -1;
    for (let i = 1; i < petaDataRaw.length; i++) {
      if (petaDataRaw[i][cleanWordIndex] === data.Kata_Teks_Polos) {
        targetRowIndex = i + 1;
        break;
      }
    }

    const rowData = [
      data.ID_Kosakata,
      data.ID_Teks || "",
      data.Kata_Teks,
      data.Kata_Teks_Polos,
      data.Arti_Kata_Teks,
      data.ID_Kata_Induk,
      data.Sambungan_Awal_1 || "",
      data.Sambungan_Awal_2 || "",
      data.Sambungan_Awal_3 || "",
      data.Sambungan_Akhir_1 || "",
      data.Sambungan_Akhir_2 || "",
      data.Sambungan_Akhir_3 || ""
    ];

    if (targetRowIndex !== -1) {
      const range = sheetPeta.getRange(targetRowIndex, 1, 1, rowData.length);
      range.setValues([rowData]);
    } else {
      sheetPeta.appendRow(rowData);
    }

    return { type: "peta_kosakata_synced", id_kosakata: data.ID_Kosakata };
  }
}

/**
 * LOGIKA PENYIMPANAN DATA LATIHAN (BRIDGE LATIHAN.HTML)
 */
function saveLatihan(data) {
  const ss = getSpreadsheet();
  const sheetPustaka = ss.getSheetByName("Pustaka_Latihan");
  const sheetJudul = ss.getSheetByName("Judul_Himpunan_Latihan");

  const numSoal = parseInt(data.Nomor_Soal);
  if (isNaN(numSoal) || numSoal < 1 || numSoal > 100) {
    return { success: false, error: "Nomor soal tidak valid (1-100)." };
  }

  const dataPustaka = sheetPustaka.getDataRange().getValues();
  let rowIndexPustaka = -1;
  for (let i = 1; i < dataPustaka.length; i++) {
    if (dataPustaka[i][0] === data.ID_Himpunan_Latihan && parseInt(dataPustaka[i][3]) === numSoal) {
      rowIndexPustaka = i + 1;
      break;
    }
  }

  const idNoSoal = data.ID_No_Soal || "QN-" + Utilities.getUuid().substring(0,8).toUpperCase();
  
  const rowPustaka = [
    data.ID_Himpunan_Latihan,
    idNoSoal,
    data.Judul_Himpunan_Latihan,
    numSoal,
    data.Teks_Soal,
    data.Pilihan_A,
    data.Pilihan_B,
    data.Pilihan_C,
    data.Pilihan_D,
    data.Pilihan_E,
    data.Jawaban_Benar,
    data.Feedback_Jawaban_Benar,
    data.Feedback_Jawaban_Salah
  ];

  if (rowIndexPustaka !== -1) {
    sheetPustaka.getRange(rowIndexPustaka, 1, 1, rowPustaka.length).setValues([rowPustaka]);
  } else {
    sheetPustaka.appendRow(rowPustaka);
  }

  const dataJudul = sheetJudul.getDataRange().getValues();
  let rowIndexJudul = -1;
  for (let i = 1; i < dataJudul.length; i++) {
    if (dataJudul[i][0] === data.ID_Himpunan_Latihan) {
      rowIndexJudul = i + 1;
      break;
    }
  }

  if (rowIndexJudul === -1) {
    const newJudulRow = new Array(103).fill("");
    newJudulRow[0] = data.ID_Himpunan_Latihan;
    newJudulRow[1] = data.Judul_Himpunan_Latihan;
    newJudulRow[2] = 0;
    sheetJudul.appendRow(newJudulRow);
    rowIndexJudul = sheetJudul.getLastRow();
  }

  const colIndex = 3 + (numSoal - 1);
  if (colIndex >= 3 && colIndex < 103) {
    sheetJudul.getRange(rowIndexJudul, colIndex + 1).setValue(idNoSoal);
  }

  const updatedRow = sheetJudul.getRange(rowIndexJudul, 1, 1, 103).getValues()[0];
  let count = 0;
  for (let i = 3; i < 103; i++) {
    if (updatedRow[i] !== "") count++;
  }
  sheetJudul.getRange(rowIndexJudul, 3).setValue(count);

  return { success: true, id_no_soal: idNoSoal, total_soal: count, message: "Latihan berhasil disimpan." };
}

/**
 * Mengunggah cadangan data JSON ke Google Drive pengguna.
 * @param {string} userId - ID pengguna yang melakukan backup.
 * @param {string} backupJsonString - Data cadangan dalam format string JSON.
 * @returns {Object} Objek respons berisi status sukses dan detail file.
 */
function uploadBackupToDrive(userId, backupJsonString) {
  try {
    const folderName = "MEB Backups";
    let folder = DriveApp.getFoldersByName(folderName).next();
    
    // Buat folder jika belum ada
    if (!folder) {
      folder = DriveApp.createFolder(folderName);
    }

    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HHmmss");
    const fileName = `MEB_Backup_${userId}_${timestamp}.json`;

    const file = folder.createFile(fileName, backupJsonString, MimeType.JSON);

    return { success: true, message: "Cadangan berhasil diunggah ke Google Drive.", fileId: file.getId(), fileName: file.getName() };
  } catch (err) {
    return { success: false, error: `Gagal mengunggah ke Google Drive: ${err.toString()}` };
  }
}

/**
 * Mengambil konten file cadangan terbaru dari Google Drive berdasarkan UserId.
 * @param {string} userId - ID User yang mencari cadangan.
 * @returns {Object} Objek respons berisi data JSON cadangan.
 */
function getLatestBackupFromDrive(userId) {
  try {
    const folderName = "MEB Backups";
    const folders = DriveApp.getFoldersByName(folderName);
    if (!folders.hasNext()) return { success: false, error: "Folder cadangan tidak ditemukan." };
    
    const folder = folders.next();
    const files = folder.getFilesByType(MimeType.JSON);
    const backups = [];
    
    while (files.hasNext()) {
      const file = files.next();
      // Pola nama: MEB_Backup_IDUSER_YYYY-MM-DD... 
      // Ditambahkan "_" setelah userId untuk mencegah partial match (misal: USR-1 cocok dengan USR-10)
      if (file.getName().indexOf("MEB_Backup_" + userId + "_") !== -1) {
        backups.push({
          id: file.getId(),
          dateCreated: file.getDateCreated()
        });
      }
    }
    
    if (backups.length === 0) return { success: false, error: "Tidak ada file cadangan di Drive Anda." };
    
    // Urutkan berdasarkan tanggal dibuat (terbaru di atas)
    backups.sort((a, b) => b.dateCreated - a.dateCreated);
    const latestFile = DriveApp.getFileById(backups[0].id);
    const content = latestFile.getBlob().getDataAsString();
    
    return { success: true, data: JSON.parse(content) };
  } catch (err) {
    return { success: false, error: "Gagal mengambil cadangan: " + err.toString() };
  }
}


/**
 * LOGIKA PENGHAPUSAN DATA LATIHAN
 */
function deleteLatihan(idHimpunan, nomorSoal) {
  const ss = getSpreadsheet();
  const sheetPustaka = ss.getSheetByName("Pustaka_Latihan");
  const sheetJudul = ss.getSheetByName("Judul_Himpunan_Latihan");
  
  if (nomorSoal) {
    const n = parseInt(nomorSoal);
    const dataP = sheetPustaka.getDataRange().getValues();
    for (let i = dataP.length - 1; i >= 1; i--) {
      if (dataP[i][0] === idHimpunan && parseInt(dataP[i][3]) === n) {
        sheetPustaka.deleteRow(i + 1);
      }
    }
    
    const dataJ = sheetJudul.getDataRange().getValues();
    for (let i = 1; i < dataJ.length; i++) {
      if (dataJ[i][0] === idHimpunan) {
        // Kolom ID_Soal_1 dimulai dari indeks kolom 4 (indeks array 3)
        const colIndex = 3 + (n - 1);
        sheetJudul.getRange(i + 1, colIndex + 1).setValue("");
        
        // Hitung ulang Jumlah_Soal_Terdaftar
        const row = sheetJudul.getRange(i + 1, 1, 1, 103).getValues()[0];
        let count = 0;
        for (let j = 3; j < 103; j++) { if (row[j] && row[j] !== "") count++; }
        sheetJudul.getRange(i + 1, 3).setValue(count);
        break;
      }
    }
    return { success: true, message: `Soal nomor ${n} pada himpunan ${idHimpunan} berhasil dihapus.` };
  } else {
    const dataP = sheetPustaka.getDataRange().getValues();
    for (let i = dataP.length - 1; i >= 1; i--) {
      if (dataP[i][0] === idHimpunan) {
        sheetPustaka.deleteRow(i + 1);
      }
    }
    const dataJ = sheetJudul.getDataRange().getValues();
    for (let i = dataJ.length - 1; i >= 1; i--) {
      if (dataJ[i][0] === idHimpunan) {
        sheetJudul.deleteRow(i + 1);
      }
    }
    return { success: true, message: `Himpunan ${idHimpunan} beserta seluruh soalnya telah dihapus.` };
  }
}


// ==========================================
// 3. LOGIKA USER (TAMBAHAN BARU - FASE 1)
// ==========================================

function initUserDatabase() {
  const db = getDb();
  const tables = {
    "Login_User": ["No", "ID_User", "Username", "Password", "Salt", "Login_Pertama", "Login_Terakhir", "Reset_Token", "Reset_Expired", "Jumlah_Teks_Dibaca", "Jumlah_Kata_Learning", "Jumlah_Kata_Known"],
    "Progres_Membaca": ["ID_Progress", "ID_User", "ID_Teks", "Status_Selesai", "Tanggal_Terakhir_Membaca"],
    "Kamus_User": ["ID_User_Word", "ID_User", "Kata_Polos", "ID_Kata_Induk", "Arti_Kustom", "Status_Belajar", "Tanggal_Simpan", "Tanggal_Review_Berikutnya", "Streak_Benar"]
  };
  const report = {};
  for (const [sheetName, headers] of Object.entries(tables)) {
    let sheet = db.getSheetByName(sheetName);
    if (!sheet) {
      sheet = db.insertSheet(sheetName);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#E0F2FE").setHorizontalAlignment("center");
      report[sheetName] = "Berhasil Dibuat";
    } else {
      report[sheetName] = "Sudah Tersedia";
    }
  }
  return { success: true, status: report };
}

function generateSalt(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let salt = "";
  for (let i = 0; i < length; i++) { salt += chars.charAt(Math.floor(Math.random() * chars.length)); }
  return salt;
}

function hashPassword(password, salt) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt, Utilities.Charset.UTF_8);
  let hashStr = "";
  for (let i = 0; i < rawHash.length; i++) {
    let byteValue = rawHash[i];
    if (byteValue < 0) byteValue += 256;
    let byteString = byteValue.toString(16);
    if (byteString.length == 1) byteString = "0" + byteString;
    hashStr += byteString;
  }
  return hashStr;
}

function registerUser(username, password) {
  const db = getDb();
  const sheet = db.getSheetByName("Login_User") || initUserDatabase() && db.getSheetByName("Login_User");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2].toString().toLowerCase() === username.toLowerCase()) { return { success: false, error: "Username sudah digunakan!" }; }
  }
  const timestamp = new Date();
  const salt = generateSalt();
  const hashedPassword = hashPassword(password, salt);
  const idUser = "USR-" + Utilities.formatDate(timestamp, "GMT+7", "yyyyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
  sheet.appendRow([data.length, idUser, username, hashedPassword, salt, timestamp, timestamp, "", "", 0, 0, 0]);
  return { success: true, userId: idUser };
}

function loginUser(username, password) {
  const db = getDb();
  const sheet = db.getSheetByName("Login_User");
  if (!sheet) return { success: false, error: "Database pengguna belum siap" };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2].toString().toLowerCase() === username.toLowerCase()) {
      const challengeHash = hashPassword(password, data[i][4]);
      if (challengeHash === data[i][3]) {
        sheet.getRange(i + 1, 7).setValue(new Date());
        return { success: true, userId: data[i][1], username: data[i][2], stats: { teksDibaca: data[i][9], kataLearning: data[i][10], kataKnown: data[i][11] } };
      } else { return { success: false, error: "Password salah!" }; }
    }
  }
  return { success: false, error: "Username tidak ditemukan!" };
}

function getUserKamus(userId) {
  const db = getDb();
  const sheet = db.getSheetByName("Kamus_User");
  if (!sheet) return { success: true, data: [] };
  const data = sheet.getDataRange().getValues();
  const userKamus = [];
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === userId) {
      let obj = {};
      headers.forEach((header, index) => { obj[header] = data[i][index]; });
      userKamus.push(obj);
    }
  }
  return { success: true, data: userKamus };
}

function updateReadingProgress(userId, textId, isFinished) {
  const db = getDb();
  const progressSheet = db.getSheetByName("Progres_Membaca") || initUserDatabase() && db.getSheetByName("Progres_Membaca");
  const data = progressSheet.getDataRange().getValues();
  let foundRow = -1;
  const timestamp = new Date();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === userId && data[i][2] === textId) { foundRow = i + 1; break; }
  }
  if (foundRow !== -1) {
    progressSheet.getRange(foundRow, 4).setValue(isFinished);
    progressSheet.getRange(foundRow, 5).setValue(timestamp);
  } else { progressSheet.appendRow(["PRG-" + Math.floor(100000 + Math.random() * 900000), userId, textId, isFinished, timestamp]); }
  if (isFinished) recalculateReadingStats(userId);
  return { success: true };
}

function recalculateReadingStats(userId) {
  const db = getDb();
  const progressSheet = db.getSheetByName("Progres_Membaca");
  const userSheet = db.getSheetByName("Login_User");
  if (!progressSheet || !userSheet) return;
  const progressData = progressSheet.getDataRange().getValues();
  let totalFinished = 0;
  for (let i = 1; i < progressData.length; i++) { if (progressData[i][1] === userId && progressData[i][3] === true) totalFinished++; }
  const userData = userSheet.getDataRange().getValues();
  for (let i = 1; i < userData.length; i++) { if (userData[i][1] === userId) { userSheet.getRange(i + 1, 10).setValue(totalFinished); break; } }
}

function addWordToKamus(userId, idKataInduk, kataPolos, artiKustom) {
  const db = getDb();
  const kamusSheet = db.getSheetByName("Kamus_User") || initUserDatabase() && db.getSheetByName("Kamus_User");
  const data = kamusSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === userId && data[i][2].toString().trim() === kataPolos.trim()) { return { success: false, error: "Kata ini sudah ada di kamus Anda!" }; }
  }
  const timestamp = new Date();
  const idUserWord = "VOC-" + Math.floor(100000 + Math.random() * 900000);
  const reviewBesok = new Date(); reviewBesok.setDate(timestamp.getDate() + 1);
  kamusSheet.appendRow([idUserWord, userId, kataPolos, idKataInduk, artiKustom, 1, timestamp, reviewBesok, 0]);
  updateUserKamusStats(userId);
  return { success: true, idUserWord: idUserWord };
}

function reviewWord(userId, idUserWord, isCorrect) {
  const db = getDb();
  const kamusSheet = db.getSheetByName("Kamus_User");
  if (!kamusSheet) return { success: false, error: "Database kamus belum siap" };
  const data = kamusSheet.getDataRange().getValues();
  let targetRow = -1;
  for (let i = 1; i < data.length; i++) { if (data[i][0] === idUserWord && data[i][1] === userId) { targetRow = i + 1; break; } }
  if (targetRow === -1) return { success: false, error: "Kosakata tidak ditemukan" };
  const currentBox = parseInt(kamusSheet.getRange(targetRow, 6).getValue()) || 1;
  const currentStreak = parseInt(kamusSheet.getRange(targetRow, 9).getValue()) || 0;
  let nextBox = 1; let nextStreak = 0; let daysToAdd = 1;
  if (isCorrect) {
    nextStreak = currentStreak + 1;
    if (currentBox < 5) nextBox = currentBox + 1; else nextBox = "Known";
    switch(nextBox) { case 2: daysToAdd = 2; break; case 3: daysToAdd = 4; break; case 4: daysToAdd = 8; break; case 5: daysToAdd = 16; break; case "Known": daysToAdd = 999; break; }
  }
  const nextReviewDate = new Date(); nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
  kamusSheet.getRange(targetRow, 6).setValue(nextBox);
  kamusSheet.getRange(targetRow, 8).setValue(nextReviewDate);
  kamusSheet.getRange(targetRow, 9).setValue(nextStreak);
  updateUserKamusStats(userId);
  return { success: true, nextBox: nextBox, nextReview: nextReviewDate, streak: nextStreak };
}

function updateUserKamusStats(userId) {
  const db = getDb();
  const kamusSheet = db.getSheetByName("Kamus_User");
  const userSheet = db.getSheetByName("Login_User");
  if (!kamusSheet || !userSheet) return;
  const kamusData = kamusSheet.getDataRange().getValues();
  let countLearning = 0; let countKnown = 0;
  for (let i = 1; i < kamusData.length; i++) {
    if (kamusData[i][1] === userId) { if (kamusData[i][5].toString() === "Known") countKnown++; else countLearning++; }
  }
  const userData = userSheet.getDataRange().getValues();
  for (let i = 1; i < userData.length; i++) { if (userData[i][1] === userId) { userSheet.getRange(i + 1, 11).setValue(countLearning); userSheet.getRange(i + 1, 12).setValue(countKnown); break; } }
}

/**
 * Menangani pembaruan massal untuk sesi Leitner (Optimized Version)
 * Strategi Optimasi: 
 * 1. Menggunakan Map untuk pencarian O(1).
 * 2. Memproses perubahan di memori (Array).
 * 3. Menulis kembali ke Sheet dalam satu operasi (Batch Update) untuk kecepatan maksimal.
 */
function handleBulkReviewWords(userId, reviews) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("Kamus_User");
    if (!sheet) throw new Error("Sheet Kamus_User tidak ditemukan.");

    const range = sheet.getDataRange();
    const data = range.getValues();
    const headers = data[0];
    
    const colIdx = {
      idUser: headers.indexOf("ID_User"),
      idUserWord: headers.indexOf("ID_User_Word"),
      status: headers.indexOf("Status_Belajar"),
      nextReview: headers.indexOf("Tanggal_Review_Berikutnya"),
      streak: headers.indexOf("Streak_Benar")
    };

    // Buat index baris untuk akses cepat berdasarkan ID_User_Word
    const rowMap = {};
    for (let i = 1; i < data.length; i++) {
      if (data[i][colIdx.idUser] == userId) {
        rowMap[data[i][colIdx.idUserWord]] = i;
      }
    }

    reviews.forEach(rev => {
      const rowIndex = rowMap[rev.idUserWord];
      if (rowIndex !== undefined) {
        const isCorrect = rev.isCorrect;
        const currentStatus = data[rowIndex][colIdx.status];
        
        const nextBox = isCorrect ? (currentStatus === 'Known' ? 'Known' : (parseInt(currentStatus) < 5 ? parseInt(currentStatus) + 1 : 'Known')) : 1;
        const streak = isCorrect ? (parseInt(data[rowIndex][colIdx.streak]) || 0) + 1 : 0;
        const intervals = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 'Known': 30 };
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (intervals[nextBox] || 1));

        // Update data di memori (Array)
        data[rowIndex][colIdx.status] = nextBox;
        data[rowIndex][colIdx.nextReview] = nextDate.toISOString();
        data[rowIndex][colIdx.streak] = streak;
      }
    });

    // Tulis kembali seluruh data ke Sheet dalam satu kali transaksi (Sangat Cepat)
    range.setValues(data);

    // Perbarui Statistik Pengguna (Learning & Known)
    updateUserKamusStats(userId);

    return { success: true, message: "Sinkronisasi massal dan pembaruan statistik berhasil." };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Mengambil riwayat skor latihan user untuk himpunan tertentu dari sheet Progres_Latihan_User.
 * Mengelompokkan catatan berdasarkan Tanggal_Mengerjakan untuk merepresentasikan setiap percobaan.
 * @param {string} userId - ID User.
 * @param {string} setId - ID Himpunan Latihan.
 * @returns {Object} Objek respons berisi status sukses dan data riwayat skor.
 */
function getExerciseScoreHistory(userId, setId) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("Progres_Latihan_User");
    if (!sheet) return { success: true, data: [] }; // Tidak ada riwayat jika sheet tidak ada

    const allRecords = sheetToObjects(sheet);
    const userSetRecords = allRecords.filter(record => 
      record.ID_User === userId && record.ID_Himpunan_Latihan === setId
    );

    if (userSetRecords.length === 0) {
      return { success: true, data: [] };
    }

    // Kelompokkan catatan berdasarkan 'Tanggal_Mengerjakan' untuk merepresentasikan setiap percobaan
    const attemptsMap = new Map(); // Key: Tanggal_Mengerjakan (sebagai string ISO), Value: Array of records for that attempt

    userSetRecords.forEach(record => {
      // Pastikan Tanggal_Mengerjakan adalah objek Date sebelum memanggil toISOString()
      const dateKey = record.Tanggal_Mengerjakan instanceof Date ? record.Tanggal_Mengerjakan.toISOString() : new Date(record.Tanggal_Mengerjakan).toISOString();
      if (!attemptsMap.has(dateKey)) {
        attemptsMap.set(dateKey, []);
      }
      attemptsMap.get(dateKey).push(record);
    });

    const scoreHistory = [];
    attemptsMap.forEach((attemptRecords, dateKey) => {
      const totalQuestions = attemptRecords.length;
      const correctCount = attemptRecords.filter(record => record.Status_Benar === true).length;
      const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
      
      scoreHistory.push({
        Tanggal_Mengerjakan: new Date(dateKey), // Konversi kembali ke objek Date untuk frontend
        Score_Percentage: parseFloat(scorePercentage.toFixed(2)),
        Total_Correct: correctCount,
        Total_Questions: totalQuestions
      });
    });

    scoreHistory.sort((a, b) => b.Tanggal_Mengerjakan.getTime() - a.Tanggal_Mengerjakan.getTime()); // Urutkan dari terbaru
    return { success: true, data: scoreHistory };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Mengambil data soal lengkap berdasarkan ID_Himpunan_Latihan
 * Urutan soal disesuaikan dengan mapping di sheet Judul_Himpunan_Latihan
 * @param {string} setId - ID Himpunan Latihan
 */
function getLatihanQuestions(setId) {
  try {
    const ss = getSpreadsheet();
    const sheetJudul = ss.getSheetByName("Judul_Himpunan_Latihan");
    const sheetPustaka = ss.getSheetByName("Pustaka_Latihan");
    
    const judulData = sheetToObjects(sheetJudul);
    const setEntry = judulData.find(row => row.ID_Himpunan_Latihan === setId);
    
    if (!setEntry) throw new Error("Himpunan latihan tidak ditemukan.");
    
    // Ambil daftar ID soal dari kolom ID_Soal_1 sampai ID_Soal_100
    const questionIds = [];
    for (let i = 1; i <= 100; i++) {
      const key = "ID_Soal_" + i;
      if (setEntry[key]) questionIds.push(setEntry[key]);
    }
    
    if (questionIds.length === 0) return { success: true, data: [] };
    
    const allQuestions = sheetToObjects(sheetPustaka);
    // Map untuk memastikan urutan soal sesuai dengan urutan di Judul_Himpunan_Latihan
    const orderedQuestions = questionIds.map(id => allQuestions.find(q => q.ID_No_Soal === id)).filter(Boolean);
    
    return { success: true, data: orderedQuestions };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Menyimpan hasil latihan user ke sheet Progres_Latihan_User
 * @param {string} userId - ID User
 * @param {string} setId - ID Himpunan Latihan
 * @param {Array} results - Array berisi objek { questionId, userAnswer, isCorrect }
 */
function saveExerciseResults(userId, setId, results) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("Progres_Latihan_User");
    if (!sheet) throw new Error("Sheet Progres_Latihan_User tidak ditemukan.");
    
    const timestamp = new Date();
    let correctCount = 0;
    const rowsToAdd = results.map(res => [
      "PRG-L-" + Utilities.getUuid().substring(0, 8).toUpperCase(),
      userId,
      setId,
      res.questionId,
      res.userAnswer,
      res.isCorrect,
      timestamp
    ]);
    
    correctCount = results.filter(res => res.isCorrect).length;
    const totalQuestions = results.length;
    const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    if (rowsToAdd.length > 0) {
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, rowsToAdd.length, 7).setValues(rowsToAdd);
    }
    
    return { success: true, message: "Hasil latihan berhasil disimpan.", score: scorePercentage.toFixed(2) };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}