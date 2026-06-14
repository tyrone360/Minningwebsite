const STORAGE_CART_KEY = 'minepulse-cart';
const STORAGE_CUSTOMER_KEY = 'minepulse-customer';

const products = [
  { id: 1, name: 'Volcanic Crystal', price: 24.0 },
  { id: 2, name: 'Mineral Ore Bundle', price: 36.0 },
  { id: 3, name: 'Electric Shard', price: 52.0 },
  { id: 4, name: 'Meteor Stone', price: 69.0 },
  { id: 5, name: 'Lava Dust Pack', price: 18.0 },
  { id: 6, name: 'Quartz Cluster', price: 28.0 },
  { id: 7, name: 'Obsidian Ridge', price: 42.0 },
  { id: 8, name: 'Celestial Fragment', price: 58.0 },
  { id: 9, name: 'Rift Stone', price: 33.0 },
];

const body = document.body;
const pageType = body.dataset.page || '';
const toastElement = document.querySelector('.toast');
const cartCountElements = document.querySelectorAll('.cart-count');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const cartItemsElement = document.querySelector('.cart-items');
const cartTotalElement = document.querySelector('.cart-total');
const deliveryForm = document.querySelector('#delivery-form');
const customerDetailsElement = document.querySelector('.customer-details');
const placeOrderButton = document.querySelector('.place-order');
const continueCheckoutButton = document.querySelector('.continue-checkout');
const slideTrack = document.querySelector('.slider-track');
const slideNextButton = document.querySelector('.slide-button.next');
const slidePrevButton = document.querySelector('.slide-button.prev');
const slideItems = document.querySelectorAll('.slide-item');
let slideIndex = 0;

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function loadCart() {
  return safeParse(localStorage.getItem(STORAGE_CART_KEY)) || {};
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
}

function loadCustomer() {
  return safeParse(localStorage.getItem(STORAGE_CUSTOMER_KEY)) || {};
}

function saveCustomer(customer) {
  localStorage.setItem(STORAGE_CUSTOMER_KEY, JSON.stringify(customer));
}

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function showToast(message) {
  if (!toastElement) return;
  toastElement.textContent = message;
  toastElement.classList.add('is-active');
  clearTimeout(window.minepulseToastTimeout);
  window.minepulseToastTimeout = setTimeout(() => {
    toastElement.classList.remove('is-active');
  }, 2200);
}

function getCartCount(cart) {
  return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartCount() {
  const cart = loadCart();
  const count = getCartCount(cart);
  cartCountElements.forEach((element) => {
    element.textContent = count;
  });
}

function addToCart(productId) {
  const cart = loadCart();
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  if (!cart[productId]) {
    cart[productId] = { ...product, quantity: 0 };
  }

  cart[productId].quantity += 1;
  saveCart(cart);
  updateCartCount();
  showToast(`${product.name} added to cart`);
  if (pageType === 'cart') {
    renderCart();
  }
}

function changeQuantity(productId, amount) {
  const cart = loadCart();
  if (!cart[productId]) return;
  cart[productId].quantity += amount;
  if (cart[productId].quantity <= 0) {
    delete cart[productId];
  }
  saveCart(cart);
  updateCartCount();
  renderCart();
}

function renderCart() {
  if (!cartItemsElement || !cartTotalElement) return;
  const cart = loadCart();
  const items = Object.values(cart);

  cartItemsElement.innerHTML = '';
  if (!items.length) {
    cartItemsElement.innerHTML = '<p class="cart-empty">Your cart is empty. Add some minerals on the shop page.</p>';
    cartTotalElement.textContent = formatPrice(0);
    return;
  }

  let total = 0;
  items.forEach((item) => {
    total += item.quantity * item.price;
    const card = document.createElement('div');
    card.className = 'cart-item';
    card.innerHTML = `
      <div class="cart-item__info">
        <p class="cart-item__name">${item.name}</p>
        <p class="cart-item__qty">Qty: ${item.quantity}</p>
      </div>
      <div class="cart-item__actions">
        <button type="button" data-action="decrease" data-id="${item.id}">–</button>
        <button type="button" data-action="increase" data-id="${item.id}">+</button>
      </div>
      <div class="cart-item__price">${formatPrice(item.quantity * item.price)}</div>
    `;
    cartItemsElement.appendChild(card);
  });

  cartTotalElement.textContent = formatPrice(total);
}

function attachProductButtons() {
  addToCartButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      if (!card) return;
      const productId = Number(card.dataset.productId);
      addToCart(productId);
    });
  });
}

function attachCartActions() {
  if (!cartItemsElement) return;
  cartItemsElement.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    const productId = Number(button.dataset.id);
    if (action === 'increase') {
      changeQuantity(productId, 1);
    }
    if (action === 'decrease') {
      changeQuantity(productId, -1);
    }
  });
}

