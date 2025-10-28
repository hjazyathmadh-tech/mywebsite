// My Account Page JavaScript
import { auth, db, onAuthStateChanged } from "./zakarya.js";
import { doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// DOM Elements
const editModal = document.getElementById("edit-modal");
const modalLabel = document.getElementById("modal-label");
const modalInput = document.getElementById("modal-input");
const editForm = document.getElementById("edit-form");
const closeModal = document.getElementById("close-modal");
const modalCancel = document.getElementById("modal-cancel");
const successMessage = document.getElementById("success-message");
const errorMessage = document.getElementById("error-message");
const displayName = document.getElementById("display-name");
const userMenuItem = document.getElementById("user-menu-item");
const logoutBtn = document.getElementById("logout-btn");
const updateInfoBtn = document.getElementById("update-info-btn");

// Display values
const displayNameValue = document.getElementById("display-name-value");
const displayEmailValue = document.getElementById("display-email-value");
const displayPhoneValue = document.getElementById("display-phone-value");
const displayAgeValue = document.getElementById("display-age-value");
const displayGenderValue = document.getElementById("display-gender-value");

// Store current field being edited
let currentField = null;
const fieldLabels = {
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    age: "العمر",
    gender: "الجنس"
};

// Store user data
let userData = {};

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    // Setup mobile menu
    setupMobileMenu();

    // Check user authentication state
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userId", user.uid);

            // Show user menu
            if (userMenuItem) {
                userMenuItem.style.display = "block";
            }

            // Load user data from Firestore
            await loadUserData(user);

            // Setup edit buttons
            setupEditButtons();

            // Setup modal close buttons
            setupModalCloseButtons();

            // Setup form submission
            editForm.addEventListener("submit", updateUserData);

            // Setup logout functionality
            if (logoutBtn) {
                logoutBtn.addEventListener("click", logoutUser);
            }
        } else {
            // User is signed out
            showError("لم يتم تسجيل الدخول");

            // Redirect to login page
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        }
    });
});

// Check if user is logged in
function checkUserLogin() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userId = localStorage.getItem("userId");

    // Check for user ID instead of user name
    if (isLoggedIn && userId) {
        // Try to get user name from localStorage
        let userName = localStorage.getItem("userName");

        // If user name is not in localStorage, try to get it from email
        if (!userName) {
            const userEmail = localStorage.getItem("userEmail");
            if (userEmail) {
                userName = userEmail.split('@')[0];
                localStorage.setItem("userName", userName);
            }
        }

        // Show user menu
        if (userMenuItem) {
            userMenuItem.style.display = "block";
        }

        // Update display name
        if (displayName && userName) {
            displayName.textContent = userName;
        }
    } else {
        // Redirect to login page if not logged in
        window.location.href = "login.html";
    }
}

// Load user data from Firebase
async function loadUserData(user) {
    // Check if user is authenticated
    if (!user) {
        showError("لم يتم تسجيل الدخول");
        return;
    }

    try {
        // Get user document from Firestore (users collection)
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
            userData = userDoc.data();

            // Update display values with user data
            displayNameValue.textContent = userData.fullName || "غير محدد";
            displayEmailValue.textContent = userData.email || "غير محدد";
            displayPhoneValue.textContent = userData.phone || "غير محدد";
            displayAgeValue.textContent = userData.age || "غير محدد";

            // Handle gender display
            if (userData.gender === "male") {
                displayGenderValue.textContent = "ذكر";
            } else if (userData.gender === "female") {
                displayGenderValue.textContent = "أنثى";
            } else {
                displayGenderValue.textContent = "غير محدد";
            }

            // Update localStorage with user data
            localStorage.setItem("userName", userData.fullName || "غير محدد");
            localStorage.setItem("userEmail", userData.email || "غير محدد");
            localStorage.setItem("userPhone", userData.phone || "غير محدد");
            localStorage.setItem("userId", user.uid);

            // Update display name in header
            if (displayName) {
                displayName.textContent = userData.fullName || "غير محدد";
            }
        } else {
            // User doesn't have a document, create one automatically
            console.log("Creating new user document for:", user.uid);
            await createOrUpdateUserDocument(user);

            // Load the newly created document
            await loadUserData(user);
            return;
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        showError("حدث خطأ أثناء تحميل بيانات المستخدم");
    }
}

