// Payment Methods JavaScript
import { auth, db } from "./zakarya.js";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// DOM Elements
const paymentOptions = document.querySelectorAll(".payment-option");
const paypalButtonContainer = document.getElementById("paypal-button-container");
const confirmOrderBtn = document.getElementById("confirm-order");

// Global variables
let selectedPaymentMethod = "cash"; // Default payment method

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    // Initialize payment options
    initializePaymentOptions();

    // Load PayPal SDK if needed
    loadPayPalSDK();
});

// Initialize payment options
function initializePaymentOptions() {
    paymentOptions.forEach(option => {
        option.addEventListener("click", () => {
            // Remove active class from all options
            paymentOptions.forEach(opt => opt.classList.remove("active"));

            // Add active class to selected option
            option.classList.add("active");

            // Update selected payment method
            selectedPaymentMethod = option.getAttribute("data-method");

            // Show/hide PayPal button based on selection
            if (selectedPaymentMethod === "paypal") {
                paypalButtonContainer.style.display = "block";
                renderPayPalButton();
            } else {
                paypalButtonContainer.style.display = "none";
            }
        });
    });
}

// Load PayPal SDK
function loadPayPalSDK() {
    // Import PayPal configuration
    import('./config.js').then(config => {
        const { PAYPAL_CONFIG } = config;

        // Check if PayPal script is already loaded
        if (document.getElementById("paypal-sdk")) {
            return;
        }

        // Create PayPal script element
        const script = document.createElement("script");
        script.id = "paypal-sdk";
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.CLIENT_ID}&currency=${PAYPAL_CONFIG.CURRENCY}&env=${PAYPAL_CONFIG.ENVIRONMENT}`;
        script.async = true;

        // Add script to document
        document.body.appendChild(script);
    }).catch(error => {
        console.error("Error loading PayPal configuration:", error);
        showNotification("حدث خطأ أثناء تحميل إعدادات الدفع", "error");
    });
}

// Render PayPal button
function renderPayPalButton() {
    // Check if PayPal SDK is loaded
    if (!window.paypal) {
        // If not loaded, wait and try again
        setTimeout(renderPayPalButton, 500);
        return;
    }

    // Clear existing buttons
    paypalButtonContainer.innerHTML = "";

    // Render PayPal buttons
    window.paypal.Buttons({
        createOrder: function(data, actions) {
            // Calculate total amount
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Add delivery fee if applicable
            const selectedDeliveryOption = document.querySelector(".delivery-option.active").getAttribute("data-option");
            if (selectedDeliveryOption === "delivery") {
                total += 10; // 10 ريال رسوم التوصيل
            }

            // Create order
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: total.toFixed(2)
                    }
                }]
            });
        },
        onApprove: function(data, actions) {
            // Capture the funds from the transaction
            return actions.order.capture().then(function(details) {
                // Process the order with PayPal payment
                processOrderWithPayment("PayPal", "Paid", details.id);
            });
        },
        onCancel: function(data) {
            // Show a notification when payment is cancelled
            showNotification("تم إلغاء عملية الدفع عبر PayPal", "error");
        },
        onError: function(err) {
            // Show an error message
            showNotification("حدث خطأ أثناء عملية الدفع عبر PayPal: " + err.message, "error");
        }
    }).render("#paypal-button-container");
}

// Process order with payment
async function processOrderWithPayment(paymentMethod, paymentStatus, transactionId = null) {
    // Import necessary functions from checkout.js
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const customerName = document.getElementById("customer-name");
    const customerPhone = document.getElementById("customer-phone");
    const customerAddress = document.getElementById("customer-address");
    const selectedDeliveryOption = document.querySelector(".delivery-option.active").getAttribute("data-option");

    // Validate form
    if (!customerName.value.trim()) {
        showNotification("يرجى إدخال الاسم الكامل", "error");
        customerName.focus();
        return;
    }

    if (!customerPhone.value.trim()) {
        showNotification("يرجى إدخال رقم الهاتف", "error");
        customerPhone.focus();
        return;
    }

    if (selectedDeliveryOption === "delivery" && !customerAddress.value.trim()) {
        showNotification("يرجى إدخال العنوان", "error");
        customerAddress.focus();
        return;
    }

    if (cart.length === 0) {
        showNotification("السلة فارغة، يرجى إضافة منتجات", "error");
        return;
    }

    try {
        // Calculate total
        let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Add delivery fee if applicable
        if (selectedDeliveryOption === "delivery") {
            total += 10; // 10 ريال رسوم التوصيل
        }

        // Prepare order data
        const orderData = {
            customerName: customerName.value.trim(),
            customerPhone: customerPhone.value.trim(),
            deliveryMethod: selectedDeliveryOption,
            deliveryType: selectedDeliveryOption, // Add deliveryType field with same value as deliveryMethod
            status: "pending",
            items: cart,
            total: total,
            createdAt: serverTimestamp(),
            paymentMethod: paymentMethod,
            paymentStatus: paymentStatus
        };

        // Add transaction ID if available
        if (transactionId) {
            orderData.transactionId = transactionId;
        }

        // Add address if delivery is selected
        if (selectedDeliveryOption === "delivery") {
            orderData.address = customerAddress.value.trim();

            // Get coordinates from hidden input fields
            const lat = document.getElementById('customer-lat').value;
            const lng = document.getElementById('customer-lng').value;

            if (lat && lng) {
                orderData.location = {
                    address: customerAddress.value.trim(), // العنوان المدخل
                    lat: parseFloat(lat),
                    lng: parseFloat(lng)
                };
            }
        }

        // Add user ID if logged in
        const user = auth.currentUser;
        if (user) {
            orderData.userId = user.uid;
        }

        // Save order to Firestore
        const docRef = await addDoc(collection(db, "orders"), orderData);

        // Show success message
        showNotification("تم اختيار وسيلة الدفع بنجاح وجاري إرسال الطلب", "success");

        // Clear cart and redirect
        localStorage.removeItem("cart");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 3000);

    } catch (error) {
        console.error("Error processing order:", error);
        showNotification("حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى", "error");
    }
}

// Show notification
function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.className = "notification";
    notification.classList.add(type);
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 5000);
}
