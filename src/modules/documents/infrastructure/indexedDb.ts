const DB_NAME = 'docux-phase1';
const DB_VERSION = 1;
const DOCUMENTS_STORE = 'documents';
const PAGES_STORE = 'pages';

export interface StoredPage {
  id: string;
  documentId: string;
  order: number;
  blob: Blob;
  createdAt: string;
}

export interface StoredDocument {
  id: string;
  name: string;
  createdAt: string;
  pageCount: number;
  size: number;
  pdfBlob: Blob;
}

export interface SaveDocumentInput {
  id: string;
  name: string;
  createdAt: string;
  pageCount: number;
  size: number;
  pdfBlob: Blob;
  pages: Array<{ blob: Blob; createdAt: string }>;
}

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise !== null) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no está disponible en este navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(DOCUMENTS_STORE)) {
        database.createObjectStore(DOCUMENTS_STORE, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(PAGES_STORE)) {
        const pages = database.createObjectStore(PAGES_STORE, {
          keyPath: 'id',
        });
        pages.createIndex('documentId', 'documentId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('No se pudo abrir IndexedDB.'));
  });

  return databasePromise;
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Error de IndexedDB.'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Transacción cancelada.'));
  });
}

async function deletePagesForDocument(documentId: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(PAGES_STORE, 'readwrite');
    const store = transaction.objectStore(PAGES_STORE);
    const index = store.index('documentId');
    const request = index.openKeyCursor(IDBKeyRange.only(documentId));

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
    request.onerror = () =>
      reject(request.error ?? new Error('No se pudieron borrar páginas.'));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Error de IndexedDB.'));
  });
}

export async function saveDocument(input: SaveDocumentInput): Promise<void> {
  const database = await openDatabase();
  await deletePagesForDocument(input.id);

  const transaction = database.transaction(
    [DOCUMENTS_STORE, PAGES_STORE],
    'readwrite',
  );
  const documents = transaction.objectStore(DOCUMENTS_STORE);
  const pages = transaction.objectStore(PAGES_STORE);

  const document: StoredDocument = {
    id: input.id,
    name: input.name,
    createdAt: input.createdAt,
    pageCount: input.pageCount,
    size: input.size,
    pdfBlob: input.pdfBlob,
  };

  documents.put(document);

  input.pages.forEach((page, index) => {
    const storedPage: StoredPage = {
      id: `${input.id}-${index}`,
      documentId: input.id,
      order: index,
      blob: page.blob,
      createdAt: page.createdAt,
    };
    pages.put(storedPage);
  });

  await transactionDone(transaction);
}

export async function listDocuments(): Promise<StoredDocument[]> {
  const database = await openDatabase();
  const transaction = database.transaction(DOCUMENTS_STORE, 'readonly');
  const store = transaction.objectStore(DOCUMENTS_STORE);
  const request = store.getAll();

  const documents = await new Promise<StoredDocument[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as StoredDocument[]);
    request.onerror = () =>
      reject(request.error ?? new Error('No se pudieron leer los documentos.'));
  });

  return documents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteDocument(documentId: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(
    [DOCUMENTS_STORE, PAGES_STORE],
    'readwrite',
  );
  const pages = transaction.objectStore(PAGES_STORE);
  const index = pages.index('documentId');
  const cursorRequest = index.openKeyCursor(IDBKeyRange.only(documentId));

  cursorRequest.onsuccess = () => {
    const cursor = cursorRequest.result;
    if (cursor) {
      pages.delete(cursor.primaryKey);
      cursor.continue();
    }
  };

  transaction.objectStore(DOCUMENTS_STORE).delete(documentId);
  await transactionDone(transaction);
}
