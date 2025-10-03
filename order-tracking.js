// Order Tracking Page JavaScript
import { auth, db } from "./firebase.js";
import { doc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// DOM Elements
const mapContainer = document.getElementById("map");
const orderStatusContainer = document.getElementById("order-status-container");
const etaContainer = document.getElementById("eta-container");
const etaTime = document.getElementById("eta-time");
const driverInfoCard = document.getElementById("driver-info-card");
const driverInfo = document.getElementById("driver-info");
const orderDetails = document.getElementById("order-details");
const displayName = document.getElementById("display-name");
const userMenuItem = document.getElementById("user-menu-item");
const logoutBtn = document.getElementById("logout-btn");

// Global variables
let map;
let customerMarker;
let driverMarker;
let routeLine;
let order;
let orderId;
let watchId = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    // Get order ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get("orderId");

    if (!orderId) {
        showError("معرف الطلب غير موجود");
        return;
    }

    // Check if user is logged in
    checkUserLogin();

    // Load order data
    loadOrderData();

    // Initialize map
    initMap();

    // Setup logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logoutUser);
    }

    // Setup mobile menu
    setupMobileMenu();
});

// Check if user is logged in
function checkUserLogin() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userName = localStorage.getItem("userName");

    if (isLoggedIn && userName) {
        // Show user menu
        if (userMenuItem) {
            userMenuItem.style.display = "block";
        }

        // Update display name
        if (displayName) {
            displayName.textContent = userName;
        }
    } else {
        // Hide user menu if not logged in
        if (userMenuItem) {
            userMenuItem.style.display = "none";
        }
    }
}

