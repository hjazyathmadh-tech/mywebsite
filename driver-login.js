// استيراد الدوال من ملف firebase.js
import { driverLogin } from "./firebase.js";

async function handleLogin(email, password) {
  try {
    await driverLogin(email, password);
    window.location.href = "drivers.html";
  } catch (err) {
    console.error("❌ خطأ في تسجيل الدخول:", err.message);
    showErrorModal(err.message || "حدث خطأ أثناء تسجيل الدخول");
  }
}

// دالة لعرض نافذة الخطأ المنبثقة
function showErrorModal(message) {
  // التحقق من وجود النافذة المنبثقة مسبقاً
  let errorModal = document.getElementById('errorModal');

  // إذا لم تكن النافذة موجودة، قم بإنشائها
  if (!errorModal) {
    errorModal = document.createElement('div');
    errorModal.id = 'errorModal';
    errorModal.style.position = 'fixed';
    errorModal.style.top = '0';
    errorModal.style.left = '0';
    errorModal.style.width = '100%';
    errorModal.style.height = '100%';
    errorModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    errorModal.style.display = 'flex';
    errorModal.style.justifyContent = 'center';
    errorModal.style.alignItems = 'center';
    errorModal.style.zIndex = '10000';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.borderRadius = '10px';
    modalContent.style.padding = '30px';
    modalContent.style.maxWidth = '400px';
    modalContent.style.width = '90%';
    modalContent.style.textAlign = 'center';
    modalContent.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    modalContent.style.border = '2px solid #e74c3c';

    modalContent.innerHTML = `
      <div style="color: #e74c3c; font-size: 48px; margin-bottom: 15px;">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h2 style="color: #e74c3c; margin-bottom: 15px; font-family: 'Tajawal', sans-serif;">خطأ في تسجيل الدخول</h2>
      <p style="color: #333; margin-bottom: 25px; font-family: 'Tajawal', sans-serif; font-size: 16px; line-height: 1.5;">
        ${message}
      </p>
      <button id="closeErrorModal" style="
        background-color: #e74c3c; 
        color: white; 
        border: none; 
        padding: 10px 25px; 
        border-radius: 5px; 
        cursor: pointer; 
        font-family: 'Tajawal', sans-serif; 
        font-size: 16px;
        font-weight: bold;
        transition: background-color 0.3s;
      ">موافق</button>
    `;

    errorModal.appendChild(modalContent);
    document.body.appendChild(errorModal);

    // إضافة حدث النقر على زر الإغلاق
    document.getElementById('closeErrorModal').addEventListener('click', function() {
      document.body.removeChild(errorModal);
    });

    // إضافة حدث النقر على خلفية النافذة لإغلاقها
    errorModal.addEventListener('click', function(e) {
      if (e.target === errorModal) {
        document.body.removeChild(errorModal);
      }
    });
  } else {
    // تحديث الرسالة إذا كانت النافذة موجودة مسبقاً
    const messageElement = errorModal.querySelector('p');
    if (messageElement) {
      messageElement.textContent = message;
    }
    errorModal.style.display = 'flex';
  }
}

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  handleLogin(email, password);
});



// دالة لعرض الإشعارات
function showNotification(message, type = 'info') {
    // تحديد لون الإشعار حسب النوع
    let bgColor = '#3498db'; // معلومات (الأزرق)
    if (type === 'success') bgColor = '#2ecc71'; // نجاح (الأخضر)
    else if (type === 'warning') bgColor = '#f39c12'; // تحذير (الأصفر)
    else if (type === 'danger') bgColor = '#e74c3c'; // خطأ (الأحمر)

    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '20px';
    notification.style.backgroundColor = bgColor;
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.style.maxWidth = '500px';
    notification.style.transform = 'translateX(-120%)';
    notification.style.transition = 'transform 0.3s ease';
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <span style="cursor: pointer; margin-right: 10px;" onclick="this.parentElement.parentElement.remove()">&times;</span>
        </div>
    `;

    // إضافة الإشعار إلى الصفحة
    document.body.appendChild(notification);

    // إظهار الإشعار
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    // إخفاء الإشعار تلقائياً بعد 5 ثوانٍ
    setTimeout(() => {
        notification.style.transform = 'translateX(-120%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    }, 5000);
}
