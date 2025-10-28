import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  signOut,
  saveDriverInfo,
  loadDriverInfo
} from "./zakarya.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { app } from "./zakarya.js";

const auth = getAuth(app);
let driverId = null;

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
onAuthStateChanged(auth, async (user) => {
  if (user) {
    driverId = user.uid;
    console.log("🚗 السائق الحالي:", driverId);
    
    // عرض اسم السائق وصورته من التخزين المحلي
    if (driverNameEl) {
      driverNameEl.textContent = localStorage.getItem("driverName") || "السائق";
    }

    // تحميل صورة السائق
    const driverProfileImage = document.getElementById("driverProfileImage");
    if (driverProfileImage) {
      const savedPhotoURL = localStorage.getItem("driverPhotoURL");
      if (savedPhotoURL) {
        driverProfileImage.src = savedPhotoURL;
      }
    }

    // تحميل صورة السائق من قاعدة البيانات
    loadDriverPhotoFromDatabase(driverId);
    
    // تهيئة صفحة السائق
    initializeDriverPage();

    // إعداد مستمعي أحداث القائمة الجانبية
    setupMenuListeners(driverId);

    // إعداد القائمة المنسدلة للجوال
    setupMobileDropdownMenu();
  } else {
    console.log("❌ لم يتم تسجيل الدخول");
    window.location.href = "driver-login.html";
  }
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

// عرض الطلبات التي حالتها "accepted" ونوعها "delivery" (توصيل)
function displayPendingOrders() {
  // إظهار حاوية الطلبات وإخفاء نموذج بيانات السائق
  if (ordersContainer) {
    ordersContainer.style.display = "grid";
  }

  const driverAccountForm = document.getElementById("driverAccountForm");
  if (driverAccountForm) {
    driverAccountForm.style.display = "none";
  }

  const ordersQuery = query(
    collection(db, "orders"),
    where("status", "==", "accepted"),
    where("deliveryType", "==", "delivery")
  );

  fetchAndDisplayOrders(ordersQuery, "الطلبات المقبولة");
}

// عرض الطلبات الجارية (حالة ready)
function displayInProgressOrders(driverId) {
  // إظهار حاوية الطلبات وإخفاء نموذج بيانات السائق
  if (ordersContainer) {
    ordersContainer.style.display = "grid";
  }

  const driverAccountForm = document.getElementById("driverAccountForm");
  if (driverAccountForm) {
    driverAccountForm.style.display = "none";
  }

  const ordersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "ready")
  );

  fetchAndDisplayOrders(ordersQuery, "الطلبات الجارية");
}

// عرض الطلبات المكتملة (حالة completed)
function displayCompletedOrders(driverId) {
  // إظهار حاوية الطلبات وإخفاء نموذج بيانات السائق
  if (ordersContainer) {
    ordersContainer.style.display = "grid";
  }

  const driverAccountForm = document.getElementById("driverAccountForm");
  if (driverAccountForm) {
    driverAccountForm.style.display = "none";
  }

  const ordersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "completed")
  );

  fetchAndDisplayOrders(ordersQuery, "الطلبات المنتهية");
}

// عرض معلومات الحساب
function displayAccountInfo() {
  // إخفاء حاوية الطلبات وإظهار نموذج بيانات السائق
  if (ordersContainer) {
    ordersContainer.style.display = "none";
  }

  const driverAccountForm = document.getElementById("driverAccountForm");
  if (driverAccountForm) {
    driverAccountForm.style.display = "block";

    // تحميل بيانات السائق المحفوظة مسبقًا
    loadDriverData();

    // إعداد مستمعي الأحداث للنموذج
    setupDriverFormListeners();
  }
}