function fillDeliveryForm() {
  if (!deliveryForm) return;
  const customer = loadCustomer();
  Object.entries(customer).forEach(([key, value]) => {
    const input = deliveryForm.querySelector(`[name="${key}"]`);
    if (input) input.value = value;
  });
}

function renderCustomerDetails() {
  if (!customerDetailsElement) return;
  const customer = loadCustomer();
  const displayKeys = ['name', 'email', 'phone', 'address', 'city', 'postal', 'country'];
  const hasDetails = displayKeys.some((key) => customer[key]);

  if (!hasDetails) {
    customerDetailsElement.innerHTML = '<p class="cart-empty">No delivery details saved yet. Save them on the cart page.</p>';
    return;
  }

  customerDetailsElement.innerHTML = displayKeys
    .filter((key) => customer[key])
    .map((key) => {
      const label = key === 'postal' ? 'Postal code' : key.charAt(0).toUpperCase() + key.slice(1);
      return `<p><strong>${label}:</strong> ${customer[key]}</p>`;
    })
    .join('');
}

function attachDeliveryForm() {
  if (!deliveryForm) return;
  deliveryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(deliveryForm);
    const customer = {
      name: formData.get('name')?.toString().trim() || '',
      email: formData.get('email')?.toString().trim() || '',
      phone: formData.get('phone')?.toString().trim() || '',
      address: formData.get('address')?.toString().trim() || '',
      city: formData.get('city')?.toString().trim() || '',
      postal: formData.get('postal')?.toString().trim() || '',
      country: formData.get('country')?.toString().trim() || '',
    };
    saveCustomer(customer);
    renderCustomerDetails();
    showToast('Delivery details saved');
  });
}

function hasValidDelivery(customer) {
  return Boolean(customer.name && customer.address && customer.city && customer.country);
}

function handleContinueCheckout() {
  if (!continueCheckoutButton) return;
  continueCheckoutButton.addEventListener('click', () => {
    const cart = loadCart();
    const customer = loadCustomer();
    const hasItems = Boolean(Object.keys(cart).length);
    if (!hasItems) {
      showToast('Your cart is empty. Add items from the shop page.');
      return;
    }

    if (!hasValidDelivery(customer)) {
      showToast('Save delivery details before continuing to checkout.');
      return;
    }

    window.location.href = 'checkout.html';
  });
}

function initSlideshow() {
  if (!slideTrack || !slideItems.length) return;

  function showSlide(index) {
    slideItems.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === index);
    });
    slideTrack.style.transform = `translateX(-${index * 100}%)`;
  }

  function nextSlide() {
    slideIndex = (slideIndex + 1) % slideItems.length;
    showSlide(slideIndex);
  }

  function prevSlide() {
    slideIndex = (slideIndex - 1 + slideItems.length) % slideItems.length;
    showSlide(slideIndex);
  }

  slideNextButton?.addEventListener('click', nextSlide);
  slidePrevButton?.addEventListener('click', prevSlide);
  showSlide(slideIndex);
  setInterval(nextSlide, 6000);
}

function handlePlaceOrder() {
  if (!placeOrderButton) return;
  placeOrderButton.addEventListener('click', () => {
    const cart = loadCart();
    const customer = loadCustomer();
    const hasItems = Boolean(Object.keys(cart).length);
    const hasAddress = customer.name && customer.address && customer.city && customer.country;

    if (!hasItems) {
      showToast('Your cart is empty. Add items from the shop page.');
      return;
    }
    if (!hasAddress) {
      showToast('Save your delivery details before placing your order.');
      return;
    }

    localStorage.removeItem(STORAGE_CART_KEY);
    updateCartCount();
    renderCart();
    showToast('Order placed! Delivery information is saved for next time.');
  });
}

function setupScrollEffects() {
  const floats = document.querySelectorAll('.scene__spark, .scene__orb');
  const heroItems = document.querySelectorAll('[data-float-speed]');
  if (!floats.length && !heroItems.length) return;

  window.addEventListener('scroll', () => {
    const offset = window.scrollY;
    floats.forEach((float, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const movement = (offset / (10 + index * 8)) * direction;
      float.style.transform = `translate3d(${movement}px, ${movement * 0.45}px, 0)`;
    });

    heroItems.forEach((item) => {
      const speed = Number(item.dataset.floatSpeed) || 10;
      item.style.transform = `translateY(${Math.sin(offset / speed) * 10}px)`;
    });
  });
}

function revealOnScroll() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    },
    { threshold: 0.16 }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function init() {
  updateCartCount();
  attachProductButtons();
  attachCartActions();
  attachDeliveryForm();
  renderCustomerDetails();
  setupScrollEffects();
  revealOnScroll();
  initSlideshow();

  if (pageType === 'cart') {
    renderCart();
    fillDeliveryForm();
    handleContinueCheckout();
  }

  if (pageType === 'checkout') {
    renderCart();
    renderCustomerDetails();
    handlePlaceOrder();
  }

  if (pageType === 'location') {
    renderCustomerDetails();
  }
}

document.addEventListener('DOMContentLoaded', init);
