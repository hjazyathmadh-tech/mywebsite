import {
  db,
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  onAuthStateChanged,
  signOut,
  auth
} from "./firebase.js";

// تعريف المتغيرات مع التحقق من وجود العناصر
const ordersContainer = document.getElementById("ordersContainer");
const modal = document.getElementById("orderDetailsModal");
const closeModalBtn = document.querySelector(".close-modal");
const statusUpdateButtons = document.getElementById("statusUpdateButtons");
const driverNameEl = document.getElementById("driverName");
const currentOrdersEl = document.getElementById("current-orders");
const completedOrdersEl = document.getElementById("completed-orders");
const avgDeliveryTimeEl = document.getElementById("avg-delivery-time");

// متغيرات عامة
let currentOrderId = null;

// تعريف متغيرات المصفوفات
let currentOrders = [];
let completedOrders = [];

// التحقق من تسجيل الدخول وصلاحيات السائق
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "driver-login.html";
    return;
  }

  // عرض اسم السائق من التخزين المحلي
  if (driverNameEl) {
    driverNameEl.textContent = localStorage.getItem("driverName") || "السائق";
  }

  // إعداد مستمع للتحديثات الفورية للطلبات
  setupOrdersListener(user.uid);

  // إعداد مستمعي أحداث القائمة الجانبية
  setupMenuListeners(user.uid);
});

// إعداد مستمعي أحداث القائمة الجانبية
function setupMenuListeners(driverId) {
  const homeLink = document.getElementById("home-link");
  const acceptedOrdersLink = document.getElementById("accepted-orders-link");
  const completedOrdersLink = document.getElementById("completed-orders-link");
  const accountLink = document.getElementById("account-link");

  // استدعاء دالة عرض الطلبات المعلقة افتراضياً
  displayPendingOrders();

  if (homeLink) {
    homeLink.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveMenuItem(homeLink);
      displayPendingOrders();
    });
  }

  if (acceptedOrdersLink) {
    acceptedOrdersLink.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveMenuItem(acceptedOrdersLink);
      displayInProgressOrders(driverId);
    });
  }

  if (completedOrdersLink) {
    completedOrdersLink.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveMenuItem(completedOrdersLink);
      displayCompletedOrders(driverId);
    });
  }

  if (accountLink) {
    accountLink.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveMenuItem(accountLink);
      displayAccountInfo();
    });
  }
}

// تعيين العنصر النشط في القائمة الجانبية
function setActiveMenuItem(activeItem) {
  // إزالة الفئة النشطة من جميع عناصر القائمة
  document.querySelectorAll(".sidebar-menu a").forEach(item => {
    item.classList.remove("active");
  });

  // إضافة الفئة النشطة للعنصر المحدد
  activeItem.classList.add("active");
}

// عرض الطلبات المعلقة (حالة pending) ونوع التوصيل (delivery)
function displayPendingOrders() {
  const ordersQuery = query(
    collection(db, "orders"),
    where("status", "==", "pending"),
    where("deliveryType", "==", "delivery")
  );

  fetchAndDisplayOrders(ordersQuery, "طلبات جديدة");
}

// عرض الطلبات الجارية (حالة accepted)
function displayInProgressOrders(driverId) {
  const ordersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "accepted")
  );

  fetchAndDisplayOrders(ordersQuery, "الطلبات المقبولة");
}

// عرض الطلبات المكتملة (حالة completed)
function displayCompletedOrders(driverId) {
  const ordersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "completed")
  );

  fetchAndDisplayOrders(ordersQuery, "الطلبات المنتهية");
}

// عرض معلومات الحساب
function displayAccountInfo() {
  if (ordersContainer) {
    ordersContainer.innerHTML = `
      <div class="empty-orders">
        <i class="fas fa-user-circle fs-1"></i>
        <h4>معلومات حسابي</h4>
        <div style="text-align: right; margin-top: 20px; max-width: 500px;">
          <p><strong>الاسم:</strong> ${localStorage.getItem("driverName") || "غير متوفر"}</p>
          <p><strong>البريد الإلكتروني:</strong> ${auth.currentUser ? auth.currentUser.email : "غير متوفر"}</p>
          <p><strong>رقم الهاتف:</strong> ${localStorage.getItem("driverPhone") || "غير متوفر"}</p>
          <p><strong>نوع المركبة:</strong> ${localStorage.getItem("vehicleType") || "غير متوفر"}</p>
          <p><strong>رقم لوحة المركبة:</strong> ${localStorage.getItem("vehiclePlate") || "غير متوفر"}</p>
        </div>
      </div>
    `;
  }
}

