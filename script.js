// const webAppUrl = "https://script.google.com/macros/s/AKfycbwtB1MZtsSbFjAzWhx72ZTq1JpWucgso07N-joNEf25fQBHpl_y6501Aq0034s7dYwr/exec";

// document.addEventListener("DOMContentLoaded", () => {
//     const scannerSection = document.getElementById("scannerSection");
//     const inventoryForm = document.getElementById("inventoryForm");
//     const cartItems = document.getElementById("cartItems");
//     const totalPriceElement = document.getElementById("totalPrice");
//     const scanResult = document.getElementById("scanResult");
//     const checkoutButton = document.getElementById("checkout");
//     const receivedMoneyInput = document.getElementById("receivedMoney");
//     const changeAmountElement = document.getElementById("changeAmount");
//     const calculateChangeButton = document.getElementById("calculateChange");
//     const scanModeButton = document.getElementById("scanMode");

//     let scanner;
//     let cart = [];
//     let totalPrice = 0;
//     let inventoryData = [];

//     // Load inventory data
//     async function loadInventoryData() {
//         try {
//             const response = await fetch(`${webAppUrl}?action=getInventory`);
//             if (!response.ok) throw new Error(`Failed to fetch inventory data. Status: ${response.status}`);

//             const result = await response.json();
//             inventoryData = (Array.isArray(result.inventory) ? result.inventory : result).map(item => ({
//                 Barcode: cleanBarcode(item.Barcode),
//                 ProductName: item["Product Name"],
//                 UnitPrice: parseFloat(item["Unit Price"]),
//                 Quantity: parseInt(item.Quantity, 10),
//                 Category: item.Category,
//                 Supplier: item.Supplier,
//                 ExpiringDate: item["Expiring Date"],
//                 CostPrice: parseFloat(item["Cost Price"] || "0"),
//             }));
//         } catch (error) {
//             console.error("Error loading inventory data:", error.message);
//         }
//     }

//     // Clean barcode
//     function cleanBarcode(barcode) {
//         return String(barcode).trim();
//     }

//     // Update total price
//     function updateTotalPrice() {
//         totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
//         totalPriceElement.textContent = `K${totalPrice.toFixed(2)}`;
//     }

//     // Render cart
//     function renderCart() {
//         cartItems.innerHTML = "";
//         cart.forEach((item, index) => {
//             const row = document.createElement("tr");
//             row.innerHTML = `
//                 <td>${item.barcode || "N/A"}</td>
//                 <td>${item.name}</td>
//                 <td>${item.quantity}</td>
//                 <td>K${item.price.toFixed(2)}</td>
//                 <td>K${(item.quantity * item.price).toFixed(2)}</td>
//                 <td><button onclick="removeFromCart(${index})">Remove</button></td>
//             `;
//             cartItems.appendChild(row);
//         });
//         updateTotalPrice();
//     }

//     // Remove item from cart
//     window.removeFromCart = (index) => {
//         cart.splice(index, 1);
//         renderCart();
//     };

//     // Add to cart
//     async function addToCartWithQuantity(product) {
//         const enteredQuantity = parseInt(prompt(`Enter quantity for ${product.ProductName} (Stock: ${product.Quantity}):`), 10);

//         if (isNaN(enteredQuantity) || enteredQuantity <= 0) {
//             alert("Please enter a valid quantity.");
//             return;
//         }

//         if (enteredQuantity > product.Quantity) {
//             alert(`Not enough stock! Available quantity: ${product.Quantity}`);
//             return;
//         }

//         cart.push({
//             barcode: product.Barcode,
//             name: product.ProductName,
//             quantity: enteredQuantity,
//             price: product.UnitPrice,
//         });

//         product.Quantity -= enteredQuantity;
//         await updateInventoryOnServer(product);

//         if (product.Quantity <= 5) {
//             alert(`Low stock alert for ${product.ProductName}! Remaining quantity: ${product.Quantity}`);
//         }

