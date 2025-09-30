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

// عرض تفاصيل الطلب
// تم نقل معالج النقر إلى داخل دالة loadOrders

async function openModal(id, data) {
  const docRef = doc(db, "orders", id);
  const snap = await getDocs(collection(db, "orders"));
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

  document.getElementById("modal-order-id").textContent = id;
  document.getElementById("modal-customer-name").textContent = data.customerName || "-";
  document.getElementById("modal-customer-address").textContent = data.address || "-";
  document.getElementById("modal-customer-phone").textContent = data.phone || "-";
  document.getElementById("modal-order-date").textContent = orderDate;
  document.getElementById("modal-order-total").textContent = (data.total || 0) + " ريال";
  statusSelect.value = data.status || "pending";
  
  // Display order items if available
  const orderItemsContainer = document.getElementById("order-items-container");
  orderItemsContainer.innerHTML = "";
  
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach(item => {
      const itemElement = document.createElement("div");
      itemElement.className = "order-item";
      itemElement.innerHTML = `
        <span>${item.name || "منتج غير معروف"}</span>
        <span>${item.quantity || 1} × ${item.price || 0} ريال</span>
      `;
      orderItemsContainer.appendChild(itemElement);
    });
  } else {
    const noItemsElement = document.createElement("div");
    noItemsElement.className = "order-item";
    noItemsElement.innerHTML = "<span>لا توجد تفاصيل للمنتجات</span>";
    orderItemsContainer.appendChild(noItemsElement);
  }

  updateStatusBtn.onclick = async () => {
    await updateDoc(doc(db, "orders", id), { status: statusSelect.value });
    closeModal();
    // تمت إزالة استدعاء loadOrders لأن onSnapshot يقوم بالتحديث تلقائياً
  };

  modal.style.display = "flex";
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
