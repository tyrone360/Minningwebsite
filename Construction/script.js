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
//
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
    cartItemsElement.appendChild(card);//
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

  deliveryForm.addEventListener('submit', async (event) => {
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

    // Save customer details
    saveCustomer(customer);
    renderCustomerDetails();

    const submitButton = deliveryForm.querySelector('[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    try {
      if (!window.emailjs) {
        throw new Error('EmailJS did not load.');
      }

      await emailjs.send(
        'service_xosfsw7',
        'template_7f3q2uq',
        {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          postal: customer.postal,
          country: customer.country
        },
        {
          publicKey: 'jrdAX27VnR-pmEL1x'
        }
      );

      showToast('Delivery details saved and email sent!');

    } catch (error) {
      console.error('EmailJS error:', error);
      showToast('Details saved, but email could not be sent.');

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Save delivery details';
      }
    }
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
//    
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
}//

function handlePlaceOrder() {
  if (!placeOrderButton) return;

  placeOrderButton.addEventListener('click', async () => {
    const cart = loadCart();
    const customer = loadCustomer();

    const items = Object.values(cart);
    const hasItems = items.length > 0;

    const hasAddress =
      customer.name &&
      customer.email &&
      customer.phone &&
      customer.address &&
      customer.city &&
      customer.postal &&
      customer.country;

    if (!hasItems) {
      showToast('Your cart is empty. Add items first.');
      return;
    }

    if (!hasAddress) {
      showToast('Please save all delivery details first.');
      return;
    }

    if (placeOrderButton.disabled) return;

    placeOrderButton.disabled = true;
    placeOrderButton.textContent = 'Processing order...';

    // Generate a unique order number
    const orderNumber =
      'MP-' +
      Date.now().toString().slice(-8) +
      '-' +
      Math.floor(1000 + Math.random() * 9000);

    // Calculate order total
    const total = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    // Prepare product details for the emails
    const orderItems = items.map(item =>
      `${item.name} | Quantity: ${item.quantity} | Price: ${formatPrice(item.price * item.quantity)}`
    ).join('\n');

    const orderDate = new Date().toLocaleString();

    // Save complete order
    const order = {
      orderNumber,
      customer,
      items,
      total,
      orderDate
    };

    localStorage.setItem(
      'minepulse-last-order',
      JSON.stringify(order)
    );

    // Email information
    const emailDetails = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      postal: customer.postal,
      country: customer.country,
      order_number: orderNumber,
      order_items: orderItems,
      order_total: formatPrice(total),
      order_date: orderDate
    };

    try {
      if (!window.emailjs) {
        throw new Error('EmailJS did not load.');
      }

      // Send notification to MinePulse
      const ownerEmail = {
        ...emailDetails,
        to_email: 'tshungutyrone@gmail.com'
      };

      // Send confirmation to customer
      const customerEmail = {
        ...emailDetails,
        to_email: customer.email
      };

      const results = await Promise.allSettled([
        emailjs.send(
          'service_xosfsw7',
          'template_7f3q2uq',
          ownerEmail,
          { publicKey: 'jrdAX27VnR-pmEL1x' }
        ),

        emailjs.send(
          'service_xosfsw7',
          'template_7f3q2uq',
          customerEmail,
          { publicKey: 'jrdAX27VnR-pmEL1x' }
        )
      ]);

      const successfulEmails = results.filter(
        result => result.status === 'fulfilled'
      ).length;

      console.log('Email results:', results);

      // Clear cart after order has been saved
      localStorage.removeItem(STORAGE_CART_KEY);

      updateCartCount();
      renderCart();

      if (successfulEmails === 2) {
        showToast('Order placed! Both emails were sent.');
      } else {
        showToast(
          `Order saved. ${successfulEmails} of 2 emails sent.`
        );
      }

      setTimeout(() => {
        window.location.href = 'order-confirmation.html';
      }, 1500);

    } catch (error) {
      console.error('Order email error:', error);

      // Keep the saved order so it is not lost
      showToast('Order saved, but email sending failed.');

      setTimeout(() => {
        window.location.href = 'order-confirmation.html';
      }, 1500);
    }
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

  const observer = new IntersectionObserver(//
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    },
    { threshold: 0.16 }
  );

  revealElements.forEach((element) => observer.observe(element));
}
function renderConfirmation() {
  const orderNumberElement = document.querySelector('#confirmation-order-number');
  const itemsElement = document.querySelector('#confirmation-items');
  const totalElement = document.querySelector('#confirmation-total');
  const customerElement = document.querySelector('#confirmation-customer');
  const dateElement = document.querySelector('#confirmation-date');
  const printButton = document.querySelector('#print-receipt');

  if (!orderNumberElement) return;

  const order = safeParse(
    localStorage.getItem('minepulse-last-order')
  );

  if (!order) {
    orderNumberElement.textContent = 'No recent order found';

    if (itemsElement) {
      itemsElement.textContent = 'There is no saved order to display.';
    }

    if (customerElement) {
      customerElement.textContent = 'No delivery details available.';
    }

    if (printButton) printButton.disabled = true;

    return;
  }

  orderNumberElement.textContent = order.orderNumber || 'Unavailable';

  if (dateElement) {
    dateElement.textContent = 'Order date: ' + (order.orderDate || 'Unavailable');
  }

  if (totalElement) {
    totalElement.textContent = formatPrice(Number(order.total) || 0);
  }

  // Display purchased products safely
  if (itemsElement) {
    itemsElement.innerHTML = '';

    (Array.isArray(order.items) ? order.items : []).forEach(item => {
      const row = document.createElement('div');
      row.className = 'confirmation-item';

      const info = document.createElement('div');
      info.className = 'confirmation-item-info';

      const name = document.createElement('h4');
      name.textContent = item.name || 'Product';

      const quantity = document.createElement('p');
      quantity.textContent = 'Quantity: ' + (Number(item.quantity) || 0);

      const price = document.createElement('div');
      price.className = 'confirmation-item-price';
      price.textContent = formatPrice(
        (Number(item.price) || 0) * (Number(item.quantity) || 0)
      );

      info.appendChild(name);
      info.appendChild(quantity);
      row.appendChild(info);
      row.appendChild(price);

      itemsElement.appendChild(row);
    });
  }

  // Display delivery information safely
  if (customerElement) {
    customerElement.innerHTML = '';

    const fields = [
      ['Full name', 'name'],
      ['Email', 'email'],
      ['Phone', 'phone'],
      ['Address', 'address'],
      ['City', 'city'],
      ['Postal code', 'postal'],
      ['Country', 'country']
    ];

    fields.forEach(([label, key]) => {
      const paragraph = document.createElement('p');
      const strong = document.createElement('strong');

      strong.textContent = label + ': ';
      paragraph.appendChild(strong);
      paragraph.appendChild(
        document.createTextNode(order.customer?.[key] || 'Not provided')
      );

      customerElement.appendChild(paragraph);
    });
  }

  if (printButton) {
    printButton.addEventListener('click', () => {
      window.print();
    });
  }
}
function init() {
  initGallerySlideshow();
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

  if (pageType === 'confirmation') {
    renderConfirmation();
  }
}

document.addEventListener('DOMContentLoaded', init);
function initGallerySlideshow() {
    const slides = document.querySelectorAll('.gallery-slider .slide-item');

    if (!slides.length) return;

    let currentSlide = 0;

    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === 0);
    });

    setInterval(() => {
        slides[currentSlide].classList.remove('active');

        currentSlide = (currentSlide + 1) % slides.length;

        slides[currentSlide].classList.add('active');
    }, 5000);
}