//         renderCart();
//     }

//     // Update inventory on server
//     async function updateInventoryOnServer(data) {
//         try {
//             const response = await fetch(webAppUrl, {
//                 method: "POST",
//                 headers: { "Content-Type": "text/plain;charset=utf-8" },
//                 body: JSON.stringify(data),
//             });

//             if (!response.ok) throw new Error(`Server error! Status: ${response.status}`);
//             const result = await response.json();
//             console.log("Server Response:", result);
//         } catch (error) {
//             console.error("Error updating inventory:", error.message);
//         }
//     }

//     // Handle scan mode
//     scanModeButton.addEventListener("click", () => {
//         scannerSection.classList.remove("hidden");
//         inventoryForm.classList.add("hidden");
    
//         if (!scanner) {
//             scanner = new Html5QrcodeScanner("scanner", { fps: 50, qrbox: 800 });
            
//             // Define a persistent scanner session
//             scanner.render(async (decodedText) => {
//                 scanResult.textContent = `Scanned: ${decodedText}`;
//                 const cleanedBarcode = cleanBarcode(decodedText);
//                 const product = inventoryData.find(item => item.Barcode === cleanedBarcode);
    
//                 if (product) {
//                     await addScannedProductToCart(product); // Add scanned product to cart
//                 } else {
//                     alert("Product not found in inventory.");
//                 }
//             });
//         }
//     });
    
//     // Add scanned product to cart with quantity adjustment
//     async function addScannedProductToCart(product) {
//         const existingCartItem = cart.find(item => item.barcode === product.Barcode);
    
//         if (existingCartItem) {
//             // Update quantity if the product already exists in the cart
//             if (existingCartItem.quantity + 1 > product.Quantity) {
//                 alert(`Not enough stock! Available quantity: ${product.Quantity}`);
//                 return;
//             }
    
//             existingCartItem.quantity += 1;
//         } else {
//             // Add a new item to the cart
//             if (product.Quantity <= 0) {
//                 alert(`No stock available for ${product.ProductName}.`);
//                 return;
//             }
    
//             cart.push({
//                 barcode: product.Barcode,
//                 name: product.ProductName,
//                 quantity: 1,
//                 price: product.UnitPrice,
//             });
//         }
    
//         // Update stock in the inventory
//         product.Quantity -= 1;
//         await updateInventoryOnServer(product);
    
//         if (product.Quantity <= 5) {
//             alert(`Low stock alert for ${product.ProductName}! Remaining quantity: ${product.Quantity}`);
//         }
    
//         renderCart();
//     }    

//     // Handle inventory form submission
//     inventoryForm.addEventListener("submit", async (e) => {
//         e.preventDefault();
//         const item = {
//             Barcode: document.getElementById("barcode").value || "Manual Entry",
//             ProductName: document.getElementById("productName").value,
//             Quantity: parseInt(document.getElementById("quantity").value, 10),
//             UnitPrice: parseFloat(document.getElementById("price").value),
//         };

//         cart.push({
//             barcode: item.Barcode,
//             name: item.ProductName,
//             quantity: item.Quantity,
//             price: item.UnitPrice,
//         });

//         await updateInventoryOnServer(item);
//         renderCart();
//         inventoryForm.reset();
//     });

//     // Calculate change
//     calculateChangeButton.addEventListener("click", () => {
//         const receivedMoney = parseFloat(receivedMoneyInput.value);
//         if (isNaN(receivedMoney) || receivedMoney < totalPrice) {
//             alert("The amount received must be greater than or equal to the total price.");
//             return;
//         }
//         const change = receivedMoney - totalPrice;
//         changeAmountElement.textContent = `K${change.toFixed(2)}`;
//     });

//     // Checkout
//     checkoutButton.addEventListener("click", async () => {
//         const transactionDate = new Date().toISOString();

