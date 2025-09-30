// DOM Elements
const menuFilterBtns = document.querySelectorAll(".filter-btn")
const menuItems = document.querySelectorAll(".menu-item")
const addToCartBtns = document.querySelectorAll(".add-to-cart")
const cartBtn = document.querySelector(".cart-btn")
const cartCount = document.querySelector(".cart-count")
const cartModal = document.querySelector(".cart-modal")
const closeCart = document.querySelector(".close-cart")
const cartItemsContainer = document.querySelector(".cart-items")
const cartTotal = document.querySelector(".cart-total")
const checkoutBtn = document.querySelector(".checkout-btn")
const mobileMenuBtn = document.querySelector(".mobile-menu")
const navMenu = document.querySelector("nav ul")
const navLinks = document.querySelectorAll("nav ul li a")
const header = document.querySelector("header")

// Customize Order Elements
let customizeModal
let closeCustomize
let cancelCustomize
let addToCartCustomize
let customizeItemImg
let customizeItemName
let customizeItemDesc
let customizeBasePrice
let customizeBaseIngredients
let customizeSauces
let customizeExtras
let customizeNotes
let customizeTotalPrice

// Categories and Products Elements
const categoriesView = document.getElementById("categoriesView")
const productsView = document.getElementById("productsView")
const backBtn = document.getElementById("backBtn")
const categoryTitle = document.getElementById("categoryTitle")
const menuContent = document.getElementById("menuContent")
const categoryCards = document.querySelectorAll(".category-card")

// Current Item Being Customized
let currentItem = null

// Cart array to store items
let cart = []

