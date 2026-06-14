/**
 * MODUL UTILITAS BAHASA ARAB (SHARED)
 * Berisi fungsi normalisasi dan pembersihan harakat.
 */

function cleanArabicHarakat(text) {
  if (!text) return "";
  return String(text).replace(/[\u064B-\u065F\u0670]/g, "");
}

/**
 * Alias untuk cleanArabicHarakat guna mendukung kompatibilitas kode Admin
 */
const cleanArabicDiacritics = cleanArabicHarakat;

function normalizeArabic(text) {
  if (text === null || text === undefined) return "";
  let str = String(text).trim();
  str = str.replace(/[\u064B-\u065F\u0670]/g, "");
  str = str.replace(/\u0640/g, "");
  str = str.replace(/[\u0622\u0623\u0625]/g, "\u0627");
  return str;
}

/**
 * Menyaring teks paragraf menjadi array kata-kata unik bahasa Arab.
 */
function parseArabicText(rawText) {
  const cleanParagraph = rawText.trim().replace(/\s+/g, ' ');
  const rawWords = cleanParagraph.split(' ');
  
  const seen = new Set();
  const uniqueQueue = [];

  rawWords.forEach(word => {
    const cleaned = cleanArabicHarakat(word);
    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
      uniqueQueue.push({
        raw: word,
        clean: cleaned
      });
    }
  });
  return uniqueQueue;
}