// جلب وعرض الطلبات بناءً على الاستعلام المحدد
function fetchAndDisplayOrders(ordersQuery, sectionTitle) {
  if (ordersContainer) {
    ordersContainer.innerHTML = "";
  }

  // استخدام onSnapshot للاستماع للتحديثات الفورية للطلبات
  onSnapshot(ordersQuery, (snapshot) => {
    const orders = [];

    // مسح المحتوى الحالي قبل إعادة الرسم
    if (ordersContainer) {
      ordersContainer.innerHTML = "";
    }

    if (snapshot.empty) {
      // لا توجد طلبات
      if (ordersContainer) {
        ordersContainer.innerHTML = `
          <div class="empty-orders">
            <i class="fas fa-inbox fs-1"></i>
            <h4>لا توجد طلبات في ${sectionTitle}</h4>
            <p>سيتم عرض الطلبات هنا عندما تصبح متاحة.</p>
          </div>
        `;
      }
      return;
    }

    snapshot.forEach((doc) => {
      const order = {
        id: doc.id,
        ...doc.data()
      };

      orders.push(order);
    });

    // تحديث عنوان الصفحة
    const headerTitle = document.querySelector(".header h1");
    if (headerTitle) {
      headerTitle.textContent = `لوحة تحكم السائق - ${sectionTitle}`;
    }

    // عرض الطلبات
    orders.forEach((order, index) => {
      const orderCard = document.createElement("div");
      orderCard.className = "order-card";
      if (orderCard.style) {
        orderCard.style.animationDelay = `${index * 0.1}s`;
      }

      // Format date if available
      let orderTime = "-";
      if (order.createdAt) {
        const date = order.createdAt.toDate();
        orderTime = date.toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit"
        });
      }

      orderCard.innerHTML = `
        <div class="order-header">
          <div class="order-id">#${order.id.substring(0, 8)}</div>
          <div class="order-status status-${order.status}">${translateStatus(order.status)}</div>
        </div>
        <div class="order-customer">
          <i class="fas fa-user"></i> ${order.customerName || "عميل غير معروف"}
        </div>
        <div class="order-details">
          <div class="detail-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${order.pickup || "مكان الانطلاق غير محدد"}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-flag-checkered"></i>
            <span>${order.destination || "مكان التوصيل غير محدد"}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-clock"></i>
            <span>${orderTime}</span>
          </div>
        </div>
      `;

      orderCard.addEventListener("click", () => {
        openModal(order.id, order);
      });

      if (ordersContainer) {
        ordersContainer.appendChild(orderCard);
      }
    });
  });
}

// إعداد مستمع للتحديثات الفورية للطلبات
function setupOrdersListener(driverId) {
  // استخدام onSnapshot للاستماع للتحديثات الفورية للطلبات المعلقة (توصيل فقط)
  const pendingOrdersQuery = query(
    collection(db, "orders"),
    where("status", "==", "pending"),
    where("deliveryType", "==", "delivery")
  );

  onSnapshot(pendingOrdersQuery, (snapshot) => {
    updateStatistics();
  });

  // استخدام onSnapshot للاستماع للتحديثات الفورية للطلبات الجارية
  const inProgressOrdersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "accepted")
  );

  onSnapshot(inProgressOrdersQuery, (snapshot) => {
    updateStatistics();
  });

  // استخدام onSnapshot للاستماع للتحديثات الفورية للطلبات المكتملة
  const completedOrdersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "completed")
  );

  onSnapshot(completedOrdersQuery, (snapshot) => {
    updateStatistics();
  });
}

