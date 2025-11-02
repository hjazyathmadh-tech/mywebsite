// link-account.js
// استيراد Firebase
import { linkGoogleAccountWithEmail, auth } from "./firebase.js";

// تحديث معالج تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    updateGoogleLoginHandler();
});

// دالة لمعالجة ربط الحساب بعد تسجيل الدخول عبر Google
export async function handleGoogleLoginLinking() {
    // عرض مربع حوار لسؤال المستخدم عن ربط الحساب
    const shouldLink = confirm('هل ترغب في ربط حساب Google بحساب بريد إلكتروني وكلمة مرور لتسهيل تسجيل الدخول مستقبلاً؟');

    if (shouldLink) {
        // طلب كلمة المرور من المستخدم
        const password = prompt('الرجاء إدخال كلمة مرور لربطها بحساب Google:');

        if (password) {
            try {
                // الحصول على المستخدم الحالي
                const user = auth.currentUser;

                if (!user) {
                    alert('لا يوجد مستخدم مسجل حالياً');
                    return;
                }

                // ربط الحسابين
                const linkResult = await linkGoogleAccountWithEmail(user.email, password);

                if (linkResult.success) {
                    alert('تم ربط حساب Google بحساب البريد الإلكتروني بنجاح!');
                } else {
                    alert('لم يتم ربط الحساب: ' + linkResult.message);
                }
            } catch (error) {
                console.error('خطأ في ربط الحساب:', error);
                alert('حدث خطأ أثناء ربط الحساب: ' + error.message);
            }
        }
    }
}

// دالة لتحديث دالة تسجيل الدخول عبر Google
export function updateGoogleLoginHandler() {
    const googleBtn = document.querySelector('.google-btn');
    if (!googleBtn) return;

    // إزالة معالج الأحداث الحالي (إذا وجد)
    const newGoogleBtn = googleBtn.cloneNode(true);
    googleBtn.parentNode.replaceChild(newGoogleBtn, googleBtn);

    // إضافة معالج الأحداث الجديد
    newGoogleBtn.addEventListener('click', async function(e) {
        e.preventDefault();

        window.signInWithPopup(window.firebaseAuth, window.googleProvider)
            .then(async (result) => {
                // تم تسجيل الدخول بنجاح
                const user = result.user;

                // تخزين حالة تسجيل الدخول في localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userId', user.uid);

                // محاولة الحصول على اسم المستخدم
                if (user.displayName) {
                    localStorage.setItem('userName', user.displayName);
                } else {
                    localStorage.setItem('userName', 'مستخدم جوجل');
                }

                // محاولة ربط الحساب
                await handleGoogleLoginLinking();

                // الانتقال إلى الصفحة الرئيسية
                window.location.href = 'index.html';
            })
            .catch((error) => {
                // حدث خطأ
                const errorCode = error.code;
                const errorMessage = error.message;

                // عرض رسالة الخطأ
                alert('خطأ في تسجيل الدخول عبر جوجل: ' + errorMessage);
            });
    });
}
