const webAppUrl = "https://script.google.com/macros/s/AKfycbwYlsh-YcM046Y3XTobPCVOlJflbp-jSPTERUwq68q7V_PIrKZytvYUkIM8nO_KA52B/exec";

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const elements = {
        scannerSection: document.getElementById("scannerSection"),
        inventoryForm: document.getElementById("inventoryForm"),
        cartItems: document.getElementById("cartItems"),
        totalPrice: document.getElementById("totalPrice"),
        scanResult: document.getElementById("scanResult"),
        checkoutButton: document.getElementById("checkout"),
        receivedMoney: document.getElementById("receivedMoney"),
        changeAmount: document.getElementById("changeAmount"),
        calculateChangeButton: document.getElementById("calculateChange"),
        scanModeButton: document.getElementById("scanMode"),
        manualModeButton: document.getElementById("manualMode"),
    };
scanModeButton.style.color = "red";
    // Global Variables
    let scanner;
    let cart = [];
    let totalPrice = 0;
    let inventoryData = [];

    // Helper Functions
    const openDatabase = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("POSInventoryDB", 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("inventory")) {
                    db.createObjectStore("inventory", { keyPath: "Barcode" });
                }
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.errorCode);
        });
    };

    const updateTotalPrice = () => {
        totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        elements.totalPrice.textContent = `K${totalPrice.toFixed(2)}`;
    };

    const renderCart = () => {
        elements.cartItems.innerHTML = "";
        cart.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.barcode || "N/A"}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>K${item.price.toFixed(2)}</td>
                <td>K${(item.quantity * item.price).toFixed(2)}</td>
                <td><button onclick="removeFromCart(${index})">Remove</button></td>
            `;
            elements.cartItems.appendChild(row);
        });
        updateTotalPrice();
    };

    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    const syncInventoryToLocal = async () => {
        try {
            const response = await fetch(`${webAppUrl}?action=getInventory`);
            const result = await response.json();
            const inventory = Array.isArray(result.inventory) ? result.inventory : [];

            const db = await openDatabase();
            const transaction = db.transaction("inventory", "readwrite");
            const store = transaction.objectStore("inventory");

            inventory.forEach(item => store.put(item));
            console.log("Inventory synced to IndexedDB.");
        } catch (error) {
            console.error("Error syncing inventory:", error.message);
        }
    };

    const getInventoryFromLocal = () => {
        return new Promise((resolve, reject) => {
            openDatabase().then(db => {
                const transaction = db.transaction("inventory", "readonly");
                const store = transaction.objectStore("inventory");
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = event => reject(event.target.errorCode);
            });
        });
    };

    const loadInventoryData = async () => {
        if (navigator.onLine) {
            await syncInventoryToLocal();
        } else {
            inventoryData = await getInventoryFromLocal();
            console.log("Loaded inventory from IndexedDB.");
        }
    };

    const addToCartWithQuantity = async (product) => {
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
    };

    const updateInventoryOnServer = async (data) => {
        try {
            const response = await fetch(webAppUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "updateInventory", data }),
            });

            const result = await response.json();
            if (result.status !== "success") {
                console.error("Server error:", result.message);
                alert(`Error updating inventory: ${result.message}`);
            }
        } catch (error) {
            console.error("Error updating inventory:", error.message);
            alert("Failed to update inventory. Check your connection or server status.");
        }
    };

    const sendTransactionData = async (transaction) => {
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
            }
        } catch (error) {
            console.error("Error sending transaction data:", error.message);
            alert("Failed to record transaction. Please check your network or server configuration.");
        }
    };

    // Event Listeners
    elements.manualModeButton.addEventListener("click", () => {
        elements.scannerSection.classList.add("hidden");
        elements.inventoryForm.classList.remove("hidden");
    });

    elements.inventoryForm.addEventListener("submit", async (event) => {
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
            Barcode: barcodeInput || null,
            ProductName: productName,
            Quantity: quantity,
            UnitPrice: price,
        };

        inventoryData.push(newProduct);
        const db = await openDatabase();
        const transaction = db.transaction("inventory", "readwrite");
        transaction.objectStore("inventory").put(newProduct);

        alert(`${productName} added to inventory successfully.`);
        elements.inventoryForm.reset();
        renderCart();
    });

    elements.calculateChangeButton.addEventListener("click", () => {
        const receivedMoney = parseFloat(elements.receivedMoney.value);
        if (isNaN(receivedMoney) || receivedMoney < totalPrice) {
            alert("The amount received must be greater than or equal to the total price.");
            return;
        }
        const change = receivedMoney - totalPrice;
        elements.changeAmount.textContent = `K${change.toFixed(2)}`;
    });

    elements.checkoutButton.addEventListener("click", async () => {
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
            await sendTransactionData(transaction);
        }

        alert(`Transaction Complete. Total Price: K${totalPrice.toFixed(2)}.`);
        cart = [];
        renderCart();
    });

    elements.scanModeButton.addEventListener("click", () => {
        elements.scannerSection.classList.remove("hidden");
        elements.inventoryForm.classList.add("hidden");

        if (!scanner) {
            scanner = new Html5QrcodeScanner("scanner", { fps: 10, qrbox: { width: 200, height: 200 } });

            scanner.render(
                async (decodedText) => {
                    const cleanedBarcode = decodedText.trim();
                    const product = inventoryData.find(item => item.Barcode === cleanedBarcode);

                    if (product) {
                        await addToCartWithQuantity(product);
                    } else {
                        alert("Product not found in inventory.");
                    }
                },
                (error) => console.warn(`Scanning failed: ${error.message || error}`)
            );
        }
    });

    // Initialize Inventory
    loadInventoryData();
});
