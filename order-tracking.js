// Order Tracking Page JavaScript - Version 2.0 (مصحح الأخطاء)
import { auth, db } from "./zakarya.js";
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
let unsubscribeOrderListener = null; // لإلغاء الاشتراك في Firebase

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get("orderId");

    if (!orderId) {
        showError("معرف الطلب غير موجود");
        return;
    }

    checkUserLogin();
    initMap();
    loadOrderData(); // يبدأ الاستماع لتحديثات الطلب والموقع

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logoutUser);
    }
    
    // تصحيح: إضافة تعريف للدالة أو حذف الاستدعاء
    setupMobileMenu(); 

    // تنظيف الاشتراك عند مغادرة الصفحة
    window.addEventListener('beforeunload', cleanup); 
});

// دالة لتنظيف الاشتراكات
function cleanup() {
    if (unsubscribeOrderListener) {
        unsubscribeOrderListener();
        console.log("تم إلغاء الاشتراك في تحديثات الطلب.");
    }
}

// Check if user is logged in
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

// Load order data from Firebase (تم دمج كل منطق التحديث هنا)
function loadOrderData() {
    orderStatusContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>جاري تحميل بيانات الطلب...</p>
        </div>
    `;

    const orderRef = doc(db, "orders", orderId);

    // الاشتراك الوحيد في تحديثات الطلب
    unsubscribeOrderListener = onSnapshot(orderRef, (docSnap) => {
        if (docSnap.exists()) {
            // تحديث كائن الطلب العام
            order = {
                id: docSnap.id,
                ...docSnap.data()
            };

            // تحديث UI الحالة والتفاصيل
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

// دالة موحدة لتحديث معلومات السائق والخريطة
function updateDriverAndMap(currentOrder) {
    if (!currentOrder || !map || !driverMarker || !customerMarker) return;

    // 1. تحديث موقع العميل
    if (currentOrder.location && currentOrder.location.lat && currentOrder.location.lng) {
        const customerLocation = [currentOrder.location.lat, currentOrder.location.lng];
        customerMarker.setLatLng(customerLocation);
        customerMarker.bindPopup("موقع العميل").openPopup();
    }
    
    // 2. تحديث معلومات السائق (إذا كان موجوداً)
    if (currentOrder.driverId) {
        updateDriverInfo(); // سيتولى جلب الصورة إذا لم تكن موجودة

        // 3. تحديث موقع السائق وخط الطريق
        if (currentOrder.driverLocation && currentOrder.driverLocation.lat && currentOrder.driverLocation.lng) {
            const driverLocation = [currentOrder.driverLocation.lat, currentOrder.driverLocation.lng];
            
            console.log("📍 موقع السائق من Firebase (عبر الاشتراك الموحد):", driverLocation[0], driverLocation[1]);

            driverMarker.setLatLng(driverLocation);
            driverMarker.setOpacity(1);
            driverMarker.bindPopup("موقع السائق").openPopup();

            // تحديث خط الطريق فقط إذا كانت الحالة تتطلب تتبعاً
            if (currentOrder.status === "in_progress" || currentOrder.status === "ready") {
                 if (currentOrder.location && currentOrder.location.lat && currentOrder.location.lng) {
                    const customerLocation = [currentOrder.location.lat, currentOrder.location.lng];
                    updateRouteLine(driverLocation, customerLocation);
                }
            } else {
                 // إزالة خط الطريق في حالات الاكتمال/الإلغاء
                if (routeLine) {
                    map.removeLayer(routeLine);
                    routeLine = null;
                }
            }
            
            // ضبط عرض الخريطة ليشمل العلامتين عند التحديث الأولي
            const group = new L.featureGroup([customerMarker, driverMarker]);
            map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 15 });

        } else {
            // إخفاء علامة السائق في حال عدم توفر الموقع
            driverMarker.setOpacity(0);
            if (routeLine) {
                map.removeLayer(routeLine);
                routeLine = null;
            }
        }
    } else {
        // إخفاء معلومات وعلامة السائق إذا لم يتم تعيين سائق
        if (driverInfoCard) driverInfoCard.style.display = "none";
        if (driverMarker) driverMarker.setOpacity(0);
        if (routeLine) {
            map.removeLayer(routeLine);
            routeLine = null;
        }
    }
}

// ... (بقية دوال updateOrderStatus و updateOrderDetails و updateDriverInfo و fetchDriverPhoto و initMap لم تتغير بشكل كبير) ...

// Update order status in the UI
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

// Update order details in the UI
function updateOrderDetails() {
    if (!order || !orderDetails) return;

    let formattedDate = "غير محدد";
    if (order.createdAt && order.createdAt.toDate) {
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

// Initialize Leaflet Map
function initMap() {
    if (!mapContainer) return;

    const defaultLocation = [21.485811, 39.192504];
    map = L.map(mapContainer).setView(defaultLocation, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // استخدام أيقونة Font Awesome لتكون أوضح
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

    driverMarker = L.marker(defaultLocation, {
        icon: L.icon({
            iconUrl: "images/car.png",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        })
    }).addTo(map);
    driverMarker.bindPopup("موقع السائق");

    driverMarker.setOpacity(0);
}


// **تم حذف updateMapWithDriverLocation و updateDriverMarker و listenForDriverLocationUpdates**


// Update route line between driver and customer
async function updateRouteLine(driverLocation, customerLocation) {
    if (!map) return;

    // Remove existing route line
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }

    try {
        // تأكد من أن مفتاح API الخاص بك لخدمة OpenRouteService صالح
        const API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFiYWQwM2ExNjI2NjRmYzg5YWU1ZDNkZDNmNjMxY2M4IiwiaCI6Im11cm11cjY0In0=";
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${API_KEY}&start=${driverLocation[1]},${driverLocation[0]}&end=${customerLocation[1]},${customerLocation[0]}`);
        
        if (!response.ok) {
            throw new Error(`OpenRouteService HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const route = data.features[0];
            const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

            // Draw route on map
            routeLine = L.polyline(coordinates, {
                color: '#e74c3c',
                weight: 5,
                opacity: 0.7
            }).addTo(map);

            // Fit map to show the entire route (اختياري، قد يسبب اهتزازاً مع التحديثات المتكررة)
            // map.fitBounds(routeLine.getBounds(), { padding: [20, 20], maxZoom: 15 });
        }
    } catch (error) {
        console.error("Error drawing route (استخدام خط مستقيم كبديل):", error);

        // Draw a straight line as fallback
        routeLine = L.polyline([driverLocation, customerLocation], {
            color: "#e74c3c",
            weight: 4,
            opacity: 0.7,
            dashArray: "10, 10"
        }).addTo(map);
    }
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
    const errorMessageHtml = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>حدث خطأ</h3>
                <p>${message}</p>
            </div>
        `;

    if (mapContainer) mapContainer.innerHTML = errorMessageHtml;
    if (orderStatusContainer) orderStatusContainer.innerHTML = errorMessageHtml;
    if (driverInfoCard) driverInfoCard.style.display = "none";
    if (orderDetails) orderDetails.innerHTML = "";
}

// Logout user
function logoutUser() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhone");
    // window.location.href = "login.html"; // قد تحتاج لإعادة التوجيه
}

// تصحيح: إضافة تعريف للدالة الوهمية لـ setupMobileMenu
function setupMobileMenu() {
    // هذه الدالة كانت مفقودة، يمكن تركها فارغة إذا لم تكن بحاجة إليها
    // console.log("إعداد القائمة المتنقلة...");
}