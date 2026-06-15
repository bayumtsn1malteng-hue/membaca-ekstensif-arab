/**
 * Fungsi utama doPost untuk menangani request dari frontend
 */
function doPost(e) {
  const request = JSON.parse(e.postData.contents);
  const action = request.action;
  const userId = request.userId;
  
  // ... existing action logic ...

  if (action === "bulkReviewWords") {
    return ContentService.createTextOutput(JSON.stringify(handleBulkReviewWords(userId, request.reviews)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // ...
}

/**
 * Menangani pembaruan massal untuk sesi Leitner
 */
function handleBulkReviewWords(userId, reviews) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Kamus_User"); // Pastikan nama sheet sesuai
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const colIdUser = headers.indexOf("ID_User");
    const colIdUserWord = headers.indexOf("ID_User_Word");
    const colStatus = headers.indexOf("Status_Belajar");
    const colNextReview = headers.indexOf("Tanggal_Review_Berikutnya");
    const colStreak = headers.indexOf("Streak_Benar");

    reviews.forEach(rev => {
      for (let i = 1; i < data.length; i++) {
        // Cari baris yang sesuai dengan User dan ID Kata
        if (data[i][colIdUser] == userId && data[i][colIdUserWord] === rev.idUserWord) {
          const currentStatus = data[i][colStatus];
          const isCorrect = rev.isCorrect;
          
          // Hitung progres Leitner (Logika disamakan dengan front-end)
          const nextBox = isCorrect ? (currentStatus === 'Known' ? 'Known' : (parseInt(currentStatus) < 5 ? parseInt(currentStatus) + 1 : 'Known')) : 1;
          const streak = isCorrect ? (parseInt(data[i][colStreak]) || 0) + 1 : 0;
          const intervals = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 'Known': 30 };
          const nextReviewDays = intervals[nextBox] || 1;
          
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + nextReviewDays);
          
          sheet.getRange(i + 1, colStatus + 1).setValue(nextBox);
          sheet.getRange(i + 1, colNextReview + 1).setValue(nextDate.toISOString());
          sheet.getRange(i + 1, colStreak + 1).setValue(streak);
          break; 
        }
      }
    });

    return { status: "success", message: "Sinkronisasi massal berhasil" };
  } catch (err) {
    return { status: "error", message: `Error: ${err.message}` };
  }
}