// Create or update user document in Firestore
async function createOrUpdateUserDocument(user, additionalData = {}) {
    try {
        // Get the current user document
        const userDoc = await getDoc(doc(db, "users", user.uid));

        // Prepare user data with default values
        const userData = {
            fullName: user.displayName || "غير محدد",
            email: user.email,
            phone: "",
            age: "",
            gender: "",
            ...additionalData
        };

        if (userDoc.exists()) {
            // Update existing document
            await updateDoc(doc(db, "users", user.uid), userData);
            console.log("Updated user document for:", user.uid);
        } else {
            // Create new document
            await setDoc(doc(db, "users", user.uid), userData);
            console.log("Created new user document for:", user.uid);
        }

        return userData;
    } catch (error) {
        console.error("Error creating/updating user document:", error);
        throw error;
    }
}

// Update user data in Firebase
async function updateUserData(event) {
    event.preventDefault();

    // Check if user is authenticated
    const user = auth.currentUser;

    if (!user) {
        showError("لم يتم تسجيل الدخول");
        return;
    }

    if (!currentField) {
        showError("لم يتم تحديد الحقل للتحديث");
        return;
    }

    // Get input value
    const value = modalInput.value;

    try {
        // Create update object with only the current field
        const updatedData = {};
        updatedData[currentField] = value;

        // Update or create user document
        await createOrUpdateUserDocument(user, updatedData);

        // Update userData object
        userData[currentField] = value;

        // Update localStorage if name or email
        if (currentField === "fullName" || currentField === "name") {
            localStorage.setItem("userName", value);
            // Update display name in header
            if (displayName) {
                displayName.textContent = value;
            }
        } else if (currentField === "email") {
            localStorage.setItem("userEmail", value);
        } else if (currentField === "phone") {
            localStorage.setItem("userPhone", value);
        }

        // Update display value on page
        updateDisplayValue(currentField, value);

        // Close modal
        closeModalFunc();

        // Show success message
        showSuccess();
    } catch (error) {
        console.error("Error updating user data:", error);
        showError("حدث خطأ أثناء تحديث بيانات المستخدم");
    }
}

// Reset form to original values
function resetForm() {
    nameInput.value = originalValues.name;
    emailInput.value = originalValues.email;
    phoneInput.value = originalValues.phone;
    ageInput.value = originalValues.age;
    genderInput.value = originalValues.gender;

    // Hide any messages
    successMessage.style.display = "none";
    errorMessage.style.display = "none";
}

// Show success message
function showSuccess() {
    successMessage.style.display = "block";
    errorMessage.style.display = "none";

    // Hide success message after 5 seconds
    setTimeout(() => {
        successMessage.style.display = "none";
    }, 5000);
}

// Show error message
function showError(message) {
    errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorMessage.style.display = "block";
    successMessage.style.display = "none";

    // Hide error message after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = "none";
    }, 5000);
}

// Setup edit buttons
function setupEditButtons() {
    const editButtons = document.querySelectorAll(".edit-btn");

    editButtons.forEach(button => {
        button.addEventListener("click", () => {
            const field = button.getAttribute("data-field");
            openEditModal(field);
        });
    });

    // Setup update info button
    if (updateInfoBtn) {
        updateInfoBtn.addEventListener("click", () => {
            // Show update form modal with all fields
            openUpdateForm();
        });
    }
}

// Setup modal close buttons
function setupModalCloseButtons() {
    if (closeModal) {
        closeModal.addEventListener("click", closeModalFunc);
    }

    if (modalCancel) {
        modalCancel.addEventListener("click", closeModalFunc);
    }

    // Close modal when clicking outside
    editModal.addEventListener("click", (e) => {
        if (e.target === editModal) {
            closeModalFunc();
        }
    });
}

// Open edit modal
function openEditModal(field) {
    currentField = field;

    // Set modal label
    modalLabel.textContent = fieldLabels[field];

    // Get current value
    let currentValue = "";
    if (field === "fullName" || field === "name") {
        currentValue = displayNameValue.textContent;
    } else if (field === "email") {
        currentValue = displayEmailValue.textContent;
    } else if (field === "phone") {
        currentValue = displayPhoneValue.textContent;
    } else if (field === "age") {
        currentValue = displayAgeValue.textContent;
    } else if (field === "gender") {
        currentValue = displayGenderValue.textContent;
    }

    // Set input value
    modalInput.value = currentValue === "غير محدد" ? "" : currentValue;

    // Set input type based on field
    if (field === "email") {
        modalInput.type = "email";
    } else if (field === "age") {
        modalInput.type = "number";
        modalInput.min = "18";
        modalInput.max = "100";
    } else if (field === "gender") {
        // For gender, create a select dropdown
        const select = document.createElement("select");
        select.id = "modal-input";
        select.name = "modal-input";
        select.required = true;

        const maleOption = document.createElement("option");
        maleOption.value = "male";
        maleOption.textContent = "ذكر";

        const femaleOption = document.createElement("option");
        femaleOption.value = "female";
        femaleOption.textContent = "أنثى";

        select.appendChild(maleOption);
        select.appendChild(femaleOption);

        // Replace input with select
        modalInput.parentNode.replaceChild(select, modalInput);

        // Update reference
        window.modalInput = select;

        // Set selected value
        if (currentValue === "ذكر") {
            select.value = "male";
        } else if (currentValue === "أنثى") {
            select.value = "female";
        }
    } else {
        modalInput.type = "text";
    }

    // Show modal
    editModal.classList.add("active");
}

