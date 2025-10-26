// وظائف إدارة سلة المشتريات

// تحديث عداد السلة في شريط التنقل
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.getElementById('cart-count');

    if (cartCount) {
        // حساب إجمالي الكميات وليس عدد المنتجات
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

// عرض محتويات السلة
function displayCart() {
    const cartContainer = document.getElementById('cart-container');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    // تفريغ محتوى السلة الحالي
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-cart"></i><p>السلة فارغة</p></div>';
        document.getElementById('checkout-btn').style.display = 'none';
        return;
    }

    // إظهار زر إتمام الطلب
    document.getElementById('checkout-btn').style.display = 'block';

    let totalPrice = 0;

    // عرض كل منتج في السلة
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';

        // حساب سعر المنتج بناءً على الكمية
        const itemTotal = (parseFloat(item.price) * item.quantity).toFixed(2);

        cartItem.innerHTML = `
            <img src="${item.image || 'https://i.ibb.co/6PJCf3G/placeholder.png'}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${item.price} ريال</div>
                ${item.description ? `<div class="cart-item-description">${item.description}</div>` : ''}
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn decrease" data-index="${index}">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn increase" data-index="${index}">+</button>
            </div>
            <button class="cart-item-remove" data-index="${index}"><i class="fas fa-trash"></i></button>
        `;

        cartContainer.appendChild(cartItem);

        // حساب السعر الإجمالي
        totalPrice += parseFloat(item.price) * item.quantity;
    });

    // عرض السعر الإجمالي
    const totalElement = document.createElement('div');
    totalElement.className = 'cart-total';
    totalElement.textContent = `الإجمالي: ${totalPrice.toFixed(2)} ريال`;
    cartContainer.appendChild(totalElement);

    // إضافة مستمعي الأحداث للأزرار
    document.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', removeFromCart);
    });

    document.querySelectorAll('.quantity-btn.decrease').forEach(button => {
        button.addEventListener('click', decreaseQuantity);
    });

    document.querySelectorAll('.quantity-btn.increase').forEach(button => {
        button.addEventListener('click', increaseQuantity);
    });
}

// حذف منتج من السلة
function removeFromCart(event) {
    const index = parseInt(event.target.getAttribute('data-index'));
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));

    updateCartCount();
    displayCart();
}

// زيادة كمية المنتج
function increaseQuantity(event) {
    const index = parseInt(event.target.getAttribute('data-index'));
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart[index]) {
        cart[index].quantity += 1;
        localStorage.setItem('cart', JSON.stringify(cart));

        updateCartCount();
        displayCart();
    }
}

// نقصان كمية المنتج
function decreaseQuantity(event) {
    const index = parseInt(event.target.getAttribute('data-index'));
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart[index] && cart[index].quantity > 1) {
        cart[index].quantity -= 1;
        localStorage.setItem('cart', JSON.stringify(cart));

        updateCartCount();
        displayCart();
    }
}

// إضافة منتج إلى السلة
function addToCart(item) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    // التحقق مما إذا كان المنتج موجود بالفعل في السلة
    const existingItemIndex = cart.findIndex(cartItem => 
        cartItem.id === item.id && cartItem.type === item.type
    );

    if (existingItemIndex !== -1) {
        // إذا كان المنتج موجوداً، قم بزيادة الكمية
        cart[existingItemIndex].quantity += 1;
    } else {
        // إذا كان المنتج جديداً، أضفه مع كمية 1
        item.quantity = 1;
        cart.push(item);
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    updateCartCount();

    // عرض رسالة تأكيد
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = 'تمت إضافة المنتج إلى السلة ✅';
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
}

// إتمام الطلب
function checkout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        alert('السلة فارغة!');
        return;
    }

    // الانتقال إلى صفحة الدفع
    window.location.href = 'checkout.html';
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();

    // إذا كنا في صفحة السلة، اعرض محتوياتها
    if (window.location.pathname.includes('cart.html')) {
        displayCart();

        // إضافة مستمع الحدث لزر إتمام الطلب
        document.getElementById('checkout-btn').addEventListener('click', checkout);
    }
});

// إضافة وظيفة عالمية لإضافة المنتجات للسلة
window.addToCart = addToCart;
