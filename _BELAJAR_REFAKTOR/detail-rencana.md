Rencana Refaktor Mikro-Iteratif: Batch 1 (Pondasi Shell & State Reaktif)

Dokumen ini memecah Batch 1 menjadi langkah-langkah sangat kecil. Setiap subtugas dirancang agar dapat diselesaikan dalam waktu kurang dari 10 menit untuk memudahkan pengujian mandiri (self-testing) sebelum melakukan komit Git.

SUBTUGAS 1.1: Pembuatan Entry Point Tunggal & Struktur Kerangka Dasar

1.1.1: Pembuatan Berkas HTML Shell Bersih (index.html)

Tujuan: Membuat kerangka HTML5 dasar yang murni tanpa library styling luar (Tailwind).

Detail Pekerjaan:

Buat berkas index.html kosong di direktori akar.

Tambahkan tag dasar HTML5: <!DOCTYPE html>, <html lang="id">, <head>, dan <body>.

Masukkan preconnect Google Fonts (Noto Sans Arabic & Plus Jakarta Sans) dan link CDN FontAwesome untuk ikon-ikon antarmuka.

Buat elemen kontainer utama: <div id="app-view-container"></div> di dalam <body>.

Kriteria Selesai (DoD): Berkas index.html dapat dibuka di browser tanpa error di Console ($F12$), menampilkan halaman kosong dengan judul yang benar di tab browser.

1.1.2: Pembuatan Berkas CSS Global & Reset Browser Style (css/app.css)

Tujuan: Menstandarisasi tampilan dasar elemen HTML di semua browser (style reset).

Detail Pekerjaan:

Buat subfolder css dan buat berkas css/app.css di dalamnya.

Sambungkan berkas CSS tersebut ke index.html menggunakan tag <link rel="stylesheet">.

Tulis aturan reset CSS universal menggunakan selector bintang (*) untuk mengatur box-sizing: border-box, margin: 0, dan padding: 0.

Atur elemen html dan body agar memiliki tinggi penuh min-height: 100vh dan overflow-x tersembunyi (overflow-x: hidden).

Kriteria Selesai (DoD): Margin bawaan browser pada elemen body hilang (teks berada tepat di pojok kiri atas saat diuji dengan tag teks sembarang).

SUBTUGAS 1.2: Implementasi Sistem Variabel Desain (CSS Variables & Dark Theme)

1.2.1: Pendefinisian Variabel Tema Terang (:root)

Tujuan: Membuat pusat kendali warna dan tipografi tema terang yang mudah dikelola.

Detail Pekerjaan:

Di dalam css/app.css, tambahkan selektor :root.

Definisikan CSS Variables untuk font keluarga (--font-sans, --font-arabic).

