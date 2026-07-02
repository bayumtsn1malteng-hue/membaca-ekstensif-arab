/**
 * PENGATUR UTAMA APLIKASI (STATE & EVENT MANAGER)
 * Versi: v0.5.0-alpha.2
 * ID Unik: MEB-ADMIN-APP-001
 * * Pengatur aliran siklus hidup aplikasi Admin, deklarasi state global, 
 * inisialisasi awal program (`window.onload`), dan penanganan form submit.
 */
import { cleanArabicDiacritics } from "/shared/arabic_utils.js";
import { toggleConnectionMode } from "./api.js";
import {renderLiveArabicFeedback, renderPustakaTable, renderQueueTable} from "./ui.js";

// Deklarasi State Utama Aplikasi (Global Scope)
export let stateActiveText = {
  id_teks: "",
  seri: "",
  judul: "",
  judul_arab: "",
  terjemah_judul: "",
  konten_arab: "",
  terjemah: "",
  tingkat_kesulitan: "Pemula",
  tanggal_rilis: ""
};

export  let stateWordQueue = []; 
export let stateActiveWord = {}; 
export let idTeksToDelete = ""; 

let connectionMode = "local"; 
const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbztUEY5nMEEq8qakQcaow-F_CQJ6-6PHbTdv4YZ82g6L5PyA4oOVhg-ux1g9bVZ_FSD/exec";

export const DB_KEYS = {
  CONNECTION_MODE: "membaca_connection_mode",
  API_URL: "membaca_api_url",
  PUSTAKA: "membaca_pustaka_bacaan",
  KOSAKATA: "membaca_peta_kosakata",
  KATA_INDUK: "membaca_kata_induk",
  SAMBUNGAN: "membaca_master_sambungan"
};

export let dbPustaka = [];
export let dbPetaKosakata = [];
export let dbKataInduk = [];
export let dbMasterSambungan = [];

// Data Dummy Bawaan jika penyimpanan kosong
const MASTER_SAMBUNGAN_DEFAULT = [
  { ID_Sambungan: "SAM-PRE-0001", Bentuk_Sambungan: "لـ", Letak_Sambungan: "awal", Jenis_Sambungan: "huruf jar", Fungsi_Sambungan: "untuk / milik" },
  { ID_Sambungan: "SAM-PRE-0002", Bentuk_Sambungan: "الـ", Letak_Sambungan: "awal", Jenis_Sambungan: "partikel", Fungsi_Sambungan: "penjelas makrifah" },
  { ID_Sambungan: "SAM-PRE-0003", Bentuk_Sambungan: "يـ", Letak_Sambungan: "awal", Jenis_Sambungan: "huruf mudhara'ah orang ketiga", Fungsi_Sambungan: "subjek mudhari'" },
  { ID_Sambungan: "SAM-PRE-0004", Bentuk_Sambungan: "سـ", Letak_Sambungan: "awal", Jenis_Sambungan: "keterangan waktu", Fungsi_Sambungan: "masa depan dekat" },
  { ID_Sambungan: "SAM-PRE-0005", Bentuk_Sambungan: "بـ", Letak_Sambungan: "awal", Jenis_Sambungan: "huruf jar", Fungsi_Sambungan: "dengan / pada" },
  { ID_Sambungan: "SAM-PRE-0006", Bentuk_Sambungan: "و", Letak_Sambungan: "awal", Jenis_Sambungan: "huruf 'ataf (dan)", Fungsi_Sambungan: "penyambung" },
  { ID_Sambungan: "SAM-SU-0001", Bentuk_Sambungan: "يـ", Letak_Sambungan: "akhir", Jenis_Sambungan: "dhamir muttasil tunggal orang pertama", Fungsi_Sambungan: "kepunyaan saya" },
  { ID_Sambungan: "SAM-SU-0002", Bentuk_Sambungan: "ها", Letak_Sambungan: "akhir", Jenis_Sambungan: "dhamir muttasil tunggal orang ketiga", Fungsi_Sambungan: "nya (pr)" },
  { ID_Sambungan: "SAM-SU-0003", Bentuk_Sambungan: "ـو", Letak_Sambungan: "akhir", Jenis_Sambungan: "penanda jamak mudzakar", Fungsi_Sambungan: "mereka laki-laki" },
  { ID_Sambungan: "SAM-SU-0004", Bentuk_Sambungan: "ه/ـه", Letak_Sambungan: "akhir", Jenis_Sambungan: "dhamir muttasil tunggal orang ketiga laki-laki", Fungsi_Sambungan: "nya (lk)" }
];

