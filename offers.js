// استيراد Firebase
import { db, collection, getDocs } from "./firebase.js";

// تعريف متغيرات عامة
let offersContent;
let cart = [];
let cartModal;

// تهيئة المتغيرات عند تحميل الصفحة
function initVariables() {
    offersContent = document.getElementById("offers-content");
    cartModal = document.querySelector(".cart-modal");
    
    // استرجاع السلة من التخزين المحلي
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// تحديث السلة وحفظها في التخزين المحلي
function updateCart() {
    // تحديث عداد السلة
    const cartCount = document.querySelector(".cart-count");
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // حفظ السلة في التخزين المحلي
    localStorage.setItem("cart", JSON.stringify(cart));
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
            <button class="btn ${isOutOfStock ? 'disabled' : ''}" data-offer-id="${offer.id}" data-offer-title="${offer.title}" data-offer-price="${offer.priceNew}" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'نفدت الكمية' : 'اطلب العرض'}
            </button>
        </div>
    `;

    // إضافة حدث النقر على زر الطلب
    const orderBtn = offerCard.querySelector(".btn");
    if (!isOutOfStock) {
        orderBtn.addEventListener("click", function() {
            // إضافة العرض إلى السلة
            const offerId = this.getAttribute("data-offer-id");
            const offerTitle = this.getAttribute("data-offer-title");
            const offerPrice = parseFloat(this.getAttribute("data-offer-price"));

            // التحقق من وجود العرض في السلة
            const existingItem = cart.find(item => item.id === offerId && item.type === "offer");

            if (existingItem) {
                // إذا كان العرض موجوداً في السلة، زيادة الكمية
                existingItem.quantity += 1;
            } else {
                // إضافة العرض إلى السلة مع حفظ جميع بيانات العرض
                cart.push({
                    id: offerId,
                    name: offerTitle,
                    price: offerPrice,
                    quantity: 1,
                    type: "offer",
                    // حفظ بيانات العرض الكاملة لاستخدامها في صفحة الدفع
                    offerData: {
                        title: offer.title,
                        description: offer.description,
                        priceOld: offer.priceOld,
                        priceNew: offer.priceNew,
                        imageUrl: offer.imageUrl,
                        products: offer.products
                    }
                });
            }

            // تحديث السلة
            updateCart();

            // فتح السلة
            if (cartModal) {
                cartModal.style.display = "flex";
            }
        });
    }

    offersContent.appendChild(offerCard);
}

// استدعاء دالة تحميل العروض عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    initVariables();
    loadOffers();
});
