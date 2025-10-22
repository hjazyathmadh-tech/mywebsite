// Order Tracking Page JavaScript
import { auth, db } from "./firebase.js";
// تم تعديل الاستيراد لإضافة getDoc لمعالجة خطأ Firebase
import { doc, onSnapshot, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

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

                // Update driver location directly from the order document
                if (order.driverLocation && order.driverLocation.lat && order.driverLocation.lng) {
                    // طباعة موقع السائق من Firebase في الـ Console
                    console.log("📍 موقع السائق من Firebase (في loadOrderData):", order.driverLocation.lat, order.driverLocation.lng);

                    // Update driver marker position
                    const driverLocation = [order.driverLocation.lat, order.driverLocation.lng];
                    if (driverMarker) {
                        driverMarker.setLatLng(driverLocation);
                        driverMarker.setOpacity(1);
                        driverMarker.bindPopup("موقع السائق").openPopup();

                        // Update route line
                        if (order.location && order.location.lat && order.location.lng) {
                            const customerLocation = [order.location.lat, order.location.lng];
                            updateRouteLine(driverLocation, customerLocation);
                        }
                    }
                }

                // Call updateMapWithDriverLocation to set up real-time updates
                updateMapWithDriverLocation();
            } else {
                // Hide driver info card if no driver assigned
                if (driverInfoCard) {
                    driverInfoCard.style.display = "none";
                }
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
    if (!order || !orderDetails) return;

    // Format date
    let formattedDate = "غير محدد";
    if (order.createdAt && order.createdAt.toDate) {
        // التحقق من وجود toDate للتأكد من أنه Timestamp
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
                <div class="detail-value">${order.total ? order.total.toFixed(2) : '0.00'} ريال</div>
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
    if (!order || !order.driverId || !driverInfoCard || !driverInfo) return;

    driverInfoCard.style.display = "block";

    // إذا لم تكن صورة السائق متوفرة في بيانات الطلب، قم بجلبها من قاعدة البيانات
    if (!order.driverPhoto) {
        // لا نحتاج لـ await هنا، فقط استدعاء الدالة
        fetchDriverPhoto(order.driverId);
    }

    driverInfo.innerHTML = `
        <div class="driver-info">
            <div class="driver-avatar" id="driver-avatar-${order.driverId}">
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

// جلب صورة السائق من قاعدة البيانات
// تم تصحيح الخطأ بإضافة getDoc إلى Imports
async function fetchDriverPhoto(driverId) {
    try {
        const driverDoc = await getDoc(doc(db, "drivers", driverId));
        if (driverDoc.exists()) {
            const driverData = driverDoc.data();
            if (driverData.imageUrl) {
                // تحديث صورة السائق في الواجهة
                const driverAvatar = document.getElementById(`driver-avatar-${driverId}`);
                if (driverAvatar) {
                    driverAvatar.innerHTML = `<img src="${driverData.imageUrl}" alt="${order.driverName}">`;
                    // تحديث كائن الطلب محليًا (اختياري)
                    order.driverPhoto = driverData.imageUrl;
                }
            }
        }
    } catch (error) {
        console.error("خطأ في جلب صورة السائق:", error);
    }
}

// Initialize Leaflet Map
function initMap() {
    if (!mapContainer) return;

    // Default location (Jeddah, Saudi Arabia)
    const defaultLocation = [21.485811, 39.192504];

    // Create map
    map = L.map(mapContainer).setView(defaultLocation, 13);

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create customer marker (red pin icon)
    customerMarker = L.marker(defaultLocation, {
        icon: L.divIcon({
            className: 'map-arrow-icon',
            html: `<div style="
                width: 0;
                height: 0;
                border-left: 10px solid transparent;
                border-right: 10px solid transparent;
                border-bottom: 20px solid blue;
                transform: rotate(0deg);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 20],
            popupAnchor: [0, -20]
        })
    }).addTo(map);
    
    customerMarker.bindPopup("موقع العميل");
    

    // Create driver marker (car icon)
    driverMarker = L.marker(defaultLocation, {
        icon: L.icon({
            iconUrl: "images/car.png",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        })
    }).addTo(map);
    driverMarker.bindPopup("موقع السائق");

    // Hide driver marker initially
    driverMarker.setOpacity(0);
}