const KATA_INDUK_DEFAULT = [
  { ID_Kata_Induk: "IND-00045", Kata_Induk: "مَدْرَسَة", Kata_Induk_Polos: "مدرسة", Arti_Kata_Induk: "sekolah", Kategori: "Isim" },
  { ID_Kata_Induk: "IND-00046", Kata_Induk: "كَتَبَ", Kata_Induk_Polos: "كتب", Arti_Kata_Induk: "menulis", Kategori: "Fi'il" },
  { ID_Kata_Induk: "IND-00047", Kata_Induk: "سَفِينَة", Kata_Induk_Polos: "سفينة", Arti_Kata_Induk: "kapal", Kategori: "Isim" }
];

const PUSTAKA_DEFAULT = [
  {
    ID_Teks: "TX-20260611-133500",
    Tanggal_Rilis: "2026-06-11 13:35:00 WIT",
    Seri: "Kisah Para Nabi",
    Judul_Teks: "Nabi Nuh dan Bahtera",
    Judul_Teks_Arab: "نُوحٌ وَالسَّفِينَةُ",
    Terjemah_Judul_Indonesia: "Nabi Nuh dan Bahtera",
    Konten_Arab: "بَنَى نُوحٌ عَلَيْهِ السَّلَامُ سَفِينَةً كَبِيرَةً",
    Terjemah_Indonesia: "Nuh alaihissalam membangun sebuah kapal yang besar.",
    Tingkat_Kesulitan: "Pemula"
  }
];

const PETA_KOSAKATA_DEFAULT = [
  {
    ID_Kosakata: "VOC-00001",
    ID_Teks: "TX-20260611-133500",
    Kata_Teks: "سَفِينَةً",
    Kata_Teks_Polos: "سفينة",
    Arti_Kata_Teks: "sebuah kapal (harakat tanwin)",
    ID_Kata_Induk: "IND-00047",
    Sambungan_Awal_1: "", Sambungan_Awal_2: "", Sambungan_Awal_3: "",
    Sambungan_Akhir_1: "", Sambungan_Akhir_2: "", Sambungan_Akhir_3: ""
  }
];

// INTI SIKLUS HIDUP APLIKASI
window.onload = function() {
  const connectionMode = localStorage.getItem(DB_KEYS.CONNECTION_MODE) || "local";
  const apiInput = document.getElementById("api-script-url");
  if (apiInput) {
    apiInput.value = localStorage.getItem(DB_KEYS.API_URL) || DEFAULT_API_URL;
  }

  dbPustaka = getFromLocalStorage(DB_KEYS.PUSTAKA, PUSTAKA_DEFAULT);
  dbPetaKosakata = getFromLocalStorage(DB_KEYS.KOSAKATA, PETA_KOSAKATA_DEFAULT);
  dbKataInduk = getFromLocalStorage(DB_KEYS.KATA_INDUK, KATA_INDUK_DEFAULT);
  dbMasterSambungan = getFromLocalStorage(DB_KEYS.SAMBUNGAN, MASTER_SAMBUNGAN_DEFAULT);

  toggleConnectionMode(connectionMode, false);

  if (dbPustaka.length > 0) {
    loadSelectedTextIntoState(dbPustaka[0]);
  }

  renderPustakaTable();
  renderQueueTable();
  updateQueueBadge();

  // Event listener global tutup autocomplete
  window.addEventListener('click', function(e) {
     if (!e.target.closest('#gabungan-kata-induk') && !e.target.closest('#autocomplete-results-gabungan')) {
       document.getElementById('autocomplete-results-gabungan')?.classList.add('hidden');
     }
  });

  showToast("Aplikasi Admin berhasil diinisialisasi secara modular!", "info");
};

function loadSelectedTextIntoState(textObj) {
  stateActiveText = textObj;
  renderLiveArabicFeedback();
  
  const metaContainer = document.getElementById("active-text-meta");
  const metaId = document.getElementById("active-text-meta-id");
  if (metaId) {
    metaId.innerHTML = `Naskah Aktif: ${textObj.ID_Teks}`;
  }
  if (metaContainer) {
    metaContainer.classList.remove("hidden");
  }
}

/**
 * Membuat Metadata ID Unik (TX-YYYYMMDD-HHMMSS) untuk naskah
 */
