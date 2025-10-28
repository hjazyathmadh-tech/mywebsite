// استيراد Firebase
import { db, collection, getDocs } from "./zakarya.js";

// تعريف متغيرات عامة
let offersContent;

// تهيئة المتغيرات عند تحميل الصفحة
function initVariables() {
    offersContent = document.getElementById("offers-content");

    // تحديث عداد السلة فورًا
    updateCartCount();
}

// تحديث عداد السلة
function updateCartCount() {
    // جلب السلة من التخزين المحلي
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // تحديث عداد السلة
    const cartCount = document.querySelector(".cart-count");
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

// تحميل العروض من قاعدة البيانات
async function loadOffers() {
    try {
        const querySnapshot = await getDocs(collection(db, "offers"));

        // مسح محتوى الحاوية
        offersContent.innerHTML = "";

        // التحقق من وجود عروض
        if (querySnapshot.empty) {
            offersContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                    <i class="fas fa-tags" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <h3>لا توجد عروض حالياً</h3>
                    <p>سيتم إضافة عروض قريباً</p>
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

            // التحقق من أن العرض نشط
            if (!offer.active) {
                return;
            }

            // حساب تاريخ الانتهاء من تاريخ الإنشاء والمدة
            const createdDate = offer.createdAt.toDate();
            const durationInDays = parseInt(offer.duration.split(' ')[0]);
            const endDate = new Date(createdDate);
            endDate.setDate(endDate.getDate() + durationInDays);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // عرض العرض فقط إذا لم ينتهِ وكانت الكمية متوفرة
            if (endDate >= today && offer.quantity > 0) {
                renderOfferCard(offer, endDate);
            }
        });
    } catch (error) {
        console.error("خطأ في تحميل العروض:", error);
        offersContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e74c3c;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h3>حدث خطأ في تحميل العروض</h3>
                <p>يرجى المحاولة مرة أخرى</p>
            </div>
        `;
    }
}

// عرض بطاقة العرض
function renderOfferCard(offer, endDate) {
    const offerCard = document.createElement("div");
    offerCard.className = "offer-card";

    // حساب النسبة المئوية للخصم
    const discountPercentage = Math.round(((offer.priceOld - offer.priceNew) / offer.priceOld) * 100);

    // الكمية المتوفرة
    const availableQuantity = offer.quantity;
    const quantityText = availableQuantity > 0 ? `الكمية: ${availableQuantity}` : "نفدت الكمية";
    const isOutOfStock = availableQuantity <= 0;

    // تحويل تاريخ الانتهاء إلى صيغة مناسبة
    const formattedEndDate = endDate.toLocaleDateString('ar-SA');

    offerCard.innerHTML = `
        <div class="offer-img">
            <img src="${offer.imageUrl || 'https://i.ibb.co/6PJCf3G/placeholder.png'}" alt="${offer.title}">
            <span class="discount-badge">خصم ${discountPercentage}%</span>
        </div>
        <div class="offer-info">
            <h3>${offer.title}</h3>
            <p>${offer.description}</p>
            <div class="offer-products">
                ${offer.products.map(product => `<span>${product}</span>`).join('')}
            </div>
            <div class="offer-price">
                <span class="old-price">${offer.priceOld} ريال</span>
                <span class="new-price">${offer.priceNew} ريال</span>
            </div>
            <div class="offer-meta">
                <span class="offer-quantity">${quantityText}</span>
                <span class="offer-end-date">ينتهي: ${formattedEndDate}</span>
            </div>
            <button class="btn offer-details-btn ${isOutOfStock ? 'disabled' : ''}" data-offer-id="${offer.id}" data-offer-title="${offer.title}" data-offer-description="${offer.description}" data-offer-price="${offer.priceNew}" data-offer-price-old="${offer.priceOld}" data-offer-image="${offer.imageUrl || ''}" data-offer-products="${Array.isArray(offer.products) ? offer.products.join(', ') : (offer.products || '')}" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'نفدت الكمية' : 'اطلب العرض'}
            </button>
        </div>
    `;

    // إضافة حدث النقر على زر الطلب
    const orderBtn = offerCard.querySelector(".offer-details-btn");
    if (!isOutOfStock) {
        orderBtn.addEventListener("click", function() {
            // عرض تفاصيل العرض
            const offerId = this.getAttribute("data-offer-id");
            const offerTitle = this.getAttribute("data-offer-title");
            const offerDescription = this.getAttribute("data-offer-description");
            const offerPrice = this.getAttribute("data-offer-price");
            const offerPriceOld = this.getAttribute("data-offer-price-old");
            const offerImage = this.getAttribute("data-offer-image");
            const offerProducts = this.getAttribute("data-offer-products");

            showOfferDetailsModal(offerId, offerTitle, offerDescription, offerPrice, offerPriceOld, offerImage, offerProducts);
        });
    }

    offersContent.appendChild(offerCard);
}

// عرض تفاصيل العرض في نافذة منبثقة
function showOfferDetailsModal(offerId, title, description, price, priceOld, image, products) {
  // التحقق من وجود النافذة المنبثقة، إذا لم تكن موجودة، قم بإنشائها
  let offerModal = document.getElementById("offer-details-modal");

  if (!offerModal) {
    // إنشاء النافذة المنبثقة
    offerModal = document.createElement("div");
    offerModal.id = "offer-details-modal";
    offerModal.className = "modal";
    offerModal.style.cssText = `
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      justify-content: center;
      align-items: center;
      z-index: 2000;
    `;

    // إضافة محتوى النافذة المنبثقة
    offerModal.innerHTML = `
      <div class="modal-content" style="background-color: white; border-radius: 10px; padding: 30px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; position: relative;">
        <span class="close-modal" style="position: absolute; top: 15px; left: 15px; font-size: 1.5rem; cursor: pointer; color: #7f8c8d;">&times;</span>
        <div class="modal-header" style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <h2 style="color: #2c3e50; margin: 0;">تفاصيل العرض</h2>
        </div>

        <div class="offer-details" style="margin-bottom: 20px;">
          <div class="offer-image" style="width: 100%; height: 200px; border-radius: 8px; overflow: hidden; margin-bottom: 15px; display: flex; justify-content: center; align-items: center; background-color: #f8f9fa;">
            <img id="modal-offer-image" src="" alt="صورة العرض" style="width: 100%; height: 100%; object-fit: cover; display: none;">
            <i id="modal-offer-image-placeholder" class="fas fa-image" style="font-size: 3rem; color: #ccc;"></i>
          </div>

          <h3 id="modal-offer-title" style="color: #2c3e50; margin-bottom: 10px;"></h3>
          <p id="modal-offer-description" style="color: #7f8c8d; line-height: 1.6; margin-bottom: 15px;"></p>

          <div class="offer-meta" style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div class="offer-price" style="font-size: 1.5rem; font-weight: 700; color: #e74c3c;">
              <span id="modal-offer-price"></span> ريال
              ${priceOld ? `<span style="text-decoration: line-through; color: #999; font-size: 0.9rem; margin-right: 10px;"><span id="modal-offer-price-old"></span> ريال</span>` : ""}
            </div>
          </div>

          <div class="offer-products" style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px; color: #2c3e50;">المنتجات:</h4>
            <p id="modal-offer-products" style="color: #7f8c8d;"></p>
          </div>
        </div>

        <div class="offer-actions" style="display: flex; justify-content: center; margin-top: 20px;">
          <button id="add-offer-to-cart" class="btn" style="padding: 12px 30px; border: none; border-radius: 5px; background-color: #e74c3c; color: white; font-family: 'Tajawal', sans-serif; font-weight: 500; cursor: pointer; transition: background-color 0.3s ease;">
            <i class="fas fa-shopping-cart" style="margin-left: 8px;"></i>
            أتمم الطلب
          </button>
        </div>
      </div>
    `;

    // إضافة النافذة المنبثقة إلى الصفحة
    document.body.appendChild(offerModal);

    // إضافة مستمع حدث لزر الإغلاق
    const closeModal = offerModal.querySelector(".close-modal");
    closeModal.addEventListener("click", function() {
      offerModal.style.display = "none";
    });

    // إضافة مستمع حدث للنقر خارج النافذة
    offerModal.addEventListener("click", function(e) {
      if (e.target === offerModal) {
        offerModal.style.display = "none";
      }
    });
  }

  // تعبئة بيانات العرض في النافذة المنبثقة
  document.getElementById("modal-offer-title").textContent = title;
  document.getElementById("modal-offer-description").textContent = description;
  document.getElementById("modal-offer-price").textContent = price;
  if (priceOld) {
    document.getElementById("modal-offer-price-old").textContent = priceOld;
  }
  document.getElementById("modal-offer-products").textContent = products;

  // عرض الصورة إذا كانت موجودة
  const modalImage = document.getElementById("modal-offer-image");
  const modalImagePlaceholder = document.getElementById("modal-offer-image-placeholder");

  if (image && image.trim() !== "") {
    modalImage.src = image;
    modalImage.style.display = "block";
    modalImagePlaceholder.style.display = "none";
  } else {
    modalImage.style.display = "none";
    modalImagePlaceholder.style.display = "block";
  }

  // إضافة مستمع حدث لزر إضافة العرض إلى السلة
  const addToCartBtn = document.getElementById("add-offer-to-cart");
  addToCartBtn.onclick = function() {
    addOfferToCart(offerId, title, description, price, priceOld, image, products);
    offerModal.style.display = "none";

    // عرض رسالة تأكيد
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = "تمت إضافة العرض إلى السلة ✅";
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #2ecc71;
      color: white;
      padding: 15px 25px;
      border-radius: 5px;
      z-index: 10000;
      font-family: 'Tajawal', sans-serif;
      font-weight: 500;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      transition: opacity 0.3s;
    `;

    document.body.appendChild(notification);

    // إزالة الرسالة بعد 3 ثوانٍ
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  // عرض النافذة المنبثقة
  offerModal.style.display = "flex";
}

// إضافة العرض إلى السلة
function addOfferToCart(offerId, title, description, price, priceOld, image, products) {
  // جلب السلة من التخزين المحلي
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // التحقق من وجود العرض في السلة
  const existingItem = cart.find(item => item.id === offerId && item.type === "offer");

  if (existingItem) {
    // إذا كان العرض موجوداً في السلة، زيادة الكمية
    existingItem.quantity += 1;
  } else {
    // إضافة العرض إلى السلة مع جميع التفاصيل
    cart.push({
      id: offerId,
      name: title,
      description: description,
      price: parseFloat(price),
      priceOld: priceOld ? parseFloat(priceOld) : null,
      quantity: 1,
      type: "offer",
      image: image || "https://i.ibb.co/6PJCf3G/placeholder.png",
      products: products
    });
  }

  // حفظ السلة في التخزين المحلي
  localStorage.setItem("cart", JSON.stringify(cart));

  // تحديث عداد السلة
  updateCartCount();
}

// استدعاء دالة تحميل العروض عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    initVariables();
    loadOffers();
});
