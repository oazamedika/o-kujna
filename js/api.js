// Обвивка за комуникација со Apps Script backend-от.
// POST се испраќа со text/plain за да се избегне CORS preflight (Apps Script ограничување).

const Api = {
  async get(action, params = {}) {
    const usp = new URLSearchParams({ action, ...params });
    const res = await fetch(`${SCRIPT_URL}?${usp.toString()}`, { method: 'GET' });
    return res.json();
  },

  async post(action, payload = {}) {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload })
    });
    return res.json();
  },

  login(pin) {
    return this.post('login', { pin });
  },

  getGroceries() {
    return this.get('groceries');
  },

  getEntries(filters = {}) {
    return this.get('entries', filters);
  },

  addEntry(entry) {
    return this.post('addEntry', entry);
  }
};
