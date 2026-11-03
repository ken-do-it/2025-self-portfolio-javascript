export async function offlineData(value?: unknown, locale = 'ko'): Promise<unknown> {
  return new Promise(resolve => {
    const request = indexedDB.open('hiken-offline', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('data');
    request.onerror = () => resolve(undefined);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('data', value === undefined ? 'readonly' : 'readwrite');
      const key = locale === 'ko' ? 'events' : `events:${locale}`;
      const op = value === undefined ? tx.objectStore('data').get(key) : tx.objectStore('data').put(value, key);
      let result: unknown;
      op.onsuccess = () => { result = op.result; };
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onerror = () => { db.close(); resolve(undefined); };
      tx.onabort = () => { db.close(); resolve(undefined); };
    };
  });
}
