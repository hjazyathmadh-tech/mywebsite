// Delivery Orders Page JavaScript
import { auth, db } from "./firebase.js";
import { collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// DOM Elements
const ordersContainer = document.getElementById("orders-container");
const displayName = document.getElementById("display-name");
const userMenuItem = document.getElementById("user-menu-item");
const logoutBtn = document.getElementById("logout-btn");
const mapModal = document.getElementById("map-modal");
const orderMap = document.getElementById("order-map");
const closeMapModal = document.querySelector(".close-map-modal");

// Global variables for map
let orderMapInstance = null;
let customerMarker = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    // Check if user is logged in
    checkUserLogin();

    // Load user orders
    loadDeliveryOrders();

    // Setup logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logoutUser);
    }

    // Setup mobile menu
    setupMobileMenu();

    // Setup map modal close functionality
    if (closeMapModal) {
        closeMapModal.addEventListener("click", closeOrderMap);
    }

    // Close map modal when clicking outside
    if (mapModal) {
        mapModal.addEventListener("click", (e) => {
            if (e.target === mapModal) {
                closeOrderMap();
            }
        });
    }

    // Setup mobile logout button
    const mobileLogoutBtn = document.getElementById("mobile-logout-btn");
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener("click", logoutUser);
    }
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

        // Update mobile display name
        const mobileDisplayName = document.getElementById("mobile-display-name");
        if (mobileDisplayName) {
            mobileDisplayName.textContent = userName;
        }

        // Show mobile user menu item
        const mobileUserMenuItem = document.getElementById("mobile-user-menu-item");
        if (mobileUserMenuItem) {
            mobileUserMenuItem.style.display = "block";
        }
    } else {
        // Hide user menu if not logged in
        if (userMenuItem) {
            userMenuItem.style.display = "none";
        }

        // Hide mobile user menu item
        const mobileUserMenuItem = document.getElementById("mobile-user-menu-item");
        if (mobileUserMenuItem) {
            mobileUserMenuItem.style.display = "none";
        }
    }
}

// Load delivery orders from Firebase
function loadDeliveryOrders() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        // If user is not logged in, show empty orders message
        ordersContainer.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-receipt"></i>
                <h3>لا توجد طلبات</h3>
                <p>يرجى تسجيل الدخول لعرض طلبات التوصيل الخاصة بك.</p>
                <a href="index.html#menu">اطلب الآن</a>
            </div>
        `;
        return;
    }

    // Create a query to get delivery orders for the current user
    const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        where("deliveryMethod", "==", "delivery"),
        orderBy("createdAt", "desc")
    );

    // Listen for real-time updates
    onSnapshot(ordersQuery, (querySnapshot) => {
        const orders = [];

        querySnapshot.forEach((doc) => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Render orders
        renderOrders(orders);
    }, (error) => {
        console.error("Error loading orders:", error);

        // Check if the error is related to missing index
        if (error.message.includes("The query requires an index")) {
            ordersContainer.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>جاري تحديث الفهرس</h3>
                    <p>نقوم حالياً بتحديث فهرس قاعدة البيانات. يرجى المحاولة مرة أخرى بعد بضع دقائق.</p>
                    <p>هذه العملية مطلوبة مرة واحدة فقط.</p>
                </div>
            `;
        } else {
            ordersContainer.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>حدث خطأ</h3>
                    <p>لا يمكن تحميل الطلبات حالياً. يرجى المحاولة مرة أخرى لاحقاً.</p>
                </div>
            `;
        }
    });
}

// Render orders in the UI
function renderOrders(orders) {
    // Clear orders container
    ordersContainer.innerHTML = "";

    // Check if there are no orders
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-receipt"></i>
                <h3>لا توجد طلبات توصيل</h3>
                <p>لم تقم بإنشاء أي طلبات توصيل بعد.</p>
                <a href="index.html#menu">اطلب الآن</a>
            </div>
        `;
        return;
    }

    // Render each order
    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersContainer.appendChild(orderCard);
    });
}

// Create an order card element
function createOrderCard(order) {
    const orderCard = document.createElement("div");
    orderCard.classList.add("order-card");

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

    // Get status class and text
    const statusInfo = getOrderStatusInfo(order.status);

    orderCard.innerHTML = `
        <div class="order-header">
            <div class="order-number">طلب #${order.id.substring(0, 6)}</div>
            <div class="order-status ${statusInfo.class}">${statusInfo.text}</div>
        </div>
        <div class="order-details">
            <div class="order-amount">${order.total.toFixed(2)} ريال</div>
            <div class="order-date">${formattedDate}</div>
        </div>
        <div class="order-footer">
            <div>عرض التفاصيل</div>
            <div class="order-actions">
                <button class="track-order-btn" data-order-id="${order.id}">تتبع الطلب</button>
                ${order.location && order.location.lat && order.location.lng ? 
                    `<button class="view-location-btn" data-order-id="${order.id}" data-lat="${order.location.lat}" data-lng="${order.location.lng}">عرض الموقع</button>` : 
                    ''}
            </div>
        </div>
    `;

    // Add click event to track order button
    const trackOrderBtn = orderCard.querySelector(".track-order-btn");
    trackOrderBtn.addEventListener("click", () => {
        window.location.href = `order-tracking.html?orderId=${order.id}`;
    });

    // Add click event to view location button if it exists
    const viewLocationBtn = orderCard.querySelector(".view-location-btn");
    if (viewLocationBtn) {
        viewLocationBtn.addEventListener("click", () => {
            const lat = parseFloat(viewLocationBtn.getAttribute("data-lat"));
            const lng = parseFloat(viewLocationBtn.getAttribute("data-lng"));
            showOrderMap(lat, lng);
        });
    }

    return orderCard;
}

// Get status class and text based on order status
function getOrderStatusInfo(status) {
    switch (status) {
        case "pending":
            return { class: "status-pending", text: "قيد الانتظار" };
        case "accepted":
            return { class: "status-accepted", text: "مقبول" };
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

// Show order map modal
function showOrderMap(lat, lng) {
    if (!mapModal || !orderMap) return;

    // Show modal
    mapModal.style.display = "block";

    // Initialize map if not already initialized
    if (!orderMapInstance) {
        // Create map
        orderMapInstance = L.map(orderMap).setView([lat, lng], 16);

        // Add tile layer (OpenStreetMap)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(orderMapInstance);

        // Create customer marker (red pin)
        customerMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: "images/red-pin.png",
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            })
        }).addTo(orderMapInstance);
    } else {
        // Update map view and marker position
        orderMapInstance.setView([lat, lng], 16);
        customerMarker.setLatLng([lat, lng]);
    }
}

// Close order map modal
function closeOrderMap() {
    if (mapModal) {
        mapModal.style.display = "none";
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
