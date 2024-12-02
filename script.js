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

    let scanner;
    let cart = [];
    let totalPrice = 0;
    let inventoryData = [];

    // Load Inventory Data from an Excel file
    function loadInventoryData() {
        const fileUrl = "reakai.xlsx"; // Path to the inventory file
        fetch(fileUrl)
            .then((response) => response.arrayBuffer())
            .then((data) => {
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                inventoryData = XLSX.utils.sheet_to_json(sheet);
            })
            .catch((error) => console.error("Error loading inventory file:", error));
    }

    // Clean and normalize barcodes
    function cleanBarcode(barcode) {
        return typeof barcode === "string" ? barcode.trim().replace(/\D/g, "") : "";
    }

    // Update Total Price
    const updateTotalPrice = () => {
        totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
    };

    // Render Cart
    const renderCart = () => {
        cartItems.innerHTML = "";
        cart.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.barcode || "N/A"}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.quantity * item.price).toFixed(2)}</td>
                <td>
                    <button onclick="removeFromCart(${index})">Remove</button>
                </td>
            `;
            cartItems.appendChild(row);
        });
        updateTotalPrice();
    };

    // Remove Item from Cart
    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    // Add Item to Cart
    const addToCart = (item) => {
        cart.push(item);
        renderCart();
    };

    // QR Code Scanner Integration
    const scanModeButton = document.getElementById("scanMode");
    scanModeButton.addEventListener("click", () => {
        scannerSection.classList.remove("hidden");
        inventoryForm.classList.add("hidden");
        if (!scanner) {
            scanner = new Html5QrcodeScanner("scanner", { fps: 10, qrbox: 250 });
        }
        scanner.render(
            (decodedText) => {
                scanResult.innerText = `Scanned: ${decodedText}`;
                const cleanedBarcode = cleanBarcode(decodedText);
                const product = inventoryData.find(
                    (p) => cleanBarcode(p.Barcode) === cleanedBarcode
                );
                if (product) {
                    addToCart({
                        barcode: cleanedBarcode,
                        name: product["Product Name"],
                        quantity: 1,
                        price: parseFloat(product["Unit Price"]),
                    });
                } else {
                    alert("Product not found in inventory.");
                }
            },
            (error) => {
                scanResult.innerText = `Error: ${error}`;
            }
        );
    });

    // Switch to Manual Mode
    const manualModeButton = document.getElementById("manualMode");
    manualModeButton.addEventListener("click", () => {
        inventoryForm.classList.remove("hidden");
        scannerSection.classList.add("hidden");
        if (scanner) {
            scanner.clear();
            scanner = null;
        }
        scanResult.innerText = "No barcode scanned yet";
    });

    // Manual Form Submission
    inventoryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const item = {
            barcode: document.getElementById("barcode").value || "Manual Entry",
            name: document.getElementById("productName").value,
            quantity: parseInt(document.getElementById("quantity").value),
            price: parseFloat(document.getElementById("price").value),
        };
        addToCart(item);
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
        changeAmountElement.textContent = `$${change.toFixed(2)}`;
    });

    // Checkout and Save to Excel
    checkoutButton.addEventListener("click", () => {
        alert(
            `Transaction Complete. Total Price: $${totalPrice.toFixed(
                2
            )}. Change: $${changeAmountElement.textContent}`
        );
        const newCartData = cart.map((item) => ({
            Barcode: item.barcode,
            ProductName: item.name,
            Quantity: item.quantity,
            Price: item.price,
        }));

        const newWorkbook = XLSX.utils.book_new();
        const newWorksheet = XLSX.utils.json_to_sheet(newCartData);
        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sales");
        XLSX.writeFile(newWorkbook, "sales_receipt.xlsx");

        cart = [];
        renderCart();
        changeAmountElement.textContent = "0.00";
        receivedMoneyInput.value = "";
    });

    // Load inventory data on page load
    loadInventoryData();
});
