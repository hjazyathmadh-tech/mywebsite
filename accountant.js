import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { app, auth, db } from "./firebase.js";



const ordersGrid = document.getElementById("orders-grid");
const modal = document.getElementById("order-modal");
const closeModalBtn = document.querySelector(".close-modal");
const statusSelect = document.getElementById("status-select");
const updateStatusBtn = document.getElementById("update-status-btn");
const accountantNameEl = document.getElementById("accountant-name");
const totalRevenueEl = document.getElementById("total-revenue");
const totalOrdersEl = document.getElementById("total-orders");
const totalCustomersEl = document.getElementById("total-customers");

// التحقق من تسجيل الدخول وصلاحيات المحاسب
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "accountant-login.html";
    return;
  }
  const token = await user.getIdTokenResult();
  if (!token.claims.accountant) {
    await signOut(auth);
    window.location.href = "accountant-login.html";
    return;
  }
  accountantNameEl.textContent = localStorage.getItem("accountantName") || "المحاسب";
  setupOrdersListener();
});

// إعداد مستمع للتحديثات الفورية للطلبات
function setupOrdersListener() {
  ordersGrid.innerHTML = "";
  const ordersRef = collection(db, "orders");

  onSnapshot(ordersRef, (snapshot) => {
  let totalRevenue = 0;
  let customers = new Set();

    // مسح المحتوى الحالي قبل إعادة الرسم
    ordersGrid.innerHTML = "";

    snapshot.forEach((docu, index) => {
    const data = docu.data();
    const orderCard = document.createElement("div");
    orderCard.className = "order-card";
    orderCard.style.animationDelay = `${index * 0.1}s`;

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

    orderCard.innerHTML = `
      <div class="order-header">
        <div class="order-id">#${docu.id}</div>
        <div class="order-status status-${data.status}">${translateStatus(data.status)}</div>
      </div>
      <div class="order-customer">${data.customerName || "عميل غير معروف"}</div>
      <div class="order-details">
        <span>${orderDate}</span>
        <span>${data.total || 0} ريال</span>
      </div>
    `;

    orderCard.addEventListener("click", () => {
      openModal(docu.id, data);
    });

    ordersGrid.appendChild(orderCard);
    totalRevenue += Number(data.total || 0);
    if (data.customerName) customers.add(data.customerName);
  });

    totalRevenueEl.textContent = totalRevenue + " ريال";
    totalOrdersEl.textContent = snapshot.size;
    totalCustomersEl.textContent = customers.size;
  });
}

function translateStatus(status) {
  switch (status) {
    case "pending": return "قيد الانتظار";
    case "preparing": return "قيد التحضير";
    case "ready": return "جاهز";
    case "delivered": return "تم التوصيل";
    default: return status;
  }
}

