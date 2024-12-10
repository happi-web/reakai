if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/reakai/sw.js')
        .then(() => console.log('Service Worker registered successfully.'))
        .catch(err => console.error('Service Worker registration failed:', err));
}

const webAppUrl = "https://script.google.com/macros/s/AKfycbz9RnYSgXLE4UW-Sn_jw9y1hv1J3mHcv3nOiEv0QOt1ZWcEooD15HPBcd5RPPx3Aveg/exec";

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

    let scanner;
    let cart = [];
    let totalPrice = 0;
    let inventoryData = [];

    async function loadInventoryData() {
        try {
            const isOnline = navigator.onLine; // Check network status
            if (isOnline) {
                const response = await fetch(`${webAppUrl}?action=getInventory`);
                if (!response.ok) throw new Error(`Failed to fetch inventory data: ${response.status}`);
                const result = await response.json();
                inventoryData = result.inventory.map(item => ({
                    Barcode: cleanBarcode(item.Barcode),
                    ProductName: item["Product Name"],
                    UnitPrice: parseFloat(item["Unit Price"]),
                    Quantity: parseInt(item.Quantity, 10),
                    // Other fields...
                }));
                saveToIndexedDB('inventory', inventoryData); // Save to IndexedDB
            } else {
                console.log("Offline. Fetching data from IndexedDB...");
                inventoryData = await getAllFromIndexedDB('inventory');
            }
        } catch (error) {
            console.error("Error loading inventory data:", error.message);
        }
    }
    
    
    // Helper function to clean the barcode data
    function cleanBarcode(barcode) {
        if (typeof barcode !== 'string') {
            // If barcode is not a string, convert it to string (if it's a number, boolean, etc.)
            barcode = String(barcode);
        }
        return barcode.trim();  // Now you can safely trim the string
    }
    
    
    // Utility: Clean Barcode
    function cleanBarcode(barcode) {
        return String(barcode).trim();
    }

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

    product.QuantityChange = quantity; // Store the change separately
    product.Quantity -= quantity; // Update local inventory

    await updateInventory(product);

    if (product.Quantity <= 5) {
        alert(`Low stock alert for ${product.ProductName}! Remaining: ${product.Quantity}`);
    }

    renderCart();
    }
    
// Update Inventory on Server
async function updateInventory(product) {
    try {
        if (navigator.onLine) {
            const response = await fetch(webAppUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "processBarcode", data: product }),
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
        } else {
            console.log("Offline. Saving inventory update to IndexedDB...");
            await saveToIndexedDB('inventory', [product]); // Save locally
        }
    } catch (error) {
        console.error("Error updating inventory:", error.message);
    }
}

    // Render Cart
    function renderCart() {
        cartItems.innerHTML = "";
        cart.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.barcode}</td>
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

    // Update Total Price
    function updateTotalPrice() {
        totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        totalPriceElement.textContent = `K${totalPrice.toFixed(2)}`;
    }

    // Remove Item from Cart
    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    // Calculate Change
    calculateChangeButton.addEventListener("click", () => {
        const receivedMoney = parseFloat(receivedMoneyInput.value);
        if (isNaN(receivedMoney) || receivedMoney < totalPrice) {
            alert("Received amount must be greater than or equal to the total price.");
            return;
        }
        const change = receivedMoney - totalPrice;
        changeAmountElement.textContent = `K${change.toFixed(2)}`;
    });

    // Checkout
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
            if (navigator.onLine) {
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(transaction),
                });
                if (!response.ok) throw new Error(`Server error: ${response.status}`);
            } else {
                console.log("Offline. Saving transaction to IndexedDB...");
                await saveToIndexedDB('transactions', [transaction]); // Save locally
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

// Handle Barcode Search
document.getElementById("barcode").addEventListener("input", (e) => {
    const barcode = e.target.value.trim();
    const product = inventoryData.find(item => item.Barcode === barcode);

    if (product) {
        document.getElementById("productName").value = product.ProductName;
        document.getElementById("price").value = product.UnitPrice.toFixed(2);
        document.getElementById("productName").disabled = true;
        document.getElementById("price").disabled = true;
    } else {
        document.getElementById("productName").value = "";
        document.getElementById("price").value = "";
        document.getElementById("productName").disabled = false;
        document.getElementById("price").disabled = false;
    }
});



// Handle Inventory Form Submission
inventoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const barcode = document.getElementById("barcode").value.trim();
    const productName = document.getElementById("productName").value;
    const quantity = parseInt(document.getElementById("quantity").value, 10);
    const price = parseFloat(document.getElementById("price").value);

    if (isNaN(quantity) || quantity <= 0) {
        alert("Please enter a valid quantity.");
        return;
    }

    let item = {
        Barcode: barcode || "Manual Entry",
        ProductName: productName,
        Quantity: quantity,
        UnitPrice: price,
    };

    const existingProduct = inventoryData.find(p => p.Barcode === item.Barcode);

    // If the barcode is not found in the inventory, and it's manually entered, allow manual entry of all fields
    if (!existingProduct && barcode) {
        alert("Barcode not found! Please enter all product details manually.");
    }

    // Check stock for existing product if barcode matches
    if (existingProduct && item.Quantity > existingProduct.Quantity) {
        alert(`Insufficient stock for ${item.ProductName}! Available: ${existingProduct.Quantity}.`);

        const newQuantity = prompt(
            `Enter a smaller quantity for ${item.ProductName} (Max: ${existingProduct.Quantity}):`
        );

        const parsedQuantity = parseInt(newQuantity, 10);
        if (!parsedQuantity || parsedQuantity <= 0 || parsedQuantity > existingProduct.Quantity) {
            alert("Invalid quantity. Operation canceled.");
            inventoryForm.reset();
            return;
        }

        item.Quantity = parsedQuantity; // Adjust to valid input
    }

    // Add product to cart
    cart.push({
        barcode: item.Barcode,
        name: item.ProductName,
        quantity: item.Quantity,
        price: item.UnitPrice,
    });

    // Update inventory
    if (existingProduct) {
        existingProduct.Quantity -= item.Quantity;
        await updateInventory(existingProduct);
    } else {
        await updateInventory(item); // For new manual entries
    }

    renderCart();
    inventoryForm.reset();
});


    // Initialize
    loadInventoryData();
});