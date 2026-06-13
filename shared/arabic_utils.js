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
function cleanArabicDiacritics(word) {
  const diacriticsRegex = /[\u064B-\u0650\u0652]/g;
  let cleaned = word.replace(diacriticsRegex, "");
  cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?،!]/g, "");
  return cleaned.trim();
}

/**
 * Analisis morfologi ringan (stemmer) untuk mendeteksi afiksasi awal/akhir
 * @param {string} word - Kata Arab bersih (tanpa harakat)
 * @returns {Object} Hasil ekstraksi prefiks, kata dasar, dan sufiks
 */
function arabicLightStemmer(word) {
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