// Categories data
const menuItemsData = [
    // الشاورما
    {
      id: 1,
      name: "شاورما صغير",
      price: 6,
      description: "شاورما صغير بالدجاج أو اللحم مع الخضروات الطازجة",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "shawarma",
      baseIngredients: [
        { id: "meat", name: "دجاج أو لحم", checked: true },
        { id: "bread", name: "خبز", checked: true },
        { id: "vegetables", name: "خضروات طازجة", checked: true },
      ],
      sauces: [
        { id: "garlic", name: "صلصة الثوم", checked: false },
        { id: "hummus", name: "صلصة الحمص", checked: false },
      ],
      extras: [
        { id: "cheese", name: "جبن", price: 2, checked: false },
        { id: "spicy", name: "فلفل حار", price: 1, checked: false },
      ],
    },
  
    // البيتزا
    {
      id: 10,
      name: "بيتزا صغير",
      price: 11,
      description: "بيتزا صغيرة بالجبن والخضروات",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "pizza",
      baseIngredients: [
        { id: "dough", name: "عجينة", checked: true },
        { id: "cheese", name: "جبن", checked: true },
        { id: "sauce", name: "صلصة طماطم", checked: true },
      ],
      sauces: [],
      extras: [
        { id: "vegetables", name: "خضروات", price: 2, checked: false },
        { id: "meat", name: "لحم", price: 5, checked: false },
      ],
    },
  
    // السندويتشات
    {
      id: 13,
      name: "مشكيكي عادي",
      price: 11,
      description: "مشكيكي عادي بالدجاج والخضروات",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "chicken", name: "دجاج", checked: true },
        { id: "bread", name: "خبز", checked: true },
        { id: "vegetables", name: "خضروات", checked: true },
      ],
      sauces: [{ id: "garlic", name: "صلصة الثوم", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
  
    // البروست
    {
      id: 17,
      name: "بروست عادي",
      price: 18,
      description: "بروست دجاج مقرمش بالطريقة التقليدية",
      image:
        "https://images.unsplash.com/photo-1599940824468-a91f97c85eba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "broast",
      baseIngredients: [{ id: "chicken", name: "دجاج مقرمش", checked: true }],
      sauces: [
        { id: "garlic", name: "صلصة الثوم", checked: false },
        { id: "ketchup", name: "كاتشب", checked: false },
      ],
      extras: [
        { id: "fries", name: "بطاطس", price: 3, checked: false },
        { id: "coleslaw", name: "سلطة كولسلو", price: 3, checked: false },
      ],
    },
  
    // المقرمشات
    {
      id: 19,
      name: "بطاطس مقلي صغير",
      price: 6,
      description: "بطاطس مقلية مقرمشة حجم صغير",
      image:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "snacks",
      baseIngredients: [{ id: "potatoes", name: "بطاطس", checked: true }],
      sauces: [
        { id: "ketchup", name: "كاتشب", checked: false },
        { id: "mayo", name: "مايونيز", checked: false },
      ],
      extras: [{ id: "cheese", name: "جبن", price: 2, checked: false }],
    },
  
    // الطباخي
    {
      id: 26,
      name: "سمبوسة",
      price: 2.5,
      description: "سمبوسة محشية باللحم أو الخضار",
      image:
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "cooked",
      baseIngredients: [
        { id: "pastry", name: "عجينة سمبوسة", checked: true },
        { id: "filling", name: "حشوة لحم أو خضار", checked: true },
      ],
      sauces: [{ id: "chutney", name: "صلصة تشاتني", checked: false }],
      extras: [],
    },
  ]
  
  const categories = {
    shawarma: { name: "الشاورما", count: 9 },
    pizza: { name: "البيتزا", count: 3 },
    sandwiches: { name: "السندويتشات", count: 4 },
    broast: { name: "البروست", count: 2 },
    snacks: { name: "المقرمشات", count: 8 },
    cooked: { name: "الطباخي", count: 6 },
  }

// Initialize DOM elements
function initializeDOMElements() {
  customizeModal = document.querySelector(".customize-modal")
  closeCustomize = document.querySelector(".close-customize")
  cancelCustomize = document.querySelector(".cancel-customize")
  addToCartCustomize = document.querySelector(".add-to-cart-customize")
  customizeItemImg = document.querySelector(".customize-item-img img")
  customizeItemName = document.querySelector(".customize-item-details h4")
  customizeItemDesc = document.querySelector(".customize-item-details p")
  customizeBasePrice = document.querySelector(".customize-base-price")
  customizeBaseIngredients = document.querySelector(".customize-base-ingredients")
  customizeSauces = document.querySelector(".customize-sauces")
  customizeExtras = document.querySelector(".customize-extras")
  customizeNotes = document.querySelector(".customize-notes")
  customizeTotalPrice = document.querySelector(".customize-total-price")
  
  // Add event listeners for customize modal
  if (closeCustomize) {
    closeCustomize.addEventListener("click", () => {
      customizeModal.style.display = "none"
      document.body.style.overflow = "auto"
    })
  }
  
  if (cancelCustomize) {
    cancelCustomize.addEventListener("click", () => {
      customizeModal.style.display = "none"
      document.body.style.overflow = "auto"
    })
  }
  
  if (addToCartCustomize) {
    addToCartCustomize.addEventListener("click", addCustomizedItemToCart)
  }
  
  // Close modal when clicking outside
  if (customizeModal) {
    customizeModal.addEventListener("click", (e) => {
      if (e.target === customizeModal) {
        customizeModal.style.display = "none"
        document.body.style.overflow = "auto"
      }
    })
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM elements
  initializeDOMElements();
  
  // Check if user is logged in
  checkUserLogin();
  // Set active nav link on scroll
  window.addEventListener("scroll", () => {
    let current = ""

    document.querySelectorAll("section").forEach((section) => {
      const sectionTop = section.offsetTop
      const sectionHeight = section.clientHeight
      if (scrollY >= sectionTop - 200) {
        current = section.getAttribute("id")
      }
    })

    navLinks.forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href").slice(1) === current) {
        link.classList.add("active")
      }
    })

    // Header shadow on scroll
    if (window.scrollY > 100) {
      header.style.boxShadow = "0 2px 15px rgba(0, 0, 0, 0.1)"
    } else {
      header.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)"
    }
  })

  // Mobile menu toggle
  const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");
  const mobileMenuSidebar = document.querySelector(".mobile-menu-sidebar");
  const mobileMenuClose = document.querySelector(".mobile-menu-close");
  const mobileMenuContent = document.querySelector(".mobile-menu-content");
  
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
  function setupMobileMenu() {
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
      
      // Setup cart button functionality in mobile view
      const mobileCartBtn = mobileMenuContent.querySelector(".cart-btn");
      if (mobileCartBtn && cartModal) {
        // Remove any existing event listeners to avoid duplicates
        mobileCartBtn.replaceWith(mobileCartBtn.cloneNode(true));
        const newMobileCartBtn = mobileMenuContent.querySelector(".cart-btn");
        
        // Add event listener to open cart modal
        newMobileCartBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Open cart modal
          cartModal.style.display = "flex";
          document.body.style.overflow = "hidden";
          
          // Close mobile menu
          closeMobileMenu();
        });
      }
      
      // Setup user menu toggle in mobile view
      const userMenuItems = mobileMenuContent.querySelectorAll(".user-menu");
      userMenuItems.forEach(userMenu => {
        userMenu.addEventListener("click", (e) => {
          if (e.target.closest(".user-name") && !e.target.closest(".user-dropdown")) {
            userMenu.classList.toggle("active");
            e.stopPropagation();
          }
        });
      });
    }
  }
  
  // Setup mobile menu on page load
  setupMobileMenu();
  
  // Toggle mobile menu
  mobileMenuBtn.addEventListener("click", () => {
    if (isMobileView()) {
      mobileMenuSidebar.classList.toggle("active");
      mobileMenuOverlay.classList.toggle("active");
      document.body.style.overflow = mobileMenuSidebar.classList.contains("active") ? "hidden" : "auto";
    }
  });
  
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
      setupMobileMenu();
    }
  });
  
  // User menu toggle for mobile
  const userMenuItem = document.getElementById("user-menu-item");
  if (userMenuItem) {
    const userMenu = userMenuItem.querySelector(".user-menu");
    if (userMenu) {
      userMenu.addEventListener("click", (e) => {
        // Only toggle if clicking on the user name, not on dropdown items
        if (e.target.closest(".user-name") && !e.target.closest(".user-dropdown")) {
          userMenu.classList.toggle("active");
          e.stopPropagation();
        }
      });
    }
  }

  // Category cards click events
  categoryCards.forEach((card) => {
    card.addEventListener("click", () => {
      const category = card.getAttribute("data-category")
      showCategoryProducts(category)
    })
  })

  // Back button click event
  backBtn.addEventListener("click", showCategories)

  // Add to cart functionality
  addToCartBtns.forEach((btn) => {
    btn.addEventListener("click", openCustomizeModal)
  })

  // Cart modal functionality
  cartBtn.addEventListener("click", () => {
    cartModal.style.display = "flex"
    document.body.style.overflow = "hidden"
  })

  closeCart.addEventListener("click", () => {
    cartModal.style.display = "none"
    document.body.style.overflow = "auto"
  })

  // Close cart when clicking outside
  cartModal.addEventListener("click", (e) => {
    if (e.target === cartModal) {
      cartModal.style.display = "none"
      document.body.style.overflow = "auto"
    }
  })

  // Checkout functionality
  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("السلة فارغة! يرجى إضافة منتجات أولاً.")
      return
    }

    // Save cart to localStorage before redirecting to checkout page
    localStorage.setItem("cart", JSON.stringify(cart));

    // Redirect to checkout page
    window.location.href = "checkout.html";
  })

  // Smooth scrolling for navigation links
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href")

      // Check if it's an external link
      if (href && !href.startsWith("#")) {
        // Allow external links to work normally
        return
      }

      e.preventDefault()

      const targetId = href
      const targetSection = document.querySelector(targetId)

      if (targetSection) {
        window.scrollTo({
          top: targetSection.offsetTop - 80,
          behavior: "smooth",
        })
      }

      // Close mobile menu if open
      navMenu.classList.remove("show")
    })
  })

  // Initialize cart
  loadCartFromStorage()

  // Show categories view initially
  showCategories()
})

