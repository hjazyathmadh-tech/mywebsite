// Order Tracking Page JavaScript - Final Production Ready Version

import { auth, db } from "./firebase.js";
// تم استيراد doc, onSnapshot, getDoc لمعالجة بيانات الطلبات والسائقين
import { doc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

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
let routeLine; // المسار بين السائق والعميل
let order;
let orderId;
let unsubscribeOrderListener = null; // لتنظيف اشتراك Firebase

// ⚠️ مفتاح API لخدمة OpenRouteService - يجب استبداله بمفتاحك الخاص والساري
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFiYWQwM2ExNjI2NjRmYzg5YWU1ZDNkZDNmNjMxY2M4IiwiaCI6Im11cm11cjY0In0=";


// 1. Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get("orderId");

    if (!orderId) {
        showError("معرف الطلب غير موجود");
        return;
    }

    // تهيئة الواجهة
    checkUserLogin();
    initMap();
    setupMobileMenu(); 

    // بدء عملية جلب بيانات الطلب وتتبعها في الوقت الحقيقي
    loadOrderData(); 

    // إعداد الوظائف الأساسية
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logoutUser);
    }
    
    // ⚠️ مهم: التنظيف عند مغادرة الصفحة لمنع استهلاك الموارد (Memory Leak)
    window.addEventListener('beforeunload', cleanup); 
});

// دالة لتنظيف الاشتراكات
function cleanup() {
    if (unsubscribeOrderListener) {
        unsubscribeOrderListener();
        console.log("تم إلغاء الاشتراك في تحديثات الطلب.");
    }
}

// 2. Load order data from Firebase (نقطة التحكم الرئيسية)
function loadOrderData() {
    orderStatusContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>جاري تحميل بيانات الطلب...</p>
        </div>
    `;

    const orderRef = doc(db, "orders", orderId);

    // الاشتراك الموحد الوحيد لتحديث جميع البيانات في الوقت الحقيقي
    unsubscribeOrderListener = onSnapshot(orderRef, (docSnap) => {
        if (docSnap.exists()) {
            // تحديث كائن الطلب العام
            order = { id: docSnap.id, ...docSnap.data() };

            // تحديث واجهة المستخدم
            updateOrderStatus();
            updateOrderDetails();
            
            // تحديث معلومات السائق والخريطة
            updateDriverAndMap(order);

        } else {
            cleanup();
            showError("الطلب غير موجود");
        }
    }, (error) => {
        console.error("Error loading order:", error);
        cleanup();
        showError("لا يمكن تحميل بيانات الطلب");
    });
}

// 3. دالة موحدة لتحديث معلومات السائق وتتبع الخريطة
function updateDriverAndMap(currentOrder) {
    if (!currentOrder || !map || !driverMarker || !customerMarker) return;

    // أ. تحديث موقع العميل
    if (currentOrder.location && currentOrder.location.lat && currentOrder.location.lng) {
        const customerLocation = [currentOrder.location.lat, currentOrder.location.lng];
        customerMarker.setLatLng(customerLocation);
        customerMarker.bindPopup("موقع العميل").openPopup();
    }

    // ب. تحديث معلومات السائق والـ ETA وخط السير
    if (currentOrder.driverId) {
        updateDriverInfo();

        const driverLoc = currentOrder.driverLocation;
        
        // تحديث موقع السائق وخط السير إذا كان الموقع متوفراً
        if (driverLoc && driverLoc.lat && driverLoc.lng) {
            const driverLocation = [driverLoc.lat, driverLoc.lng];
            
            console.log("📍 موقع السائق من Firebase (عبر الاشتراك الموحد):", driverLocation[0], driverLocation[1]);

            driverMarker.setLatLng(driverLocation);
            driverMarker.setOpacity(1); // إظهار العلامة
            driverMarker.bindPopup("موقع السائق").openPopup();

            // رسم خط السير
            if (currentOrder.location && currentOrder.location.lat && currentOrder.location.lng) {
                const customerLocation = [currentOrder.location.lat, currentOrder.location.lng];
                // استدعاء دالة رسم المسار
                updateRouteLine(driverLocation, customerLocation);
            }
            
            // ضبط عرض الخريطة ليشمل العلامتين عند التحديث الأولي
            const group = new L.featureGroup([customerMarker, driverMarker]);
            map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 15 });
        }
        
        // تحديث ETA
        if (currentOrder.eta) {
            if (etaContainer) etaContainer.style.display = "flex";
            if (etaTime) etaTime.textContent = currentOrder.eta;
        } else {
            if (etaContainer) etaContainer.style.display = "none";
        }
    } else {
        // إخفاء عناصر السائق إذا لم يكن موجوداً
        if (driverInfoCard) driverInfoCard.style.display = "none";
        if (driverMarker) driverMarker.setOpacity(0);
        if (routeLine) {
            map.removeLayer(routeLine);
            routeLine = null;
        }
        if (etaContainer) etaContainer.style.display = "none";
    }
}

// 4. الدالة المسؤولة عن رسم المسار الفعلي باستخدام OpenRouteService
async function updateRouteLine(driverLocation, customerLocation) {
    if (!map) return;

    // 1. إزالة خط الطريق القديم إن وجد
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }

    // 2. إعداد الإحداثيات لـ OpenRouteService (خط طول, خط عرض)
    const driverLngLat = `${driverLocation[1]},${driverLocation[0]}`; 
    const customerLngLat = `${customerLocation[1]},${customerLocation[0]}`; 

    try {
        // 3. الاتصال بـ OpenRouteService
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${driverLngLat}&end=${customerLngLat}`);
        
        if (!response.ok) {
            throw new Error(`ORS API failed with status: ${response.status}`);
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const route = data.features[0];
            
            // تحويل الإحداثيات من (lng, lat) إلى (lat, lng) لـ Leaflet
            const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

            // 4. رسم المسار التفصيلي
            routeLine = L.polyline(coordinates, {
                color: '#e74c3c', // لون المسار
                weight: 5,
                opacity: 0.8
            }).addTo(map);

        } else {
             throw new Error("لا توجد ميزات مسار في استجابة API.");
        }
    } catch (error) {
        console.error("خطأ في رسم المسار (لجوء للخط المستقيم):", error);
        
        // 5. المسار البديل (Fallback) خط مستقيم متقطع
        routeLine = L.polyline([driverLocation, customerLocation], {
            color: "#e74c3c",
            weight: 4,
            opacity: 0.7,
            dashArray: "10, 10" // خط متقطع
        }).addTo(map);
    }
}