//         for (const item of cart) {
//             const transaction = {
//                 action: "logTransaction",
//                 data: {
//                     Barcode: item.barcode,
//                     ProductName: item.name,
//                     Quantity: item.quantity,
//                     UnitPrice: item.price,
//                     TotalPrice: item.quantity * item.price,
//                     TransactionDate: transactionDate,
//                 },
//             };
//             await sendTransactionData(transaction);
//         }

//         alert(`Transaction Complete. Total Price: K${totalPrice.toFixed(2)}.`);
//         cart = [];
//         renderCart();
//         receivedMoneyInput.value = "";
//         changeAmountElement.textContent = "K0.00";
//     });

//     // Send transaction data
//     async function sendTransactionData(transaction) {
//         try {
//             const response = await fetch(webAppUrl, {
//                 method: "POST",
//                 headers: { "Content-Type": "text/plain;charset=utf-8" },
//                 body: JSON.stringify(transaction),
//             });

//             const result = await response.json();
//             if (result.status !== "success") {
//                 console.error("Error saving transaction:", result.message);
//             } else {
//                 console.log("Transaction successfully recorded.");
//             }
//         } catch (error) {
//             console.error("Error:", error.message);
//         }
//     }

//     // Initialize
//     loadInventoryData();
// });


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

    // Load inventory data
    async function loadInventoryData() {
        try {
            const response = await fetch(`${webAppUrl}?action=getInventory`);
            if (!response.ok) throw new Error(`Failed to fetch inventory data. Status: ${response.status}`);

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

    // Clean barcode
    function cleanBarcode(barcode) {
        return String(barcode).trim();
    }

    // Update total price
    function updateTotalPrice() {
        totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        totalPriceElement.textContent = `K${totalPrice.toFixed(2)}`;
    }

    // Render cart
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

    // Add to cart
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
            alert(`Low stock alert for ${product.ProductName}! Remaining quantity: ${product.Quantity}`);
        }

        renderCart();
    }

    // Update inventory on server
    async function updateInventoryOnServer(data) {
        try {
            const response = await fetch(webAppUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error(`Server error! Status: ${response.status}`);
            const result = await response.json();
            console.log("Server Response:", result);
        } catch (error) {
            console.error("Error updating inventory:", error.message);
        }
    }

    // Handle scan mode
    scanModeButton.addEventListener("click", () => {
        scannerSection.classList.remove("hidden");
        inventoryForm.classList.add("hidden");

        if (!scanner) {
            scanner = new Html5QrcodeScanner("scanner", { fps: 10, qrbox: 250 });
            scanner.render(decodedText => {
                scanResult.textContent = `Scanned: ${decodedText}`;
                const product = inventoryData.find(item => item.Barcode === cleanBarcode(decodedText));

                if (product) {
                    addToCartWithQuantity(product);
                } else {
                    alert("Product not found in inventory.");
                }
                scanner.clear();
            });
        }
    });

    // Handle inventory form submission
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

    // Calculate change
    calculateChangeButton.addEventListener("click", () => {
        const receivedMoney = parseFloat(receivedMoneyInput.value);
        if (isNaN(receivedMoney) || receivedMoney < totalPrice) {
            alert("The amount received must be greater than or equal to the total price.");
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
            await sendTransactionData(transaction);
        }

        alert(`Transaction Complete. Total Price: K${totalPrice.toFixed(2)}.`);
        cart = [];
        renderCart();
        receivedMoneyInput.value = "";
        changeAmountElement.textContent = "K0.00";
    });

    // Send transaction data
    async function sendTransactionData(transaction) {
        try {
            const response = await fetch(webAppUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(transaction),
            });

            const result = await response.json();
            if (result.status !== "success") {
                console.error("Error saving transaction:", result.message);
            } else {
                console.log("Transaction successfully recorded.");
            }
        } catch (error) {
            console.error("Error:", error.message);
        }
    }

    // Initialize
    loadInventoryData();
});