// Update cart function
function updateCart() {
  // Update cart count
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)
  
  // Update cart count in desktop view
  if (cartCount) {
    cartCount.textContent = totalItems
  }
  
  // Update cart count in mobile view
  const mobileCartCount = document.querySelector(".mobile-menu-content .cart-count")
  if (mobileCartCount) {
    mobileCartCount.textContent = totalItems
  }

  // Update cart items
  cartItemsContainer.innerHTML = ""

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart">السلة فارغة</p>'
  } else {
    cart.forEach((item, index) => {
      const cartItem = document.createElement("div")
      cartItem.classList.add("cart-item")
      cartItem.innerHTML = `
                <div class="cart-item-img">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">
                        <span>${item.price} ريال</span>
                        <div class="quantity-control">
                            <button class="decrease-quantity">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="increase-quantity">+</button>
                        </div>
                    </div>
                </div>
                <button class="remove-item" data-index="${index}"><i class="fas fa-trash"></i></button>
            `

      cartItemsContainer.appendChild(cartItem)
    })

    // Add event listeners to quantity controls and remove buttons
    const decreaseBtns = document.querySelectorAll(".decrease-quantity")
    const increaseBtns = document.querySelectorAll(".increase-quantity")
    const removeBtns = document.querySelectorAll(".remove-item")

    decreaseBtns.forEach((btn) => {
      btn.addEventListener("click", decreaseQuantity)
    })

    increaseBtns.forEach((btn) => {
      btn.addEventListener("click", increaseQuantity)
    })

    removeBtns.forEach((btn) => {
      btn.addEventListener("click", removeItem)
    })
  }

  // Update cart total
  const total = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  cartTotal.textContent = `${total.toFixed(2)} ريال`
}

