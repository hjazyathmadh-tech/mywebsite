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

// Offers Elements
const offersContent = document.getElementById("offers-content")

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
    {
      id: 2,
      name: "شاورما ساندوتش",
      price: 7,
      description: "شاورما ساندوتش بالدجاج أو اللحم مع الخضروات الطازجة",
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
    {
      id: 3,
      name: "شاورما صاج",
      price: 8,
      description: "شاورما صاج بالدجاج أو اللحم مع الخضروات الطازجة",
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
    {
      id: 4,
      name: "شاورما سوبريم",
      price: 11,
      description: "شاورما سوبريم بالدجاج أو اللحم مع الخضروات الطازجة",
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
    {
      id: 5,
      name: "شاورما سوبر",
      price: 11,
      description: "شاورما سوبر بالدجاج أو اللحم مع الخضروات الطازجة",
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
    {
      id: 6,
      name: "شاورما حراق",
      price: 11,
      description: "شاورما حراق بالدجاج أو اللحم مع الخضروات الطازجة",
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
    {
      id: 7,
      name: "شاورما حراق دجاج",
      price: 11,
      description: "شاورما حراق دجاج مع الخضروات الطازجة",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "shawarma",
      baseIngredients: [
        { id: "meat", name: "دجاج", checked: true },
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
    {
      id: 8,
      name: "شاورما مشكل",
      price: 15,
      description: "شاورما مشكل بالدجاج واللحم مع الخضروات الطازجة",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "shawarma",
      baseIngredients: [
        { id: "meat", name: "دجاج ولحم", checked: true },
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
    {
      id: 9,
      name: "شاورما عربي وسط",
      price: 16,
      description: "شاورما عربي وسط بالدجاج أو اللحم مع الخضروات الطازجة",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "shawarma",
      baseIngredients: [
        { id: "meat", name: "دجاج أو لحم", checked: true },
        { id: "bread", name: "خبز عربي", checked: true },
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
    {
      id: 10,
      name: "شاورما عربي كبير",
      price: 20,
      description: "شاورما عربي كبير بالدجاج أو اللحم مع الخضروات الطازجة",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "shawarma",
      baseIngredients: [
        { id: "meat", name: "دجاج أو لحم", checked: true },
        { id: "bread", name: "خبز عربي", checked: true },
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
    {
      id: 11,
      name: "شاورما عربي سبشل",
      price: 17,
      description: "شاورما عربي سبشل بالدجاج أو اللحم مع الخضروات الطازجة",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "shawarma",
      baseIngredients: [
        { id: "meat", name: "دجاج أو لحم", checked: true },
        { id: "bread", name: "خبز عربي", checked: true },
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
    {
      id: 12,
      name: "شاورما عربي حراق",
      price: 18,
      description: "شاورما عربي حراق بالدجاج أو اللحم مع الخضروات الطازجة",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "shawarma",
      baseIngredients: [
        { id: "meat", name: "دجاج أو لحم", checked: true },
        { id: "bread", name: "خبز عربي", checked: true },
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
    {
      id: 13,
      name: "شاورما عادي",
      price: 15,
      description: "شاورما عادي بالدجاج أو اللحم مع الخضروات الطازجة",
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
    {
      id: 14,
      name: "شاورما جامبو",
      price: 19,
      description: "شاورما جامبو بالدجاج أو اللحم مع الخضروات الطازجة",
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
    {
      id: 15,
      name: "شاورما اسبشل",
      price: 20,
      description: "شاورما اسبشل بالدجاج أو اللحم مع الخضروات الطازجة",
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
    {
      id: 16,
      name: "شاورما برجر",
      price: 15,
      description: "شاورما برجر بالدجاج أو اللحم مع الخضروات الطازجة",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "shawarma",
      baseIngredients: [
        { id: "meat", name: "دجاج أو لحم", checked: true },
        { id: "bread", name: "خبز برجر", checked: true },
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
    {
      id: 17,
      name: "شاورما برجر جبن",
      price: 17,
      description: "شاورما برجر بالجبن والدجاج أو اللحم مع الخضروات الطازجة",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "shawarma",
      baseIngredients: [
        { id: "meat", name: "دجاج أو لحم", checked: true },
        { id: "bread", name: "خبز برجر", checked: true },
        { id: "vegetables", name: "خضروات طازجة", checked: true },
        { id: "cheese", name: "جبن", checked: true },
      ],
      sauces: [
        { id: "garlic", name: "صلصة الثوم", checked: false },
        { id: "hummus", name: "صلصة الحمص", checked: false },
      ],
      extras: [
        { id: "spicy", name: "فلفل حار", price: 1, checked: false },
      ],
    },
  
    // البيتزا
    {
      id: 10,
      name: "بيتزا اخطار",
      price: 11,
      description: "بيتزا اخطار صغيرة بالجبن والمكونات المميزة",
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
        { id: "large", name: "حجم كبير", price: 5, checked: false },
      ],
    },
    {
      id: 11,
      name: "بيتزا أمريكانا",
      price: 11,
      description: "بيتزا أمريكانا صغيرة بالجبن والمكونات المميزة",
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
        { id: "large", name: "حجم كبير", price: 3, checked: false },
      ],
    },
    {
      id: 12,
      name: "بيتزا خضار",
      price: 11,
      description: "بيتزا خضار صغيرة بالجبن والخضروات الطازجة",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "pizza",
      baseIngredients: [
        { id: "dough", name: "عجينة", checked: true },
        { id: "cheese", name: "جبن", checked: true },
        { id: "vegetables", name: "خضروات متنوعة", checked: true },
      ],
      sauces: [],
      extras: [
        { id: "large", name: "حجم كبير", price: 3, checked: false },
      ],
    },
    {
      id: 13,
      name: "بيتزا دجاج",
      price: 13,
      description: "بيتزا دجاج صغيرة بالجبن ودجاج",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "pizza",
      baseIngredients: [
        { id: "dough", name: "عجينة", checked: true },
        { id: "cheese", name: "جبن", checked: true },
        { id: "chicken", name: "دجاج", checked: true },
      ],
      sauces: [],
      extras: [
        { id: "large", name: "حجم كبير", price: 7, checked: false },
      ],
    },
    {
      id: 14,
      name: "بيتزا تاكسي",
      price: 13,
      description: "بيتزا تاكسي صغيرة بالجبن والمكونات المميزة",
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
        { id: "large", name: "حجم كبير", price: 7, checked: false },
      ],
    },
    {
      id: 15,
      name: "بيتزا هوت دوق",
      price: 13,
      description: "بيتزا هوت دوق صغيرة بالجبن والمكونات المميزة",
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
        { id: "large", name: "حجم كبير", price: 7, checked: false },
      ],
    },
    {
      id: 16,
      name: "بيتزا شاورما",
      price: 13,
      description: "بيتزا شاورما صغيرة بالجبن وشاورما",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "pizza",
      baseIngredients: [
        { id: "dough", name: "عجينة", checked: true },
        { id: "cheese", name: "جبن", checked: true },
        { id: "shawarma", name: "شاورما", checked: true },
      ],
      sauces: [],
      extras: [
        { id: "large", name: "حجم كبير", price: 7, checked: false },
      ],
    },
    {
      id: 17,
      name: "بيتزا مشكلة أحيانًا",
      price: 13,
      description: "بيتزا مشكلة أحيانًا صغيرة بالجبن والمكونات المميزة",
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
        { id: "large", name: "حجم كبير", price: 7, checked: false },
      ],
    },
    {
      id: 18,
      name: "بيتزا تونة",
      price: 14,
      description: "بيتزا تونة صغيرة بالجبن والتونة",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "pizza",
      baseIngredients: [
        { id: "dough", name: "عجينة", checked: true },
        { id: "cheese", name: "جبن", checked: true },
        { id: "tuna", name: "تونة", checked: true },
      ],
      sauces: [],
      extras: [
        { id: "large", name: "حجم كبير", price: 6, checked: false },
      ],
    },
    {
      id: 19,
      name: "بيتزا نقانق",
      price: 14,
      description: "بيتزا نقانق صغيرة بالجبن والنقانق",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "pizza",
      baseIngredients: [
        { id: "dough", name: "عجينة", checked: true },
        { id: "cheese", name: "جبن", checked: true },
        { id: "sausage", name: "نقانق", checked: true },
      ],
      sauces: [],
      extras: [
        { id: "large", name: "حجم كبير", price: 6, checked: false },
      ],
    },
    {
      id: 20,
      name: "بيتزا ديلايت",
      price: 14,
      description: "بيتزا ديلايت صغيرة بالجبن والمكونات المميزة",
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
        { id: "large", name: "حجم كبير", price: 6, checked: false },
      ],
    },
    {
      id: 21,
      name: "بيتزا دجاج",
      price: 14,
      description: "بيتزا دجاج صغيرة بالجبن ودجاج",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "pizza",
      baseIngredients: [
        { id: "dough", name: "عجينة", checked: true },
        { id: "cheese", name: "جبن", checked: true },
        { id: "chicken", name: "دجاج", checked: true },
      ],
      sauces: [],
      extras: [
        { id: "large", name: "حجم كبير", price: 6, checked: false },
      ],
    },
    {
      id: 22,
      name: "بيتزا جبن",
      price: 14,
      description: "بيتزا جبن صغيرة بالجبن",
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
        { id: "large", name: "حجم كبير", price: 6, checked: false },
      ],
    },
    {
      id: 23,
      name: "بيتزا جمبري",
      price: 14,
      description: "بيتزا جمبري صغيرة بالجبن والجمبري",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "pizza",
      baseIngredients: [
        { id: "dough", name: "عجينة", checked: true },
        { id: "cheese", name: "جبن", checked: true },
        { id: "shrimp", name: "جمبري", checked: true },
      ],
      sauces: [],
      extras: [
        { id: "large", name: "حجم كبير", price: 9, checked: false },
      ],
    },
    {
      id: 24,
      name: "بيتزا خضار",
      price: 14,
      description: "بيتزا خضار صغيرة بالجبن والخضروات الطازجة",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "pizza",
      baseIngredients: [
        { id: "dough", name: "عجينة", checked: true },
        { id: "cheese", name: "جبن", checked: true },
        { id: "vegetables", name: "خضروات متنوعة", checked: true },
      ],
      sauces: [],
      extras: [
        { id: "large", name: "حجم كبير", price: 9, checked: false },
      ],
    },
    {
      id: 25,
      name: "بيتزا مشكل أحيانًا",
      price: 13,
      description: "بيتزا مشكل أحيانًا صغيرة بالجبن والمكونات المميزة",
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
        { id: "large", name: "حجم كبير", price: 7, checked: false },
      ],
    },
    {
      id: 26,
      name: "بيتزا ديلايت",
      price: 23,
      description: "بيتزا ديلايت كبيرة بالجبن والمكونات المميزة",
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
        { id: "small", name: "حجم صغير", price: -9, checked: false },
      ],
    },
    {
      id: 27,
      name: "بيتزا حجازيات",
      price: 23,
      description: "بيتزا حجازيات صغيرة بالجبن والمكونات المميزة",
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
        { id: "large", name: "حجم كبير", price: 2, checked: false },
      ],
    },
  
    // السندويتشات
    {
      id: 13,
      name: "مكسيكي عادي",
      price: 11,
      description: "مكسيكي عادي بالدجاج والخضروات",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "meat", name: "دجاج", checked: true },
        { id: "bread", name: "خبز", checked: true },
        { id: "vegetables", name: "خضروات", checked: true },
      ],
      sauces: [{ id: "garlic", name: "صلصة الثوم", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 14,
      name: "مكسيكي حراق",
      price: 11,
      description: "مكسيكي حراق بالدجاج والخضروات",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "meat", name: "دجاج", checked: true },
        { id: "bread", name: "خبز", checked: true },
        { id: "vegetables", name: "خضروات", checked: true },
      ],
      sauces: [{ id: "garlic", name: "صلصة الثوم", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 15,
      name: "برجر دبل",
      price: 7,
      description: "برجر دبل باللحم والخضروات",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "meat", name: "لحم", checked: true },
        { id: "bread", name: "خبز برجر", checked: true },
        { id: "vegetables", name: "خضروات", checked: true },
      ],
      sauces: [{ id: "ketchup", name: "كاتشب", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 16,
      name: "برجر لحم",
      price: 7,
      description: "برجر لحم بالخضروات",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "meat", name: "لحم", checked: true },
        { id: "bread", name: "خبز برجر", checked: true },
        { id: "vegetables", name: "خضروات", checked: true },
      ],
      sauces: [{ id: "ketchup", name: "كاتشب", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 17,
      name: "برجر دجاج",
      price: 7,
      description: "برجر دجاج بالخضروات",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "chicken", name: "دجاج", checked: true },
        { id: "bread", name: "خبز برجر", checked: true },
        { id: "vegetables", name: "خضروات", checked: true },
      ],
      sauces: [{ id: "ketchup", name: "كاتشب", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 18,
      name: "برجر جبن",
      price: 7,
      description: "برجر جبن بالخضروات",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "meat", name: "لحم", checked: true },
        { id: "bread", name: "خبز برجر", checked: true },
        { id: "cheese", name: "جبن", checked: true },
        { id: "vegetables", name: "خضروات", checked: true },
      ],
      sauces: [{ id: "ketchup", name: "كاتشب", checked: false }],
      extras: [],
    },
    {
      id: 19,
      name: "وجبة برجر",
      price: 12,
      description: "وجبة برجر مع بطاطس ومشروب",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "burger", name: "برجر", checked: true },
        { id: "fries", name: "بطاطس", checked: true },
        { id: "drink", name: "مشروب", checked: true },
      ],
      sauces: [{ id: "ketchup", name: "كاتشب", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 20,
      name: "وجبة زنجر",
      price: 15,
      description: "وجبة زنجر مع بطاطس ومشروب",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "zinger", name: "زنجر", checked: true },
        { id: "fries", name: "بطاطس", checked: true },
        { id: "drink", name: "مشروب", checked: true },
      ],
      sauces: [{ id: "garlic", name: "صلصة الثوم", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 21,
      name: "وجبة شاورما",
      price: 15,
      description: "وجبة شاورما مع بطاطس ومشروب",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "shawarma", name: "شاورما", checked: true },
        { id: "fries", name: "بطاطس", checked: true },
        { id: "drink", name: "مشروب", checked: true },
      ],
      sauces: [{ id: "garlic", name: "صلصة الثوم", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 22,
      name: "وجبة عادي",
      price: 11,
      description: "وجبة عادية مع بطاطس ومشروب",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "sandwich", name: "ساندويتش", checked: true },
        { id: "fries", name: "بطاطس", checked: true },
        { id: "drink", name: "مشروب", checked: true },
      ],
      sauces: [{ id: "ketchup", name: "كاتشب", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 23,
      name: "وجبة حراق",
      price: 11,
      description: "وجبة حراق مع بطاطس ومشروب",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "sandwich", name: "ساندويتش حراق", checked: true },
        { id: "fries", name: "بطاطس", checked: true },
        { id: "drink", name: "مشروب", checked: true },
      ],
      sauces: [{ id: "garlic", name: "صلصة الثوم", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 24,
      name: "زنجر عادي",
      price: 11,
      description: "زنجر عادي بالدجاج والخضروات",
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
    {
      id: 25,
      name: "زنجر حراق",
      price: 11,
      description: "زنجر حراق بالدجاج والخضروات",
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
    {
      id: 26,
      name: "وجبة زنجر دجاج",
      price: 15,
      description: "وجبة زنجر دجاج مع بطاطس ومشروب",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "zinger", name: "زنجر دجاج", checked: true },
        { id: "fries", name: "بطاطس", checked: true },
        { id: "drink", name: "مشروب", checked: true },
      ],
      sauces: [{ id: "garlic", name: "صلصة الثوم", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 27,
      name: "وجبة زنجر حراق",
      price: 15,
      description: "وجبة زنجر حراق مع بطاطس ومشروب",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "zinger", name: "زنجر حراق", checked: true },
        { id: "fries", name: "بطاطس", checked: true },
        { id: "drink", name: "مشروب", checked: true },
      ],
      sauces: [{ id: "garlic", name: "صلصة الثوم", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 28,
      name: "وجبة دجاج",
      price: 13,
      description: "وجبة دجاج مع بطاطس ومشروب",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "chicken", name: "دجاج", checked: true },
        { id: "fries", name: "بطاطس", checked: true },
        { id: "drink", name: "مشروب", checked: true },
      ],
      sauces: [{ id: "garlic", name: "صلصة الثوم", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
    {
      id: 29,
      name: "وجبة زهر",
      price: 17,
      description: "وجبة زهر مع بطاطس ومشروب",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "sandwiches",
      baseIngredients: [
        { id: "zahr", name: "زهر", checked: true },
        { id: "fries", name: "بطاطس", checked: true },
        { id: "drink", name: "مشروب", checked: true },
      ],
      sauces: [{ id: "garlic", name: "صلصة الثوم", checked: false }],
      extras: [{ id: "cheese", name: "جبن", price: 3, checked: false }],
    },
  
    // البروست
    {
      id: 30,
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
    {
      id: 31,
      name: "بروست حراق",
      price: 19,
      description: "بروست دجاج حراق مقرمش بالتوابل الحارة",
      image:
        "https://images.unsplash.com/photo-1599940824468-a91f97c85eba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "broast",
      baseIngredients: [{ id: "chicken", name: "دجاج مقرمش حار", checked: true }],
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
      id: 32,
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
    {
      id: 33,
      name: "بطاطس وسط",
      price: 7,
      description: "بطاطس مقلية مقرمشة حجم وسط",
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
    {
      id: 34,
      name: "بطاطس كبير",
      price: 8,
      description: "بطاطس مقلية مقرمشة حجم كبير",
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
    {
      id: 35,
      name: "بطاطس جبن",
      price: 8,
      description: "بطاطس مقلية بالجبن",
      image:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "snacks",
      baseIngredients: [
        { id: "potatoes", name: "بطاطس", checked: true },
        { id: "cheese", name: "جبن", checked: true },
      ],
      sauces: [
        { id: "ketchup", name: "كاتشب", checked: false },
        { id: "mayo", name: "مايونيز", checked: false },
      ],
      extras: [],
    },
    {
      id: 36,
      name: "بطاطس زنجر",
      price: 8,
      description: "بطاطس مقلية مع قطع الدجاج المقلي",
      image:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "snacks",
      baseIngredients: [
        { id: "potatoes", name: "بطاطس", checked: true },
        { id: "chicken", name: "دجاج مقلي", checked: true },
      ],
      sauces: [
        { id: "ketchup", name: "كاتشب", checked: false },
        { id: "mayo", name: "مايونيز", checked: false },
      ],
      extras: [{ id: "cheese", name: "جبن", price: 2, checked: false }],
    },
    {
      id: 37,
      name: "بطاطس حجازيات",
      price: 9,
      description: "بطاطس حجازيات المميزة",
      image:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "snacks",
      baseIngredients: [
        { id: "potatoes", name: "بطاطس", checked: true },
        { id: "special_sauce", name: "صوص حجازيات خاص", checked: true },
      ],
      sauces: [
        { id: "ketchup", name: "كاتشب", checked: false },
        { id: "mayo", name: "مايونيز", checked: false },
      ],
      extras: [{ id: "cheese", name: "جبن", price: 2, checked: false }],
    },
    {
      id: 38,
      name: "دوم جبن",
      price: 7,
      description: "دوم جبن مقرمش",
      image:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "snacks",
      baseIngredients: [
        { id: "bread", name: "خبز", checked: true },
        { id: "cheese", name: "جبن", checked: true },
      ],
      sauces: [
        { id: "ketchup", name: "كاتشب", checked: false },
        { id: "mayo", name: "مايونيز", checked: false },
      ],
      extras: [],
    },
    {
      id: 39,
      name: "بطاطس فلافل",
      price: 10,
      description: "بطاطس مقلية مع قطع الفلافل",
      image:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "snacks",
      baseIngredients: [
        { id: "potatoes", name: "بطاطس", checked: true },
        { id: "falafel", name: "فلافل", checked: true },
      ],
      sauces: [
        { id: "tahini", name: "طحينة", checked: false },
        { id: "ketchup", name: "كاتشب", checked: false },
      ],
      extras: [{ id: "cheese", name: "جبن", price: 2, checked: false }],
    },
  
    // المشروبات
    {
      id: 40,
      name: "بيبسي",
      price: 2.5,
      description: "مشروب بيبسي غازي منعش",
      image:
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "cooked",
      baseIngredients: [{ id: "drink", name: "مشروب غازي", checked: true }],
      sauces: [],
      extras: [{ id: "ice", name: "ثلج", price: 0.5, checked: false }],
    },
    {
      id: 41,
      name: "ميرندا",
      price: 2.5,
      description: "مشروب ميرندا غازي منعش",
      image:
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "cooked",
      baseIngredients: [{ id: "drink", name: "مشروب غازي", checked: true }],
      sauces: [],
      extras: [{ id: "ice", name: "ثلج", price: 0.5, checked: false }],
    },
    {
      id: 42,
      name: "سفن",
      price: 2.5,
      description: "مشروب سفن غازي منعش",
      image:
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "cooked",
      baseIngredients: [{ id: "drink", name: "مشروب غازي", checked: true }],
      sauces: [],
      extras: [{ id: "ice", name: "ثلج", price: 0.5, checked: false }],
    },
    {
      id: 43,
      name: "ماي",
      price: 0.5,
      description: "مياه معدنية نقية",
      image:
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "cooked",
      baseIngredients: [{ id: "water", name: "مياه", checked: true }],
      sauces: [],
      extras: [{ id: "ice", name: "ثلج", price: 0.5, checked: false }],
    },
    {
      id: 44,
      name: "تانك",
      price: 9,
      description: "مشروب تانك غازي منعش بحجم كبير",
      image:
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      category: "cooked",
      baseIngredients: [{ id: "drink", name: "مشروب غازي كبير", checked: true }],
      sauces: [],
      extras: [{ id: "ice", name: "ثلج", price: 0.5, checked: false }],
    },
  ]
  
  const categories = {
    shawarma: { name: "الشاورما", count: 17 },
    pizza: { name: "البيتزا", count: 18 },
    sandwiches: { name: "السندويتشات", count: 18 },
    broast: { name: "البروست", count: 2 },
    snacks: { name: "المقرمشات", count: 8 },
    cooked: { name: "المشروبات", count: 5 },
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
import { collection, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// تحميل العروض من قاعدة البيانات
async function loadOffers() {
    try {
        const db = getFirestore();
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
            
            // التحقق من انتهاء صلاحية العرض
            const expiryDate = new Date(offer.expiryDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // عرض العرض فقط إذا لم ينتهي
            if (expiryDate >= today) {
                renderOfferCard(offer);
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
function renderOfferCard(offer) {
    const offerCard = document.createElement("div");
    offerCard.className = "offer-card";
    
    // حساب النسبة المئوية للخصم
    const discountPercentage = Math.round(((offer.oldPrice - offer.newPrice) / offer.oldPrice) * 100);
    
    // التحقق من الكمية
    const quantityText = offer.quantity > 0 ? `الكمية: ${offer.quantity}` : "نفدت الكمية";
    const isOutOfStock = offer.quantity <= 0;
    
    offerCard.innerHTML = `
        <div class="offer-img">
            <img src="${offer.imageUrl || 'https://via.placeholder.com/400x300'}" alt="${offer.title}">
        </div>
        <div class="offer-info">
            <h3>${offer.title}</h3>
            <p>${offer.description}</p>
            <div class="offer-price">
                <span class="old-price">${offer.oldPrice} ريال</span>
                <span class="new-price">${offer.newPrice} ريال</span>
            </div>
            <button class="btn ${isOutOfStock ? 'disabled' : ''}" data-offer-id="${offer.id}" data-offer-title="${offer.title}" data-offer-price="${offer.newPrice}" ${isOutOfStock ? 'disabled' : ''}>
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
                // إضافة العرض إلى السلة
                cart.push({
                    id: offerId,
                    name: offerTitle,
                    price: offerPrice,
                    quantity: 1,
                    type: "offer"
                });
            }
            
            // تحديث السلة
            updateCart();
            
            // فتح السلة
            cartModal.style.display = "flex";
        });
    }
    
    offersContent.appendChild(offerCard);
}

// استدعاء دالة تحميل العروض عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    loadOffers();
});

document.querySelector(".checkout-btn").addEventListener("click", async () => {
    if (cart.length === 0) {
        alert("السلة فارغة! يرجى إضافة منتجات أولاً.");
        return;
    }

    const cartItems = cart; // 🟢 مصفوفة المنتجات
    const total     = cart.reduce((sum, item) => sum + item.price * item.quantity, 0); // 🟢 مجموع السعر

    await sendOrder(cartItems, total);
});