// تحديث الإحصائيات
function updateStatistics() {
  const driverId = auth.currentUser ? auth.currentUser.uid : null;
  if (!driverId) return;

  // الحصول على الطلبات المعلقة (توصيل فقط)
  const pendingOrdersQuery = query(
    collection(db, "orders"),
    where("status", "==", "pending"),
    where("deliveryType", "==", "delivery")
  );

  // الحصول على الطلبات الجارية
  const inProgressOrdersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "accepted")
  );

  // الحصول على الطلبات المكتملة
  const completedOrdersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "completed")
  );

  Promise.all([
    getDocs(pendingOrdersQuery),
    getDocs(inProgressOrdersQuery),
    getDocs(completedOrdersQuery)
  ]).then(([pendingSnapshot, inProgressSnapshot, completedSnapshot]) => {
    // حساب عدد الطلبات الحالية (المعلقة + الجارية)
    const currentOrdersCount = pendingSnapshot.size + inProgressSnapshot.size;

    // حساب عدد الطلبات المكتملة
    const completedOrdersCount = completedSnapshot.size;

    // حساب متوسط وقت التوصيل
    let totalDeliveryTime = 0;
    let deliveredCount = 0;

    completedSnapshot.forEach((doc) => {
      const order = doc.data();
      if (order.createdAt && order.deliveredAt) {
        const createdAt = order.createdAt.toDate();
        const deliveredAt = order.deliveredAt.toDate();
        const deliveryTimeMinutes = (deliveredAt - createdAt) / (1000 * 60);
        totalDeliveryTime += deliveryTimeMinutes;
        deliveredCount++;
      }
    });

    const avgDeliveryTime = deliveredCount > 0 ? Math.round(totalDeliveryTime / deliveredCount) : 0;

    // تحديث الإحصائيات في الواجهة
    if (currentOrdersEl) {
      currentOrdersEl.textContent = currentOrdersCount;
    }
    if (completedOrdersEl) {
      completedOrdersEl.textContent = completedOrdersCount;
    }
    if (avgDeliveryTimeEl) {
      avgDeliveryTimeEl.textContent = avgDeliveryTime + " دقيقة";
    }
  }).catch(error => {
    console.error("خطأ في تحديث الإحصائيات:", error);
  });
}

function translateStatus(status) {
  switch (status) {
    case "pending": return "في الانتظار";
    case "accepted": return "مقبول";
    case "in_progress": return "قيد التنفيذ";
    case "completed": return "مكتمل";
    default: return status;
  }
}

// عرض تفاصيل الطلب
async function openModal(id, data) {
  // Format date if available
  let orderDate = "-";
  if (data.createdAt) {
    const date = data.createdAt.toDate();
    orderDate = date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const modalOrderId = document.getElementById("modal-order-id");
  const modalCustomerName = document.getElementById("modal-customer-name");
  const modalCustomerAddress = document.getElementById("modal-customer-address");
  const modalDetailedAddress = document.getElementById("modal-detailed-address");
  const modalCustomerPhone = document.getElementById("modal-customer-phone");
  const modalOrderStatus = document.getElementById("modal-order-status");
  const modalOrderTotal = document.getElementById("modal-order-total");

  if (modalOrderId) modalOrderId.textContent = "#" + id;
  if (modalCustomerName) modalCustomerName.textContent = data.customerName || "-";
  if (modalCustomerAddress) modalCustomerAddress.textContent = data.destination || "-";
  if (modalDetailedAddress) modalDetailedAddress.textContent = (data.location && data.location.address) ? data.location.address : (data.address || "-");
  if (modalCustomerPhone) modalCustomerPhone.textContent = data.customerPhone || "-";
  if (modalOrderStatus) modalOrderStatus.textContent = translateStatus(data.status);
  if (modalOrderTotal) modalOrderTotal.textContent = (data.total || 0) + " ريال";

  // Display order items if available
  const orderItemsContainer = document.getElementById("modal-order-items");
  if (orderItemsContainer) {
    orderItemsContainer.innerHTML = "";

    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(item => {
        const itemElement = document.createElement("div");
        itemElement.className = "order-item";
        itemElement.innerHTML = `
          <span>${item.name || "منتج غير معروف"} (x${item.quantity || 1})</span>
          <span>${item.price || 0} ريال</span>
        `;
        orderItemsContainer.appendChild(itemElement);
      });
    } else {
      const noItemsElement = document.createElement("div");
      noItemsElement.className = "order-item";
      noItemsElement.innerHTML = "<span>لا توجد تفاصيل للمنتجات</span>";
      orderItemsContainer.appendChild(noItemsElement);
    }
  }

  const modalOrderNotes = document.getElementById("modal-order-notes");
  if (modalOrderNotes) {
    modalOrderNotes.textContent = data.notes || "لا توجد ملاحظات";
  }

  // إنشاء أزرار تحديث الحالة بناءً على الحالة الحالية
  if (statusUpdateButtons) {
    statusUpdateButtons.innerHTML = "";

    if (data.status === "pending") {
      const acceptOrderBtn = document.createElement("button");
      acceptOrderBtn.innerHTML = '<i class="fas fa-check"></i> قبول الطلب';
      acceptOrderBtn.className = "accept-btn";
      acceptOrderBtn.onclick = async () => {
        // تحديث حالة الطلب إلى "accepted" أولاً
        await updateOrderStatusInDB(id, "accepted");
        // التوجيه إلى صفحة الخريطة مع تمرير معرف الطلب
        window.location.href = `driver-map.html?orderId=${id}`;
      };
      statusUpdateButtons.appendChild(acceptOrderBtn);
    } else if (data.status === "in_progress") {
      const completeOrderBtn = document.createElement("button");
      completeOrderBtn.innerHTML = '<i class="fas fa-check-circle"></i> إنهاء الطلب';
      completeOrderBtn.className = "complete-btn";
      completeOrderBtn.onclick = async () => {
        await updateOrderStatusInDB(id, "completed");
      };
      statusUpdateButtons.appendChild(completeOrderBtn);
    }
  }

  if (modal) {
    modal.style.display = "flex";
  }
}