// Close modal
function closeModalFunc() {
    editModal.classList.remove("active");
    currentField = null;

    // Reset input type to text in case it was changed
    if (window.modalInput && window.modalInput.tagName === "SELECT") {
        const input = document.createElement("input");
        input.type = "text";
        input.id = "modal-input";
        input.name = "modal-input";
        input.required = true;

        window.modalInput.parentNode.replaceChild(input, window.modalInput);
        window.modalInput = input;
    }
}

// Open update form with all fields
function openUpdateForm() {
    // Create a custom form container
    const formContainer = document.createElement("div");
    formContainer.className = "update-form-container";

    // Create form fields
    formContainer.innerHTML = `
        <div class="modal-header">
            <h3>تحديث جميع المعلومات</h3>
            <button class="close-modal" id="close-update-form">&times;</button>
        </div>
        <div class="modal-body">
            <form id="update-all-form">
                <div class="form-group">
                    <label for="update-fullName">الاسم الكامل</label>
                    <input type="text" id="update-fullName" value="${userData.fullName || ""}" required>
                </div>
                <div class="form-group">
                    <label for="update-email">البريد الإلكتروني</label>
                    <input type="email" id="update-email" value="${userData.email || ""}" required>
                </div>
                <div class="form-group">
                    <label for="update-phone">رقم الهاتف</label>
                    <input type="tel" id="update-phone" value="${userData.phone || ""}" required>
                </div>
                <div class="form-group">
                    <label for="update-age">العمر</label>
                    <input type="number" id="update-age" min="18" max="100" value="${userData.age || ""}" required>
                </div>
                <div class="form-group">
                    <label for="update-gender">الجنس</label>
                    <select id="update-gender" required>
                        <option value="">اختر الجنس</option>
                        <option value="male" ${userData.gender === "male" ? "selected" : ""}>ذكر</option>
                        <option value="female" ${userData.gender === "female" ? "selected" : ""}>أنثى</option>
                    </select>
                </div>
                <div class="btn-container">
                    <button type="button" class="btn btn-secondary" id="update-form-cancel">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ جميع التغييرات</button>
                </div>
            </form>
        </div>
    `;

    // Replace modal content
    const modalContent = document.querySelector(".modal-content");
    modalContent.innerHTML = "";
    modalContent.appendChild(formContainer);

    // Setup close button
    document.getElementById("close-update-form").addEventListener("click", () => {
        editModal.classList.remove("active");
        resetModalContent();
    });

    document.getElementById("update-form-cancel").addEventListener("click", () => {
        editModal.classList.remove("active");
        resetModalContent();
    });

    // Setup form submission
    document.getElementById("update-all-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get form values
        const updatedData = {
            fullName: document.getElementById("update-fullName").value,
            email: document.getElementById("update-email").value,
            phone: document.getElementById("update-phone").value,
            age: document.getElementById("update-age").value,
            gender: document.getElementById("update-gender").value
        };

        try {
            // Check if user is authenticated
            const user = auth.currentUser;

            if (!user) {
                showError("لم يتم تسجيل الدخول");
                return;
            }

            // Update or create user document
            await createOrUpdateUserDocument(user, updatedData);

            // Update userData object
            userData = { ...userData, ...updatedData };

            // Update localStorage
            localStorage.setItem("userName", updatedData.fullName);
            localStorage.setItem("userEmail", updatedData.email);
            localStorage.setItem("userPhone", updatedData.phone);

            // Update display values
            displayNameValue.textContent = updatedData.fullName;
            displayEmailValue.textContent = updatedData.email;
            displayPhoneValue.textContent = updatedData.phone;
            displayAgeValue.textContent = updatedData.age;

            // Handle gender display
            if (updatedData.gender === "male") {
                displayGenderValue.textContent = "ذكر";
            } else if (updatedData.gender === "female") {
                displayGenderValue.textContent = "أنثى";
            } else {
                displayGenderValue.textContent = "غير محدد";
            }

            // Update display name in header
            if (displayName) {
                displayName.textContent = updatedData.fullName;
            }

            // Close modal
            editModal.classList.remove("active");
            resetModalContent();

            // Show success message
            showSuccess();
        } catch (error) {
            console.error("Error updating user data:", error);
            showError("حدث خطأ أثناء تحديث بيانات المستخدم");
        }
    });

    // Show modal
    editModal.classList.add("active");
}