function generateMetadata() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const witOffset = 9 * 60 * 60000;
  const witDate = new Date(utc + witOffset);

  const pad = (n) => String(n).padStart(2, '0');
  const YYYY = witDate.getFullYear();
  const MM = pad(witDate.getMonth() + 1);
  const DD = pad(witDate.getDate());
  const HH = pad(witDate.getHours());
  const Min = pad(witDate.getMinutes());
  const Sec = pad(witDate.getSeconds());

  const id_teks = `TX-${YYYY}${MM}${DD}-${HH}${Min}${Sec}`;
  const tanggal_rilis = `${YYYY}-${MM}-${DD} ${HH}:${Min}:${Sec} WIT`;

  return { id_teks, tanggal_rilis };
}

/**
 * Menyimpan data teks baru dan menyaring kosakata ke antrean pemetaan
 */
async function handleSaveText(event) {
  event.preventDefault();
  const { id_teks, tanggal_rilis } = generateMetadata();

  const textData = {
    ID_Teks: id_teks,
    Tanggal_Rilis: tanggal_rilis,
    Seri: document.getElementById("input-seri").value,
    Judul_Teks: document.getElementById("input-judul-terjemah").value,
    Judul_Teks_Arab: document.getElementById("input-judul-arab").value,
    Terjemah_Judul_Indonesia: document.getElementById("input-judul-terjemah").value,
    Konten_Arab: document.getElementById("input-arab").value,
    Terjemah_Indonesia: document.getElementById("input-terjemah").value,
    Tingkat_Kesulitan: document.getElementById("input-kesulitan").value
  };

  dbPustaka.unshift(textData);
  saveToLocalStorage(DB_KEYS.PUSTAKA, dbPustaka);
  
  await postDataToBackend("saveText", textData);

  const uniqueParsed = parseArabicText(textData.Konten_Arab);
  
  stateWordQueue = uniqueParsed.map(item => {
    const existing = dbPetaKosakata.find(v => v.Kata_Teks_Polos === item.clean);
    const existingInduk = dbKataInduk.find(i => i.Kata_Induk_Polos === item.clean);
    return {
      id_teks: id_teks,
      word_raw: item.raw,
      word_clean: item.clean,
      status: (existing || existingInduk) ? "Ada di Database" : "Antrean Baru"
    };
  });

  loadSelectedTextIntoState(textData);
  renderPustakaTable();
  renderQueueTable();
  updateQueueBadge();
  document.getElementById("form-metadata").reset();

  showToast("Naskah disimpan & disinkronkan secara realtime!", "success");
}

function deleteActivePustaka() {
  if (stateActiveText && stateActiveText.ID_Teks) {
    deletePustaka(stateActiveText.ID_Teks);
  }
}

function deletePustaka(idTeks) {
  idTeksToDelete = idTeks;
  document.getElementById("modal-delete-confirm").classList.remove("hidden");
}

function closeDeleteConfirmModal() {
  idTeksToDelete = "";
  document.getElementById("modal-delete-confirm").classList.add("hidden");
}

async function executeDeletePustaka() {
  if (!idTeksToDelete) return;
  const idTeks = idTeksToDelete;

  dbPustaka = dbPustaka.filter(p => p.ID_Teks !== idTeks);
  saveToLocalStorage(DB_KEYS.PUSTAKA, dbPustaka);
  
  await postDataToBackend("deleteText", { ID_Teks: idTeks });

  renderPustakaTable();
  if (stateActiveText.ID_Teks === idTeks) {
    stateActiveText = {};
    renderLiveArabicFeedback();
    document.getElementById("active-text-meta").classList.add("hidden");
  }
  closeDeleteConfirmModal();
  showToast("Pustaka berhasil dihapus secara realtime.", "warning");
}

