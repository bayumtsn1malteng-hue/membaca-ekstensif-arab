// Import Dexie using importScripts for classic Service Worker compatibility
importScripts('./js/dexie.js'); // Assuming you save dexie.js in your js folder

const SW_VERSION = 'v0.9.0';
const CACHE_NAME = 'meb-cache-v0.9.0';
const urlsToCache = [
  'index.html',
  'latihan.html',
  'css/style.css',
  'css/fontawesome.min.css',
  'js/dexie.js',
  'fonts/plus-jakarta-sans.woff2',
  'fonts/noto-sans-arabic.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    .then(() => console.log(`[SW] ${SW_VERSION} installed.`))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Mengembalikan respons gagal yang valid untuk menghindari uncaught promise error
        return new Response('Network error occurred', { status: 408, statusText: 'Network Error' });
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
    .then(() => console.log(`[SW] ${SW_VERSION} activated.`))
  );
});

// Mendengarkan pesan untuk melewati masa tunggu (Triggered by Update UI)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- PENANGANAN NOTIFIKASI KLIK ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Tutup notifikasi setelah diklik
  event.waitUntil(
    clients.openWindow('/index.html#kamus') // Buka atau fokus ke halaman Kamus
  );
});

// --- PENANGANAN PERIODIC BACKGROUND SYNC ---

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'leitner-reminder') {
    // Jalankan pengecekan database di latar belakang
    event.waitUntil(checkAndNotifyLeitner());
  }
});

/**
 * Memeriksa IndexedDB untuk mencari kata yang jatuh tempo reviewnya
 * dan menampilkan notifikasi jika ada.
 */
async function checkAndNotifyLeitner() {
  try {
    // Inisialisasi DB di konteks Service Worker
    const db = new Dexie("MEB_UserDB");
    db.version(2).stores({
      kamusUser: "ID_User_Word, ID_User, Kata_Polos, ID_Kata_Induk, Status_Belajar, Tanggal_Update",
      appLogs: "++id, eventType, timestamp"
    });

    const now = new Date();
    // Ambil jumlah kata yang perlu direview (Status != 'Known' dan Tanggal_Review <= sekarang)
    const dueCount = await db.kamusUser
      .filter(item => item.Status_Belajar !== 'Known' && new Date(item.Tanggal_Review_Berikutnya) <= now)
      .count();

    if (dueCount > 0) {
      await self.registration.showNotification("Sesi Leitner Siap", {
        body: `Ada ${dueCount} kosakata yang perlu Anda tinjau hari ini.`,
        icon: "https://cdn-icons-png.flaticon.com/512/3389/3389081.png",
        badge: "https://cdn-icons-png.flaticon.com/512/3389/3389081.png",
        tag: 'leitner-reminder-notif',
        renotify: true
      });
    }
  } catch (error) {
    console.error('[SW] Gagal menjalankan pengecekan Leitner:', error);
  }
}