// Reset modal content to original state
function resetModalContent() {
    const modalContent = document.querySelector(".modal-content");
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>تعديل المعلومات</h3>
            <button class="close-modal" id="close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <form id="edit-form">
                <div class="form-group">
                    <label id="modal-label">القيمة</label>
                    <input type="text" id="modal-input" required>
                </div>
                <div class="btn-container">
                    <button type="button" class="btn btn-secondary" id="modal-cancel">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ</button>
                </div>
            </form>
        </div>
    `;

    // Re-setup event listeners
    setupModalCloseButtons();
    editForm.addEventListener("submit", updateUserData);
}

// Update display value
function updateDisplayValue(field, value) {
    if (field === "fullName" || field === "name") {
        displayNameValue.textContent = value;
    } else if (field === "email") {
        displayEmailValue.textContent = value;
    } else if (field === "phone") {
        displayPhoneValue.textContent = value;
    } else if (field === "age") {
        displayAgeValue.textContent = value;
    } else if (field === "gender") {
        if (value === "male") {
            displayGenderValue.textContent = "ذكر";
        } else if (value === "female") {
            displayGenderValue.textContent = "أنثى";
        } else {
            displayGenderValue.textContent = value;
        }
    }
}

// Logout user
function logoutUser() {
    // Clear login data from localStorage
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userId");

    // Redirect to login page
    window.location.href = "login.html";
}

// Setup mobile menu
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector(".mobile-menu");
    const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");
    const mobileMenuSidebar = document.querySelector(".mobile-menu-sidebar");
    const mobileMenuClose = document.querySelector(".mobile-menu-close");
    const mobileMenuContent = document.querySelector(".mobile-menu-content");
    const navMenu = document.querySelector("nav ul");

    // Function to check if we're on mobile view
    function isMobileView() {
        return window.innerWidth <= 768;
    }

    // Function to close mobile menu
    function closeMobileMenu() {
        if (mobileMenuSidebar) mobileMenuSidebar.classList.remove("active");
        if (mobileMenuOverlay) mobileMenuOverlay.classList.remove("active");
        document.body.style.overflow = "auto";
    }

    // Function to setup mobile menu
    function setupMobileMenuContent() {
        // Clone navigation items to mobile menu only if we're on mobile view
        if (isMobileView() && mobileMenuContent && navMenu) {
            // Clear existing content
            mobileMenuContent.innerHTML = "";

            // Create new list for mobile menu
            const mobileNavList = document.createElement("ul");

            // Clone all navigation items
            const navItems = navMenu.querySelectorAll("li");
            navItems.forEach(item => {
                const clonedItem = item.cloneNode(true);
                mobileNavList.appendChild(clonedItem);
            });

            // Add the cloned list to mobile menu content
            mobileMenuContent.appendChild(mobileNavList);
        }
    }

    // Setup mobile menu on page load
    setupMobileMenuContent();

    // Toggle mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => {
            if (isMobileView()) {
                mobileMenuSidebar.classList.toggle("active");
                mobileMenuOverlay.classList.toggle("active");
                document.body.style.overflow = mobileMenuSidebar.classList.contains("active") ? "hidden" : "auto";
            }
        });
    }

    // Close mobile menu when clicking on the overlay
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener("click", () => {
            closeMobileMenu();
        });
    }

    // Close mobile menu when clicking on the close button
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener("click", () => {
            closeMobileMenu();
        });
    }

    // Handle window resize
    window.addEventListener("resize", () => {
        // If we switch from mobile to desktop view, close the mobile menu
        if (!isMobileView()) {
            closeMobileMenu();
        } else {
            // If we switch from desktop to mobile view, setup the mobile menu
            setupMobileMenuContent();
        }
    });
}
