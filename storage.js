// storage.js — chrome.storage.local adapter
// Drop-in replacement for localStorage: all data is stored locally in Chrome's
// extension storage (survives browser updates, incognito protection, independent
// of the browser's localStorage which can be cleared by the user).

const Store = {
  async get(key, fallback = null) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) { resolve(fallback); return; }
        resolve(result[key] !== undefined ? result[key] : fallback);
      });
    });
  },

  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) console.warn("Store.set error:", chrome.runtime.lastError);
        resolve();
      });
    });
  },

  async remove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) console.warn("Store.remove error:", chrome.runtime.lastError);
        resolve();
      });
    });
  },

  // Read multiple keys in one call (more efficient than multiple get() calls)
  async getMany(keys, fallbacks = {}) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) { resolve(fallbacks); return; }
        const out = {};
        keys.forEach((k) => { out[k] = result[k] !== undefined ? result[k] : (fallbacks[k] ?? null); });
        resolve(out);
      });
    });
  },
};
