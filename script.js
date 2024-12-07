<<<<<<< HEAD
const webAppUrl = "https://script.google.com/macros/s/AKfycbydlzYlDKjyR0LD5QDKLiQJfBbroTbOwMmgepWkT_i5uIijc4GeBrd39Has4bgXEzXs/exec";
=======
const webAppUrl = "https://script.google.com/macros/s/AKfycbwYlsh-YcM046Y3XTobPCVOlJflbp-jSPTERUwq68q7V_PIrKZytvYUkIM8nO_KA52B/exec";
>>>>>>> 76e1701 (Trying to put offline)

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const scannerSection = document.getElementById("scannerSection");
    const inventoryForm = document.getElementById("inventoryForm");
    const cartItems = document.getElementById("cartItems");
    const totalPriceElement = document.getElementById("totalPrice");
    const scanResult = document.getElementById("scanResult");
    const checkoutButton = document.getElementById("checkout");
    const receivedMoneyInput = document.getElementById("receivedMoney");
    const changeAmountElement = document.getElementById("changeAmount");
    const calculateChangeButton = document.getElementById("calculateChange");
    const scanModeButton = document.getElementById("scanMode");

<<<<<<< HEAD
=======
    // Global Variables
>>>>>>> 76e1701 (Trying to put offline)
    let scanner;
    let cart = [];
    let totalPrice = 0;
    let inventoryData = [];

<<<<<<< HEAD
    // Load Inventory Data
    async function loadInventoryData() {
        try {
            const response = await fetch(`${webAppUrl}?action=getInventory`);
            if (!response.ok) throw new Error(`Failed to fetch inventory data: ${response.status}`);

            const result = await response.json();
            inventoryData = (Array.isArray(result.inventory) ? result.inventory : result).map(item => ({
                Barcode: cleanBarcode(item.Barcode),
                ProductName: item["Product Name"],
                UnitPrice: parseFloat(item["Unit Price"]),
                Quantity: parseInt(item.Quantity, 10),
                Category: item.Category,
                Supplier: item.Supplier,
                ExpiringDate: item["Expiring Date"],
                CostPrice: parseFloat(item["Cost Price"] || "0"),
            }));
        } catch (error) {
            console.error("Error loading inventory data:", error.message);
        }
    }

    // Utility: Clean Barcode
    function cleanBarcode(barcode) {
        return String(barcode).trim();
    }

    // Add Product to Cart
    async function addProductToCart(product) {
        const quantity = parseInt(prompt(`Enter quantity for ${product.ProductName} (Stock: ${product.Quantity}):`), 10);

        if (isNaN(quantity) || quantity <= 0) {
            alert("Please enter a valid quantity.");
            return;
        }

        if (quantity > product.Quantity) {
            alert(`Not enough stock! Available: ${product.Quantity}`);
            return;
        }

        const existingItem = cart.find(item => item.barcode === product.Barcode);
        if (existingItem) {
            if (existingItem.quantity + quantity > product.Quantity) {
                alert(`Not enough stock! Available: ${product.Quantity}`);
                return;
            }
            existingItem.quantity += quantity;
        } else {
            cart.push({
                barcode: product.Barcode,
                name: product.ProductName,
                quantity,
                price: product.UnitPrice,
            });
        }

        product.Quantity -= quantity;
        await updateInventory(product);

        if (product.Quantity <= 5) {
            alert(`Low stock alert for ${product.ProductName}! Remaining: ${product.Quantity}`);
        }

        renderCart();
    }

    // Update Inventory on Server
    async function updateInventory(product) {
        try {
            const response = await fetch(webAppUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "processBarcode",
                    data: { Barcode: product.Barcode, Quantity: product.Quantity },
                }),
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const result = await response.json();
            if (result.status !== "success") alert(result.message);
        } catch (error) {
            console.error("Error updating inventory:", error.message);
        }
    }

    // Render Cart
=======
    document.getElementById("manualMode").addEventListener("click", () => {
        scannerSection.classList.add("hidden");
        inventoryForm.classList.remove("hidden");
    });
    

    // Inventory Handling
    async function loadInventoryData() {
        if (navigator.onLine) {
            await syncInventoryToLocal();
        } else {
            inventoryData = await getInventoryFromLocal();
            console.log("Loaded inventory from IndexedDB.");
        }
    }

    async function syncInventoryToLocal() {
        try {
            const response = await fetch(`${webAppUrl}?action=getInventory`);
            const result = await response.json();
            const inventory = Array.isArray(result.inventory) ? result.inventory : [];

            const db = await openDatabase();
            const transaction = db.transaction("inventory", "readwrite");
            const store = transaction.objectStore("inventory");

            inventory.forEach(item => {
                store.put(item);
            });
            console.log("Inventory synced to IndexedDB.");
        } catch (error) {
            console.error("Error syncing inventory:", error.message);
        }
    }

    function getInventoryFromLocal() {
        return new Promise((resolve, reject) => {
            openDatabase().then((db) => {
                const transaction = db.transaction("inventory", "readonly");
                const store = transaction.objectStore("inventory");
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) => reject(event.target.errorCode);
            });
        });
    }
    // Cart Handling
    function updateTotalPrice() {
        totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        totalPriceElement.textContent = `K${totalPrice.toFixed(2)}`;
    }
