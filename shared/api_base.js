/**
 * SHARED API BASE
 * Logika dasar komunikasi network dengan Google Apps Script.
 */

async function apiCall(payload, endpoint = appState.gasEndpoint, retries = 5, delay = 1000) {
  if (!endpoint) {
    console.error("Endpoint API tidak ditemukan.");
    throw new Error("Endpoint API belum siap.");
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      if (attempt === retries) {
        console.error("API Call gagal setelah beberapa percobaan:", error);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; 
    }
  }
}