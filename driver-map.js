import {
    db,
    doc,
    getDoc,
    updateDoc,
    onAuthStateChanged,
    auth
} from "./firebase.js";

// DOM Elements
const mapElement = document.getElementById("map");
const backBtn = document.getElementById("backBtn");
const completeOrderBtn = document.getElementById("completeOrderBtn");
const customerNameEl = document.getElementById("customerName");
const customerPhoneEl = document.getElementById("customerPhone");
const customerAddressEl = document.getElementById("customerAddress");
const notification = document.getElementById("notification");

// Global variables
let map = null;
let driverMarker = null;
let customerMarker = null;
let routeLayer = null;
let watchId = null;
let currentOrderId = null;
let orderData = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    // Get order ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentOrderId = urlParams.get('orderId');

    if (!currentOrderId) {
        showNotification("لم يتم تحديد طلب", "error");
        setTimeout(() => {
            window.location.href = "drivers.html";
        }, 2000);
        return;
    }

    // Check if user is logged in
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "driver-login.html";
            return;
        }

        // Load order data
        loadOrderData();
    });

    // Setup event listeners
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            // Stop watching driver location
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }

            window.location.href = "drivers.html";
        });
    }

    if (completeOrderBtn) {
        completeOrderBtn.addEventListener("click", completeOrder);
    }
});

// Load order data from Firebase
async function loadOrderData() {
    try {
        const orderDoc = doc(db, "orders", currentOrderId);
        const orderSnapshot = await getDoc(orderDoc);

        if (!orderSnapshot.exists()) {
            showNotification("الطلب غير موجود", "error");
            setTimeout(() => {
                window.location.href = "drivers.html";
            }, 2000);
            return;
        }

        orderData = orderSnapshot.data();

        // Update order info in the UI
        if (customerNameEl) customerNameEl.textContent = orderData.customerName || "-";
        if (customerPhoneEl) customerPhoneEl.textContent = orderData.customerPhone || "-";
        if (customerAddressEl) customerAddressEl.textContent = 
            (orderData.location && orderData.location.address) ? orderData.location.address : 
            (orderData.address || "-");

        // Initialize map
        initMap();

        // Start tracking driver location and show route
        if (orderData.location) {
            trackDriverLocation(orderData.location);
        } else {
            showNotification("لا يوجد موقع محدد للعميل", "warning");
        }
    } catch (error) {
        console.error("Error loading order data:", error);
        showNotification("حدث خطأ أثناء تحميل بيانات الطلب", "error");
    }
}

// Initialize map
function initMap() {
    // Initialize map with a default location (Jeddah)
    map = L.map(mapElement).setView([21.485811, 39.192504], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    return map;
}

// Track driver location and show route to customer
function trackDriverLocation(orderLocation) {
    if (!navigator.geolocation) {
        showNotification("متصفحك لا يدعم تحديد الموقع", "error");
        return;
    }

    // Add customer marker
    if (orderLocation && orderLocation.lat && orderLocation.lng) {
        customerMarker = L.marker([orderLocation.lat, orderLocation.lng], {
            title: "موقع العميل"
        }).addTo(map);

        // Set map view to customer location initially
        map.setView([orderLocation.lat, orderLocation.lng], 13);
    }

    // Start watching driver's position
    watchId = navigator.geolocation.watchPosition(
        async (position) => {
            const driverLocation = [position.coords.latitude, position.coords.longitude];

            // Update or create driver marker
            if (driverMarker) {
                driverMarker.setLatLng(driverLocation);
            } else {
                driverMarker = L.marker(driverLocation, {
                    title: "موقعك الحالي",
                    icon: L.icon({
                        iconUrl: 'images/car.png',
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                        popupAnchor: [0, -20]
                    })
                }).addTo(map);
            }

            // Draw route if customer location is available
            if (orderLocation && orderLocation.lat && orderLocation.lng) {
                drawRoute(driverLocation, [orderLocation.lat, orderLocation.lng]);
            }

            // Persist driver location to Firestore for real-time tracking on order-tracking page
            try {
                await updateDoc(doc(db, "orders", currentOrderId), {
                    driverLocation: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        updatedAt: new Date()
                    }
                });
            } catch (err) {
                console.error("Failed to update driver location in Firestore:", err);
            }
        },
        (error) => {
            console.error("Error getting driver location:", error);
            showNotification("لا يمكن تحديد موقعك الحالي", "warning");
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// Draw route between driver and customer
async function drawRoute(start, end) {
    // Remove old route if exists
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }

    try {
        // Use OpenRouteService API to draw the route
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFiYWQwM2ExNjI2NjRmYzg5YWU1ZDNkZDNmNjMxY2M4IiwiaCI6Im11cm11cjY0In0=&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const route = data.features[0];
            const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

            // Draw route on map
            routeLayer = L.polyline(coordinates, {
                color: '#e74c3c',
                weight: 5,
                opacity: 0.7
            }).addTo(map);

            // Fit map to show the entire route
            map.fitBounds(routeLayer.getBounds(), { padding: [20, 20] });
        }
    } catch (error) {
        console.error("Error drawing route:", error);
        showNotification("لا يمكن رسم المسار حالياً", "warning");

        // Draw a straight line as fallback
        routeLayer = L.polyline([start, end], {
            color: '#e74c3c',
            weight: 5,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(map);

        // Fit map to show both points
        const group = new L.featureGroup([driverMarker, customerMarker]);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Complete the order
async function completeOrder() {
    if (!currentOrderId) {
        showNotification("لم يتم تحديد طلب", "error");
        return;
    }

    try {
        // Update order status to delivered
        await updateDoc(doc(db, "orders", currentOrderId), {
            status: "delivered",
            deliveredAt: new Date(),
            driverId: auth.currentUser.uid
        });

        showNotification("تم إنهاء الطلب بنجاح", "success");

        // Stop watching driver location
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }

        // Redirect to drivers page after a short delay
        setTimeout(() => {
            window.location.href = "drivers.html";
        }, 2000);
    } catch (error) {
        console.error("Error completing order:", error);
        showNotification("حدث خطأ أثناء إنهاء الطلب", "error");
    }
}

// Show notification
function showNotification(message, type = "info") {
    notification.textContent = message;
    notification.className = "notification";
    notification.classList.add(type);
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 5000);
}
