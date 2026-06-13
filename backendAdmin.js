/**
 * SISTEM PELACAKAN PROGRESS BE ADMIN
 * Versi: v0.4.5-alpha (Perbaikan Bug Sambungan)
 * ID Unik: MEB-PLAN-2026-003-REV
 * Status: Kode Google Apps Script sudah dapat menangani sambungan 
 */

const SS_ID = "1pGpSgMVJKpdlA8xQz84f9OkUQ4SEjGrsDI_fwK0Cc1g"; 

function getSpreadsheet() {
  if (SS_ID === "") {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  return SpreadsheetApp.openById(SS_ID);
}

function initDatabaseStructure() {
  const ss = getSpreadsheet();
  const sheets = {
    "Pustaka_Bacaan": ["ID_Teks", "Tanggal_Rilis", "Seri", "Judul_Teks", "Judul_Teks_Arab", "Terjemah_Judul_Indonesia", "Konten_Arab", "Terjemah_Indonesia", "Tingkat_Kesulitan"],
    "Peta_Kosakata": ["ID_Kosakata", "ID_Teks", "Kata_Teks", "Kata_Teks_Polos", "Arti_Kata_Teks", "ID_Kata_Induk", "Sambungan_Awal_1", "Sambungan_Awal_2", "Sambungan_Awal_3", "Sambungan_Akhir_1", "Sambungan_Akhir_2", "Sambungan_Akhir_3"],
    "Kata_Induk": ["ID_Kata_Induk", "Kata_Induk", "Kata_Induk_Polos", "Arti_Kata_Induk", "Kategori"],
    "Sambungan": ["ID_Sambungan", "Bentuk_Sambungan", "Letak_Sambungan", "Jenis_Sambungan", "Fungsi_Sambungan", "Keterangan"]
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

function doGet(e) {
  initDatabaseStructure();
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

function getDatabasePayload() {
  const ss = getSpreadsheet();
  return {
    pustaka: sheetToObjects(ss.getSheetByName("Pustaka_Bacaan")),
    peta_kosakata: sheetToObjects(ss.getSheetByName("Peta_Kosakata")),
    kata_induk: sheetToObjects(ss.getSheetByName("Kata_Induk")),
    sambungan: sheetToObjects(ss.getSheetByName("Sambungan"))
  };
}

function doPost(e) {
  initDatabaseStructure();
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(30000);
    
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const ss = getSpreadsheet();
    let response;

    if (action === "saveText") {
      const sheet = ss.getSheetByName("Pustaka_Bacaan");
      response = savePustaka(sheet, requestData.data);
    } else if (action === "saveVocab") {
      response = saveVocabularyMapping(ss, requestData.data);
    } else {
      throw new Error("Aksi backend tidak dikenali.");
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      result: response,
      database: getDatabasePayload()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
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
    const newIndukId = data.ID_Kata_Induk;
    
    const newIndukRow = [
      newIndukId,
      data.Kata_Induk,
      data.Kata_Induk_Polos,
      data.Arti_Kata_Induk,
      data.Kategori
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