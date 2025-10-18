// firebase.js
// ===== استيراد مكتبات Firebase =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";

// دالة عرض الإشعارات
window.showNotification = function(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // إظهار الإشعار
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);
  
  // إخفاء الإشعار بعد 3 ثواني
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
};

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

// ===== معلومات مشروعك من Firebase =====
const firebaseConfig = {
  apiKey: "AIzaSyAki8OCL3hfL3FFIiZdf9_kJmWxZzRFSCs",
  authDomain: "hijaziat-df5fb.firebaseapp.com",
  projectId: "hijaziat-df5fb",
  storageBucket: "hijaziat-df5fb.appspot.com",
  messagingSenderId: "223931695845",
  appId: "1:223931695845:web:8ec8557b2c9c347b4a8a0c",
  measurementId: "G-BC1NB19MRY"
};

// ===== تشغيل Firebase =====
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);

// ===== مزود خدمة جوجل لتسجيل الدخول =====
const googleProvider = new GoogleAuthProvider();

// ===== تصدير عام =====
export {
  app,
  db,
  auth,
  analytics,
  storage,
  googleProvider,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  ref,
  uploadBytes,
  getDownloadURL
};

// ===== دالة إرسال الطلب =====
export async function sendOrder(orderData) {
  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ يجب تسجيل الدخول قبل إتمام الطلب");
    throw new Error("User not logged in");
  }

  try {
    await addDoc(collection(db, "orders"), {
      userId: user.uid,
      customerName: orderData.customerName || "عميل غير معروف",
      customerPhone: orderData.customerPhone || "",
      pickup: orderData.pickup || "مكان الانطلاق غير محدد",
      destination: orderData.destination || "مكان التوصيل غير محدد",
      items: orderData.items || [],
      total: orderData.total || 0,
      status: "pending",
      notes: orderData.notes || "",
      createdAt: serverTimestamp()
    });

    alert("✅ تم إرسال الطلب بنجاح");
    return { success: true };
  } catch (err) {
    console.error("❌ خطأ أثناء إرسال الطلب:", err);
    alert("حدث خطأ أثناء إرسال الطلب");
    return { success: false };
  }
}

// ===== دوال نظام العملاء =====
export async function customerLogin(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (error) {
    console.error("❌ خطأ في تسجيل دخول العميل:", error);
    return { success: false, message: error.message };
  }
}

export async function customerRegister(name, email, phone, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    
    // إضافة بيانات العميل إلى مجموعة العملاء
    await setDoc(doc(db, "customers", cred.user.uid), {
      name: name,
      email: email,
      phone: phone,
      createdAt: serverTimestamp()
    });
    
    return { success: true, user: cred.user };
  } catch (error) {
    console.error("❌ خطأ في إنشاء حساب العميل:", error);
    return { success: false, message: error.message };
  }
}

export async function customerLoginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // التحقق من وجود العميل في قاعدة البيانات
    const customerDoc = await getDoc(doc(db, "customers", user.uid));
    if (!customerDoc.exists()) {
      // إذا كان العميل جديدًا، أضفه إلى قاعدة البيانات
      await setDoc(doc(db, "customers", user.uid), {
        name: user.displayName || "عميل جوجل",
        email: user.email,
        phone: "",
        createdAt: serverTimestamp()
      });
    }
    
    return { success: true, user };
  } catch (error) {
    console.error("❌ خطأ في تسجيل الدخول عبر جوجل:", error);
    return { success: false, message: error.message };
  }
}

export async function resetCustomerPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" };
  } catch (error) {
    console.error("❌ خطأ في إعادة تعيين كلمة المرور:", error);
    return { success: false, message: error.message };
  }
}

// ===== مراقبة حالة تسجيل الدخول =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("🔑 مستخدم مسجل:", user.email);
  } else {
    console.log("🚪 لا يوجد مستخدم مسجل");
  }
});

// ===== دوال نظام المحاسب =====
export async function accountantLogin(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    
    // التحقق من صلاحيات المحاسب
    const tokenResult = await user.getIdTokenResult();
    if (!tokenResult.claims.accountant) {
      await signOut(auth);
      return { success: false, message: "حسابك ليس له صلاحيات المحاسب" };
    }
    
    return { success: true, user };
  } catch (error) {
    console.error("❌ خطأ في تسجيل دخول المحاسب:", error);
    return { success: false, message: error.message };
  }
}