// 5. Initialize Leaflet Map
function initMap() {
    if (!mapContainer) return;

    const defaultLocation = [21.485811, 39.192504]; // جدة

    map = L.map(mapContainer).setView(defaultLocation, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // علامة العميل (أيقونة زرقاء)
    customerMarker = L.marker(defaultLocation, {
        icon: L.divIcon({
            className: 'map-customer-icon',
            html: `<i class="fas fa-map-marker-alt" style="color: blue; font-size: 30px;"></i>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        })
    }).addTo(map);
    customerMarker.bindPopup("موقع العميل");

    // علامة السائق (صورة السيارة)
    driverMarker = L.marker(defaultLocation, {
        icon: L.icon({
            iconUrl: "images/car.png",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        })
    }).addTo(map);
    driverMarker.bindPopup("موقع السائق");

    // إخفاء علامة السائق مبدئياً
    driverMarker.setOpacity(0);
}


// 6. الدوال المساعدة (بدون تغيير كبير في المنطق)

function checkUserLogin() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userName = localStorage.getItem("userName");
    if (isLoggedIn && userName) {
        if (userMenuItem) userMenuItem.style.display = "block";
        if (displayName) displayName.textContent = userName;
    } else {
        if (userMenuItem) userMenuItem.style.display = "none";
    }
}

function updateOrderStatus() {
    if (!order) return;
    const statusInfo = getOrderStatusInfo(order.status);

    orderStatusContainer.innerHTML = `
        <div class="order-status-container">
            <div>حالة الطلب:</div>
            <div class="order-status ${statusInfo.class}">${statusInfo.text}</div>
        </div>
    `;

    if ((order.status === "in_progress" || order.status === "ready") && order.eta) {
        etaContainer.style.display = "flex";
        etaTime.textContent = order.eta;
    } else {
        etaContainer.style.display = "none";
    }
}

function updateOrderDetails() {
    if (!order || !orderDetails) return;

    let formattedDate = "غير محدد";
    if (order.createdAt && order.createdAt.toDate) {
        const date = order.createdAt.toDate();
        formattedDate = date.toLocaleDateString("ar-SA", {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
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

function updateDriverInfo() {
    if (!order || !order.driverId || !driverInfoCard || !driverInfo) return;

    driverInfoCard.style.display = "block";

    if (!order.driverPhoto && order.driverId) {
        fetchDriverPhoto(order.driverId);
    }
    
    const avatarContent = order.driverPhoto ?
        `<img src="${order.driverPhoto}" alt="${order.driverName}">` :
        `<i class="fas fa-user"></i>`;

    driverInfo.innerHTML = `
        <div class="driver-info">
            <div class="driver-avatar" id="driver-avatar-${order.driverId}">
                ${avatarContent}
            </div>
            <div class="driver-details">
                <h3>${order.driverName || "غير محدد"}</h3>
                <p><i class="fas fa-phone"></i> ${order.driverPhone || "غير محدد"}</p>
                <p><i class="fas fa-car"></i> ${order.carPlate || "غير محدد"}</p>
            </div>
        </div>
        <div class="contact-driver">
            <a href="tel:${order.driverPhone || "#"}" class="contact-btn call-btn">
                <i class="fas fa-phone"></i> اتصال
            </a>
            <a href="https://wa.me/${(order.driverPhone || "").replace(/[^0-9]/g, "")}" class="contact-btn message-btn" target="_blank">
                <i class="fab fa-whatsapp"></i> واتساب
            </a>
        </div>
    `;
}

async function fetchDriverPhoto(driverId) {
    try {
        const driverDoc = await getDoc(doc(db, "drivers", driverId));
        if (driverDoc.exists()) {
            const driverData = driverDoc.data();
            if (driverData.imageUrl) {
                const driverAvatar = document.getElementById(`driver-avatar-${driverId}`);
                if (driverAvatar) {
                    driverAvatar.innerHTML = `<img src="${driverData.imageUrl}" alt="${order.driverName}">`;
                    order.driverPhoto = driverData.imageUrl;
                }
            }
        }
    } catch (error) {
        console.error("خطأ في جلب صورة السائق:", error);
    }
}

function getOrderStatusInfo(status) {
    switch (status) {
        case "pending": return { class: "status-pending", text: "قيد الانتظار" };
        case "accepted": return { class: "status-accepted", text: "قيد التحضير" };
        case "ready": return { class: "status-ready", text: "جاهز للتوصيل" };
        case "in_progress": return { class: "status-in_progress", text: "قيد التنفيذ" };
        case "delivered": return { class: "status-delivered", text: "تم التوصيل" };
        case "cancelled": return { class: "status-cancelled", text: "ملغي" };
        default: return { class: "status-pending", text: "قيد الانتظار" };
    }
}

function showError(message) {
    const errorMessageHtml = `<div class="error-container"><i class="fas fa-exclamation-triangle"></i><h3>حدث خطأ</h3><p>${message}</p></div>`;
    if (mapContainer) mapContainer.innerHTML = errorMessageHtml;
    if (orderStatusContainer) orderStatusContainer.innerHTML = errorMessageHtml;
    if (driverInfoCard) driverInfoCard.style.display = "none";
    if (orderDetails) orderDetails.innerHTML = "";
    if (etaContainer) etaContainer.style.display = "none";
}

function logoutUser() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userId");
    cleanup(); // إلغاء الاشتراك قبل إعادة التوجيه
    window.location.href = "login.html";
}

function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector(".mobile-menu");
    const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");
    const mobileMenuSidebar = document.querySelector(".mobile-menu-sidebar");
    const mobileMenuClose = document.querySelector(".mobile-menu-close");
    const mobileMenuContent = document.querySelector(".mobile-menu-content");
    const navMenu = document.querySelector("nav ul");

    function isMobileView() {
        return window.innerWidth <= 768;
    }

    function closeMobileMenu() {
        if (mobileMenuSidebar) mobileMenuSidebar.classList.remove("active");
        if (mobileMenuOverlay) mobileMenuOverlay.classList.remove("active");
        document.body.style.overflow = "auto";
    }

    function setupMobileMenuContent() {
        if (isMobileView() && mobileMenuContent && navMenu) {
            mobileMenuContent.innerHTML = "";
            const mobileNavList = document.createElement("ul");
            const navItems = navMenu.querySelectorAll("li");
            navItems.forEach(item => {
                const clonedItem = item.cloneNode(true);
                mobileNavList.appendChild(clonedItem);
            });
            mobileMenuContent.appendChild(mobileNavList);
        } else if (mobileMenuContent) {
            mobileMenuContent.innerHTML = "";
        }
    }

    setupMobileMenuContent();

    if (mobileMenuBtn && mobileMenuSidebar && mobileMenuOverlay) {
        mobileMenuBtn.addEventListener("click", () => {
            if (isMobileView()) {
                mobileMenuSidebar.classList.toggle("active");
                mobileMenuOverlay.classList.toggle("active");
                document.body.style.overflow = mobileMenuSidebar.classList.contains("active") ? "hidden" : "auto";
            }
        });
    }

    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener("click", closeMobileMenu);
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener("click", closeMobileMenu);
    }

    window.addEventListener("resize", () => {
        setupMobileMenuContent();
        if (!isMobileView()) {
            closeMobileMenu();
        }
    });
}