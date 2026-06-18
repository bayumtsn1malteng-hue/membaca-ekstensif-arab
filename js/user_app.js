/**
 * MODUL UTAMA APLIKASI USER (USER APP MODULE)
 * Versi: v0.9.1-alpha (Refactored Entry Point)
 * ID Unik: MEB-USER-APP-001
 *
 * Modul ini menjadi entry point utama / orchestrator:
 * - Mengimpor State utama aplikasi (appState) dari user_state.js
 * - Mengimpor Logika bisnis dan event handlers dari user_events.js
 * - Mengekspos fungsi global ke objek `window` untuk kompatibilitas atribut inline event handler di HTML
 */

import { appState, db } from './user_state.js';
import {
  logout,
  handleAuthSubmit,
  bypassLogin,
  handleAvatarClick,
  loadMockData,
  handleWordClick,
  markReadAsFinished,
  saveWordToPersonalKamus,
  deleteKamusWord,
  startLeitnerSession,
  submitLeitnerResult,
  nextLeitnerCard,
  saveApiEndpoint,
  testApiConnection,
  migrateFromLocalStorage,
  hydrateAppStateFromDB,
  checkAndAutoRestore,
  requestNotificationPermission,
  sendLocalNotification,
  setupPeriodicSync,
  checkLeitnerReminders,
  importDatabaseFromJson,
  exportDatabaseToJson,
  uploadBackupToDrive,
  importLatestBackupFromDrive,
  clearKamusOnly,
  clearAllLocalData,
  triggerSWUpdate,
  clearMediaCache,
  downloadAllPustakaForOffline,
  handleLeitnerSourceChange,
  saveLeitnerSettings,
  resetLeitnerSettings
} from './user_events.js';

import {
  switchView,
  toggleAuthMode,
  filterLibrary,
  searchLibrary,
  toggleMinimalistMode,
  adjustReaderFont,
  resetReaderSettings,
  adjustReaderLineHeight,
  toggleTranslation,
  filterKamusByBox,
  closeModal,
  closeLeitnerSession,
  revealLeitnerCard,
  hideDictModal
} from './user_ui.js';

import {
  pullSystemDataFromServer,
  pullUserKamusFromServer
} from './user_api.js';

// ============================================================
// --- EKSPOS KE WINDOW OBJECT (UNTUK ONCLICK INLINE DI HTML) ---
// ============================================================
window.appState = appState;

// Fungsi-fungsi dari user_events.js
window.logout = logout;
window.handleAuthSubmit = handleAuthSubmit;
window.bypassLogin = bypassLogin;
window.handleAvatarClick = handleAvatarClick;
window.loadMockData = loadMockData;
window.handleWordClick = handleWordClick;
window.markReadAsFinished = markReadAsFinished;
window.saveWordToPersonalKamus = saveWordToPersonalKamus;
window.deleteKamusWord = deleteKamusWord;
window.hideDictModal = hideDictModal;
window.saveApiEndpoint = saveApiEndpoint;
window.testApiConnection = testApiConnection;
window.uploadBackupToDrive = uploadBackupToDrive;
window.clearAllLocalData = clearAllLocalData;
window.clearKamusOnly = clearKamusOnly;
window.importLatestBackupFromDrive = importLatestBackupFromDrive;
window.checkAndAutoRestore = checkAndAutoRestore;
window.requestNotificationPermission = requestNotificationPermission;
window.importDatabaseFromJson = importDatabaseFromJson;
window.exportDatabaseToJson = exportDatabaseToJson;
window.handleLeitnerSourceChange = handleLeitnerSourceChange;
window.saveLeitnerSettings = saveLeitnerSettings;
window.resetLeitnerSettings = resetLeitnerSettings;

// Fungsi-fungsi dari user_ui.js
window.switchView = switchView;
window.toggleAuthMode = toggleAuthMode;
window.filterLibrary = filterLibrary;
window.searchLibrary = searchLibrary;
window.toggleMinimalistMode = toggleMinimalistMode;
window.adjustReaderFont = adjustReaderFont;
window.resetReaderSettings = resetReaderSettings;
window.adjustReaderLineHeight = adjustReaderLineHeight;
window.toggleTranslation = toggleTranslation;
window.filterKamusByBox = filterKamusByBox;
window.closeModal = closeModal;
window.closeLeitnerSession = closeLeitnerSession;
window.revealLeitnerCard = revealLeitnerCard;
window.startLeitnerSession = startLeitnerSession;
window.submitLeitnerResult = submitLeitnerResult;
window.pullSystemDataFromServer = pullSystemDataFromServer;
window.pullUserKamusFromServer = pullUserKamusFromServer;

// ============================================================
// --- RE-EXPORT UNTUK IMPOR EKSTERNAL (MODUL LAIN / SCRIPT MODUL) ---
// ============================================================
export {
  appState,
  db,
  logout,
  handleAuthSubmit,
  bypassLogin,
  handleAvatarClick,
  loadMockData,
  handleWordClick,
  markReadAsFinished,
  saveWordToPersonalKamus,
  deleteKamusWord,
  startLeitnerSession,
  submitLeitnerResult,
  nextLeitnerCard,
  saveApiEndpoint,
  testApiConnection,
  migrateFromLocalStorage,
  hydrateAppStateFromDB,
  checkAndAutoRestore
};