// تحميل صورة السائق من قاعدة البيانات
async function loadDriverPhotoFromDatabase(driverId) {
  try {
    const driverDoc = await getDoc(doc(db, "drivers", driverId));
    if (driverDoc.exists()) {
      const data = driverDoc.data();

      // جلب صورة السائق من Firestore
      const driverProfileImage = document.getElementById("driverProfileImage");
      if (driverProfileImage) {
        if (data.imageUrl) {
          driverProfileImage.src = data.imageUrl;
          // حفظ رابط الصورة في التخزين المحلي
          localStorage.setItem("driverPhotoURL", data.imageUrl);
        } else {
          // عرض الصورة الافتراضية
          driverProfileImage.src = "images/driver-avatar.png";
          localStorage.setItem("driverPhotoURL", "images/driver-avatar.png");
        }
      }

      // تحديث صورة السائق في صفحة الحساب
      const driverImage = document.getElementById("driverImage");
      if (driverImage) {
        if (data.imageUrl) {
          driverImage.src = data.imageUrl;
          driverImage.style.display = "block";
        } else {
          driverImage.src = "images/driver-avatar.png";
          driverImage.style.display = "block";
        }
      }
    }
  } catch (error) {
    console.error("خطأ في تحميل صورة السائق:", error);
  }
}

// تحميل بيانات السائق المحفوظة مسبقًا
async function loadDriverData() {
  try {
    await loadDriverInfo();
    // تحديث صورة السائق في الشريط الجانبي
    loadDriverPhotoFromDatabase(auth.currentUser.uid);
  } catch (error) {
    console.error("خطأ في تحميل بيانات السائق:", error);
    showNotification("حدث خطأ أثناء تحميل بياناتك", 'danger');
  }
}

// إعداد مستمعي الأحداث لنموذج بيانات السائق
function setupDriverFormListeners() {
  const driverForm = document.getElementById("driverForm");

  // مستمع حدث إرسال النموذج
  if (driverForm) {
    driverForm.addEventListener("submit", saveDriverData);
  }

  // لم يعد النظام يحتاج إلى مستمعي أحداث للكاميرا والمعرض
  // سيتم عرض الصورة مباشرة من قاعدة البيانات
}

// حفظ بيانات السائق
async function saveDriverData(e) {
  e.preventDefault();

  // الحصول على قيم الحقول
  const driverNameInput = document.getElementById("driverNameInput");
  const phoneInput = document.getElementById("phoneInput");
  const plateNumberInput = document.getElementById("plateNumberInput");

  const driverName = driverNameInput ? driverNameInput.value : "";
  const phone = phoneInput ? phoneInput.value : "";
  const plateNumber = plateNumberInput ? plateNumberInput.value : "";
  const file = null; // لن يتم رفع صورة من خلال هذا النموذج

  // التحقق من الحقول المطلوبة
  if (!driverName || !phone || !plateNumber) {
    showNotification("يرجى تعبئة جميع الحقول المطلوبة", 'warning');
    return;
  }

  try {
    // حفظ البيانات في قاعدة البيانات والتخزين
    await saveDriverInfo(driverName, phone, plateNumber, null);

    // حفظ البيانات في التخزين المحلي
    localStorage.setItem("driverName", driverName);
    localStorage.setItem("driverPhone", phone);
    localStorage.setItem("vehiclePlate", plateNumber);

    // تحديث صورة السائق في الشريط الجانبي
    const driverProfileImage = document.getElementById("driverProfileImage");
    if (driverProfileImage) {
      const savedPhotoURL = localStorage.getItem("driverPhotoURL");
      if (savedPhotoURL) {
        driverProfileImage.src = savedPhotoURL;
      }
    }

    // تحديث اسم السائق في الواجهة
    const driverNameEl = document.getElementById("driverName");
    if (driverNameEl) {
      driverNameEl.textContent = driverName;
    }

    showNotification("تم حفظ بياناتك بنجاح", 'success');
  } catch (error) {
    console.error("خطأ في حفظ بيانات السائق:", error);
    showNotification("حدث خطأ أثناء حفظ بياناتك", 'danger');
  }
}

