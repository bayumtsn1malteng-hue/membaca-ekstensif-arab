/**
 * MODUL STATE & DATABASE (USER STATE MODULE)
 * Versi: v0.2.0
 * Menangani definisi schema Dexie dan state global aplikasi.
 */
import Dexie from './dexie.mjs';

// ============================================================
// --- KONFIGURASI INDEXEDDB (DEXIE.JS) ---
// ============================================================
export const db = new Dexie("MEB_UserDB");
db.version(3).stores({
  pustaka: "ID_Teks, Seri, Tingkat_Kesulitan, Judul_Teks, Judul_Teks_Arab",
  petaKosakata: "ID_Kosakata, ID_Teks, Kata_Teks_Polos, ID_Kata_Induk",
  kamusUser: "ID_User_Word, ID_User, Kata_Polos, ID_Kata_Induk, Status_Belajar, Tanggal_Update",
  kataInduk: "ID_Kata_Induk, Kata_Induk_Polos",
  sambungan: "ID_Sambungan, Bentuk_Sambungan",
  appLogs: "++id, eventType, timestamp",
  bookmarks: "id, setId",
  settings: "key"
});

// ============================================================
// --- STATE UTAMA APLIKASI ---
// ============================================================
const baseState = {
  gasEndpoint: localStorage.getItem('meb_gas_endpoint') || '',
  isMockMode: !localStorage.getItem('meb_gas_endpoint'),
  currentUser: JSON.parse(localStorage.getItem('meb_user')) || null,
  pustaka: [],
  petaKosakata: [],
  kataInduk: [],
  sambungan: [],
  kamusUser: [],
  currentReadingText: null,
  activeWordSelected: null,
  isAuthRegister: false,
  selectedBoxFilter: 'semua',
  readerFontSize: Number(localStorage.getItem('meb_reader_font_size') || 24),
  readerLineHeight: Number(localStorage.getItem('meb_reader_line_height') || 1.2),
  leitnerSessionWords: [],
  leitnerSessionIndex: 0,
  leitnerReviewResults: [],
  leitnerFilter: {
    source: 'all',
    specificId: 'all'
  },
  exerciseScoreHistory: [],
  currentExerciseType: 'multiple_choice',
  currentExerciseSetId: null,
  currentQuestionIndex: 0,
  judulHimpunanLatihan: [],
  currentQuestionData: null,
  exerciseMode: 'read',
  exerciseQuestions: [],
  userAnswers: [],
  bookmarkedQuestions: JSON.parse(localStorage.getItem('meb_bookmarks') || '[]')
};

// Proxy debugging untuk memantau perubahan appState di Console
export const appState = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? new Proxy(baseState, {
    set(target, key, value) {
      console.log(`%c[STATE] %c${key}:`, 'color: #14b8a6; font-weight: bold', 'color: #64748b', value);
      target[key] = value;
      return true;
    }
  })
  : baseState;

// ============================================================
// --- DATA MOCK (FALLBACK OFFLINE) ---
// ============================================================
export const MOCK_PUSTAKA = [
  {
    ID_Teks: "TX-20260601-1",
    Seri: "Hewan & Alam",
    Judul_Teks_Arab: "الأَسَدُ الحَكِيمُ",
    Terjemah_Judul_Indonesia: "Singa yang Bijaksana",
    Konten_Arab: "فِي غَابَةٍ صَغِيرَةٍ، كَانَ الأَسَدُ الحَكِيمُ يَحْمِي الحَيَوَانَاتِ مِنَ الخَطَرِ الكَبِيرِ.",
    Terjemah_Indonesia: "Di sebuah hutan kecil, singa yang bijaksana melindungi hewan-hewan dari bahaya besar.",
    Tingkat_Kesulitan: "pemula"
  },
  {
    ID_Teks: "TX-20260601-2",
    Seri: "Kisah Sahabat",
    Judul_Teks_Arab: "شِرَاءُ البَيْتِ فِي الجَنَّةِ",
    Terjemah_Judul_Indonesia: "Membeli Rumah di Surga",
    Konten_Arab: "ذَهَبَ الصَّحَابِيُّ الكَرِيمُ إِلَى مَدِينَةِ مُنَوَّرَةِ لِيُسَاعِدَ الفُقَرَاءَ بِأَمْوَالِهِ الكَثِيرَةِ.",
    Terjemah_Indonesia: "Sahabat yang mulia pergi ke Madinah Munawwarah untuk membantu orang-orang fakir dengan hartanya yang melimpah.",
    Tingkat_Kesulitan: "menengah"
  }
];

