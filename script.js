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

    async function loadInventoryData() {
        try {
            const response = await fetch(`${webAppUrl}?action=getInventory`);
            if (!response.ok) throw new Error(`Failed to fetch inventory data. Status: ${response.status}`);

            const result = await response.json();
            if (Array.isArray(result)) {
                inventoryData = result.map(item => ({
                    Barcode: cleanBarcode(item.Barcode),
                    ProductName: item["Product Name"],
                    UnitPrice: parseFloat(item["Unit Price"]),
                    Quantity: parseInt(item.Quantity, 10),
                    Category: item.Category,
                    Supplier: item.Supplier,
                    ExpiringDate: item["Expiring Date"],
                    CostPrice: parseFloat(item["Cost Price"] || "0"),
                }));
            } else if (result.status === "success" && Array.isArray(result.inventory)) {
                inventoryData = result.inventory.map(item => ({
                    Barcode: cleanBarcode(item.Barcode),
                    ProductName: item["Product Name"],
                    UnitPrice: parseFloat(item["Unit Price"]),
                    Quantity: parseInt(item.Quantity, 10),
                    Category: item.Category,
                    Supplier: item.Supplier,
                    ExpiringDate: item["Expiring Date"],
                    CostPrice: parseFloat(item["Cost Price"] || "0"),
                }));
                
            } else {
                throw new Error(`Unexpected response format: ${JSON.stringify(result)}`);
            }
        } catch (error) {
            console.error("Error loading inventory data:", error.message);
        }
    }

    function cleanBarcode(barcode) {
        return String(barcode).trim();
    }

    function updateTotalPrice() {
        totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        totalPriceElement.textContent = `K${totalPrice.toFixed(2)}`;
    }

    function renderCart() {
        cartItems.innerHTML = "";
        cart.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.barcode || "N/A"}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>K${item.price.toFixed(2)}</td>
                <td>K${(item.quantity * item.price).toFixed(2)}</td>
                <td class="actions">
                    <button onclick="removeFromCart(${index})">Remove</button>
                </td>
            `;
            cartItems.appendChild(row);
        });
        updateTotalPrice();
    }

    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    async function addToCartWithQuantity(product) {
        const enteredQuantity = parseInt(prompt(`Enter quantity for ${product.ProductName} (Stock: ${product.Quantity}):`), 10);
        enteredQuantity.setAttribute("font-size:18px; color: blue");

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
            alert(`Low stock alert for ${product.ProductName}! Remaining quantity: ${product.Quantity}`);
        }

        renderCart();
    }

    async function updateInventoryOnServer(inventoryData) {
        try {
            const response = await fetch(webAppUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(inventoryData),
                mode: 'cors',
            });

            if (!response.ok) throw new Error(`Server error! Status: ${response.status}`);
            const result = await response.json();
            console.log("Server Response:", result);
        } catch (error) {
            console.error("Error updating inventory:", error);
        }
    }

    document.querySelector("#inventoryList").addEventListener("submit", function (e) {
        e.preventDefault();
        const inventoryData = {
            timestamp: new Date().toISOString(),
            barcode: document.querySelector("#barcode").value,
            productName: document.querySelector("#product-name").value,
            unitPrice: document.querySelector("#unit-price").value,
            category: document.querySelector("#category").value,
            quantity: document.querySelector("#quantity").value,
            supplier: document.querySelector("#supplier").value,
            expiringDate: document.querySelector("#expiring-date").value,
            costPrice: document.querySelector("#cost-price").value,
        };

        updateInventoryOnServer(inventoryData);
    });

    scanModeButton.addEventListener("click", () => {
        scannerSection.classList.remove("hidden");
        inventoryForm.classList.add("hidden");
        if (!scanner) {
            scanner = new Html5QrcodeScanner("scanner", { fps: 50, qrbox: 500 });
        }
        scanner.render(
            async (decodedText) => {
                scanResult.innerText = `Scanned: ${decodedText}`;
                const cleanedBarcode = cleanBarcode(decodedText);
                const product = inventoryData.find((p) => p.Barcode === cleanedBarcode);
                if (product) {
                    await addToCartWithQuantity(product);
                } else {
                    alert("Product not found in inventory.");
                }
                scanner.clear();
            },
            (error) => {
                scanResult.innerText = `Error: ${error}`;
            }
        );
    });

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

        await updateInventoryOnServer(item);

        renderCart();
        inventoryForm.reset();
    });

    calculateChangeButton.addEventListener("click", () => {
        const receivedMoney = parseFloat(receivedMoneyInput.value);
        if (isNaN(receivedMoney) || receivedMoney < totalPrice) {
            alert("The amount received must be greater than or equal to the total price.");
            return;
        }
        const change = receivedMoney - totalPrice;
        changeAmountElement.textContent = `K${change.toFixed(2)}`;
    });

    checkoutButton.addEventListener("click", () => {
        console.log("Cart at checkout:", cart); // Log cart contents
        const transactionDate = new Date().toISOString();
    
        cart.forEach(async (item) => {
            const transaction = {
                action: "logTransaction",
                data: {
                    Barcode: item.barcode,
                    ProductName: item.name, // Ensure correct property
                    Quantity: item.quantity,
                    UnitPrice: item.price, // Ensure correct property
                    TotalPrice: item.quantity * item.price,
                    TransactionDate: transactionDate,
                },
            };
    
            console.log("Transaction being sent to backend:", transaction); // Log transaction data
            await sendTransactionData(transaction);
        });
    
        alert(`Transaction Complete. Total Price: K${totalPrice.toFixed(2)}.`);
        cart = [];
        renderCart();
        changeAmountElement.textContent = "K0.00";
        receivedMoneyInput.value = "";
    });
    
    

    loadInventoryData();
});

async function sendTransactionData(transaction) {
    try {
        const response = await fetch(webAppUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(transaction),
        });

        const data = await response.json();
        console.log("Server response:", data); // Log server response
        if (data.status !== "success") {
            console.error("Error saving transaction:", data.message);
        } else {
            console.log("Successfully recorded the information");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
