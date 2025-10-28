// accountant-login.js - تسجيل دخول المحاسب باستخدام Firebase v9+

// استيراد الدوال اللازمة من zakarya.js
import { accountantLogin, auth } from "./zakarya.js";

// مراقبة حالة المستخدم
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // التحقق من صلاحيات المحاسب
        const tokenResult = await user.getIdTokenResult();
        if (tokenResult.claims.accountant) {
            // توجيه المحاسب المسجل دخوله مسبقًا إلى لوحة التحكم
            window.location.href = 'accountant.html';
        } else {
            // إذا لم يكن المستخدم محاسبًا، قم بتسجيل خروجه
            await auth.signOut();
        }
    }
    // إذا لا يوجد مستخدم، يبقى في صفحة تسجيل الدخول
});

// معالجة تسجيل الدخول
const loginForm = document.getElementById('accountantLoginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('accountant-email').value;
        const password = document.getElementById('accountant-password').value;

        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn.textContent;
        loginBtn.textContent = 'جاري تسجيل الدخول...';
        loginBtn.disabled = true;

        try {
            // استخدام دالة accountantLogin لتسجيل الدخول
            const result = await accountantLogin(email, password);
            
            if (result.success) {
                // تخزين بيانات الجلسة
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('isAccountant', 'true');
                localStorage.setItem('userEmail', result.user.email);
                localStorage.setItem('userId', result.user.uid);
                localStorage.setItem('accountantName', 'المحاسب');

                // توجيه إلى صفحة لوحة المحاسب
                window.location.href = 'accountant.html';
            } else {
                showNotification(result.error || 'حسابك ليس له صلاحيات المحاسب', 'error');
                resetButton();
            }

        } catch (error) {
            showNotification('خطأ في تسجيل الدخول: ' + error.message, 'error');
            resetButton();
        }

        function resetButton() {
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    });
}

// دالة عرض إشعار
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
