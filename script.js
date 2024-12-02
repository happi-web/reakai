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
    let inventoryData = []; // Holds inventory data

    // Load Inventory Data from Excel file
    function loadInventoryData() {
        const fileUrl = "reakai.xlsx"; // Path to inventory file

        fetch(fileUrl)
            .then(response => response.arrayBuffer())
            .then(data => {
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const sheetData = XLSX.utils.sheet_to_json(sheet);

                inventoryData = sheetData.map(item => ({
                    Barcode: cleanBarcode(item.Barcode.toString()),
                    ProductName: item["Product Name"],
                    UnitPrice: parseFloat(item["Unit Price"]),
                    Quantity: parseInt(item["Quantity"], 10),
                }));

                console.log("Inventory Data Loaded:", inventoryData);
            })
            .catch(error => console.error("Error loading inventory file:", error));
    }

    // Normalize barcodes
    function cleanBarcode(barcode) {
        return typeof barcode === "string" ? barcode.trim() : String(barcode).trim();
    }

    // Update Total Price
    function updateTotalPrice() {
        totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        totalPriceElement.textContent = totalPrice.toFixed(2);
    }

    // Render Cart
    function renderCart() {
        cartItems.innerHTML = "";
        cart.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.barcode || "N/A"}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.quantity * item.price).toFixed(2)}</td>
                <td class="actions">
                    <button onclick="removeFromCart(${index})">Remove</button>
                </td>
            `;
            cartItems.appendChild(row);
        });
        updateTotalPrice();
    }

    // Remove Item from Cart
    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    // Add to Cart with Quantity Prompt and Inventory Update
    function addToCartWithQuantity(product) {
        const enteredQuantity = parseInt(
            prompt(`Enter quantity for ${product.ProductName} (Stock: ${product.Quantity}):`),
            10
        );

        if (isNaN(enteredQuantity) || enteredQuantity <= 0) {
            alert("Please enter a valid quantity.");
            return;
        }

        if (enteredQuantity > product.Quantity) {
            alert(`Not enough stock! Available quantity: ${product.Quantity}`);
            return;
        }

        // Add to cart
        cart.push({
            barcode: product.Barcode,
            name: product.ProductName,
            quantity: enteredQuantity,
            price: product.UnitPrice,
        });

        // Update inventory quantity
        product.Quantity -= enteredQuantity;

        // Notify if stock is low
        if (product.Quantity <= 5) {
            alert(`Low stock alert for ${product.ProductName}! Remaining quantity: ${product.Quantity}`);
        }

        renderCart();
    }

    // Scan Mode
    scanModeButton.addEventListener("click", () => {
        scannerSection.classList.remove("hidden");
        inventoryForm.classList.add("hidden");
        if (!scanner) {
            scanner = new Html5QrcodeScanner("scanner", { fps: 50, qrbox: 800 });
        }
        scanner.render(
            (decodedText) => {
                scanResult.innerText = `Scanned: ${decodedText}`;
                const cleanedBarcode = cleanBarcode(decodedText);
                const product = inventoryData.find((p) => p.Barcode === cleanedBarcode);
                if (product) {
                    addToCartWithQuantity(product);
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

    // Manual Form Submission
    inventoryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const item = {
            barcode: document.getElementById("barcode").value || "Manual Entry",
            name: document.getElementById("productName").value,
            quantity: parseInt(document.getElementById("quantity").value, 10),
            price: parseFloat(document.getElementById("price").value),
        };
        cart.push(item);
        renderCart();
        inventoryForm.reset();
    });

    // Calculate Change
    calculateChangeButton.addEventListener("click", () => {
        const receivedMoney = parseFloat(receivedMoneyInput.value);
        if (isNaN(receivedMoney) || receivedMoney < totalPrice) {
            alert("The amount received must be greater than or equal to the total price.");
            return;
        }
        const change = receivedMoney - totalPrice;
        changeAmountElement.textContent = change.toFixed(2);
    });

    // Checkout
    checkoutButton.addEventListener("click", () => {
        alert(`Transaction Complete. Total Price: $${totalPrice.toFixed(2)}. Change: $${changeAmountElement.textContent}`);
        cart = [];
        renderCart();
        changeAmountElement.textContent = "0.00";
        receivedMoneyInput.value = "";
    });

    // Load inventory data when the page loads
    loadInventoryData();
});