// دالة لتحديث حالة الطلب
async function updateOrderStatusInDB(orderId, newStatus) {
  // الحصول على معرف السائق الحالي
  const driverId = auth.currentUser ? auth.currentUser.uid : null;

  // استخدام دالة updateOrderStatus من firebase.js
  try {
    if (newStatus === "accepted") {
      // إضافة بيانات السائق إلى الطلب عند قبوله
      await updateDoc(doc(db, "orders", orderId), {
        status: "accepted",
        driverId: driverId,
        driverName: localStorage.getItem("driverName") || "سائق",
        driverPhone: localStorage.getItem("driverPhone") || "",
        carPlate: localStorage.getItem("vehiclePlate") || "",
        driverPhoto: localStorage.getItem("driverPhoto") || ""
      });
    } else if (newStatus === "in_progress") {
      await updateDoc(doc(db, "orders", orderId), {
        status: "in_progress",
        driverId: driverId
      });
    } else if (newStatus === "completed") {
      await updateDoc(doc(db, "orders", orderId), {
        status: "completed",
        completedAt: new Date(),
        driverId: driverId
      });
    }

    showNotification("تم تحديث حالة الطلب بنجاح", 'success');
    closeModal();
  } catch (error) {
    console.error("خطأ في تحديث حالة الطلب:", error);
    showNotification("حدث خطأ أثناء تحديث حالة الطلب", 'danger');
  }
}

function closeModal() {
  if (modal) {
    modal.style.display = "none";
  }
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeModal);
}

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// تسجيل الخروج
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.href = "driver-login.html";
  });
}



// دالة لعرض الإشعارات
function showNotification(message, type = 'info') {
    // تحديد لون الإشعار حسب النوع
    let bgColor = '#3498db'; // معلومات (الأزرق)
    if (type === 'success') bgColor = '#2ecc71'; // نجاح (الأخضر)
    else if (type === 'warning') bgColor = '#f39c12'; // تحذير (الأصفر)
    else if (type === 'danger') bgColor = '#e74c3c'; // خطأ (الأحمر)

    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '20px';
    notification.style.backgroundColor = bgColor;
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.style.maxWidth = '500px';
    notification.style.transform = 'translateX(-120%)';
    notification.style.transition = 'transform 0.3s ease';
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <span style="cursor: pointer; margin-right: 10px;" onclick="this.parentElement.parentElement.remove()">&times;</span>
        </div>
    `;

    // إضافة الإشعار إلى الصفحة
    document.body.appendChild(notification);

    // إظهار الإشعار
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    // إخفاء الإشعار تلقائياً بعد 5 ثوانٍ
    setTimeout(() => {
        notification.style.transform = 'translateX(-120%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    }, 5000);
}