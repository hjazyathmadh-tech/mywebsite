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



const pendingOrdersGrid = document.getElementById("pending-orders-grid");
const acceptedOrdersGrid = document.getElementById("accepted-orders-grid");
const reportsTbody = document.getElementById("reports-tbody");
const modal = document.getElementById("order-modal");
const closeModalBtn = document.querySelector(".close-modal");
const actionButtons = document.getElementById("action-buttons");
const accountantNameEl = document.getElementById("accountant-name");
const totalRevenueEl = document.getElementById("total-revenue");
const totalOrdersEl = document.getElementById("total-orders");
const totalCustomersEl = document.getElementById("total-customers");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const searchReportsBtn = document.getElementById("search-reports");
const navLinks = document.querySelectorAll(".nav-link");
const contentSections = document.querySelectorAll(".content-section");

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
  pendingOrdersGrid.innerHTML = "";
  acceptedOrdersGrid.innerHTML = "";
  const ordersRef = collection(db, "orders");

  onSnapshot(ordersRef, (snapshot) => {
    let totalRevenue = 0;
    let customers = new Set();
    let pendingOrdersCount = 0;
    let acceptedOrdersCount = 0;

    // مسح المحتوى الحالي قبل إعادة الرسم
    pendingOrdersGrid.innerHTML = "";
    acceptedOrdersGrid.innerHTML = "";

    snapshot.forEach((docu, index) => {
      const data = docu.data();

      // حساب الإحصائيات
      totalRevenue += Number(data.total || 0);
      if (data.customerName) customers.add(data.customerName);

      // إنشاء بطاقة الطلب
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

      // استخدام الرقم التسلسلي للطلب إذا كان موجودًا، وإلا استخدم المعرف
      const orderIdDisplay = data.orderNumber ? `#${data.orderNumber}` : `#${docu.id}`;
      
      orderCard.innerHTML = `
        <div class="order-header">
          <div class="order-id">${orderIdDisplay}</div>
          <div class="order-status status-${data.status}">${translateStatus(data.status)}</div>
        </div>
        <div class="order-customer">${data.customerName || "عميل غير معروف"}</div>
        <div class="order-details">
          <span>${orderDate}</span>
          <span>${data.total || 0} ريال</span>
        </div>
      `;

      // إضافة حدث النقر لفتح التفاصيل
      orderCard.addEventListener("click", () => {
        openModal(docu.id, data);
      });

      // توزيع الطلبات حسب الحالة
      if (data.status === "pending") {
        pendingOrdersGrid.appendChild(orderCard);
        pendingOrdersCount++;
      } else if (data.status === "accepted") {
        acceptedOrdersGrid.appendChild(orderCard);
        acceptedOrdersCount++;
      }
    });

    // تحديث الإحصائيات
    totalRevenueEl.textContent = totalRevenue + " ريال";
    totalOrdersEl.textContent = snapshot.size;
    totalCustomersEl.textContent = customers.size;
  });
}