// Update map with driver location
function updateMapWithDriverLocation() {
    if (!order || !order.id || !map || !driverMarker || !customerMarker) return;

    // Show driver marker
    driverMarker.setOpacity(1);

    // Update customer location if available
    if (order.location && order.location.lat && order.location.lng) {
        const customerLocation = [order.location.lat, order.location.lng];
        customerMarker.setLatLng(customerLocation);
        customerMarker.bindPopup("موقع العميل").openPopup();

        // Update map view to show both markers
        const group = new L.featureGroup([customerMarker, driverMarker]);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    // Watch for driver location updates in real-time from the order document
    const orderRef = doc(db, "orders", order.id);
    onSnapshot(orderRef, (docSnap) => {
        if (docSnap.exists()) {
            const orderData = docSnap.data();

            // Update order object with latest data
            order = {
                id: order.id,
                ...orderData
            };

            // Update driver location if available
            if (orderData.driverLocation && orderData.driverLocation.lat && orderData.driverLocation.lng) {
                // طباعة موقع السائق من Firebase في الـ Console
                console.log("📍 موقع السائق من Firebase:", orderData.driverLocation.lat, orderData.driverLocation.lng);

                // Update driver marker position
                updateDriverMarker(orderData.driverLocation.lat, orderData.driverLocation.lng);
            }

            // Update ETA if available
            if (orderData.eta) {
                if (etaContainer) etaContainer.style.display = "flex";
                if (etaTime) etaTime.textContent = orderData.eta;
            } else {
                etaContainer.style.display = "none";
            }
        }
    });
}

// Update driver marker position
function updateDriverMarker(lat, lng) {
    if (!driverMarker || !map) return;

    const driverLocation = [lat, lng];
    driverMarker.setLatLng(driverLocation);
    driverMarker.bindPopup("موقع السائق").openPopup();

    // Update route line
    if (order && order.location && order.location.lat && order.location.lng) {
        const customerLocation = [order.location.lat, order.location.lng];
        updateRouteLine(driverLocation, customerLocation);
    }
}

// Listen for order updates to get driver location
function listenForDriverLocationUpdates() {
    if (!order || !order.id) return;
    
    const orderRef = doc(db, "orders", order.id);
    
    onSnapshot(orderRef, (docSnap) => {
        if (docSnap.exists()) {
            const orderData = docSnap.data();
            
            // Update driver location if available
            if (orderData.driverLocation && orderData.driverLocation.lat && orderData.driverLocation.lng) {
                // طباعة موقع السائق من Firebase في الـ Console
                console.log("📍 موقع السائق من Firebase (في دالة listenForDriverLocationUpdates):", orderData.driverLocation.lat, orderData.driverLocation.lng);

                const driverLocation = [orderData.driverLocation.lat, orderData.driverLocation.lng];
                driverMarker.setLatLng(driverLocation);
                driverMarker.bindPopup("موقع السائق").openPopup();
                
                // Update route line
                if (orderData.location && orderData.location.lat && orderData.location.lng) {
                    const customerLocation = [orderData.location.lat, orderData.location.lng];
                    updateRouteLine(driverLocation, customerLocation);
                }
            }
            
            // Update ETA if available
            if (orderData.eta) {
                if (etaContainer) etaContainer.style.display = "flex";
                if (etaTime) etaTime.textContent = orderData.eta;
            }
        }
    });
}

// Update route line between driver and customer
function updateRouteLine(driverLocation, customerLocation) {
    if (!map) return;
    
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
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>حدث خطأ</h3>
                <p>${message}</p>
            </div>
        `;
    }

    if (orderStatusContainer) {
        orderStatusContainer.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>حدث خطأ</h3>
                <p>${message}</p>
            </div>
        `;
    }
    // إخفاء معلومات السائق إذا كان هناك خطأ
    if (driverInfoCard) {
        driverInfoCard.style.display = "none";
    }
    if (orderDetails) {
        orderDetails.innerHTML = ""; // مسح تفاصيل الطلب
    }
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
        } else if (mobileMenuContent) {
            // مسح محتوى القائمة إذا لم نعد في وضع الجوال
            mobileMenuContent.innerHTML = "";
        }
    }

    // Setup mobile menu on page load
    setupMobileMenuContent();

    // Toggle mobile menu
    if (mobileMenuBtn && mobileMenuSidebar && mobileMenuOverlay) {
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
        setupMobileMenuContent();
        // إغلاق القائمة الجانبية إذا تم تغيير الحجم إلى عرض سطح المكتب
        if (!isMobileView()) {
            closeMobileMenu();
        }
    });
}