// دالة لإنشاء بطاقة طلب
function createOrderCard(orderId, orderData) {
  const orderCard = document.createElement("div");
  orderCard.classList.add("order-card");

  // Format date if available
  let orderTime = "-";
  if (orderData.createdAt) {
    const date = orderData.createdAt.toDate();
    orderTime = date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  orderCard.innerHTML = `
    <div class="order-header">
      <div class="order-id">#${orderId.substring(0, 8)}</div>
      <div class="order-status status-${orderData.status}">${translateStatus(orderData.status)}</div>
    </div>
    <div class="order-customer">
      <i class="fas fa-user"></i> ${orderData.customerName || "عميل غير معروف"}
    </div>
    <div class="order-details">
      <div class="detail-item">
        <i class="fas fa-map-marker-alt"></i>
        <span>${orderData.pickup || "مكان الانطلاق غير محدد"}</span>
      </div>
      <div class="detail-item">
        <i class="fas fa-flag-checkered"></i>
        <span>${orderData.destination || "مكان التوصيل غير محدد"}</span>
      </div>
      <div class="detail-item">
        <i class="fas fa-clock"></i>
        <span>${orderTime}</span>
      </div>
    </div>
  `;

  orderCard.addEventListener("click", () => {
    openModal(orderId, orderData);
  });

  return orderCard;
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

// تهيئة صفحة السائق
function initializeDriverPage() {
  // الاستعلام عن الطلبات الجارية
  const inProgressOrdersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "ready")
  );

  onSnapshot(inProgressOrdersQuery, (snapshot) => {
    updateStatistics();
  });

  // الاستعلام عن الطلبات المكتملة
  const completedOrdersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "delivered")
  );

  onSnapshot(completedOrdersQuery, (snapshot) => {
    updateStatistics();
  });

  // الاستعلام عن الطلبات المقبولة
  const acceptedOrdersQuery = query(
    collection(db, "orders"),
    where("status", "==", "accepted")
  );

  onSnapshot(acceptedOrdersQuery, (snapshot) => {
    // مسح المحتوى الحالي قبل إعادة الرسم
    if (ordersContainer) {
      ordersContainer.innerHTML = "";
    }

    // عرض الطلبات المقبولة
    snapshot.forEach((doc) => {
      const order = doc.data();
      const orderCard = createOrderCard(doc.id, order);
      if (ordersContainer) {
        ordersContainer.appendChild(orderCard);
      }
    });

    updateStatistics();
  });
}

// إعداد مستمع للتحديثات الفورية للطلبات
function setupOrdersListener(driverId) {
  // استخدام onSnapshot للاستماع للتحديثات الفورية للطلبات التي حالتها "accepted"
  const acceptedOrdersQuery = query(
    collection(db, "orders"),
    where("status", "==", "accepted")
  );

  onSnapshot(acceptedOrdersQuery, (snapshot) => {
    // مسح المحتوى الحالي قبل إعادة الرسم
    if (ordersContainer) {
      ordersContainer.innerHTML = "";
    }

    // عرض الطلبات المقبولة
    snapshot.forEach((doc) => {
      const order = doc.data();
      const orderCard = createOrderCard(doc.id, order);
      if (ordersContainer) {
        ordersContainer.appendChild(orderCard);
      }
    });
  });

  // دالة لإنشاء بطاقة طلب
  function createOrderCard(orderId, orderData) {
    const orderCard = document.createElement("div");
    orderCard.classList.add("order-card");
    
    // Format date if available
    let orderTime = "-";
    if (orderData.createdAt) {
      const date = orderData.createdAt.toDate();
      orderTime = date.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    
    orderCard.innerHTML = `
      <div class="order-header">
        <div class="order-id">#${orderId.substring(0, 8)}</div>
        <div class="order-status status-${orderData.status}">${translateStatus(orderData.status)}</div>
      </div>
      <div class="order-customer">
        <i class="fas fa-user"></i> ${orderData.customerName || "عميل غير معروف"}
      </div>
      <div class="order-details">
        <div class="detail-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>${orderData.pickup || "مكان الانطلاق غير محدد"}</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-flag-checkered"></i>
          <span>${orderData.destination || "مكان التوصيل غير محدد"}</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-clock"></i>
          <span>${orderTime}</span>
        </div>
      </div>
    `;
    
    orderCard.addEventListener("click", () => {
      openModal(orderId, orderData);
    });
    
    return orderCard;
  }

    updateStatistics();
  };

  // استخدام onSnapshot للاستماع للتحديثات الفورية للطلبات الجارية
  const inProgressOrdersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "ready")
  );

  onSnapshot(inProgressOrdersQuery, (snapshot) => {
    updateStatistics();
  });

  // استخدام onSnapshot للاستماع للتحديثات الفورية للطلبات المكتملة
  const completedOrdersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "delivered")
  );

  onSnapshot(completedOrdersQuery, (snapshot) => {
    updateStatistics();
  });