function translateStatus(status) {
  switch (status) {
    case "pending": return "بانتظار المحاسب";
    case "accepted": return "مقبول من المحاسب";
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
  document.getElementById("modal-customer-phone").textContent = data.customerPhone || "-";
  document.getElementById("modal-customer-address").textContent = data.customerAddress || "-";
  
  // تعبئة طريقة الدفع
  let paymentMethod = "-";
  if (data.paymentMethod) {
    switch (data.paymentMethod) {
      case "cash":
        paymentMethod = "دفع كاش";
        break;
      case "card":
        paymentMethod = "دفع بالبطاقة";
        break;
      case "online":
        paymentMethod = "دفع عبر الإنترنت";
        break;
      default:
        paymentMethod = data.paymentMethod;
    }
  }
  document.getElementById("modal-payment-method").textContent = paymentMethod;

  // تعبئة معلومات الطلب - استخدام الرقم التسلسلي إذا كان موجودًا
  const orderIdDisplay = data.orderNumber ? `#${data.orderNumber}` : `#${id}`;
  document.getElementById("modal-order-id").textContent = orderIdDisplay;
  document.getElementById("modal-order-date").textContent = orderDate;
  document.getElementById("modal-order-status").textContent = translateStatus(data.status) || "-";
  document.getElementById("modal-order-total").textContent = (data.total || 0) + " ريال";

  // عرض أزرار الإجراءات المناسبة حسب حالة الطلب
  renderActionButtons(id, data.status || "pending");

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

  // عرض بنية البيانات في الـ Console للتحقق
  console.log("بيانات الطلب:", data);

  // التحقق من وجود تخصيصات في العناصر
  let hasCustomizations = false;

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      // عرض الإضافات (extras)
      if (item.extras && Array.isArray(item.extras) && item.extras.length > 0) {
        hasCustomizations = true;

        const extrasSection = document.createElement("div");
        extrasSection.style.marginBottom = "15px";

        const extrasTitle = document.createElement("h4");
        extrasTitle.textContent = `إضافات ${item.name || `المنتج ${index + 1}`}`;
        extrasTitle.style.marginBottom = "8px";
        extrasTitle.style.color = "var(--dark-color)";
        extrasSection.appendChild(extrasTitle);

        item.extras.forEach(extra => {
          if (extra.checked) {
            const extraElement = document.createElement("div");
            extraElement.className = "customization-item";

            const extraName = document.createElement("span");
            extraName.className = "customization-item-name";
            extraName.textContent = extra.name || "إضافة غير معروفة";

            const extraPrice = document.createElement("span");
            extraPrice.className = "customization-item-value";
            extraPrice.textContent = extra.price ? `+${extra.price} ريال` : "مضافة";

            extraElement.appendChild(extraName);
            extraElement.appendChild(extraPrice);
            extrasSection.appendChild(extraElement);
          }
        });

        customizationsContainer.appendChild(extrasSection);
      }

      // عرض الصلصات (sauces)
      if (item.sauces && Array.isArray(item.sauces) && item.sauces.length > 0) {
        hasCustomizations = true;

        const saucesSection = document.createElement("div");
        saucesSection.style.marginBottom = "15px";

        const saucesTitle = document.createElement("h4");
        saucesTitle.textContent = `صلصات ${item.name || `المنتج ${index + 1}`}`;
        saucesTitle.style.marginBottom = "8px";
        saucesTitle.style.color = "var(--dark-color)";
        saucesSection.appendChild(saucesTitle);

        item.sauces.forEach(sauce => {
          if (sauce.checked) {
            const sauceElement = document.createElement("div");
            sauceElement.className = "customization-item";

            const sauceName = document.createElement("span");
            sauceName.className = "customization-item-name";
            sauceName.textContent = sauce.name || "صلصة غير معروفة";

            const sauceValue = document.createElement("span");
            sauceValue.className = "customization-item-value";
            sauceValue.textContent = "مضافة";

            sauceElement.appendChild(sauceName);
            sauceElement.appendChild(sauceValue);
            saucesSection.appendChild(sauceElement);
          }
        });

        customizationsContainer.appendChild(saucesSection);
      }

      // عرض المكونات الأساسية (baseIngredients)
      if (item.baseIngredients && Array.isArray(item.baseIngredients) && item.baseIngredients.length > 0) {
        hasCustomizations = true;

        const ingredientsSection = document.createElement("div");
        ingredientsSection.style.marginBottom = "15px";

        const ingredientsTitle = document.createElement("h4");
        ingredientsTitle.textContent = `مكونات ${item.name || `المنتج ${index + 1}`}`;
        ingredientsTitle.style.marginBottom = "8px";
        ingredientsTitle.style.color = "var(--dark-color)";
        ingredientsSection.appendChild(ingredientsTitle);

        item.baseIngredients.forEach(ingredient => {
          if (ingredient.checked) {
            const ingredientElement = document.createElement("div");
            ingredientElement.className = "customization-item";

            const ingredientName = document.createElement("span");
            ingredientName.className = "customization-item-name";
            ingredientName.textContent = ingredient.name || "مكون غير معروف";

            const ingredientValue = document.createElement("span");
            ingredientValue.className = "customization-item-value";
            ingredientValue.textContent = "مُضاف";

            ingredientElement.appendChild(ingredientName);
            ingredientElement.appendChild(ingredientValue);
            ingredientsSection.appendChild(ingredientElement);
          }
        });

        customizationsContainer.appendChild(ingredientsSection);
      }
    });
  }

  // إذا لم يتم العثور على تخصيصات
  if (!hasCustomizations) {
    const noCustomizationsElement = document.createElement("div");
    noCustomizationsElement.className = "customization-item";
    noCustomizationsElement.innerHTML = "<span>لا يوجد تخصيص</span>";
    customizationsContainer.appendChild(noCustomizationsElement);
  }

  // التحقق من وجود تخصيصات في العناصر
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
    noCustomizationsElement.innerHTML = "<span>لا يوجد تخصيص</span>";
    customizationsContainer.appendChild(noCustomizationsElement);
  }

  // عرض الملاحظات
  const orderNotes = document.getElementById("modal-order-notes");

  // جمع الملاحظات من الطلب الرئيسي وعناصر الطلب
  let allNotes = [];

  // إضافة الملاحظات الرئيسية إن وجدت
  if (data.notes && data.notes.trim() !== "") {
    allNotes.push(data.notes);
  }

  // إضافة ملاحظات العناصر إن وجدت
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      if (item.notes && item.notes.trim() !== "") {
        allNotes.push(`${item.name || `المنتج ${index + 1}`}: ${item.notes}`);
      }
    });
  }

  // عرض الملاحظات
  if (allNotes.length > 0) {
    orderNotes.textContent = allNotes.join('\n\n');
  } else {
    orderNotes.textContent = "لا توجد ملاحظات";
  }

  // سيتم إعداد أحداث النقر للأزرار في دالة renderActionButtons

  modal.style.display = "flex";
}