export const MOCK_PETA_KOSAKATA = [
  { ID_Kosakata: "VOC-001", ID_Teks: "TX-20260601-1", Kata_Teks: "أَسَدٌ", Kata_Teks_Polos: "أسد", Arti_Kata_Teks: "singa", ID_Kata_Induk: "IND-101", Sambungan_Awal_1: "", Sambungan_Awal_2: "", Sambungan_Awal_3: "", Sambungan_Akhir_1: "", Sambungan_Akhir_2: "", Sambungan_Akhir_3: "" },
  { ID_Kosakata: "VOC-002", ID_Teks: "TX-20260601-1", Kata_Teks: "الأَسَدُ", Kata_Teks_Polos: "الأسد", Arti_Kata_Teks: "singa itu", ID_Kata_Induk: "IND-101", Sambungan_Awal_1: "CON-01", Sambungan_Awal_2: "", Sambungan_Awal_3: "", Sambungan_Akhir_1: "", Sambungan_Akhir_2: "", Sambungan_Akhir_3: "" },
  { ID_Kosakata: "VOC-003", ID_Teks: "TX-20260601-2", Kata_Teks: "لِيُسَاعِدَ", Kata_Teks_Polos: "ليساعد", Arti_Kata_Teks: "agar dia menolong", ID_Kata_Induk: "IND-102", Sambungan_Awal_1: "CON-03", Sambungan_Awal_2: "CON-04", Sambungan_Awal_3: "", Sambungan_Akhir_1: "", Sambungan_Akhir_2: "", Sambungan_Akhir_3: "" },
  { ID_Kosakata: "VOC-004", ID_Teks: "TX-20260601-2", Kata_Teks: "بِأَمْوَالِهِ", Kata_Teks_Polos: "بأمواله", Arti_Kata_Teks: "dengan hartanya", ID_Kata_Induk: "IND-103", Sambungan_Awal_1: "CON-02", Sambungan_Awal_2: "", Sambungan_Awal_3: "", Sambungan_Akhir_1: "CON-05", Sambungan_Akhir_2: "", Sambungan_Akhir_3: "" }
];

export const MOCK_KATA_INDUK = [
  { ID_Kata_Induk: "IND-101", Kata_Induk: "أَسَدٌ", Kata_Induk_Polos: "أسد", Arti_Kata_Induk: "singa (hewan buas)", Kategori: "Nomina" },
  { ID_Kata_Induk: "IND-102", Kata_Induk: "سَاعَدَ", Kata_Induk_Polos: "ساعد", Arti_Kata_Induk: "menolong / membantu", Kategori: "Verba" },
  { ID_Kata_Induk: "IND-103", Kata_Induk: "مَالٌ", Kata_Induk_Polos: "مال", Arti_Kata_Induk: "harta / uang", Kategori: "Nomina" }
];

export const MOCK_SAMBUNGAN = [
  { ID_Sambungan: "CON-01", Bentuk_Sambungan: "ال", Letak_Sambungan: "awal", Jenis_Sambungan: "imbuhan otomatis", Fungsi_Sambungan: "Definite Article", Keterangan: "Membuat kata menjadi khusus." },
  { ID_Sambungan: "CON-02", Bentuk_Sambungan: "بـ", Letak_Sambungan: "awal", Jenis_Sambungan: "imbuhan otomatis", Fungsi_Sambungan: "Preposisi", Keterangan: "Artinya 'dengan'." },
  { ID_Sambungan: "CON-03", Bentuk_Sambungan: "لـ", Letak_Sambungan: "awal", Jenis_Sambungan: "imbuhan otomatis", Fungsi_Sambungan: "Preposisi / Harf", Keterangan: "Artinya 'untuk' atau 'agar'." },
  { ID_Sambungan: "CON-04", Bentuk_Sambungan: "يـ", Letak_Sambungan: "awal", Jenis_Sambungan: "imbuhan otomatis", Fungsi_Sambungan: "Mudharah", Keterangan: "Menunjukkan kata kerja masa kini laki-laki." },
  { ID_Sambungan: "CON-05", Bentuk_Sambungan: "ه", Letak_Sambungan: "akhir", Jenis_Sambungan: "imbuhan otomatis", Fungsi_Sambungan: "Pronomina Kepemilikan", Keterangan: "Artinya 'nya'." }
];