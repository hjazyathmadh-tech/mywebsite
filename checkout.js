// Checkout Page JavaScript
import { auth, db } from "./zakarya.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// DOM Elements
const deliveryOptions = document.querySelectorAll(".delivery-option");
const pickupOption = document.querySelector('[data-option="pickup"]');
const deliveryOption = document.querySelector('[data-option="delivery"]');
const deliveryAddressGroup = document.querySelector(".delivery-address-group");
const mapContainer = document.getElementById("map");
const locationBtn = document.getElementById("location-btn");
const checkoutForm = document.getElementById("checkout-form");
const customerName = document.getElementById("customer-name");
const customerPhone = document.getElementById("customer-phone");
const customerAddress = document.getElementById("customer-address");
const orderSummary = document.getElementById("order-summary");
const confirmOrderBtn = document.getElementById("confirm-order");
const notification = document.getElementById("notification");

// Global variables
let map;
let marker;
let userLocationMarker;
let selectedDeliveryOption = "pickup";
let customerLocation = null;
let cart = [];
let watchId = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    // Load cart from localStorage
    loadCartFromStorage();

    // Check if user is logged in
    checkUserLogin();

    // Initialize delivery options
    initializeDeliveryOptions();

    // Render order summary
    renderOrderSummary();

    // Setup confirm order button
    confirmOrderBtn.addEventListener("click", processOrder);
});

// Load cart data from localStorage
function loadCartFromStorage() {
    const cartData = localStorage.getItem("cart");
    if (cartData) {
        try {
            cart = JSON.parse(cartData);
        } catch (e) {
            console.error("Error parsing cart data:", e);
            cart = [];
        }
    }
}

// Check if user is logged in
function checkUserLogin() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userName = localStorage.getItem("userName");
    const userPhone = localStorage.getItem("userPhone");

    if (isLoggedIn && userName) {
        customerName.value = userName;
        if (userPhone) {
            customerPhone.value = userPhone;
        }
    }
}

// Initialize delivery options
function initializeDeliveryOptions() {
    deliveryOptions.forEach(option => {
        option.addEventListener("click", () => {
            // Remove active class from all options
            deliveryOptions.forEach(opt => opt.classList.remove("active"));

            // Add active class to selected option
            option.classList.add("active");

            // Update selected delivery option
            selectedDeliveryOption = option.getAttribute("data-option");

            // Show/hide address fields based on selection
            if (selectedDeliveryOption === "delivery") {
                deliveryAddressGroup.style.display = "block";
                mapContainer.classList.add("active");

                // Initialize map if not already initialized
                if (!map) {
                    initMap();
                } else {
                    // If map is already initialized, refresh it to ensure proper display
                    setTimeout(() => {
                        // Ensure map container is visible
                        mapContainer.style.display = "block";

                        // Check if we're on desktop and set appropriate height
                        const isDesktop = window.innerWidth > 768;
                        mapContainer.style.height = isDesktop ? "400px" : "250px";

                        // Force a reflow
                        void mapContainer.offsetHeight;

                        // Invalidate size and refresh map
                        map.invalidateSize();

                        // Get user location once if not already retrieved
                        if (!customerLocation && navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    const lat = position.coords.latitude;
                                    const lng = position.coords.longitude;
                                    const userLocation = [lat, lng];

                                    // Set user location marker (red pin) - this will not change
                                    userLocationMarker.setLatLng(userLocation);

                                    // Update hidden input fields with user's current location
                                    document.getElementById('customer-lat').value = lat;
                                    document.getElementById('customer-lng').value = lng;

                                    // Update customer location object
                                    customerLocation = {
                                        lat: lat,
                                        lng: lng
                                    };

                                    // Set the delivery marker to user's location initially
                                    marker.setLatLng(userLocation);

                                    // Get address from coordinates
                                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                                        .then(response => response.json())
                                        .then(data => {
                                            if (data && data.display_name) {
                                                customerAddress.value = data.display_name;
                                            }
                                        })
                                        .catch(error => {
                                            console.error("Error fetching address:", error);
                                        });
                                },
                                (error) => {
                                    console.error("Error getting user location:", error);
                                    showNotification("لا يمكن الوصول إلى موقعك الحالي. يرجى تحديد الموقع يدويًا.", "error");
                                },
                                {
                                    enableHighAccuracy: true,
                                    timeout: 5000,
                                    maximumAge: 0
                                }
                            );
                        }
                    }, 300); // Increased timeout to ensure proper rendering
                }
            } else {
                deliveryAddressGroup.style.display = "none";
                mapContainer.classList.remove("active");

                // Stop watching user location when delivery is not selected
                if (watchId) {
                    navigator.geolocation.clearWatch(watchId);
                    watchId = null;
                }
            }
        });
    });
}

