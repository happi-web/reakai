if (!window.indexedDB) {
    console.error('Your browser does not support IndexedDB.');
}

// Open or Create IndexedDB
async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('InventoryDB', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('inventory')) {
                const store = db.createObjectStore('inventory', { keyPath: 'Barcode' });
                store.createIndex('ProductName', 'ProductName', { unique: false });
                store.createIndex('Quantity', 'Quantity', { unique: false });
            }

            if (!db.objectStoreNames.contains('transactions')) {
                const store = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(new Error(`IndexedDB error: ${event.target.error}`));
    });
}

// Save or Update Data in IndexedDB
async function saveToIndexedDB(storeName, data) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        data.forEach((item) => {
            const request = store.put(item); // Insert or update the data
            request.onsuccess = () => console.log('Data saved:', item);
            request.onerror = (event) => console.error('Error saving data:', event.target.error);
        });

        transaction.oncomplete = () => console.log(`Data saved to ${storeName} successfully.`);
        transaction.onerror = (event) => console.error('Transaction error:', event.target.error);
    } catch (error) {
        console.error('Error saving to IndexedDB:', error);
    }
}

// Get All Data from IndexedDB
async function getAllFromIndexedDB(storeName) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);

        if ('getAll' in store) {
            const data = await store.getAll();
            return Array.isArray(data) ? data : []; // Ensure it returns an array
        } else {
            return new Promise((resolve, reject) => {
                const data = [];
                const cursorRequest = store.openCursor();
                cursorRequest.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        data.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(data);
                    }
                };
                cursorRequest.onerror = (event) => reject(event.target.error);
            });
        }
    } catch (error) {
        console.error('Error retrieving data from IndexedDB:', error);
        return [];
    }
}


// Delete Specific Data from IndexedDB
async function deleteFromIndexedDB(storeName, key) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        const request = store.delete(key);
        request.onsuccess = () => console.log(`Data with key ${key} deleted from ${storeName}.`);
        request.onerror = (event) => console.error('Error deleting data:', event.target.error);
    } catch (error) {
        console.error('Error deleting data from IndexedDB:', error);
    }
}

// Clear All Data from IndexedDB Store
async function clearIndexedDB(storeName) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        const request = store.clear();
        request.onsuccess = () => console.log(`All data cleared from ${storeName}.`);
        request.onerror = (event) => console.error('Error clearing data:', event.target.error);
    } catch (error) {
        console.error('Error clearing data from IndexedDB:', error);
    }
}

// Sync Offline Data to Server
// Sync Offline Data to Server
async function syncOfflineData() {
    try {
        const offlineTransactions = await getAllFromIndexedDB('transactions');

        // Ensure offlineTransactions is iterable
        if (!Array.isArray(offlineTransactions)) {
            console.error('Error: offlineTransactions is not an array.');
            return;
        }

        // Iterate over transactions
        for (const transaction of offlineTransactions) {
            await sendTransaction(transaction);
        }

        console.log("Offline transactions synced successfully.");
    } catch (error) {
        console.error("Error syncing offline data:", error.message);
    }
}


// Simulate Sending Transaction to Server
async function sendTransaction(transaction) {
    try {
        console.log('Sending transaction:', transaction);
        // Simulate success or failure
        return true; // Replace with actual API call
    } catch (error) {
        console.error('Failed to send transaction:', transaction, error);
    }
}

async function debugTransactions() {
    const data = await getAllFromIndexedDB('transactions');
    console.table(data);
}

// Call this after your page loads
debugTransactions();

// List Object Stores
async function listObjectStores() {
    const db = await openDatabase();
    console.log('Object stores in the database:', Array.from(db.objectStoreNames));
}

// Debug IndexedDB
async function debugIndexedDB() {
    const inventoryData = await getAllFromIndexedDB('inventory');
    console.log('Debug: Inventory contents:', inventoryData);

    const transactionsData = await getAllFromIndexedDB('transactions');
    console.log('Debug: Transactions contents:', transactionsData);
}

// Automatically Sync Offline Data When Back Online
window.addEventListener('online', syncOfflineData);

// Example Usage
(async () => {
    // Test adding inventory data
    await saveToIndexedDB('inventory', [
        { Barcode: '12345', ProductName: 'Sample Product', Quantity: 10 }
    ]);

    // Test adding transactions data
    await saveToIndexedDB('transactions', [
        { timestamp: Date.now(), action: 'add', details: 'Sample transaction' }
    ]);

    // Debug IndexedDB contents
    await debugIndexedDB();

    // List all object stores
    await listObjectStores();
})();
