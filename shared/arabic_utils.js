/**
 * UTILITY LINGUISTIK ARAB (SHARED MODULE)
 * Versi: v0.5.0-alpha.2 (Fase 0 - Modular)
 * ID Unik: MEB-SHARED-ARABIC-001
 * * Modul bersama yang dapat diakses baik oleh sisi Admin maupun User.
 */

/**
 * Menghapus harakat & tanda baca dari kata Arab
 * @param {string} word - Kata Arab mentah
 * @returns {string} Kata Arab bersih tanpa diakritik
 */
export function cleanArabicDiacritics(word) {
  const diacriticsRegex = /[\u064B-\u0650\u0652]/g;
  let cleaned = word.replace(diacriticsRegex, "");
  cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?،!]/g, "");
  return cleaned.trim();
}

/**
 * Menyaring teks paragraf menjadi array kata-kata unik bahasa Arab.
 */
export function arabicLightStemmer(word) {
  const prefixes = ["ال", "لل", "بال", "كال", "فال", "وال", "ب", "ل", "ف", "و", "س"];
  const suffixes = ["ون", "ين", "ات", "كما", "كم", "هم", "هن", "ها", "نا", "تم", "ت", "ه", "ي", "ا"];
  
  let cleanWord = cleanArabicDiacritics(word);
  let stem = cleanWord;
  let detectedPrefix = "";
  let detectedSuffix = "";

  for (let p of prefixes) {
    if (cleanWord.startsWith(p) && cleanWord.length > p.length + 2) {
      detectedPrefix = p;
      stem = cleanWord.substring(p.length);
      break;
    }
  }

  for (let s of suffixes) {
    if (stem.endsWith(s) && stem.length > s.length + 2) {
      detectedSuffix = s;
      stem = stem.substring(0, stem.length - s.length);
      break;
    }
  }

  return {
    prefix: detectedPrefix,
    stem: stem,
    suffix: detectedSuffix
  };
}

/**
 * Menghapus seluruh harakat dari teks Arab termasuk Syaddah
 * @param {string} text - Teks Arab mentah
 * @returns {string} Teks Arab tanpa harakat
 */
export function cleanArabicHarakat(text) {
  if (!text) return "";
  return String(text).replace(/[\u064B-\u065F\u0670]/g, "");
}

/**
 * Menormalisasi teks Arab: menghapus harakat, tatweel, dan menyamakan variasi Alif
 * @param {string} text - Teks Arab mentah
 * @returns {string} Teks Arab ternormalisasi untuk pencarian database yang akurat
 */
export function normalizeArabic(text) {
  if (text === null || text === undefined) return "";
  let str = String(text).trim();
  str = str.replace(/[\u064B-\u065F\u0670]/g, ""); // Hapus seluruh harakat
  str = str.replace(/\u0640/g, ""); // Hapus Tatweel (Kashida)
  str = str.replace(/[\u0622\u0623\u0625]/g, "\u0627"); // Samakan Alif (أ, إ, آ menjadi ا)
  return str;
}