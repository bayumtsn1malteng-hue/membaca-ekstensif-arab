# Rencana Kerja Migrasi Storage: LocalStorage ke IndexedDB (Dexie.js)
**Versi Dokumen:** v1.2.0
**Target:** Meningkatkan kapasitas penyimpanan dan performa aplikasi MEB Arab.

## 1. Tujuan Utama
- **Kapasitas:** Mengatasi batasan 5MB localStorage untuk menampung ribuan peta kosakata.
- **Performa:** Operasi database bersifat asynchronous (non-blocking UI).
- **Offline-First:** Aplikasi memuat data dari IndexedDB secara instan saat startup. Sinkronisasi dengan Google Sheets terjadi di latar belakang.

## 2. Struktur Database (Schema Dexie)
- `pustaka`: ID_Teks (PK), Judul, Konten, dsb.
- `petaKosakata`: ID_Kosakata (PK), ID_Teks, Kata_Teks_Polos, dsb.
- `kamusUser`: ID_User_Word (PK), ID_User, Kata_Polos, Status_Belajar, dsb.
- `kataInduk`: ID_Kata_Induk (PK), Kata_Induk, Arti.
- `sambungan`: ID_Sambungan (PK), Bentuk, Fungsi.

## 3. Tahapan Implementasi
### Fase 1: Inisialisasi & Migrasi (v0.7.0)
- [ ] Import Dexie.js via CDN di `index.html`.
- [ ] Inisialisasi DB di `user_app.js`.
- [ ] Buat fungsi `migrateFromLocalStorage()` untuk memindahkan data `meb_local_kamus` lama.

### Fase 2: Refaktorisasi API (v0.7.1)
- [ ] Update `pullSystemDataFromServer` untuk menyimpan hasil fetch ke IndexedDB menggunakan `bulkPut`.
- [ ] Update `pullUserKamusFromServer` untuk sinkronisasi ke IndexedDB.

### Fase 3: Integrasi State & UI (v0.7.2)
- [ ] Ubah `appState` agar melakukan hidrasi awal dari IndexedDB sebelum fetch ke server.
- [ ] Update fungsi simpan/hapus kata agar berinteraksi langsung dengan Dexie.

### Fase 4: Pengayaan Fitur Latihan & Leitner (v0.9.0)
- [ ] **Mode Latihan Terpadu:** Implementasi Mode Baca, Latihan, dan Tantangan di `latihan.html`.
- [ ] **Filter Leitner Cerdas:** Menambahkan pengaturan sumber kosakata (Pustaka vs Latihan) sebelum memulai sesi.
- [ ] **Minimalist UI (Focus Mode):** Menghilangkan gangguan visual (header/footer) saat berinteraksi dengan konten utama.
- [ ] **Optimasi Mobile:** Memperbaiki interaksi avatar mobile dan keterbacaan font Noto Arabic.
- [ ] **Visualisasi & Persistensi:** Menambahkan Pie Chart hasil latihan dan fitur resume sesi (v0.9.1).
- [ ] **Bookmark Soal & Review Mode:** Implementasi fitur bookmark soal dan mode review khusus di `latihan.html` serta daftar di `index.html` (v0.9.2).

## 4. Keamanan & Integritas Data
... (tetap)

## 5. Aturan Versi
- v0.9.x-alpha: Fokus pada UI Minimalis dan Pemisahan Mode Latihan.

## 6. Aturan Pengembangan
- Prioritas: Android kelas menengah ke bawah (Low-latency, Touch-friendly).
- Skalabilitas: Responsif hingga Desktop.
- Tipografi: Noto Sans Arabic sebagai standar keterbacaan.
- Gunakan `bulkPut` untuk mencegah duplikasi data saat sinkronisasi berulang.
- Tetap simpan `meb_user` (metadata sesi) di localStorage karena ukurannya kecil dan sering diakses secara synchronous saat boot.

## 5. Aturan Versi
- Setiap perubahan pada modul JS/HTML wajib menaikkan minor/patch version.
- Migrasi ini menandai lompatan ke versi `v0.7.x-alpha`.

## 6. Aturan Pengembangan, prioritaskan pengguna Android kelas menengah ke bawah. 



update gemini.md. buat tujuan dan rencana kerja

1. Icon user di index.html tidak berfungsi di mode mobile. buat menjadi fungsional untuk login dan logout.

1. Mulai uji hafalan di index.html diubah. UI Screen 4: Leitner Box, menampilkan tombol pengaturan di sekitar pengantar Leitner yang membuka modal pengaturan leitner. pengaturan terdiri dari: 1. memilih kosakata dari bacaan, latihan, atau semua 2. jika memilih bacaan / latihan muncul pilihan untuk memilih judul tertentu atau semua judul. Mulai uji hafalan diganti dengan gambar flashcard dengan tulisan mulai review. Pastikan kata yang muncul sesuai dengan box yang akan direview hari ini. 

Catatan:(kosakata bacaan ditandai dengan voc-{angka}, dan kosakata latihan ditandai dengan VOC-LAT-{angka}; ID bacaan = TX-{angka} dan ID latihan = LAT-{angka}. 

2. Mode Latihan di bagian latihan.html diubah menjadi 3 mode. Mode baca untuk membaca, latihan, dan tantangan. a. Mode membaca: untuk memahami pertanyaan dan menyimpan kosakata. b. Mode latihan: memahami soal dan mencoba jawaban, bila salah akan mendapatkan feedback. Pastikan untuk mengambil feedback dari Feedback_Jawaban_Benar dan	Feedback_Jawaban_Salah di database spreadsheet. di Mode Latihan user bisa memilih untuk melanjutkan ke pertanyaan berikutnya, kembali kepertanyaan sebelumnya, memilih/memulai dari nomor pertanyaan tertentu, atau mengulangi pertanyaan yang sama. Pada mode latihan, user dapat mengetuk tombol mode membaca untuk melihat soal yang sama bila ia ingin melihat arti kata. begitu juga user dapat beralih dari mode baca ke mode latihan di nomor yang sama, atau dapat memulai mode latihan di nomor tertentu. 3. mode tantangan : mode latihan dan mode membaca akan terkunci. feedback tersembunyi. pada mode tantangan, user bisa memilih antara berbatas waktu atau tidak. Bila berbatas waktu user dapat memilih apa waktu akan dibagi secara merata perjumlah soal atau bebas. bila berbatas waktu, front-end langsung mengirim hasil jawaban tersimpan ke back-end. history percobaan hanya berlaku untuk mode tantangan. Pada mode tantangan, user harus menekan tombol soal selanjutnya untuk berganti soal, tidak boleh berganti secara otomatis. 
3. buat agar semua area membaca, latihan leitner, maupun latihan soal bebas dari header dan footer. tampilan harus selapang dan seminimalis mungkin untuk meningkatkan fokus. bila memungkinkan fitur-fitur yang dibutuhkan memiliki kapabilitas diciutkan dan diluaskan. 
4. uji keterbacaan pada semua mode di latihan.html = ukuran font, jarak antar baris, dan jarak antar kata. Gunakan noto arabic saja. 

---
Aturan versi: setiap perubahan wajib menaikkan versi minor/patch.
aturan pengembangan: selalu mulai dari prioritas untuk pengguna Android kelas menengah ke bawah, baru diskalakan ke tablet dan desktop. 