// Load cart from localStorage
function loadCartFromStorage() {
  const cartData = localStorage.getItem("cart");
  if (cartData) {
    try {
      cart = JSON.parse(cartData);
      updateCart();
    } catch (e) {
      console.error("Error parsing cart data:", e);
      cart = [];
    }
  }
}

// Decrease quantity function
function decreaseQuantity(e) {
  const cartItem = e.target.closest(".cart-item")
  const index = Array.from(cartItemsContainer.children).indexOf(cartItem)

  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1
    updateCart()
    // Save cart to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));
  }
}

// Increase quantity function
function increaseQuantity(e) {
  const cartItem = e.target.closest(".cart-item")
  const index = Array.from(cartItemsContainer.children).indexOf(cartItem)

  cart[index].quantity += 1
  updateCart()
  // Save cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Remove item function
function removeItem(e) {
  const index = e.currentTarget.getAttribute("data-index")

  cart.splice(index, 1)
  updateCart()
  // Save cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Animation on scroll
const animateOnScroll = () => {
  const elements = document.querySelectorAll(".feature, .menu-item, .offer-card, .contact-info, .contact-form")

  elements.forEach((element) => {
    const elementPosition = element.getBoundingClientRect().top
    const screenPosition = window.innerHeight / 1.3

    if (elementPosition < screenPosition) {
      element.style.opacity = "1"
      element.style.transform = "translateY(0)"
    }
  })
}

window.addEventListener("scroll", animateOnScroll)
window.addEventListener("load", animateOnScroll)

// Customize Order Functions
// Open customize modal
const openCustomizeModal = (e) => {
  // Initialize DOM elements if not already initialized
  if (!customizeModal) {
    initializeDOMElements();
  }
  
  const menuItem = e.target.closest(".menu-item")
  const itemId = Number.parseInt(menuItem.getAttribute("data-id"))

  // Find the item in menuItemsData
  currentItem = menuItemsData.find((item) => item.id === itemId)

  if (!currentItem) return

  // Set item details in the modal
  customizeItemImg.src = currentItem.image
  customizeItemName.textContent = currentItem.name
  customizeItemDesc.textContent = currentItem.description
  customizeBasePrice.textContent = `${currentItem.price} ريال`

  // Reset notes
  customizeNotes.value = ""

  // Render base ingredients
  renderIngredients(currentItem.baseIngredients, customizeBaseIngredients, "ingredient")

  // Render sauces
  renderIngredients(currentItem.sauces, customizeSauces, "sauce")

  // Render extras
  renderIngredients(currentItem.extras, customizeExtras, "extra")

  // Calculate initial total
  calculateCustomizeTotal()

  // Show modal
  customizeModal.style.display = "flex"
  document.body.style.overflow = "hidden"
}

// Render ingredients, sauces, or extras
const renderIngredients = (ingredients, container, type) => {
  container.innerHTML = ""

  if (ingredients.length === 0) {
    container.innerHTML = '<p class="no-options">لا توجد خيارات متاحة</p>'
    return
  }

  ingredients.forEach((ingredient) => {
    const ingredientElement = document.createElement("div")
    ingredientElement.classList.add(`${type}-item`)

    const checkbox = document.createElement("div")
    checkbox.classList.add(`${type}-checkbox`)

    const input = document.createElement("input")
    input.type = "checkbox"
    input.id = `${type}-${ingredient.id}`
    input.checked = ingredient.checked || false
    input.addEventListener("change", () => {
      ingredient.checked = input.checked
      calculateCustomizeTotal()
    })

    const checkmark = document.createElement("span")
    checkmark.classList.add("checkmark")

    const name = document.createElement("span")
    name.classList.add(`${type}-name`)
    name.textContent = ingredient.name

    checkbox.appendChild(input)
    checkbox.appendChild(checkmark)

    ingredientElement.appendChild(checkbox)
    ingredientElement.appendChild(name)

    // Add price for extras
    if (type === "extra" && ingredient.price !== undefined) {
      const price = document.createElement("span")
      price.classList.add("extra-price")
      price.textContent = `+${ingredient.price} ريال`
      ingredientElement.appendChild(price)
    }

    container.appendChild(ingredientElement)
  })
}

// Calculate total price for customized item
const calculateCustomizeTotal = () => {
  // Initialize DOM elements if not already initialized
  if (!customizeTotalPrice) {
    initializeDOMElements();
  }
  
  if (!currentItem) return

  let total = currentItem.price

  // Add extras price
  currentItem.extras.forEach((extra) => {
    if (extra.checked && extra.price) {
      total += extra.price
    }
  })

  // Update total price display
  if (customizeTotalPrice) {
    customizeTotalPrice.textContent = `${total} ريال`
  }
}

// Add customized item to cart
const addCustomizedItemToCart = () => {
  // Initialize DOM elements if not already initialized
  if (!customizeModal) {
    initializeDOMElements();
  }
  
  if (!currentItem) return

  // Create a copy of the current item
  const customizedItem = {
    ...currentItem,
    baseIngredients: currentItem.baseIngredients.filter((ing) => ing.checked),
    sauces: currentItem.sauces.filter((sauce) => sauce.checked),
    extras: currentItem.extras.filter((extra) => extra.checked),
    notes: customizeNotes.value,
    quantity: 1,
  }

  // Calculate the total price
  let totalPrice = currentItem.price
  customizedItem.extras.forEach((extra) => {
    if (extra.price) {
      totalPrice += extra.price
    }
  })
  customizedItem.price = totalPrice

  // Add to cart
  cart.push(customizedItem)

  // Update cart UI
  updateCart()

  // Save cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));

  // Close modal
  customizeModal.style.display = "none"
  document.body.style.overflow = "auto"

  // Show success message
  showNotification("تمت إضافة الطلب إلى السلة بنجاح!")
}

// Show notification
const showNotification = (message) => {
  const notification = document.createElement("div")
  notification.classList.add("notification")
  notification.textContent = message

  document.body.appendChild(notification)

  // Show notification
  setTimeout(() => {
    notification.classList.add("show")
  }, 10)

  // Hide and remove notification
  setTimeout(() => {
    notification.classList.remove("show")
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

// Event listeners for customize modal are now set in initializeDOMElements function

// Categories and Products Functions
// Show category products
function showCategoryProducts(category) {
  const categoryData = categories[category]
  const categoryProducts = menuItemsData.filter((item) => item.category === category)

  // Update category title
  categoryTitle.textContent = categoryData.name

  // Clear menu content
  menuContent.innerHTML = ""

  // Add products to menu content
  categoryProducts.forEach((product) => {
    const productElement = createProductElement(product)
    menuContent.appendChild(productElement)
  })

  // Hide categories view and show products view
  categoriesView.style.display = "none"
  productsView.style.display = "block"
}

// Show categories
function showCategories() {
  categoriesView.style.display = "block"
  productsView.style.display = "none"
}

// Create product element
function createProductElement(product) {
  const productDiv = document.createElement("div")
  productDiv.classList.add("menu-item")
  productDiv.setAttribute("data-category", product.category)
  productDiv.setAttribute("data-id", product.id)

  productDiv.innerHTML = `
            <div class="menu-img">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="menu-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="menu-price">
                    <span>${product.price} ريال</span>
                    <button class="add-to-cart">أضف للسلة</button>
                </div>
            </div>
        `

  // Add event listener to add to cart button
  const addToCartBtn = productDiv.querySelector(".add-to-cart")
  addToCartBtn.addEventListener("click", openCustomizeModal)

  return productDiv
}

// Check user login status
function checkUserLogin() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userMenuItem = document.getElementById('user-menu-item');
  const displayName = document.getElementById('display-name');
  const logoutBtn = document.getElementById('logout-btn');
  const accountantPanel = document.getElementById('accountant-panel');

  if (isLoggedIn) {
    // Show user menu
    userMenuItem.style.display = 'block';

    // Get user name from localStorage
    const userName = localStorage.getItem('userName');
    if (userName) {
      displayName.textContent = userName;
    } else {
      displayName.textContent = 'مستخدم';
    }

    // Check if user is accountant
    const isAccountant = localStorage.getItem('isAccountant') === 'true';
    if (isAccountant && accountantPanel) {
      accountantPanel.style.display = 'block';
    } else if (accountantPanel) {
      accountantPanel.style.display = 'none';
    }

    // Add logout functionality
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        logoutUser();
      });
    }
  } else {
    // Hide user menu
    userMenuItem.style.display = 'none';
  }
}

// Logout user
function logoutUser() {
  // Clear login data from localStorage
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userPhone');

  // Redirect to login page
  window.location.href = 'login.html';
}

import { sendOrder } from "./firebase.js";

document.querySelector(".checkout-btn").addEventListener("click", async () => {
    if (cart.length === 0) {
        alert("السلة فارغة! يرجى إضافة منتجات أولاً.");
        return;
    }

    const cartItems = cart; // 🟢 مصفوفة المنتجات
    const total     = cart.reduce((sum, item) => sum + item.price * item.quantity, 0); // 🟢 مجموع السعر

    await sendOrder(cartItems, total);
});