async function deleteVocab(idKosakata, type="Gabungan") {
  if (type === "Induk") {
    const match = dbKataInduk.find(i => i.ID_Kata_Induk === idKosakata);
    if (!match) return;
    dbKataInduk = dbKataInduk.filter(i => i.ID_Kata_Induk !== idKosakata);
    saveToLocalStorage(DB_KEYS.KATA_INDUK, dbKataInduk);
    await postDataToBackend("deleteVocab", { ID_Kata_Induk: idKosakata, jenis_kata: "Induk" });
    showToast(`Kata Induk "${match.Kata_Induk}" dihapus.`, "warning");
  } else {
    const match = dbPetaKosakata.find(v => v.ID_Kosakata === idKosakata);
    if (!match) return;
    dbPetaKosakata = dbPetaKosakata.filter(v => v.ID_Kosakata !== idKosakata);
    saveToLocalStorage(DB_KEYS.KOSAKATA, dbPetaKosakata);
    await postDataToBackend("deleteVocab", { ID_Kosakata: idKosakata, jenis_kata: "Gabungan" });
    showToast(`Kosakata "${match.Kata_Teks_Polos}" dihapus dari pemetaan.`, "warning");
  }

  renderQueueTable();
  renderLiveArabicFeedback();
}

function updateQueueBadge() {
  const badge = document.getElementById("queue-badge");
  if (!badge) return;
  const totalQueue = stateWordQueue.length;
  if (totalQueue > 0) {
    badge.innerText = totalQueue;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

/**
 * Memproses penyimpanan pemetaan kata (Kata Induk, Gabungan, Sambungan Afiks) ke database
 */
async function handleSaveVocabMapping(event) {
  event.preventDefault();

  const jenisVal = document.querySelector('input[name="input-jenis-kata"]:checked').value;
  const rawWord = document.getElementById("mapper-active-word").value.trim();
  const cleanWord = cleanArabicDiacritics(rawWord); 
  const artiTeks = document.getElementById("mapper-arti-teks").value;

  if (jenisVal === "Induk") {
    const existingIndukIndex = dbKataInduk.findIndex(i => i.Kata_Induk_Polos === cleanWord);
    let updatedInduk;

    if (existingIndukIndex !== -1) {
      dbKataInduk[existingIndukIndex].Kata_Induk = cleanWord; 
      dbKataInduk[existingIndukIndex].Arti_Kata_Induk = artiTeks;
      updatedInduk = dbKataInduk[existingIndukIndex];
    } else {
      const nextIdVal = `IND-000${dbKataInduk.length + 45}`;
      updatedInduk = {
        ID_Kata_Induk: nextIdVal,
        Kata_Induk: cleanWord, 
        Kata_Induk_Polos: cleanWord,
        Arti_Kata_Induk: artiTeks,
        Kategori: "Isim"
      };
      dbKataInduk.push(updatedInduk);
    }
    saveToLocalStorage(DB_KEYS.KATA_INDUK, dbKataInduk);
    await postDataToBackend("saveVocab", { jenis_kata: "Induk", ...updatedInduk });

    const existingPetaIndex = dbPetaKosakata.findIndex(v => v.Kata_Teks_Polos === cleanWord);
    const nextVocabId = `VOC-000${dbPetaKosakata.length + 1}`;
    
    const targetPetaRecord = {
      ID_Kosakata: existingPetaIndex !== -1 ? dbPetaKosakata[existingPetaIndex].ID_Kosakata : nextVocabId,
      ID_Teks: stateActiveText.ID_Teks || "",
      Kata_Teks: rawWord, 
      Kata_Teks_Polos: cleanWord,
      Arti_Kata_Teks: artiTeks,
      ID_Kata_Induk: updatedInduk.ID_Kata_Induk, 
      Sambungan_Awal_1: "", Sambungan_Awal_2: "", Sambungan_Awal_3: "",
      Sambungan_Akhir_1: "", Sambungan_Akhir_2: "", Sambungan_Akhir_3: ""
    };

    if (existingPetaIndex !== -1) {
      dbPetaKosakata[existingPetaIndex] = targetPetaRecord;
    } else {
      dbPetaKosakata.push(targetPetaRecord);
    }
    saveToLocalStorage(DB_KEYS.KOSAKATA, dbPetaKosakata);
    await postDataToBackend("saveVocab", { jenis_kata: "Gabungan", ...targetPetaRecord });

    showToast(`Kata Induk Ganda "${rawWord}" & "${cleanWord}" tersimpan di kedua sheet secara realtime!`, "success");

  } else {
    let id_kata_induk = document.getElementById("gabungan-id-induk").value;
    const editKataIndukText = document.getElementById("gabungan-kata-induk").value.trim();
    const editArtiIndukText = document.getElementById("gabungan-arti-induk").value.trim();

    let statusWarnaKata = "kuning"; 

    if (editKataIndukText && editArtiIndukText) {
      statusWarnaKata = "hijau";
      const cleanEditInduk = cleanArabicDiacritics(editKataIndukText);
      const matchIndukIndex = dbKataInduk.findIndex(i => i.Kata_Induk_Polos === cleanEditInduk);
      
      if (matchIndukIndex !== -1) {
        dbKataInduk[matchIndukIndex].Kata_Induk = editKataIndukText;
        dbKataInduk[matchIndukIndex].Arti_Kata_Induk = editArtiIndukText;
        saveToLocalStorage(DB_KEYS.KATA_INDUK, dbKataInduk);
        await postDataToBackend("saveVocab", { jenis_kata: "Induk", ...dbKataInduk[matchIndukIndex] });
        id_kata_induk = dbKataInduk[matchIndukIndex].ID_Kata_Induk;
      } else {
        const nextIdVal = `IND-000${dbKataInduk.length + 45}`;
        const newInduk = {
          ID_Kata_Induk: nextIdVal,
          Kata_Induk: editKataIndukText,
          Kata_Induk_Polos: cleanEditInduk,
          Arti_Kata_Induk: editArtiIndukText,
          Kategori: "Isim"
        };
        dbKataInduk.push(newInduk);
        saveToLocalStorage(DB_KEYS.KATA_INDUK, dbKataInduk);
        await postDataToBackend("saveVocab", { jenis_kata: "Induk", ...newInduk });
        id_kata_induk = nextIdVal;
      }
    }

    const rows = document.querySelectorAll("#sambungan-rows-container > div");
    let sambunganData = {
      Sambungan_Awal_1: "", Sambungan_Awal_2: "", Sambungan_Awal_3: "",
      Sambungan_Akhir_1: "", Sambungan_Akhir_2: "", Sambungan_Akhir_3: ""
    };

    for (const r of rows) {
      const slot = r.querySelector(".row-slot").value;
      const bentuk = r.querySelector(".row-bentuk").value.trim();
      const fungsiVal = r.querySelector(".row-fungsi").value.trim() || "imbuhan otomatis";

      if (bentuk && slot) {
        let match = dbMasterSambungan.find(s => s.Bentuk_Sambungan === bentuk);
        if (!match) {
          const letak = slot.toLowerCase().includes("awal") ? "awal" : "akhir";
          const generatedId = "SAM-" + (letak === "awal" ? "PRE-" : "SU-") + Math.floor(1000 + Math.random() * 9000);
          match = {
            ID_Sambungan: generatedId,
            Bentuk_Sambungan: bentuk,
            Letak_Sambungan: letak,
            Fungsi_Sambungan: fungsiVal,
            Jenis_Sambungan: fungsiVal
          };
          dbMasterSambungan.push(match);
          saveToLocalStorage(DB_KEYS.SAMBUNGAN, dbMasterSambungan);
        }
        sambunganData[slot] = match.ID_Sambungan;
      }
    }

    const existingIndex = dbPetaKosakata.findIndex(v => v.Kata_Teks_Polos === cleanWord);
    const nextVocabId = `VOC-000${dbPetaKosakata.length + 1}`;

    const targetRecord = {
      ID_Kosakata: existingIndex !== -1 ? dbPetaKosakata[existingIndex].ID_Kosakata : nextVocabId,
      ID_Teks: stateActiveText.ID_Teks || "",
      Kata_Teks: rawWord, 
      Kata_Teks_Polos: cleanWord,
      Arti_Kata_Teks: artiTeks,
      ID_Kata_Induk: id_kata_induk || "",
      ...sambunganData
    };

    if (existingIndex !== -1) {
      dbPetaKosakata[existingIndex] = targetRecord;
    } else {
      dbPetaKosakata.push(targetRecord);
    }

    saveToLocalStorage(DB_KEYS.KOSAKATA, dbPetaKosakata);
    await postDataToBackend("saveVocab", { jenis_kata: "Gabungan", ...targetRecord });
    
    if (statusWarnaKata === "kuning") {
      showToast(`⚠️ Kuning: Kosakata "${rawWord}" disimpan tanpa relasi Kata Induk.`, "warning");
    } else {
      showToast(`Kosakata "${rawWord}" disimpan dengan relasi Kata Induk secara realtime!`, "success");
    }
  }

  stateWordQueue = stateWordQueue.filter(item => item.word_clean !== cleanWord);

  closeVocabModal();
  renderQueueTable();
  updateQueueBadge();
  renderLiveArabicFeedback();
}