export async function getOrders(status = null) {
  try {
    let ordersQuery;
    if (status) {
      ordersQuery = query(collection(db, "orders"), where("status", "==", status));
    } else {
      ordersQuery = collection(db, "orders");
    }
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders = [];
    
    querySnapshot.forEach((docSnap) => {
      orders.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    
    return { success: true, orders };
  } catch (error) {
    console.error("❌ خطأ في جلب الطلبات:", error);
    return { success: false, message: error.message };
  }
}

export async function updateOrder(orderId, updateData) {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("❌ خطأ في تحديث الطلب:", error);
    return { success: false, message: error.message };
  }
}

export async function getCustomers() {
  try {
    const querySnapshot = await getDocs(collection(db, "customers"));
    const customers = [];
    
    querySnapshot.forEach((docSnap) => {
      customers.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    
    return { success: true, customers };
  } catch (error) {
    console.error("❌ خطأ في جلب العملاء:", error);
    return { success: false, message: error.message };
  }
}

export async function getDrivers() {
  try {
    const querySnapshot = await getDocs(collection(db, "drivers"));
    const drivers = [];
    
    querySnapshot.forEach((docSnap) => {
      drivers.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    
    return { success: true, drivers };
  } catch (error) {
    console.error("❌ خطأ في جلب السائقين:", error);
    return { success: false, message: error.message };
  }
}

export async function getFinancialReport(startDate, endDate) {
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate)
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders = [];
    let totalRevenue = 0;
    
    querySnapshot.forEach((docSnap) => {
      const order = {
        id: docSnap.id,
        ...docSnap.data()
      };
      orders.push(order);
      totalRevenue += order.total || 0;
    });
    
    return { 
      success: true, 
      orders, 
      totalRevenue,
      orderCount: orders.length
    };
  } catch (error) {
    console.error("❌ خطأ في جلب التقرير المالي:", error);
    return { success: false, message: error.message };
  }
}

// ===== دوال نظام السائقين =====
export async function driverLogin(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const driverDoc = await getDoc(doc(db, "drivers", uid));
    if (!driverDoc.exists()) {
      await signOut(auth);
      return { success: false, message: "لا تملك صلاحية الدخول كسائق" };
    }

    localStorage.setItem("driver", JSON.stringify({
      uid: uid,
      email: cred.user.email,
      name: driverDoc.data().name || "سائق"
    }));

    return { success: true, user: cred.user };
  } catch (error) {
    console.error("❌ خطأ في تسجيل دخول السائق:", error);
    return { success: false, message: error.message };
  }
}

export async function getDriverOrders(driverId) {
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      where("driverId", "==", driverId)
    );

    const querySnapshot = await getDocs(ordersQuery);
    const orders = [];

    querySnapshot.forEach((docSnap) => {
      orders.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    return { success: true, orders };
  } catch (error) {
    console.error("خطأ في جلب طلبات السائق:", error);
    return { success: false };
  }
}

export async function updateOrderStatus(orderId, status, driverId = null) {
  try {
    const updateData = {
      status: status,
      updatedAt: serverTimestamp()
    };

    if (status === "accepted" && driverId) {
      updateData.driverId = driverId;
    }

    if (status === "completed") {
      updateData.deliveredAt = serverTimestamp();
    }

    await updateDoc(doc(db, "orders", orderId), updateData);
    return { success: true };
  } catch (error) {
    console.error("خطأ في تحديث حالة الطلب:", error);
    return { success: false };
  }
}

export function listenToDriverOrders(driverId, callback) {
  const ordersQuery = query(
    collection(db, "orders"),
    where("driverId", "==", driverId)
  );

  return onSnapshot(ordersQuery, (snapshot) => {
    const orders = [];
    let currentOrders = 0;
    let completedOrders = 0;
    let totalDeliveryTime = 0;
    let deliveredCount = 0;

    snapshot.forEach((docSnap) => {
      const order = { id: docSnap.id, ...docSnap.data() };
      orders.push(order);

      if (order.status === "pending" || order.status === "in_progress") {
        currentOrders++;
      } else if (order.status === "delivered") {
        completedOrders++;
        if (order.createdAt && order.deliveredAt) {
          const createdAt = order.createdAt.toDate();
          const deliveredAt = order.deliveredAt.toDate();
          const deliveryTimeMinutes = (deliveredAt - createdAt) / (1000 * 60);
          totalDeliveryTime += deliveryTimeMinutes;
          deliveredCount++;
        }
      }
    });

    const avgDeliveryTime = deliveredCount > 0 ? Math.round(totalDeliveryTime / deliveredCount) : 0;

    callback({
      orders,
      stats: { currentOrders, completedOrders, avgDeliveryTime }
    });
  });
}

export async function driverLogout() {
  try {
    await signOut(auth);
    localStorage.clear();
    return { success: true };
  } catch (error) {
    console.error("خطأ في تسجيل خروج السائق:", error);
    return { success: false };
  }
}

// دالة لحفظ بيانات السائق مع الصورة في Firebase Storage
export async function saveDriverInfo(name, phone, plate, file) {
  const user = auth.currentUser;
  if (!user) {
    showNotification("⚠️ يجب تسجيل الدخول", 'warning');
    return;
  }

  let imageUrl = "";
  if (file) {
    try {
      // رفع الصورة إلى Firebase Storage بالمسار المحدد
      const storageRef = ref(storage, `drivers/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    } catch (error) {
      console.error("خطأ في رفع الصورة:", error);
      showNotification("حدث خطأ أثناء رفع الصورة", 'danger');
      return;
    }
  }

  try {
    // تحديث بيانات السائق في Firestore مع الحفاظ على imageUrl
    const driverRef = doc(db, "drivers", user.uid);
    const updateData = {
      name: name,
      phone: phone,
      plate: plate,
      updatedAt: new Date()
    };
    
    // إضافة imageUrl فقط إذا تم رفع صورة جديدة
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }
    
    await updateDoc(driverRef, updateData);

    showNotification("تم حفظ بياناتك بنجاح", 'success');
    return imageUrl; // إرجاع رابط الصورة لتحديث الواجهة
  } catch (error) {
    console.error("خطأ في حفظ بيانات السائق:", error);
    showNotification("حدث خطأ أثناء حفظ بياناتك", 'danger');
    return;
  }
}

// دالة لعرض بيانات السائق عند تحميل صفحة "حسابي"
export async function loadDriverInfo() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const driverSnap = await getDoc(doc(db, "drivers", user.uid));
    if (driverSnap.exists()) {
      const data = driverSnap.data();

      // تحديث حقول النموذج
      const driverNameInput = document.getElementById("driverNameInput");
      if (driverNameInput) driverNameInput.value = data.name || "";

      const phoneInput = document.getElementById("phoneInput");
      if (phoneInput) phoneInput.value = data.phone || "";

      const plateNumberInput = document.getElementById("plateNumberInput");
      if (plateNumberInput) plateNumberInput.value = data.plate || "";

      // عرض صورة السائق
      const photoPreview = document.getElementById("photoPreview");
      const driverImage = document.getElementById("driverImage");

      if (data.imageUrl) {
        // عرض الصورة في معاينة النموذج
        if (photoPreview) {
          photoPreview.innerHTML = `<img src="${data.imageUrl}" alt="صورة السائق">`;
        }

        // عرض الصورة في صفحة السائق
        if (driverImage) {
          driverImage.src = data.imageUrl;
        }
      } else {
        // عرض الصورة الافتراضية إذا لم تكن هناك صورة
        const defaultImage = "images/driver-avatar.png";

        if (photoPreview) {
          photoPreview.innerHTML = `<img src="${defaultImage}" alt="صورة السائق الافتراضية">`;
        }

        if (driverImage) {
          driverImage.src = defaultImage;
        }
      }
    }
  } catch (error) {
    console.error("خطأ في تحميل بيانات السائق:", error);
    showNotification("حدث خطأ أثناء تحميل بياناتك", 'danger');
  }
}
