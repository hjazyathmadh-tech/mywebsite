// استيراد Firebase
import { db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from "./firebase.js";

console.log("تم تحميل accountant-offers.js بنجاح");

// متغيرات عامة
let offersList = document.getElementById("offers-list");
let addOfferForm = document.getElementById("add-offer-form");
let offerImageUrlInput = document.getElementById("offer-image-url");
let offerImagePreview = document.getElementById("offer-image-preview");

// معاينة الصورة عند إدخال الرابط
offerImageUrlInput.addEventListener("input", function() {
  const url = this.value;
  if (url) {
    offerImagePreview.innerHTML = `<img src="${url}" alt="معاينة الصورة" style="width: 100%; height: 100%; object-fit: cover;">`;
  } else {
    offerImagePreview.innerHTML = `<i class="fas fa-image"></i><span>معاينة الصورة</span>`;
  }
});

// إضافة عرض جديد
addOfferForm.addEventListener("submit", async function(e) {
  e.preventDefault();

  // جمع البيانات من النموذج
  const title = document.getElementById("offer-title").value;
  const description = document.getElementById("offer-description").value;
  const priceOld = parseFloat(document.getElementById("offer-price-old").value);
  const priceNew = parseFloat(document.getElementById("offer-price-new").value);

  // جمع المنتجات في مصفوفة
  const productInputs = document.querySelectorAll(".product-input");
  const products = Array.from(productInputs).map(input => input.value.trim()).filter(val => val !== "");

  const quantity = parseInt(document.getElementById("offer-quantity").value);
  const duration = document.getElementById("offer-duration").value;
  const active = document.getElementById("offer-active").checked;
  const imageUrl = document.getElementById("offer-image-url").value;

  try {
    // إضافة العرض إلى قاعدة البيانات
    await addDoc(collection(db, "offers"), {
      title,
      description,
      priceOld,
      priceNew,
      products,
      quantity,
      duration,
      active,
      imageUrl,
      createdAt: serverTimestamp()
    });

    // إعادة تعيين النموذج
    addOfferForm.reset();
    offerImagePreview.innerHTML = `<i class="fas fa-image"></i><span>معاينة الصورة</span>`;

    // إعادة تعيين حقل المنتجات إلى حقل واحد فقط
    const productsContainer = document.getElementById("products-container");
    productsContainer.innerHTML = `
      <div class="product-item">
        <input type="text" class="product-input" placeholder="اسم المنتج" required>
        <button type="button" class="remove-product-btn" style="display: none;">حذف</button>
      </div>
    `;

    // عرض رسالة نجاح
    showNotification("تم إضافة العرض بنجاح", "success");

    // إعادة تحميل قائمة العروض
    loadOffers();
  } catch (error) {
    console.error("خطأ في إضافة العرض:", error);
    showNotification("حدث خطأ أثناء إضافة العرض", "danger");
  }
});

// تحميل العروض الحالية
async function loadOffers() {
  try {
    const querySnapshot = await getDocs(collection(db, "offers"));

    // مسح المحتوى الحالي
    offersList.innerHTML = "";

    if (querySnapshot.empty) {
      offersList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <i class="fas fa-tags" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
          <h3>لا توجد عروض حالياً</h3>
          <p>أضف عرضاً جديداً باستخدام النموذج</p>
        </div>
      `;
      return;
    }

    // عرض العروض
    querySnapshot.forEach((docSnap) => {
      const offer = {
        id: docSnap.id,
        ...docSnap.data()
      };

      const offerCard = document.createElement("div");
      offerCard.className = "offer-card";

      // تحويل مصفوفة المنتجات إلى نص
      const productsText = Array.isArray(offer.products) 
        ? offer.products.join(", ") 
        : offer.products || "";

      offerCard.innerHTML = `
        <div class="offer-card-img">
          ${offer.imageUrl ? `<img src="${offer.imageUrl}" alt="${offer.title}">` : `<i class="fas fa-image" style="font-size: 2rem; color: #ccc;"></i>`}
        </div>
        <div class="offer-card-info">
          <div class="offer-card-title">${offer.title}</div>
          <div class="offer-card-price">${offer.priceNew} ريال ${offer.priceOld ? `<span style="text-decoration: line-through; color: #999; font-size: 0.9rem;">${offer.priceOld} ريال</span>` : ""}</div>
          <div class="offer-card-meta">
            <span>الكمية: ${offer.quantity}</span>
            <span>${offer.duration}</span>
          </div>
        </div>
        <div class="offer-card-actions">
          <button class="offer-edit-btn" data-id="${offer.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="offer-delete-btn" data-id="${offer.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      offersList.appendChild(offerCard);
    });

    // إضافة مستمعي الأحداث للأزرار
    document.querySelectorAll(".offer-edit-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        const offerId = this.getAttribute("data-id");
        editOffer(offerId);
      });
    });

    document.querySelectorAll(".offer-delete-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        const offerId = this.getAttribute("data-id");
        deleteOffer(offerId);
      });
    });

  } catch (error) {
    console.error("خطأ في تحميل العروض:", error);
    offersList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #e74c3c;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
        <h3>حدث خطأ أثناء تحميل العروض</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// حذف عرض
async function deleteOffer(offerId) {
  if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
    try {
      await deleteDoc(doc(db, "offers", offerId));
      showNotification("تم حذف العرض بنجاح", "success");
      loadOffers();
    } catch (error) {
      console.error("خطأ في حذف العرض:", error);
      showNotification("حدث خطأ أثناء حذف العرض", "danger");
    }
  }
}