// Render order summary
function renderOrderSummary() {
    if (cart.length === 0) {
        orderSummary.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>السلة فارغة</h3>
                <p>يرجى إضافة منتجات إلى السلة أولاً</p>
                <a href="index.html#menu" class="btn">العودة للقائمة</a>
            </div>
        `;
        confirmOrderBtn.disabled = true;
        return;
    }

    let orderItemsHTML = "";
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        // عرض تفاصيل العرض إذا كان العنصر من نوع عرض
        let itemDetails = "";
        if (item.type === "offer" && item.offerData) {
            const products = item.offerData.products.map(p => `${p.name} (${p.quantity})`).join(", ");
            itemDetails = `
                <div class="order-item-details">
                    <div class="offer-products">${products}</div>
                    <div class="offer-price-details">
                        <span class="old-price">${item.offerData.priceOld} ريال</span>
                        <span class="new-price">${item.offerData.priceNew} ريال</span>
                    </div>
                </div>
            `;
        } else {
            itemDetails = `<div class="order-item-details">${item.notes ? `ملاحظات: ${item.notes}` : ""}</div>`;
        }

        orderItemsHTML += `
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-name">${item.name} × ${item.quantity}</div>
                    ${itemDetails}
                </div>
                <div class="order-item-price">${itemTotal.toFixed(2)} ريال</div>
            </div>
        `;
    });

    // Add delivery fee if delivery is selected
    let deliveryFee = 0;
    if (selectedDeliveryOption === "delivery") {
        deliveryFee = 10; // 10 ريال رسوم التوصيل
        orderItemsHTML += `
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-name">رسوم التوصيل</div>
                </div>
                <div class="order-item-price">${deliveryFee.toFixed(2)} ريال</div>
            </div>
        `;
    }

    const grandTotal = total + deliveryFee;

    orderItemsHTML += `
        <div class="order-total">
            <span>المجموع:</span>
            <span>${grandTotal.toFixed(2)} ريال</span>
        </div>
    `;

    orderSummary.innerHTML = orderItemsHTML;
}

// Initialize Leaflet Map
function initMap() {
    // Default location (Jeddah, Saudi Arabia)
    const defaultLocation = [21.485811, 39.192504];

    // Check if we're on desktop and adjust settings
    const isDesktop = window.innerWidth > 768;

    // Make sure map container is visible and has proper dimensions
    mapContainer.style.display = "block";
    mapContainer.style.height = isDesktop ? "400px" : "250px";

    // Force a reflow to ensure the container dimensions are applied
    void mapContainer.offsetHeight;

    // Create map with specific options for better desktop display
    map = L.map(mapContainer, {
        center: defaultLocation,
        zoom: 13,
        zoomControl: true,
        attributionControl: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create a draggable marker for delivery location
    marker = L.marker(defaultLocation, {
        draggable: true,
        title: "حدد موقع التوصيل",
        autoPan: true
    }).addTo(map);

    // Create a small red circle marker for user's current location
    userLocationMarker = L.circleMarker(defaultLocation, {
        radius: 8,
        fillColor: "#ff0000",
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
        title: "موقعك الحالي"
    }).addTo(map);

    // Force map to recalculate its size
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    // Get user's current location and center map on it
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const userLocation = [lat, lng];

                // Center map on user's location with zoom level 16
                map.setView(userLocation, 16);

                // Update both markers to user's location
                marker.setLatLng(userLocation);
                userLocationMarker.setLatLng(userLocation);

                // Update customer location object
                customerLocation = {
                    lat: lat,
                    lng: lng
                };

                // Update hidden input fields with user's current location
                document.getElementById('customer-lat').value = lat;
                document.getElementById('customer-lng').value = lng;

                // Get address from coordinates
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.display_name) {
                            customerAddress.value = data.display_name;
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching address:", error);
                    });
            },
            (error) => {
                console.error("Error getting user location:", error);
                showNotification("لا يمكن الوصول إلى موقعك الحالي. يرجى تحديد الموقع يدويًا.", "error");
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        showNotification("متصفحك لا يدعم ميزة تحديد الموقع.", "error");
    }

    // Add event listener for marker drag
    marker.on("dragend", (event) => {
        const position = marker.getLatLng();

        // Update customer location
        customerLocation = {
            lat: position.lat,
            lng: position.lng
        };

        // Update hidden input fields
        document.getElementById('customer-lat').value = position.lat;
        document.getElementById('customer-lng').value = position.lng;

        // Note: We no longer update the red circle marker to match the new marker position
        // The red marker (userLocationMarker) stays fixed at the user's original GPS location

        // For OpenStreetMap, we'll use Nominatim for reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.display_name) {
                    customerAddress.value = data.display_name;
                }
            })
            .catch(error => {
                console.error("Error fetching address:", error);
            });
    });

    // Add event listener for address input
    customerAddress.addEventListener("input", () => {
        const address = customerAddress.value;
        if (address) {
            // Use Nominatim for geocoding
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const result = data[0];
                        const position = [parseFloat(result.lat), parseFloat(result.lon)];

                        // Update map and marker
                        map.setView(position, 16);
                        marker.setLatLng(position);

                        // Update customer location
                        customerLocation = {
                            lat: position[0],
                            lng: position[1]
                        };

                        // Update hidden input fields
                        document.getElementById('customer-lat').value = position[0];
                        document.getElementById('customer-lng').value = position[1];
                    }
                })
                .catch(error => {
                    console.error("Error fetching coordinates:", error);
                });
        }
    });

    // Add event listener for location button
    if (locationBtn) {
        locationBtn.addEventListener("click", () => {
            if (navigator.geolocation) {
                // If we're already watching position, just get the current position once
                if (watchId) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            const userLocation = [lat, lng];

                            // Update map and marker
                            map.setView(userLocation, 16);
                            marker.setLatLng(userLocation);

                            // Update customer location
                            customerLocation = {
                                lat: lat,
                                lng: lng
                            };

                            // Update hidden input fields
                            document.getElementById('customer-lat').value = lat;
                            document.getElementById('customer-lng').value = lng;

                            // Get address from coordinates
                            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                                .then(response => response.json())
                                .then(data => {
                                    if (data && data.display_name) {
                                        customerAddress.value = data.display_name;
                                    }
                                })
                                .catch(error => {
                                    console.error("Error fetching address:", error);
                                });
                        },
                        (error) => {
                            console.error("Error getting user location:", error);
                            showNotification("لا يمكن الوصول إلى موقعك الحالي. يرجى تحديد الموقع يدويًا.", "error");
                        }
                    );
                } else {
                    // If we're not watching position, get current position once
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            const userLocation = [lat, lng];

                            // Update user location marker (red pin) - this will not change
                            userLocationMarker.setLatLng(userLocation);

                            // Update map and marker
                            map.setView(userLocation, 16);
                            marker.setLatLng(userLocation);

                            // Update customer location
                            customerLocation = {
                                lat: lat,
                                lng: lng
                            };

                            // Update hidden input fields
                            document.getElementById('customer-lat').value = lat;
                            document.getElementById('customer-lng').value = lng;

                            // Get address from coordinates
                            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                                .then(response => response.json())
                                .then(data => {
                                    if (data && data.display_name) {
                                        customerAddress.value = data.display_name;
                                    }
                                })
                                .catch(error => {
                                    console.error("Error fetching address:", error);
                                });
                        },
                        (error) => {
                            console.error("Error getting user location:", error);
                            showNotification("لا يمكن الوصول إلى موقعك الحالي. يرجى تحديد الموقع يدويًا.", "error");
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                        }
                    );
                }
            } else {
                showNotification("متصفحك لا يدعم ميزة تحديد الموقع.", "error");
            }
        });
    }

    // Get user's position once (no continuous tracking)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const userLocation = [lat, lng];

                // Set user location marker (red pin) - this will not change
                userLocationMarker.setLatLng(userLocation);

                // Update hidden input fields with user's current location
                document.getElementById('customer-lat').value = lat;
                document.getElementById('customer-lng').value = lng;

                // Update customer location object
                customerLocation = {
                    lat: lat,
                    lng: lng
                };

                // Set the delivery marker to user's location initially
                marker.setLatLng(userLocation);

                // Get address from coordinates
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.display_name) {
                            customerAddress.value = data.display_name;
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching address:", error);
                    });
            },
            (error) => {
                console.error("Error getting user location:", error);
                showNotification("لا يمكن الوصول إلى موقعك الحالي. يرجى تحديد الموقع يدويًا.", "error");
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    // Make sure the map is properly sized when displayed
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

// Process order
async function processOrder() {
    // Get selected payment method
    const selectedPaymentMethod = document.querySelector(".payment-option.active").getAttribute("data-method");

    // If PayPal is selected, let the payment.js handle the process
    if (selectedPaymentMethod === "paypal") {
        showNotification("يرجى إكمال عملية الدفع عبر PayPal أولاً", "error");
        return;
    }

    // For cash or card payment, process the order with payment status as pending
    processOrderWithPayment(selectedPaymentMethod, "Pending");
}

// Process order with payment
async function processOrderWithPayment(paymentMethod, paymentStatus, transactionId = null) {
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
    notification.textContent = message;
    notification.className = "notification";
    notification.classList.add(type);
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 5000);
}