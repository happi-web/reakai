document.addEventListener("DOMContentLoaded", () => {
    const scannerSection = document.getElementById("scannerSection");
    const inventoryForm = document.getElementById("inventoryForm");
    const cartItems = document.getElementById("cartItems");
    const totalPriceElement = document.getElementById("totalPrice");
    const scanModeButton = document.getElementById("scanMode");
    const manualModeButton = document.getElementById("manualMode");
    const scanResult = document.getElementById("scanResult");
    const barcodeInput = document.getElementById("barcode");
    const checkoutButton = document.getElementById("checkout");
    const receivedMoneyInput = document.getElementById("receivedMoney");
    const changeAmountElement = document.getElementById("changeAmount");
    const calculateChangeButton = document.getElementById("calculateChange");

    let scanner;
    let cart = [];
    let totalPrice = 0;

    // Update Total Price
    const updateTotalPrice = () => {
        totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        totalPriceElement.textContent = totalPrice.toFixed(2);
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
                <td class="actions">
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

    // Switch to Scan Mode
    scanModeButton.addEventListener("click", () => {
        scannerSection.classList.remove("hidden");
        inventoryForm.classList.add("hidden");
        if (!scanner) {
            scanner = new Html5QrcodeScanner("scanner", { fps: 10, qrbox: 250 });
        }
        scanner.render(
            (decodedText) => {
                scanResult.innerText = `Scanned: ${decodedText}`;
                // You can replace this with logic to fetch product info based on barcode
                addToCart({ barcode: decodedText, name: "Unknown Product", quantity: 1, price: 0 });
                scanner.clear();
            },
            (error) => {
                scanResult.innerText = `Error: ${error}`;
            }
        );
    });

    // Switch to Manual Mode
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
            barcode: barcodeInput.value || "Manual Entry",
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
});