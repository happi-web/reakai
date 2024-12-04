const webAppUrl = "https://script.google.com/macros/s/AKfycbwtB1MZtsSbFjAzWhx72ZTq1JpWucgso07N-joNEf25fQBHpl_y6501Aq0034s7dYwr/exec";

document.addEventListener("DOMContentLoaded", () => {
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

    // Load inventory from server
    async function loadInventoryData() {
        try {
            const response = await fetch(`${webAppUrl}?action=getInventory`);
            if (!response.ok) throw new Error(`Failed to fetch inventory. Status: ${response.status}`);
            const result = await response.json();
            inventoryData = Array.isArray(result) ? result : result.inventory || [];
            inventoryData = inventoryData.map(item => ({
                Barcode: item.Barcode.trim(),
                ProductName: item["Product Name"],
                UnitPrice: parseFloat(item["Unit Price"]),
                Quantity: parseInt(item.Quantity, 10),
                Category: item.Category,
                Supplier: item.Supplier,
                ExpiringDate: item["Expiring Date"],
                CostPrice: parseFloat(item["Cost Price"] || 0),
            }));
        } catch (error) {
            console.error("Error loading inventory:", error);
        }
    }

    // Add product to cart with quantity prompt
    async function addToCartWithQuantity(product) {
        const enteredQuantity = parseInt(prompt(`Enter quantity for ${product.ProductName} (Stock: ${product.Quantity}):`), 10);

        if (isNaN(enteredQuantity) || enteredQuantity <= 0) {
            alert("Please enter a valid quantity.");
            return;
        }
        if (enteredQuantity > product.Quantity) {
            alert(`Not enough stock! Available quantity: ${product.Quantity}`);
            return;
        }

        cart.push({
            barcode: product.Barcode,
            name: product.ProductName,
            quantity: enteredQuantity,
            price: product.UnitPrice,
        });

        product.Quantity -= enteredQuantity;
        await updateInventoryOnServer(product);

        if (product.Quantity <= 5) {
            alert(`Low stock alert for ${product.ProductName}! Remaining: ${product.Quantity}`);
        }

        renderCart();
    }

    // Render the cart on the UI
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

    // Remove item from cart
    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    // Update the total price
    function updateTotalPrice() {
        totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        totalPriceElement.textContent = `K${totalPrice.toFixed(2)}`;
    }

// Clean and normalize barcodes for consistent comparison
function cleanBarcode(barcode) {
    return String(barcode).trim().replace(/\s+/g, "").toLowerCase();
}

// Scan mode logic
scanModeButton.addEventListener("click", () => {
    scannerSection.classList.remove("hidden");
    inventoryForm.classList.add("hidden");

    if (!scanner) {
        scanner = new Html5QrcodeScanner("scanner", { fps: 50, qrbox: 500 });
    }

    scanner.render(
        async (decodedText) => {
            const cleanedBarcode = cleanBarcode(decodedText);
            console.log(`Scanned Barcode: ${cleanedBarcode}`); // Debug log

            const product = inventoryData.find((p) => cleanBarcode(p.Barcode) === cleanedBarcode);

            if (product) {
                console.log(`Product found: ${product.ProductName}`); // Debug log
                await addToCartWithQuantity(product);
            } else {
                console.error(`Product not found for barcode: ${cleanedBarcode}`); // Debug log
                alert("Product not found in inventory. Please check the barcode.");
            }

            scanner.clear();
        },
        (error) => {
            console.error("Scan error:", error);
        }
    );
});

    

    // Update inventory on the server
    async function updateInventoryOnServer(product) {
        try {
            const response = await fetch(webAppUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "updateInventory", product }),
            });
            if (!response.ok) throw new Error(`Server error! Status: ${response.status}`);
            const result = await response.json();
            if (result.status !== "success") {
                alert("Failed to update inventory on server.");
            }
        } catch (error) {
            console.error("Error updating inventory:", error);
        }
    }

    // Checkout and log transactions
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
            await sendTransactionData(transaction);
        }
        alert(`Transaction Complete. Total Price: K${totalPrice.toFixed(2)}.`);
        cart = [];
        renderCart();
        receivedMoneyInput.value = "";
        changeAmountElement.textContent = "K0.00";
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
            }
        } catch (error) {
            console.error("Error logging transaction:", error);
        }
    }

    // Scan mode logic
    // scanModeButton.addEventListener("click", () => {
    //     scannerSection.classList.remove("hidden");
    //     inventoryForm.classList.add("hidden");
    //     if (!scanner) {
    //         scanner = new Html5QrcodeScanner("scanner", { fps: 50, qrbox: 500 });
    //     }
    //     scanner.render(
    //         async (decodedText) => {
    //             const cleanedBarcode = decodedText.trim();
    //             const product = inventoryData.find((p) => p.Barcode === cleanedBarcode);
    //             if (product) {
    //                 await addToCartWithQuantity(product);
    //             } else {
    //                 alert("Product not found in inventory.");
    //             }
    //             scanner.clear();
    //         },
    //         (error) => {
    //             console.error("Scan error:", error);
    //         }
    //     );
    // });

    loadInventoryData();
});