Definisikan CSS Variables untuk warna latar belakang, kartu, batas border, warna teks utama, teks pudar (muted), dan warna brand utama (--brand-primary menggunakan warna teal #0d9488).

Terapkan variabel font dan warna latar belakang ini pada selektor body.

Kriteria Selesai (DoD): Mengubah nilai variabel --bg-app di :root secara instan mengubah warna latar belakang seluruh halaman web saat disegarkan.

1.2.2: Pendefinisian Variabel Tema Gelap (html.dark)

Tujuan: Menyediakan skema warna malam yang nyaman di mata tanpa menduplikasi aturan CSS.

Detail Pekerjaan:

Di dalam css/app.css, tambahkan selektor html.dark.

Timpa (override) nilai variabel warna yang didefinisikan pada :root dengan warna gelap (misal: --bg-app: #020617, --text-main: #f8fafc).

Kriteria Selesai (DoD): Secara manual menambahkan kelas dark pada tag <html> di index.html (<html class="dark">) akan mengubah tampilan halaman menjadi warna gelap secara instan.

SUBTUGAS 1.3: Tata Letak Shell Utama (Grid & Flexbox Responsif)

1.3.1: Konstruksi Layout Grid Wrapper Desktop (.app-wrapper)

Tujuan: Membagi ruang layar komputer menjadi area Sidebar, Header, dan Main Content.

Detail Pekerjaan:

Buat selektor CSS .app-wrapper menggunakan display: grid.

Definisikan area grid (grid-template-areas) untuk lebar desktop: Sidebar di sebelah kiri (fixed width 260px) dan area konten di sebelah kanan.

Kriteria Selesai (DoD): Tata letak kiri-kanan terbentuk secara kokoh tanpa merusak responsivitas halaman.

1.3.2: Pembuatan Sidebar Desktop CSS (.app-sidebar)

Tujuan: Membuat area menu navigasi desktop yang melayang di sebelah kiri.

Detail Pekerjaan:

Berikan style pada kelas .app-sidebar dengan position: fixed, width: 260px, height: 100vh, dan warna latar belakang dari variabel --bg-surface.

Batasi area sidebar agar tersembunyi menggunakan media query pada layar ponsel (@media (max-width: 768px) -> transform: translateX(-100%)).

Kriteria Selesai (DoD): Sidebar muncul dengan rapi di layar desktop dan hilang saat ukuran layar ditarik mengecil di bawah 768px.

1.3.3: Pembuatan Mobile Bottom Navigation CSS (.mobile-bottom-nav)

Tujuan: Menyediakan menu navigasi jempol di bagian bawah khusus layar ponsel.

Detail Pekerjaan:

Tulis style .mobile-bottom-nav dengan position: fixed, bottom: 0, left: 0, right: 0, dan height: 60px.

Setel agar navigasi ini disembunyikan secara default di desktop (display: none), dan tampilkan menggunakan flexbox di bawah resolusi layar 768px.

Kriteria Selesai (DoD): Menu navigasi bawah muncul di layar ponsel (mode responsif Chrome $F12$ aktif) dan tersembunyi di layar komputer lebar.

SUBTUGAS 1.4: Kerangka Tampilan Navigasi Statis Tanpa Event Inline

1.4.1: Penulisan Struktur Elemen Menu Sidebar & Bottom Nav

Tujuan: Memasang tombol navigasi menu fisik ke dalam HTML.

Detail Pekerjaan:

Masukkan tag <aside class="app-sidebar"> dan <nav class="mobile-bottom-nav"> ke dalam index.html.

Pasang elemen tombol navigasi dengan kelas .nav-btn (desktop) dan .mob-nav-btn (mobile).

PENTING: Jangan tambahkan atribut onclick="..." pada tag tombol-tombol tersebut. Gunakan ID unik untuk setiap tombol (misal: id="nav-library", id="nav-kamus", dll).

Kriteria Selesai (DoD): Struktur menu navigasi terlihat rapi secara visual di desktop dan ponsel dengan icon FontAwesome yang berfungsi.

1.4.2: Pembuatan Placeholder Area Konten (.view-section)

Tujuan: Menyediakan area penampung konten dinamis untuk masing-masing rute halaman.

Detail Pekerjaan:

Di dalam area konten utama index.html, buat beberapa elemen <section> dengan kelas .view-section dan ID unik masing-masing: view-library, view-kamus, view-exercise, dan view-settings.

Secara default, sembunyikan semua section menggunakan kelas CSS .hidden { display: none !important; }, kecuali view-library yang diberikan kelas .active { display: block; }.

Kriteria Selesai (DoD): Hanya konten Pustaka (view-library) yang terlihat di layar saat pertama kali dijalankan, sementara konten lain tersembunyi dengan aman.

SUBTUGAS 1.5: Pengelolaan State Reaktif (appState Proxy)

1.5.1: Pembuatan State Inti (js/core/state.js)

Tujuan: Membuat wadah penyimpanan data global aplikasi yang terpusat.

Detail Pekerjaan:

Buat folder js/core dan buat berkas js/core/state.js di dalamnya.

Definisikan objek baseState yang menampung rute aktif saat ini (currentView: 'library'), data kosa kata pengguna, status tema, dan endpoint GAS.

Kriteria Selesai (DoD): Objek state dapat di-import oleh modul JavaScript lain secara bersih.

1.5.2: Pembuatan Proxy Debugger Reaktif

Tujuan: Mendeteksi perubahan data state secara instan untuk mempercepat proses penelusuran kesalahan (debugging).

Detail Pekerjaan:

Gunakan ES6 Proxy untuk membungkus baseState.

Tulis handler set(target, key, value) yang bertugas memantau setiap kali ada kode yang mengubah data di dalam state.

Ketika terjadi perubahan data, cetak log khusus berwarna ke dalam konsol browser (console.log) agar Anda dapat melihat data apa yang berubah secara real-time.

Ekspor objek Proxy ini sebagai appState.

Kriteria Selesai (DoD): Melakukan perubahan state via console browser (misal: appState.currentView = 'kamus') otomatis mencetak log detail perubahan di console.

1.5.3: Pembuatan Konfigurasi Database Lokal (js/services/db.js)

Tujuan: MenyiapkanIndexedDB menggunakan pustaka Dexie.js untuk penyimpanan luring permanen.

Detail Pekerjaan:

Buat folder js/services dan buat berkas js/services/db.js di dalamnya.

Import pustaka Dexie dari CDN terpercaya atau file lokal.

Deklarasikan database MEB_UserDB dan definisikan skema tabel sesuai spesifikasi: pustaka, petaKosakata, kamusUser, kataInduk, sambungan, bookmarks, dan settings.

Kriteria Selesai (DoD): Membuka tab Application -> IndexedDB di F12 Chrome menampilkan database MEB_UserDB dengan tabel-tabel kosong yang siap digunakan.

SUBTUGAS 1.6: Router Modular Berbasis Hash

1.6.1: Implementasi Class Router (js/core/router.js)

Tujuan: Mengelola perpindahan halaman secara dinamis saat URL hash berubah.

Detail Pekerjaan:

Buat berkas js/core/router.js.

Definisikan class SPARouter dengan daftar rute yang didukung (['library', 'kamus', 'exercise', 'settings']).

Tambahkan event listener global pada window untuk memantau perubahan hash (hashchange) dan pemuatan halaman pertama kali (load).

Kriteria Selesai (DoD): Mengetikkan #kamus di akhir URL browser memicu fungsi pembaca hash di dalam class SPARouter.

1.6.2: Logika Manipulasi Tampilan DOM View

Tujuan: Mengubah halaman yang aktif di layar secara dinamis tanpa melakukan muat ulang (reload).

Detail Pekerjaan:

Tulis metode switchDOMView(targetView) di dalam class SPARouter.

Metode ini akan menghapus kelas .active dan menambahkan kelas .hidden ke semua elemen .view-section, lalu sebaliknya mengaktifkan kelas .active khusus pada elemen target.

Sinkronkan pula kelas visual aktif pada tombol navigasi samping (desktop) dan bawah (mobile).

Kriteria Selesai (DoD): Mengetik #settings pada URL secara instan mengubah konten di layar menjadi halaman pengaturan tanpa proses refresh halaman.

SUBTUGAS 1.7: Registrasi Event Listener Navigasi Secara Programatik

1.7.1: Penghapusan Sisa Atribut Onclick Inline

Tujuan: Memastikan HTML bersih dari logika JavaScript inline agar mematuhi standar Separation of Concerns.

Detail Pekerjaan:

Periksa kembali index.html dan pastikan tidak ada satu pun tag tombol yang memiliki atribut onclick.

Kriteria Selesai (DoD): Pencarian teks onclick pada berkas index.html menghasilkan "0 match/tidak ditemukan".

1.7.2: Pendaftaran Event Listener Klik di Modul Router

Tujuan: Mengikat aksi klik tombol navigasi ke sistem Router menggunakan JavaScript murni.

Detail Pekerjaan:

Pada akhir berkas js/core/router.js atau di dalam blok inisialisasi, gunakan document.querySelectorAll untuk mengambil seluruh tombol navigasi.

Gunakan metode .forEach() dan .addEventListener('click', ...) secara programatik.

Ketika tombol diklik, ambil target rute dari atribut data atau ID tombol tersebut, lalu panggil rute navigasi menggunakan window.location.hash = '#' + targetRoute.

Kriteria Selesai (DoD): Mengklik tombol "Leitner Box" di sidebar desktop maupun bottom nav mobile berhasil memindahkan rute halaman secara mulus dan reaktif.

---
Rencana Refaktor Mikro-Iteratif: Batch 2 (Dekopling Modul Utilitas & Layanan)

Fokus utama Batch 2 adalah mengisolasi logika linguistik Arab dan komunikasi server (API) dari manipulasi DOM langsung. Kita akan mengubah fungsi-fungsi tersebut menjadi fungsi murni (pure functions) yang menerima input secara eksplisit dan mengembalikan output tanpa efek samping (side-effects).

SUBTUGAS 2.1: Logika Linguistik Arab (Pure Functions di js/utils/arabic.js)

2.1.1: Pembuatan File & Pemindahan Pembersih Harakat (cleanArabicHarakat & cleanArabicDiacritics)

Tujuan: Mengisolasi pembersihan teks dari tanda baca dan harakat Arab.

Detail Pekerjaan:

Buat berkas baru bernama js/utils/arabic.js.

Salin fungsi cleanArabicHarakat dan cleanArabicDiacritics dari berkas utilitas lama Anda.

Pastikan kedua fungsi tersebut berupa pure functions (hanya memproses string parameter input dan mengembalikan string baru hasil pembersihan).

Ekspor kedua fungsi tersebut menggunakan kata kunci export.

Kriteria Selesai (DoD): Mengimpor fungsi ini di konsol browser dan memanggil cleanArabicHarakat("كِتَابٌ") mengembalikan "كتاب" tanpa ada error.

2.1.2: Standardisasi Normalisasi Variasi Alif (normalizeArabic)

Tujuan: Menyamakan seluruh variasi Alif agar pencarian kata di database lokal bekerja 100% akurat.

Detail Pekerjaan:

Pindahkan fungsi normalizeArabic ke dalam berkas js/utils/arabic.js.

Pastikan fungsi ini membersihkan harakat, tatweel (kashida), dan menyamakan Alif Hamzah atas/bawah/maddah (أ, إ, آ) menjadi Alif biasa (ا).

Kriteria Selesai (DoD): Memanggil normalizeArabic("أَسَدٌ") mengembalikan "اسد" dan normalizeArabic("إِلَى") mengembalikan "الى".

2.1.3: Migrasi Dekonstruksi Imbuhan Ringan (arabicLightStemmer)

Tujuan: Mengekstrak akar kata dan imbuhan tanpa dependensi visual DOM.

Detail Pekerjaan:

Pindahkan logika arabicLightStemmer ke dalam js/utils/arabic.js.

Pastikan fungsi ini mengembalikan objek terstruktur murni: { prefix: '...', stem: '...', suffix: '...' }.

Kriteria Selesai (DoD): Memanggil arabicLightStemmer("بِأَمْوَالِهِ") mengembalikan objek dengan awalan بـ dan akhiran ه secara terpisah di konsol.

SUBTUGAS 2.2: Jembatan Koneksi API Terisolasi (Google Apps Script di js/services/api.js)

2.2.1: Pembuatan Modul API Client Generik (apiCall)

Tujuan: Menyediakan fungsi pengiriman data ke server GAS dengan penanganan retry otomatis.

Detail Pekerjaan:

Buat berkas baru bernama js/services/api.js.

Pindahkan fungsi apiCall dari berkas lama Anda.

Modifikasi fungsi agar menerima parameter endpoint secara eksplisit atau mengimpor nilai endpoint dari state jika diperlukan.

Kriteria Selesai (DoD): Berkas js/services/api.js berhasil diekspor tanpa error inisialisasi di konsol browser.

2.2.2: Isolasi Sinkronisasi Pustaka Sistem (pullSystemDataFromServer)

Tujuan: Menarik data pustaka naskah dari server ke IndexedDB tanpa menyentuh UI secara langsung.

Detail Pekerjaan:

Tulis fungsi pullSystemDataFromServer di dalam js/services/api.js.

Fungsi ini bertugas melakukan fetch data, lalu menyimpannya langsung ke IndexedDB (db.pustaka, db.petaKosakata, dll) menggunakan metode bulk write.

PENTING: Jangan lakukan manipulasi DOM (seperti mengubah ikon tombol atau memanggil fungsi render UI) di dalam modul ini. Gunakan callback atau promise jika UI perlu mengetahui kapan proses selesai.

Kriteria Selesai (DoD): Memanggil fungsi ini berhasil memperbarui tabel pustaka di IndexedDB tanpa menyebabkan error "UI function is undefined".

2.2.3: Isolasi Sinkronisasi Kamus Personal (pullUserKamusFromServer)

Tujuan: Menarik kamus pribadi pengguna dari server dengan aman menggunakan strategi Remote Wins.

Detail Pekerjaan:

Tulis fungsi pullUserKamusFromServer di dalam js/services/api.js.

Bersihkan cache tabel kamus lokal sebelum memasukkan data segar dari server untuk mencegah duplikasi data.

Kriteria Selesai (DoD): Menjalankan fungsi ini memperbarui IndexedDB tabel kamusUser sesuai dengan data yang ada di server.
---
Rencana Refaktor Mikro-Iteratif: Batch 3 (Komponen UI Dinamis & Penanganan Event Programatik)

Fokus utama Batch 3 adalah membersihkan sisa modal statis yang mengotori file HTML (index.html dan latihan.html) serta mematikan seluruh ketergantungan atribut event onclick="..." pada elemen dialog modal. Kita akan mengubah modal ini menjadi komponen UI dinamis berbasis kelas/fungsi yang menginjeksi dirinya sendiri ke dalam DOM dan mendaftarkan event listener-nya secara mandiri saat diinisialisasi.

SUBTUGAS 3.1: Modul Dialog Notifikasi Kustom (Modal Alert di js/components/modal-alert.js)

3.1.1: Pembuatan File & Pemisahan Kerangka HTML Modal Dinamis

Tujuan: Menghilangkan tag statis <div id="custom-modal"> dari file HTML dan memindahkannya ke dalam modul pembuat template dinamis.

Detail Pekerjaan:

Buat berkas baru bernama js/components/modal-alert.js.

Buat fungsi/kelas CustomModalAlert yang bertugas memeriksa apakah elemen penampung modal #custom-modal sudah ada di dalam DOM body.

Jika belum ada, buat elemen pembungkus div baru secara programatik menggunakan document.createElement('div'), berikan ID custom-modal, pasangkan kelas-kelas CSS vanilla yang sesuai, lalu injeksikan ke dalam document.body menggunakan metode .appendChild().

Pindahkan markup HTML bagian dalam modal (ikon, judul teks, isi pesan, tombol Tutup, dan tombol Coba Lagi) menjadi string literal di dalam JavaScript.

Kriteria Selesai (DoD): Menghapus seluruh blok tag <div id="custom-modal"> dari index.html, lalu memanggil modul CustomModalAlert lewat konsol browser berhasil memunculkan modal di layar tanpa ada error.

3.1.2: Implementasi Event Listener Penutup Programatik & Deteksi Klik Luar (Backdrop)

Tujuan: Menghapus event klik inline onclick="closeModal()" dan memastikan modal tertutup dengan aman baik saat tombol diklik maupun saat area luar modal (backdrop) disentuh.

Detail Pekerjaan:

Di dalam modul js/components/modal-alert.js, ambil elemen tombol Tutup menggunakan .querySelector('#modal-close-btn').

Daftarkan event listener klik secara programatik menggunakan .addEventListener('click', ...) untuk memicu animasi keluar dan menyembunyikan modal dengan menambahkan kelas .hidden.

Daftarkan event listener pada elemen backdrop modal itu sendiri agar ketika pengguna mengklik area transparan di luar kotak dialog, fungsi penutup modal juga ikut dipicu.

Kriteria Selesai (DoD): Mengklik tombol "Tutup" atau area luar modal berhasil menutup dialog dengan mulus dan tidak ada lagi kode onclick di HTML untuk modal tersebut.

3.1.3: Pengikatan Callback Dinamis & Tombol Coba Lagi (Retry)

Tujuan: Menyediakan fungsi callback kustom yang dinamis sehingga modal ini bisa digunakan kembali oleh fungsi apa pun yang membutuhkan tombol "Coba Lagi" (seperti saat koneksi internet gagal).

Detail Pekerjaan:

Buat metode show(title, message, iconClass, onRetryCallback) di dalam modul.

Jika parameter onRetryCallback dikirimkan (bukan null), tampilkan tombol Coba Lagi (#modal-retry-btn) dengan menghapus kelas .hidden.

Gunakan event listener programatik pada tombol Coba Lagi untuk mengeksekusi fungsi callback tersebut saat diklik, lalu otomatis tutup modal setelahnya.

Kriteria Selesai (DoD): Memanggil CustomModalAlert.show("Gagal", "Koneksi terputus", "fa-wifi", myRetryFunction) berhasil memicu jalannya fungsi myRetryFunction ketika tombol Coba Lagi diklik.

SUBTUGAS 3.2: Modul Kamus Pintar MEB (Morfologi Affix di js/components/modal-dict.js)

3.2.1: Pembuatan File & Desain Struktur Kamus Dinamis

Tujuan: Mengisolasi rendering visual kamus pintar (Mode A dan Mode B) dari berkas UI utama.

Detail Pekerjaan:

Buat berkas baru bernama js/components/modal-dict.js.

Tulis struktur dasar modal kamus pintar di dalam modul ini yang nantinya akan diinjeksikan ke dalam body secara dinamis (mengeliminasi tag #dict-modal dari file HTML Anda).

Salin dan pisahkan logika rendering visual untuk Mode A (Akar Kata Murni) dan Mode B (Dekonstruksi Affix) ke dalam metode-metode internal di berkas ini.

Kriteria Selesai (DoD): Blok tag HTML <div id="dict-modal"> dihapus seluruhnya dari index.html dan latihan.html tanpa mengganggu kemampuan rendering awal komponen.

3.2.2: Penghapusan Event Handler Inline "Batal" & "Simpan"

Tujuan: Mengganti pemicu klik inline pada tombol aksi di dalam kamus menjadi murni programatik.

Detail Pekerjaan:

Cari elemen tombol Batal (onclick="hideDictModal()") dan tombol Masukkan ke Kamus (onclick="saveWordToPersonalKamus()") di dalam kode markup modal kamus.

Hapus atribut onclick tersebut.

Di dalam inisialisasi modul js/components/modal-dict.js, daftarkan event listener klik programatik ke masing-masing tombol tersebut.

Pastikan tombol Batal akan memicu animasi penutupan modal, dan tombol Simpan akan mengumpulkan data arti kustom sebelum memicu pengiriman data.

Kriteria Selesai (DoD): Menekan tombol Batal menutup modal kamus pintar dan menekan tombol Simpan memicu logika penyimpanan kosakata dengan sukses tanpa satu pun atribut onclick di dalam markup modal kamus.

3.2.3: Integrasi Penyimpanan Kosakata dengan Database Lokal (IndexedDB)

Tujuan: Menghubungkan tombol Simpan programatik ke sistem penyimpanan IndexedDB menggunakan model data terstruktur.

Detail Pekerjaan:

Impor referensi database db dari js/services/db.js ke dalam js/components/modal-dict.js.

Saat tombol Simpan diklik, baca nilai dari input arti kustom (#dict-custom-meaning).

Panggil metode penyimpanan lokal (db.kamusUser.put(...)) untuk menyimpan kata yang dipilih, lalu perbarui tampilan statistik dashboard dan tutup modal secara bersih.

Kriteria Selesai (DoD): Kosakata baru yang disimpan melalui modal kamus dinamis berhasil muncul di tabel database browser (F12 -> Application -> IndexedDB) secara real-time.

---
## Batch 4

Rencana Refaktor Mikro-Iteratif: Batch 4 (Migrasi Tampilan Inti & Penghapusan Onclick - Bagian 1)

Fokus utama Batch 4 adalah menarik keluar seluruh markup visual dan manipulasi DOM untuk antarmuka Perpustakaan (view-library) dan Kamus Personal (view-kamus) dari berkas index.html Anda ke dalam modul view dinamis berbasis ES6. Kita juga akan mensterilkan kedua tampilan ini dari seluruh atribut onclick="..." inline.

SUBTUGAS 4.1: Modul View Perpustakaan (Library di js/views/library.js)

4.1.1: Pembuatan File & Rendering Dinamis Naskah Pustaka

Tujuan: Memindahkan logika rendering visual pustaka dari berkas UI lama ke modul khusus view agar struktur template kartu buku bisa dikelola secara terpusat.

Detail Pekerjaan:

Buat berkas baru bernama js/views/library.js.

Definisikan dan ekspor fungsi renderLibrary(overrideList = null) di dalam berkas ini.

Pindahkan seluruh algoritma pembentukan kartu buku Arab (termasuk perhitungan total kata, kata unik, status belajar, dan tombol "Baca Sekarang") dari js/user_ui.js ke modul ini.

Kriteria Selesai (DoD): Pemanggilan renderLibrary() dari modul ini berhasil memunculkan kartu-kartu buku di layar secara dinamis tanpa ada error di Console ($F12$).

4.1.2: Penghapusan Klik Inline pada Filter Kesulitan (Delegasi Event)

Tujuan: Menghapus atribut onclick="filterLibrary(...)" pada tombol level kesulitan (Semua, Pemula, Menengah, Mahir) dan mengikat event-nya secara programatik menggunakan teknik delegasi event.

Detail Pekerjaan:

Cari kontainer filter di HTML Anda (#difficulty-filters). Pastikan semua tombol di dalamnya bersih dari tag onclick dan memiliki atribut data seperti data-difficulty="pemula".

Di dalam inisialisasi modul js/views/library.js, pasang satu event listener klik programatik saja pada elemen pembungkus induk (#difficulty-filters).

Deteksi tombol mana yang diklik menggunakan event.target.closest('.diff-btn'), ambil nilai atribut datanya, lalu jalankan fungsi filter secara dinamis.

Kriteria Selesai (DoD): Mengklik filter "Menengah" atau "Mahir" berhasil memperbarui daftar buku di layar, dan pencarian teks "onclick" pada kontainer filter di HTML menghasilkan "0 match".

4.1.3: Integrasi Programmatic Listener pada Input Pencarian Ter-Debounce

Tujuan: Menghubungkan input pencarian naskah #library-search menggunakan event listener programatik input yang dilengkapi optimasi performa debounce.

Detail Pekerjaan:

Hapus sisa atribut oninput="debouncedSearchLibrary()" pada elemen input pencarian di HTML.

Di dalam modul js/views/library.js, ambil elemen #library-search menggunakan document.getElementById.

Daftarkan event listener 'input' secara programatik, lalu bungkus fungsi eksekusi pencarian IndexedDB menggunakan pembatas waktu (debouncer) sebesar 300ms untuk mencegah lag pada perangkat berspesifikasi rendah.

Kriteria Selesai (DoD): Mengetikkan kata kunci di kolom pencarian akan memicu pencarian dan memperbarui grid buku setelah Anda berhenti mengetik selama 300ms.

SUBTUGAS 4.2: Modul View Kamus Personal & Kotak Leitner (Leitner di js/views/kamus.js)

4.2.1: Pembuatan File & Rendering Visualisasi Kotak Leitner

Tujuan: Memindahkan logika visualisasi ringkasan hafalan kotak Leitner (Box 1 s.d Box 5 dan Known) ke berkas view yang terisolasi.

Detail Pekerjaan:

Buat berkas baru bernama js/views/kamus.js.

Definisikan fungsi renderKamusDashboard() yang bertugas memperbarui angka statistik hafalan pada masing-masing kartu Box Leitner berdasarkan data state lokal terbaru.

Kriteria Selesai (DoD): Membuka menu Leitner berhasil merender angka statistik jumlah kosakata pada Box 1 hingga Box 5 dengan akurat.

4.2.2: Penghapusan Klik Inline pada Tab Box Filter

Tujuan: Mengganti event pemicu klik inline onclick="filterKamusByBox(...)" pada masing-masing kartu Box Leitner menjadi murni programatik.

Detail Pekerjaan:

Hapus atribut onclick pada semua kartu Box di HTML. Pastikan masing-masing tombol memiliki identitas data yang jelas (misal: data-box="1", data-box="Known", dll).

Di dalam inisialisasi modul js/views/kamus.js, pasang event listener klik programatik terpusat pada pembungkus kartu Box untuk memfilter baris tabel kosakata sesuai dengan Box yang dipilih pengguna.

Kriteria Selesai (DoD): Menekan kartu "Box 1" berhasil menyaring isi tabel kamus di bawahnya hanya untuk kosakata Box 1 tanpa adanya event klik inline di HTML.

4.2.3: Penghapusan Klik Inline Hapus Kata (Delegasi Event Tabel)

Tujuan: Menghentikan ketergantungan tag onclick="deleteKamusWord(...)" pada baris tabel kamus dan menggantinya dengan delegasi event klik di level badan tabel (<tbody>).

Detail Pekerjaan:

Di dalam fungsi render tabel kamus pada js/views/kamus.js, hilangkan atribut onclick pada tombol ikon sampah. Sebagai gantinya, berikan kelas khusus .btn-delete-word dan pasangkan atribut data ID berupa data-id="${item.ID_User_Word}".

Daftarkan satu event listener klik programatik pada elemen parent <tbody> tabel kamus (#kamus-table-body).

Gunakan detektor target klik event.target.closest('.btn-delete-word') untuk menangkap aksi hapus, membaca ID kata yang dituju, lalu mengeksekusi logika penghapusan IndexedDB.

Kriteria Selesai (DoD): Menekan tombol sampah pada baris kosakata berhasil menghapus kata tersebut dari database lokal dengan aman tanpa satu pun sisa klik inline.
---

## Batch 5
Rencana Refaktor Mikro-Iteratif: Batch 5 (Migrasi Reader & Latihan Kuis - Bagian 2)

Fokus utama Batch 5 adalah menuntaskan migrasi dua fitur utama yang paling kompleks: E-Reader interaktif (view-reader) dan Sesi Latihan Kuis (view-exercise). Kita akan melebur seluruh elemen visual dari latihan.html ke dalam SPA shell index.html, mengeliminasi ketergantungan onclick inline pada kata-kata Arab, pilihan jawaban kuis, dan tombol pengontrol, serta mengisolasi logikanya ke modul view yang bersih.

SUBTUGAS 5.1: Modul View E-Reader Interaktif (Reader di js/views/reader.js)

5.1.1: Pembuatan File & Rendering Interaktif Canvas Kata

Tujuan: Mengisolasi fungsionalitas rendering teks Arab interaktif (e-reader) dari modul UI generik ke modul khusus view reader agar manipulasi visual teks lebih terpusat.

Detail Pekerjaan:

Buat berkas baru bernama js/views/reader.js.

Definisikan dan ekspor fungsi loadReader(idTeks) dan renderInteractiveArabicText(text, containerId) ke dalam modul ini.

Pindahkan algoritma pemecah kalimat dan pembungkus kata (span.word-span) dari js/user_ui.js ke modul ini.

Hubungkan fungsi ini agar ketika rute #reader aktif, data teks bacaan dari IndexedDB ditarik dan dirender otomatis ke #reader-canvas.

Kriteria Selesai (DoD): Membuka halaman buku dari perpustakaan berhasil merender seluruh teks Arab interaktif di layar e-reader tanpa adanya pesan error di konsol.

5.1.2: Penghapusan Klik Inline Kata (Delegasi Event Canvas)

Tujuan: Menghilangkan pemicu klik inline onclick="handleWordClick(...)" pada ribuan elemen span kata yang dirender di canvas membaca, menggantinya dengan satu listener terpusat demi efisiensi memori yang tinggi.

Detail Pekerjaan:

Di dalam fungsi render teks Arab pada js/views/reader.js, hilangkan atribut onclick pada pembuatan elemen span kata. Pastikan setiap span memiliki data atribut yang jelas (misal: data-word-harakat="..." dan data-word-polos="...").

Pasang satu event listener klik programatik saja pada elemen pembungkus induk utama canvas (#reader-canvas).

Gunakan taktik deteksi target click event.target.closest('.word-span') untuk menangkap kata yang diklik, membaca nilainya dari atribut data, lalu memanggil fungsi modul handleWordClick() secara dinamis.

Kriteria Selesai (DoD): Mengetuk kata Arab di e-reader memicu kemunculan Modal Kamus Pintar dengan normal, dan pencarian teks "onclick" pada algoritma pembuatan span menghasilkan "0 match".

5.1.3: Penghapusan Klik Inline Kontrol Ukuran, Jarak Baris, dan Terjemah

Tujuan: Membersihkan tombol-tombol pengatur tampilan di atas e-reader dari event klik inline.

Detail Pekerjaan:

Cari elemen tombol perbesar font, perkecil font, reset tampilan, slider line-height, dan tombol tampilkan terjemahan di HTML. Bersihkan seluruh atribut onclick dan oninput.

Daftarkan event listener programatik secara berkelompok di dalam fungsi inisialisasi js/views/reader.js untuk tombol-tombol tersebut.

Hubungkan tombol-tombol tersebut langsung ke fungsi utilitas internal seperti adjustReaderFont(), adjustReaderLineHeight(), dan toggleTranslation().

Kriteria Selesai (DoD): Menekan tombol +, -, slider jarak baris, atau tombol terjemahan di e-reader berfungsi dengan mulus secara programatik tanpa adanya kode onclick/oninput inline di HTML.

SUBTUGAS 5.2: Modul View Sesi Latihan Kuis (Exercise di js/views/exercise.js)

5.2.1: Integrasi Elemen Struktur Latihan dari latihan.html ke SPA Shell

Tujuan: Memindahkan kerangka antarmuka latihan (Carousel pemilihan set, list kuis, feedback kuis, modal summary) dari file latihan.html lama langsung masuk ke kontainer #view-exercise di index.html.

Detail Pekerjaan:

Salin seluruh tag markup visual area kuis, tombol pemilihan set, riwayat skor, dan modal summary kuis dari latihan.html lama.

Tempelkan dan rapihkan ke dalam elemen <section id="view-exercise"> di dalam shell tunggal index.html Anda.

Pastikan seluruh script module lama yang menempel di latihan.html tidak ikut disalin karena kita akan mengkonsolidasikan seluruh logikanya murni di modul ES6 baru.

Kriteria Selesai (DoD): File latihan.html dapat dihapus dari folder proyek Anda, dan kerangka visual latihan kuis sekarang menyatu di dalam index.html.

5.2.2: Pembuatan Modul View Exercise & Rendering Kartu Kuis Dinamis

Tujuan: Membuat modul view khusus latihan kuis untuk mengelola siklus hidup rendering soal kuis pilihan ganda secara dinamis.

Detail Pekerjaan:

Buat berkas baru bernama js/views/exercise.js.

Definisikan dan ekspor fungsi-fungsi latihan: startExercise(setId), backToSetSelection(), renderExerciseSets(), renderQuestion(), dan showVisualSummary().

Pindahkan logika pembentukan opsi kuis, deteksi status jawaban (benar/salah), penayangan area feedback, dan penggambaran grafik lingkaran Chart.js dari script lama ke modul view baru ini.

Kriteria Selesai (DoD): Memilih set latihan memunculkan kartu kuis dengan teks Arab yang terformat rapi sesuai nomor soal aktif secara dinamis.

5.2.3: Penghapusan Klik Inline Opsi Jawaban & Navigasi Kuis (Delegasi Event)

Tujuan: Mensterilkan pilihan jawaban (A, B, C, D, E) dan tombol navigasi soal (Sebelumnya, Berikutnya, Selesai & Kirim) dari event klik inline.

Detail Pekerjaan:

Di dalam fungsi renderQuestion() pada js/views/exercise.js, hilangkan atribut onclick pada tag opsi jawaban. Berikan kelas penanda .option-item dan atribut data data-char="A", data-char="B", dst.

Pasang satu event listener klik programatik terpusat pada kontainer pilihan jawaban #exercise-options untuk memicu fungsi handleAnswerSelection(char).

Pasang event listener programatik klik pada tombol #btn-prev-q, #btn-next-q, dan #btn-finish-exercise menggunakan addEventListener di dalam modul inisialisasi kuis.

Kriteria Selesai (DoD): Memilih jawaban dan menavigasi soal kuis berfungsi 100% normal secara programatik tanpa adanya atribut onclick inline pada kontainer kuis di HTML.

5.2.4: Integrasi Modul Pengatur Waktu Tantangan (Challenge Timer di js/views/challenge-timer.js)

Tujuan: Memisahkan komponen logika perhitungan mundur waktu kuis (Challenge Timer) ke modul tersendiri agar tidak mengotori file view kuis utama.

Detail Pekerjaan:

Buat berkas baru bernama js/views/challenge-timer.js.

Pindahkan fungsi pengatur waktu: startChallengeTimer(), stopChallengeTimer(), startPerQuestionTimer(), dan showChallengeSetupModal() dari file kuis lama ke modul khusus timer ini.

Ekspor fungsi kontrol timer tersebut dan impor ke dalam modul view latihan js/views/exercise.js agar terhubung secara otomatis saat pengguna memilih mode "Tantangan".

Kriteria Selesai (DoD): Memilih "Mode Tantangan" memicu kemunculan modal kustom opsi durasi waktu, dan timer hitung mundur berjalan mulus di layar kuis secara programatik.

---

