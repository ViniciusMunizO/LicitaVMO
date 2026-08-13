// Minimal IndexedDB key-value helper with migration from localStorage
const DB_NAME = 'licitavmo_db'
const STORE = 'kv'

function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore(mode: IDBTransactionMode, cb: (store: IDBObjectStore) => void) {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    cb(store)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function dbSet(key: string, value: any) {
  try {
    await withStore('readwrite', store => { store.put(value, key) })
  } catch (e) {
    // fallback to localStorage
    localStorage.setItem(key, JSON.stringify(value))
  }
}

export async function dbGet(key: string) {
  try {
    const db = await openDB()
    try {
      return await new Promise<any>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).get(key)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
    } finally {
      db.close()
    }
  } catch (e) {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  }
}

export async function dbDelete(key: string) {
  try {
    await withStore('readwrite', store => { store.delete(key) })
  } catch (e) {
    localStorage.removeItem(key)
  }
}

// Migration helper: copy known keys from localStorage to IDB once
export async function migrateFromLocalStorage() {
  try {
    const done = localStorage.getItem('migrated_to_idb')
    if (done) return
    const keys = ['licitacoes', 'licitacao_next', 'empresas', 'empresa_next', 'users', 'users_next', 'contratantes', 'contratante_next']
    for (const k of keys) {
      const raw = localStorage.getItem(k)
      if (raw) await dbSet(k, JSON.parse(raw))
    }
    // migrate attachments and items keys (pattern)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      if (key.startsWith('attachments_') || key.startsWith('items_')) {
        const raw = localStorage.getItem(key)
        if (raw) await dbSet(key, JSON.parse(raw))
      }
    }
    localStorage.setItem('migrated_to_idb', '1')
  } catch (e) {
    // ignore
  }
}