// Handle Manual Form Submission
document.getElementById("inventoryForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const barcodeInput = document.getElementById("barcode").value.trim();
    const productName = document.getElementById("productName").value.trim();
    const quantity = parseInt(document.getElementById("quantity").value, 10);
    const price = parseFloat(document.getElementById("price").value);

    if (!productName || isNaN(quantity) || isNaN(price) || quantity <= 0 || price <= 0) {
        alert("Please fill out all fields correctly.");
        return;
    }

    const newProduct = {
        Barcode: barcodeInput || null, // Allow manual entries without barcodes
        ProductName: productName,
        Quantity: quantity,
        UnitPrice: price,
    };

    // Add product to inventory array
    inventoryData.push(newProduct);

    // Update IndexedDB
    const db = await openDatabase();
    const transaction = db.transaction("inventory", "readwrite");
    const store = transaction.objectStore("inventory");
    store.put(newProduct);

    alert(`${productName} added to inventory successfully.`);

    // Reset form
    document.getElementById("inventoryForm").reset();

    // Update UI
    renderCart();
});

>>>>>>> 76e1701 (Trying to put offline)
    function renderCart() {
        cartItems.innerHTML = "";
        cart.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
<<<<<<< HEAD
                <td>${item.barcode}</td>
=======
                <td>${item.barcode || "N/A"}</td>
>>>>>>> 76e1701 (Trying to put offline)
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>K${item.price.toFixed(2)}</td>
                <td>K${(item.quantity * item.price).toFixed(2)}</td>
                <td><button onclick="removeFromCart(${index})">Remove</button></td>
            `;
            cartItems.appendChild(row);
        });
        updateTotalPrice();
    }

<<<<<<< HEAD
    // Update Total Price
    function updateTotalPrice() {
        totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        totalPriceElement.textContent = `K${totalPrice.toFixed(2)}`;
    }

    // Remove Item from Cart
=======
>>>>>>> 76e1701 (Trying to put offline)
    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

<<<<<<< HEAD
    // Calculate Change
    calculateChangeButton.addEventListener("click", () => {
        const receivedMoney = parseFloat(receivedMoneyInput.value);
        if (isNaN(receivedMoney) || receivedMoney < totalPrice) {
            alert("Received amount must be greater than or equal to the total price.");
=======
    async function addToCartWithQuantity(product) {
        const enteredQuantity = parseInt(prompt(`Enter quantity for ${product.ProductName} (Stock: ${product.Quantity}):`), 10);

        if (isNaN(enteredQuantity) || enteredQuantity <= 0 || enteredQuantity > product.Quantity) {
            alert(`Invalid quantity. Available stock: ${product.Quantity}`);
            return;
        }

        const existingCartItem = cart.find(item => item.barcode === product.Barcode);

        if (existingCartItem) {
            existingCartItem.quantity += enteredQuantity;
        } else {
            cart.push({
                barcode: product.Barcode,
                name: product.ProductName,
                quantity: enteredQuantity,
                price: product.UnitPrice,
            });
        }

        product.Quantity -= enteredQuantity;
        await updateInventoryOnServer(product);

        if (product.Quantity <= 5) {
            alert(`Low stock alert for ${product.ProductName}! Remaining quantity: ${product.Quantity}`);
        }

        renderCart();
    }

    async function updateInventoryOnServer(data) {
        try {
            const payload = {
                action: "updateInventory",
                data, // Ensure this matches the format required by Google Apps Script
            };
    
            const response = await fetch(webAppUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
    
            if (!response.ok) {
                throw new Error(`Server error! Status: ${response.status}`);
            }
    
            const result = await response.json();
            if (result.status !== "success") {
                console.error("Server error:", result.message);
                alert(`Error updating inventory: ${result.message}`);
            } else {
                console.log("Inventory successfully updated:", result);
            }
        } catch (error) {
            console.error("Error updating inventory:", error.message);
            alert("Failed to update inventory. Check your connection or server status.");
        }
    }
    

    // Scan Mode
    scanModeButton.addEventListener("click", () => {
        scannerSection.classList.remove("hidden");
        inventoryForm.classList.add("hidden");

        if (!scanner) {
            scanner = new Html5QrcodeScanner("scanner", { fps: 10, qrbox: { width: 200, height: 200 } });

            scanner.render(
                async (decodedText) => {
                    const cleanedBarcode = cleanBarcode(decodedText);
                    const product = inventoryData.find(item => item.Barcode === cleanedBarcode);

                    if (product) {
                        await addToCartWithQuantity(product);
                    } else {
                        alert("Product not found in inventory.");
                    }
                },
                (error) => {
                    console.warn(`Scanning failed: ${error.message || error}`);
                }
            );
        }
    });

    // Checkout Handling
    calculateChangeButton.addEventListener("click", () => {
        const receivedMoney = parseFloat(receivedMoneyInput.value);
        if (isNaN(receivedMoney) || receivedMoney < totalPrice) {
            alert("The amount received must be greater than or equal to the total price.");
>>>>>>> 76e1701 (Trying to put offline)
            return;
        }
        const change = receivedMoney - totalPrice;
        changeAmountElement.textContent = `K${change.toFixed(2)}`;
    });

<<<<<<< HEAD
    // Checkout
=======
>>>>>>> 76e1701 (Trying to put offline)
    checkoutButton.addEventListener("click", async () => {
        const transactionDate = new Date().toISOString();

        for (const item of cart) {
            const transaction = {
                action: "logTransaction",
                data: {
                    Barcode: item.barcode,
                    ProductName: item.name,
                    Quantity: item.quantity,
                    UnitPrice: item.price,
                    TotalPrice: item.quantity * item.price,
                    TransactionDate: transactionDate,
                },
            };
<<<<<<< HEAD
            await sendTransaction(transaction);
        }

        alert(`Transaction complete. Total: K${totalPrice.toFixed(2)}.`);
        cart = [];
        renderCart();
        receivedMoneyInput.value = "";
        changeAmountElement.textContent = "K0.00";
    });

    // Send Transaction Data
    async function sendTransaction(transaction) {
        try {
            const response = await fetch(webAppUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(transaction),
            });

            const result = await response.json();
            if (result.status !== "success") {
                console.error("Transaction failed:", result.message);
            }
        } catch (error) {
            console.error("Error sending transaction:", error.message);
        }
    }

    // Scan Mode
    scanModeButton.addEventListener("click", () => {
        scannerSection.classList.remove("hidden");
        inventoryForm.classList.add("hidden");

        if (!scanner) {
            scanner = new Html5QrcodeScanner("scanner", { fps: 20, qrbox: { width: 200, height: 200 } });
            scanner.render(
                async (decodedText) => {
                    scanResult.textContent = `Scanned: ${decodedText}`;
                    const barcode = cleanBarcode(decodedText);
                    const product = inventoryData.find(item => item.Barcode === barcode);
                    if (product) {
                        await addProductToCart(product);
                    } else {
                        alert("Product not found.");
                    }
                },
                (error) => console.warn("Scanning failed:", error)
            );
        }
    });

    // Handle Inventory Form Submission
    inventoryForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const item = {
            Barcode: document.getElementById("barcode").value || "Manual Entry",
            ProductName: document.getElementById("productName").value,
            Quantity: parseInt(document.getElementById("quantity").value, 10),
            UnitPrice: parseFloat(document.getElementById("price").value),
        };

        cart.push({
            barcode: item.Barcode,
            name: item.ProductName,
            quantity: item.Quantity,
            price: item.UnitPrice,
        });

        await updateInventory(item);
        renderCart();
        inventoryForm.reset();
    });

    // Initialize
=======
            await sendTransactionData(transaction);
        }

        alert(`Transaction Complete. Total Price: K${totalPrice.toFixed(2)}.`);
        cart = [];
        renderCart();
    });
    async function sendTransactionData(transaction) {
        try {
            const response = await fetch(webAppUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transaction),
            });
    
            const result = await response.json();
            if (result.status !== "success") {
                console.error("Error saving transaction:", result.message);
                alert(`Error saving transaction: ${result.message}`);
            } else {
                console.log("Transaction successfully recorded:", result);
            }
        } catch (error) {
            console.error("Error sending transaction data:", error.message);
            alert("Failed to record transaction. Please check your network or server configuration.");
        }
    }
    

    // IndexedDB Management
    const dbName = "POSInventoryDB";

    function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("inventory")) {
                    db.createObjectStore("inventory", { keyPath: "Barcode" });
                }
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.errorCode);
        });
    }

    // Initialize Inventory
>>>>>>> 76e1701 (Trying to put offline)
    loadInventoryData();
});
