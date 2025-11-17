
// TODO: ربط النموذج مع EmailJS
// تأكد من إضافة مكتبة EmailJS في HTML قبل هذا الملف

// دالة لعرض الإشعارات
function showNotification(message, type) {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // إضافة الأنماط
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 25px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        direction: rtl;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    // تحديد اللون بنوع الإشعار
    if (type === 'success') {
        notification.style.backgroundColor = '#27ae60';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
    }

    // إضافة الإشعار للصفحة
    document.body.appendChild(notification);

    // إخفاء الإشعار بعد 3 ثوانٍ
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // منع إعادة تحميل الصفحة عند الإرسال

            // جمع بيانات النموذج
            const name = contactForm.name.value;
            const email = contactForm.email.value;
            const phone = contactForm.phone.value;
            const message = contactForm.message.value;

            // التحقق من أن الحقول ليست فارغة
            if (!name || !email || !phone || !message) {
                showNotification('❌ يرجى ملء جميع الحقول', 'error');
                return;
            }

            // إرسال البيانات باستخدام EmailJS
            // ملاحظة: قم بتحديث معرف القلب في لوحة تحكم EmailJS
            emailjs.send("service_tv70s8k", "template_0d9y51u", {     
                name: name,     
                email: email,     
                title: 'تواصل معنا - مطعم الحجازيات',     
                message: message 
            })
            .then(() => {     
                showNotification("✔️ تم إرسال الرسالة بنجاح!", "success");
                contactForm.reset(); // تفريغ الحقل بعد الإرسال الناجح
            })
            .catch((error) => {     
                let errorMessage = "❌ حدث خطأ أثناء إرسال الرسالة.";

                // رسائل خطأ محددة
                if (error.text.includes("template")) {
                    errorMessage = "❌ معرف القلب غير صحيح. يرجى التأكد من إعدادات EmailJS في لوحة التحكم.";
                } else if (error.text.includes("service")) {
                    errorMessage = "❌ معرف الخدمة غير صحيح. يرجى التأكد من إعدادات EmailJS في لوحة التحكم.";
                } else if (error.text.includes("public")) {
                    errorMessage = "❌ المفتاح العام غير صحيح. يرجى التأكد من إعدادات EmailJS في لوحة التحكم.";
                } else if (error.status === 400) {
                    errorMessage = "❌ طلب غير صحيح. يرجى التأكد من إعدادات EmailJS.";
                }

                showNotification(errorMessage, "error");
                console.error("EmailJS Error:", error);
            });
        });
    }
});