// Load order data from Firebase
function loadOrderData() {
    // Show loading state
    orderStatusContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>جاري تحميل بيانات الطلب...</p>
        </div>
    `;

    // Listen for real-time updates to the order
    const orderRef = doc(db, "orders", orderId);

    onSnapshot(orderRef, (docSnap) => {
        if (docSnap.exists()) {
            order = {
                id: docSnap.id,
                ...docSnap.data()
            };

            // Update UI with order data
            updateOrderStatus();
            updateOrderDetails();

            // If order has a driver assigned, update driver info and map
            if (order.driverId) {
                updateDriverInfo();
                updateMapWithDriverLocation();
            } else {
                // Hide driver info card if no driver assigned
                driverInfoCard.style.display = "none";
            }
        } else {
            showError("الطلب غير موجود");
        }
    }, (error) => {
        console.error("Error loading order:", error);
        showError("لا يمكن تحميل بيانات الطلب");
    });
}

// Update order status in the UI
function updateOrderStatus() {
    if (!order) return;

    // Get status class and text
    const statusInfo = getOrderStatusInfo(order.status);

    orderStatusContainer.innerHTML = `
        <div class="order-status-container">
            <div>حالة الطلب:</div>
            <div class="order-status ${statusInfo.class}">${statusInfo.text}</div>
        </div>
    `;

    // Show ETA for orders in progress or ready
    if ((order.status === "in_progress" || order.status === "ready") && order.eta) {
        etaContainer.style.display = "flex";
        etaTime.textContent = order.eta;
    } else {
        etaContainer.style.display = "none";
    }
}

// Update order details in the UI
function updateOrderDetails() {
    if (!order) return;

    // Format date
    let formattedDate = "غير محدد";
    if (order.createdAt) {
        const date = order.createdAt.toDate();
        formattedDate = date.toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    orderDetails.innerHTML = `
        <div class="order-details-grid">
            <div class="detail-item">
                <div class="detail-label">رقم الطلب</div>
                <div class="detail-value">#${order.id.substring(0, 6)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">التاريخ</div>
                <div class="detail-value">${formattedDate}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">المبلغ الإجمالي</div>
                <div class="detail-value">${order.total.toFixed(2)} ريال</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">طريقة الاستلام</div>
                <div class="detail-value">${order.pickup === "مكان الانطلاق غير محدد" ? "توصيل" : "استلام من المطعم"}</div>
            </div>
        </div>
        ${order.notes ? `
        <div class="detail-item" style="margin-top: 15px;">
            <div class="detail-label">ملاحظات</div>
            <div class="detail-value">${order.notes}</div>
        </div>
        ` : ""}
    `;
}

// Update driver info in the UI
function updateDriverInfo() {
    if (!order || !order.driverId) return;

    driverInfoCard.style.display = "block";

    driverInfo.innerHTML = `
        <div class="driver-info">
            <div class="driver-avatar">
                ${order.driverPhoto ? 
                    `<img src="${order.driverPhoto}" alt="${order.driverName}">` : 
                    `<i class="fas fa-user"></i>`
                }
            </div>
            <div class="driver-details">
                <h3>${order.driverName || "غير محدد"}</h3>
                <p><i class="fas fa-phone"></i> ${order.driverPhone || "غير محدد"}</p>
                <p><i class="fas fa-car"></i> ${order.carPlate || "غير محدد"}</p>
            </div>
        </div>
        <div class="contact-driver">
            <a href="tel:${order.driverPhone || "#"}" class="contact-btn call-btn">
                <i class="fas fa-phone"></i>
                اتصال
            </a>
            <a href="https://wa.me/${(order.driverPhone || "").replace(/[^0-9]/g, "")}" class="contact-btn message-btn" target="_blank">
                <i class="fab fa-whatsapp"></i>
                واتساب
            </a>
        </div>
    `;
}

// Initialize Leaflet Map
function initMap() {
    // Default location (Jeddah, Saudi Arabia)
    const defaultLocation = [21.485811, 39.192504];

    // Create map
    map = L.map(mapContainer).setView(defaultLocation, 13);

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create customer marker (default marker)
    customerMarker = L.marker(defaultLocation).addTo(map);

    // Create driver marker (car icon)
    driverMarker = L.marker(defaultLocation, {
        icon: L.icon({
            iconUrl: "images/car.png",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        })
    }).addTo(map);

    // Hide driver marker initially
    driverMarker.setOpacity(0);
}

// Update map with driver location
function updateMapWithDriverLocation() {
    if (!order || !order.driverId || !map) return;

    // Show driver marker
    driverMarker.setOpacity(1);

    // Update customer location if available
    if (order.destinationLat && order.destinationLng) {
        const customerLocation = [order.destinationLat, order.destinationLng];
        customerMarker.setLatLng(customerLocation);

        // Update map view to show both markers
        const group = new L.featureGroup([customerMarker, driverMarker]);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    // Start watching driver location
    if (navigator.geolocation) {
        // Clear any existing watch
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
        }

        // For demo purposes, we'll simulate driver movement
        // In a real app, you would get the driver's location from your database
        simulateDriverMovement();
    }
}

// Simulate driver movement (for demo purposes)
// In a real app, you would get the driver's location from your database
function simulateDriverMovement() {
    if (!order || !order.destinationLat || !order.destinationLng) return;

    // Starting point (restaurant location)
    const startLocation = [21.485811, 39.192504];

    // Destination (customer location)
    const destination = [order.destinationLat, order.destinationLng];

    // Set driver to starting point
    driverMarker.setLatLng(startLocation);

    // Calculate steps for movement simulation
    const steps = 30;
    let currentStep = 0;

    // Calculate step increments
    const latStep = (destination[0] - startLocation[0]) / steps;
    const lngStep = (destination[1] - startLocation[1]) / steps;

    // Function to move driver marker
    const moveDriver = () => {
        if (currentStep <= steps) {
            // Calculate new position
            const newLat = startLocation[0] + (latStep * currentStep);
            const newLng = startLocation[1] + (lngStep * currentStep);

            // Update driver marker position
            driverMarker.setLatLng([newLat, newLng]);

            // Update route line
            updateRouteLine([newLat, newLng], destination);

            // Calculate ETA based on remaining distance
            if (currentStep > 0) {
                const remainingSteps = steps - currentStep;
                const etaMinutes = Math.max(1, Math.round(remainingSteps / 3));

                // Update ETA in UI
                etaContainer.style.display = "flex";
                etaTime.textContent = `${etaMinutes} دقيقة`;

                // Update ETA in order document
                if (order) {
                    updateDoc(doc(db, "orders", order.id), {
                        eta: `${etaMinutes} دقيقة`
                    }).catch(error => {
                        console.error("Error updating ETA:", error);
                    });
                }
            }

            currentStep++;

            // Continue movement
            setTimeout(moveDriver, 1000);
        } else {
            // When driver reaches destination
            etaContainer.style.display = "flex";
            etaTime.textContent = "وصل السائق";

            // Update order status to delivered
            if (order) {
                updateDoc(doc(db, "orders", order.id), {
                    status: "delivered",
                    deliveredAt: new Date()
                }).catch(error => {
                    console.error("Error updating order status:", error);
                });
            }
        }
    };

    // Start movement after a delay
    setTimeout(moveDriver, 2000);
}

// Update route line between driver and customer
function updateRouteLine(driverLocation, customerLocation) {
    // Remove existing route line if it exists
    if (routeLine) {
        map.removeLayer(routeLine);
    }

    // Create new route line
    routeLine = L.polyline([driverLocation, customerLocation], {
        color: "#e74c3c",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 10"
    }).addTo(map);
}

// Get status class and text based on order status
function getOrderStatusInfo(status) {
    switch (status) {
        case "pending":
            return { class: "status-pending", text: "قيد الانتظار" };
        case "accepted":
            return { class: "status-accepted", text: "قيد التحضير" };
        case "ready":
            return { class: "status-ready", text: "جاهز للتوصيل" };
        case "in_progress":
            return { class: "status-in_progress", text: "قيد التنفيذ" };
        case "delivered":
            return { class: "status-delivered", text: "تم التوصيل" };
        case "cancelled":
            return { class: "status-cancelled", text: "ملغي" };
        default:
            return { class: "status-pending", text: "قيد الانتظار" };
    }
}

// Show error message
function showError(message) {
    mapContainer.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>حدث خطأ</h3>
            <p>${message}</p>
        </div>
    `;

    orderStatusContainer.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>حدث خطأ</h3>
            <p>${message}</p>
        </div>
    `;
}

// Logout user
function logoutUser() {
    // Clear login data from localStorage
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userId");

    // Redirect to login page
    window.location.href = "login.html";
}

// Setup mobile menu
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector(".mobile-menu");
    const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");
    const mobileMenuSidebar = document.querySelector(".mobile-menu-sidebar");
    const mobileMenuClose = document.querySelector(".mobile-menu-close");
    const mobileMenuContent = document.querySelector(".mobile-menu-content");
    const navMenu = document.querySelector("nav ul");

    // Function to check if we're on mobile view
    function isMobileView() {
        return window.innerWidth <= 768;
    }

    // Function to close mobile menu
    function closeMobileMenu() {
        if (mobileMenuSidebar) mobileMenuSidebar.classList.remove("active");
        if (mobileMenuOverlay) mobileMenuOverlay.classList.remove("active");
        document.body.style.overflow = "auto";
    }

    // Function to setup mobile menu
    function setupMobileMenuContent() {
        // Clone navigation items to mobile menu only if we're on mobile view
        if (isMobileView() && mobileMenuContent && navMenu) {
            // Clear existing content
            mobileMenuContent.innerHTML = "";

            // Create new list for mobile menu
            const mobileNavList = document.createElement("ul");

            // Clone all navigation items
            const navItems = navMenu.querySelectorAll("li");
            navItems.forEach(item => {
                const clonedItem = item.cloneNode(true);
                mobileNavList.appendChild(clonedItem);
            });

            // Add the cloned list to mobile menu content
            mobileMenuContent.appendChild(mobileNavList);
        }
    }

    // Setup mobile menu on page load
    setupMobileMenuContent();

    // Toggle mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => {
            if (isMobileView()) {
                mobileMenuSidebar.classList.toggle("active");
                mobileMenuOverlay.classList.toggle("active");
                document.body.style.overflow = mobileMenuSidebar.classList.contains("active") ? "hidden" : "auto";
            }
        });
    }

    // Close mobile menu when clicking on the overlay
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener("click", () => {
            closeMobileMenu();
        });
    }

    // Close mobile menu when clicking on the close button
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener("click", () => {
            closeMobileMenu();
        });
    }

    // Handle window resize
    window.addEventListener("resize", () => {
        // If we switch from mobile to desktop view, close the mobile menu
        if (!isMobileView()) {
            closeMobileMenu();
        } else {
            // If we switch from desktop to mobile view, setup the mobile menu
            setupMobileMenuContent();
        }
    });
}