// عرض تفاصيل الطلب بشكل كامل
async function openModal(id, data) {
  const docRef = doc(db, "orders", id);

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

  // تعبئة معلومات العميل
  document.getElementById("modal-customer-name").textContent = data.customerName || "-";
  document.getElementById("modal-customer-phone").textContent = data.phone || "-";
  document.getElementById("modal-customer-address").textContent = data.address || "-";

  // تعبئة معلومات الطلب
  document.getElementById("modal-order-id").textContent = "#" + id;
  document.getElementById("modal-order-date").textContent = orderDate;
  document.getElementById("modal-order-status").textContent = translateStatus(data.status) || "-";
  document.getElementById("modal-order-total").textContent = (data.total || 0) + " ريال";

  // تعبئة حالة الطلب في القائمة المنسدلة
  statusSelect.value = data.status || "pending";

  // عرض عناصر الطلب
  const orderItemsContainer = document.getElementById("modal-order-items");
  orderItemsContainer.innerHTML = "";

  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    data.items.forEach(item => {
      const itemElement = document.createElement("div");
      itemElement.className = "order-item";

      // حساب السعر الإجمالي للصنف
      const itemTotal = (item.price || 0) * (item.quantity || 1);

      itemElement.innerHTML = `
        <div class="order-item-name">${item.name || "منتج غير معروف"}</div>
        <div class="order-item-details">
          <span class="order-item-quantity">${item.quantity || 1} × ${item.price || 0} ريال</span>
          <span class="order-item-price">${itemTotal} ريال</span>
        </div>
      `;

      orderItemsContainer.appendChild(itemElement);
    });
  } else {
    const noItemsElement = document.createElement("div");
    noItemsElement.className = "order-item";
    noItemsElement.innerHTML = "<div>لا توجد تفاصيل للمنتجات</div>";
    orderItemsContainer.appendChild(noItemsElement);
  }

  // عرض التخصيصات
  const customizationsContainer = document.getElementById("modal-customizations");
  customizationsContainer.innerHTML = "";

  // التحقق من وجود تخصيصات في العناصر
  let hasCustomizations = false;

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach(item => {
      if (item.customizations && Object.keys(item.customizations).length > 0) {
        hasCustomizations = true;

        // إنشاء قسم لكل منتج مع تخصيصاته
        const productSection = document.createElement("div");
        productSection.style.marginBottom = "15px";

        const productName = document.createElement("h4");
        productName.textContent = item.name || "منتج غير معروف";
        productName.style.marginBottom = "8px";
        productName.style.color = "var(--dark-color)";
        productSection.appendChild(productName);

        // إضافة كل تخصيص
        Object.entries(item.customizations).forEach(([key, value]) => {
          if (value) {
            const customizationElement = document.createElement("div");
            customizationElement.className = "customization-item";

            const customizationName = document.createElement("span");
            customizationName.className = "customization-item-name";
            customizationName.textContent = getCustomizationName(key);

            const customizationValue = document.createElement("span");
            customizationValue.className = "customization-item-value";
            customizationValue.textContent = value === true ? "نعم" : value;

            customizationElement.appendChild(customizationName);
            customizationElement.appendChild(customizationValue);
            productSection.appendChild(customizationElement);
          }
        });

        customizationsContainer.appendChild(productSection);
      }
    });
  }

  // إذا لم يتم العثور على تخصيصات
  if (!hasCustomizations) {
    const noCustomizationsElement = document.createElement("div");
    noCustomizationsElement.className = "customization-item";
    noCustomizationsElement.innerHTML = "<span>لا توجد تخصيصات</span>";
    customizationsContainer.appendChild(noCustomizationsElement);
  }

  // عرض الملاحظات
  const orderNotes = document.getElementById("modal-order-notes");
  orderNotes.textContent = data.notes || "لا توجد ملاحظات";

  // إعداد أزرار التحكم في الطلب
  document.getElementById("confirm-order-btn").onclick = async () => {
    await updateDoc(doc(db, "orders", id), { status: 'preparing' });
    closeModal();
  };

  document.getElementById("ready-order-btn").onclick = async () => {
    await updateDoc(doc(db, "orders", id), { status: 'ready' });
    closeModal();
  };

  document.getElementById("deliver-order-btn").onclick = async () => {
    await updateDoc(doc(db, "orders", id), { status: 'delivered' });
    closeModal();
  };

  document.getElementById("print-order-btn").onclick = () => {
    window.print();
  };

  modal.style.display = "flex";
}

// دالة مساعدة لتحويل مفاتيح التخصيص إلى أسماء واضحة
function getCustomizationName(key) {
  const customizationNames = {
    "withoutOnion": "بدون بصل",
    "withoutPickles": "بدون مخلل",
    "extraCheese": "زيادة جبن",
    "extraMeat": "زيادة لحم",
    "spicyLevel": "مستوى التوابل",
    "cookingLevel": "مستوى النضج",
    "specialInstructions": "تعليمات خاصة",
    "sauce": "الصلصة",
    "drink": "المشروب",
    "sideDish": "طبق جانبي"
  };

  return customizationNames[key] || key;
}

function closeModal() {
  modal.style.display = "none";
}

closeModalBtn.addEventListener("click", closeModal);
window.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

// تسجيل الخروج
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  localStorage.clear();
  window.location.href = "accountant-login.html";
});