// تحديث الإحصائيات
function updateStatistics() {
  if (!driverId) return;

  // الحصول على الطلبات التي حالتها "accepted" (مقبولة من المحاسب)
  const pendingOrdersQuery = query(
    collection(db, "orders"),
    where("status", "==", "accepted")
  );

  // الحصول على الطلبات الجارية
  const inProgressOrdersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "ready")
  );

  // الحصول على الطلبات المكتملة
  const completedOrdersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId),
    where("status", "==", "delivered")
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
    case "pending": return "بانتظار المحاسب";
    case "accepted": return "مقبول من المحاسب";
    case "ready": return "جاهز للتوصيل";
    case "delivered": return "تم التوصيل";
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

    if (data.status === "accepted") {
      const acceptOrderBtn = document.createElement("button");
      acceptOrderBtn.innerHTML = '<i class="fas fa-check"></i> قبول الطلب';
      acceptOrderBtn.className = "accept-btn";
      acceptOrderBtn.onclick = async () => {
        await updateOrderStatusInDB(id, "ready");
        // إعادة التوجيه إلى صفحة driver-map مع بيانات الطلب
        window.location.href = `driver-map.html?orderId=${id}`;
      };
      statusUpdateButtons.appendChild(acceptOrderBtn);
    }
  }

  if (modal) {
    modal.style.display = "flex";
  }
}

// دالة لتحديث حالة الطلب
async function updateOrderStatusInDB(orderId, newStatus) {
  // استخدام معرف السائق العام
  if (!driverId) {
    console.error("لا يوجد سائق مسجل");
    return;
  }

  // استخدام دالة updateOrderStatus من zakarya.js
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
    } else if (newStatus === "ready") {
      await updateDoc(doc(db, "orders", orderId), {
        status: "ready",
        driverId: driverId,
        driverName: localStorage.getItem("driverName") || "سائق",
        driverPhone: localStorage.getItem("driverPhone") || "",
        carPlate: localStorage.getItem("vehiclePlate") || "",
        driverPhoto: localStorage.getItem("driverPhoto") || ""
      });
    } else if (newStatus === "delivered") {
      await updateDoc(doc(db, "orders", orderId), {
        status: "delivered",
        deliveredAt: new Date(),
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

// Setup mobile dropdown menu
function setupMobileDropdownMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileDropdown = document.getElementById("mobileDropdown");
  const mobileHomeLink = document.getElementById("mobile-home-link");
  const mobileAcceptedOrdersLink = document.getElementById("mobile-accepted-orders-link");
  const mobileCompletedOrdersLink = document.getElementById("mobile-completed-orders-link");
  const mobileAccountLink = document.getElementById("mobile-account-link");

  // Toggle dropdown menu
  if (mobileMenuBtn && mobileDropdown) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileDropdown.classList.toggle("show");
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (mobileDropdown && !mobileDropdown.contains(e.target) && mobileMenuBtn && !mobileMenuBtn.contains(e.target)) {
      mobileDropdown.classList.remove("show");
    }
  });

  // Setup mobile menu links
  if (mobileHomeLink) {
    mobileHomeLink.addEventListener("click", (e) => {
      e.preventDefault();
      mobileDropdown.classList.remove("show");
      displayPendingOrders();
    });
  }

  if (mobileAcceptedOrdersLink) {
    mobileAcceptedOrdersLink.addEventListener("click", (e) => {
      e.preventDefault();
      mobileDropdown.classList.remove("show");
      if (driverId) {
        displayInProgressOrders(driverId);
      }
    });
  }

  if (mobileCompletedOrdersLink) {
    mobileCompletedOrdersLink.addEventListener("click", (e) => {
      e.preventDefault();
      mobileDropdown.classList.remove("show");
      if (driverId) {
        displayCompletedOrders(driverId);
      }
    });
  }

  if (mobileAccountLink) {
    mobileAccountLink.addEventListener("click", (e) => {
      e.preventDefault();
      mobileDropdown.classList.remove("show");
      displayAccountInfo();
    });
  }
}