// تعديل عرض
async function editOffer(offerId) {
  try {
    // هنا يمكن إضافة منطق تعديل العرض
    // في الوقت الحالي، سنعرض رسالة للمستخدم
    showNotification("ميزة التعديل قيد التطوير", "info");
  } catch (error) {
    console.error("خطأ في تعديل العرض:", error);
    showNotification("حدث خطأ أثناء تعديل العرض", "danger");
  }
}

// عرض الإشعارات
function showNotification(message, type) {
  // إنشاء عنصر الإشعار
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `;

  // تعيين اللون حسب النوع
  switch (type) {
    case "success":
      notification.style.backgroundColor = "#2ecc71";
      break;
    case "danger":
      notification.style.backgroundColor = "#e74c3c";
      break;
    case "warning":
      notification.style.backgroundColor = "#f39c12";
      break;
    case "info":
      notification.style.backgroundColor = "#3498db";
      break;
    default:
      notification.style.backgroundColor = "#34495e";
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  // إظهار الإشعار
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // إخفاء الإشعار بعد 3 ثوانٍ
  setTimeout(() => {
    notification.style.transform = "translateX(-100%)";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// وظيفة إضافة منتج جديد
function setupProductManagement() {
  const addProductBtn = document.getElementById("add-product-btn");
  const productsContainer = document.getElementById("products-container");

  if (addProductBtn) {
    addProductBtn.addEventListener("click", function() {
      const productItem = document.createElement("div");
      productItem.className = "product-item";
      productItem.innerHTML = `
        <input type="text" class="product-input" placeholder="اسم المنتج" required>
        <button type="button" class="remove-product-btn">حذف</button>
      `;

      productsContainer.appendChild(productItem);

      // إضافة مستمع حدث لزر الحذف
      const removeBtn = productItem.querySelector(".remove-product-btn");
      removeBtn.addEventListener("click", function() {
        productItem.remove();
        updateRemoveButtonsVisibility();
      });

      updateRemoveButtonsVisibility();
    });

    // تحديث أزرار الحذف (إظهارها فقط إذا كان هناك أكثر من منتج)
    function updateRemoveButtonsVisibility() {
      const productItems = productsContainer.querySelectorAll(".product-item");
      productItems.forEach((item, index) => {
        const removeBtn = item.querySelector(".remove-product-btn");
        if (productItems.length > 1) {
          removeBtn.style.display = "block";
        } else {
          removeBtn.style.display = "none";
        }
      });
    }
  }
}

// تحميل العروض عند فتح الصفحة
document.addEventListener("DOMContentLoaded", function() {
  // التحقق من وجود قسم العروض في الصفحة
  if (document.getElementById("offers-section")) {
    loadOffers();
    setupProductManagement();
  }
});

// تحديث قائمة العروض عند التبديل إلى قسم العروض
document.addEventListener("click", function(e) {
  if (e.target.matches('[data-section="offers-section"]') || e.target.closest('[data-section="offers-section"]')) {
    loadOffers();
  }
});