// دالة لعرض أزرار الإجراءات المناسبة حسب حالة الطلب
function renderActionButtons(orderId, currentStatus) {
  // مسح الأزرار الحالية
  actionButtons.innerHTML = "";

  // إنشاء الأزرار حسب الحالة الحالية
  if (currentStatus === "pending") {
    // زر قبول الطلب (ينقل الحالة إلى "accepted")
    const acceptBtn = document.createElement("button");
    acceptBtn.className = "action-btn accept";
    acceptBtn.innerHTML = '<i class="fas fa-check"></i> قبول الطلب';
    acceptBtn.onclick = async () => {
      await updateDoc(doc(db, "orders", orderId), { status: "accepted" });
      closeModal();
    };
    actionButtons.appendChild(acceptBtn);
  } 
  // لا توجد أزرار إضافية للمحاسب
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

// إعداد التنقل بين الأقسام
function setupNavigation() {
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // إزالة الفئة النشطة من جميع الروابط
      navLinks.forEach(l => l.classList.remove("active"));

      // إضافة الفئة النشطة للرابط المضغوط عليه
      link.classList.add("active");

      // الحصول على معرف القسم المراد عرضه
      const targetSectionId = link.getAttribute("data-section");

      // إخفاء جميع الأقسام
      contentSections.forEach(section => {
        section.style.display = "none";
      });

      // عرض القسم المطلوب
      const targetSection = document.getElementById(targetSectionId);
      if (targetSection) {
        targetSection.style.display = "block";
      }
    });
  });
}

// إعداد البحث في التقارير
function setupReportsSearch() {
  searchReportsBtn.addEventListener("click", async () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate || !endDate) {
      alert("الرجاء تحديد تاريخ البداية والنهاية");
      return;
    }

    // تحويل التواريخ إلى كائنات Date للمقارنة
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // بداية اليوم

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // نهاية اليوم

    // مسح نتائج البحث السابقة
    reportsTbody.innerHTML = "";

    // الحصول على الطلبات من Firestore
    const ordersRef = collection(db, "orders");
    const querySnapshot = await getDocs(ordersRef);

    let hasResults = false;

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // التحقق من وجود تاريخ الإنشاء
      if (data.createdAt) {
        const orderDate = data.createdAt.toDate();

        // التحقق من أن التاريخ ضمن النطاق المحدد
        if (orderDate >= start && orderDate <= end) {
          hasResults = true;

          // تنسيق التاريخ للعرض
          const formattedDate = orderDate.toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });

          // استخدام الرقم التسلسلي للطلب إذا كان موجودًا
          const orderIdDisplay = data.orderNumber ? `#${data.orderNumber}` : `#${doc.id}`;
          
          // إنشاء صف جديد في الجدول
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${orderIdDisplay}</td>
            <td>${data.customerName || "عميل غير معروف"}</td>
            <td><span class="order-status status-${data.status}">${translateStatus(data.status)}</span></td>
            <td>${formattedDate}</td>
            <td>${data.total || 0} ريال</td>
          `;

          reportsTbody.appendChild(row);
        }
      }
    });

    // عرض رسالة إذا لم يتم العثور على نتائج
    if (!hasResults) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td colspan="5" style="text-align: center; padding: 20px;">
          لا توجد طلبات في الفترة المحددة
        </td>
      `;
      reportsTbody.appendChild(row);
    }
  });
}

// تهيئة الصفحة بعد تحميلها
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupReportsSearch();
});

// تسجيل الخروج
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  localStorage.clear();
  window.location.href = "accountant-login.html";
});
