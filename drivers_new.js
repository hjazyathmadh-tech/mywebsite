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
  auth,
  saveDriverInfo,
  loadDriverInfo
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

  // إعداد القائمة المنسدلة للجوال
  setupMobileDropdownMenu();
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

// تحميل بيانات السائق المحفوظة مسبقًا
async function loadDriverData() {
  try {
    await loadDriverInfo();
  } catch (error) {
    console.error("خطأ في تحميل بيانات السائق:", error);
    showNotification("حدث خطأ أثناء تحميل بياناتك", 'danger');
  }
}

// إعداد مستمعي الأحداث لنموذج بيانات السائق
function setupDriverFormListeners() {
  const driverForm = document.getElementById("driverForm");
  const cameraBtn = document.getElementById("cameraBtn");
  const galleryBtn = document.getElementById("galleryBtn");
  const driverPhotoInput = document.getElementById("driverPhotoInput");

  // مستمع حدث إرسال النموذج
  if (driverForm) {
    driverForm.addEventListener("submit", saveDriverData);
  }

  // مستمع حدث زر الكاميرا
  if (cameraBtn) {
    cameraBtn.addEventListener("click", () => {
      // في بيئة حقيقية، سيتم فتح الكاميرا هنا
      // الآن سنقوم بمحاكاة فتح المعرض
      if (driverPhotoInput) {
        driverPhotoInput.setAttribute("capture", "camera");
        driverPhotoInput.click();
      }
    });
  }

  // مستمع حدث زر المعرض
  if (galleryBtn) {
    galleryBtn.addEventListener("click", () => {
      if (driverPhotoInput) {
        driverPhotoInput.removeAttribute("capture");
        driverPhotoInput.click();
      }
    });
  }

  // مستمع حدث اختيار الصورة
  if (driverPhotoInput) {
    driverPhotoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const photoPreview = document.getElementById("photoPreview");
          if (photoPreview) {
            photoPreview.innerHTML = `<img src="${event.target.result}" alt="صورة السائق">`;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// حفظ بيانات السائق
async function saveDriverData(e) {
  e.preventDefault();

  // الحصول على قيم الحقول
  const driverNameInput = document.getElementById("driverNameInput");
  const phoneInput = document.getElementById("phoneInput");
  const plateNumberInput = document.getElementById("plateNumberInput");
  const driverPhotoInput = document.getElementById("driverPhotoInput");

  const driverName = driverNameInput ? driverNameInput.value : "";
  const phone = phoneInput ? phoneInput.value : "";
  const plateNumber = plateNumberInput ? plateNumberInput.value : "";
  const file = driverPhotoInput && driverPhotoInput.files.length > 0 ? driverPhotoInput.files[0] : null;

  // التحقق من الحقول المطلوبة
  if (!driverName || !phone || !plateNumber) {
    showNotification("يرجى تعبئة جميع الحقول المطلوبة", 'warning');
    return;
  }

  try {
    // حفظ البيانات في قاعدة البيانات والتخزين
    await saveDriverInfo(driverName, phone, plateNumber, file);

    // حفظ البيانات في التخزين المحلي
    localStorage.setItem("driverName", driverName);
    localStorage.setItem("driverPhone", phone);
    localStorage.setItem("vehiclePlate", plateNumber);

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

    updateStatistics();
  });

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
}

// تحديث الإحصائيات
function updateStatistics() {
  const driverId = auth.currentUser ? auth.currentUser.uid : null;
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
      const driverId = auth.currentUser ? auth.currentUser.uid : null;
      if (driverId) {
        displayInProgressOrders(driverId);
      }
    });
  }

  if (mobileCompletedOrdersLink) {
    mobileCompletedOrdersLink.addEventListener("click", (e) => {
      e.preventDefault();
      mobileDropdown.classList.remove("show");
      const driverId = auth.currentUser ? auth.currentUser.uid : null;
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