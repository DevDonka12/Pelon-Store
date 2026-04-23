document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const cartKey = "cart";
  let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
  const cartCountSpan = document.querySelector(".cart-count");

  const cartModal = document.getElementById("cart-modal");
  const cartCloseBtn = document.querySelector(".cart-close-btn");
  const paymentModal = document.getElementById("payment-modal");
  const cartItemsContainer = document.getElementById("cart-items-container");
  const emptyCartMessage = document.getElementById("empty-cart-message");
  const cartSubtotalSpan = document.getElementById("cart-subtotal");
  const cartTotalSpan = document.getElementById("cart-total");
  const checkoutButton = document.getElementById("checkout-button");

  const formatPrice = (price) => {
    return `$${price.toLocaleString("es-AR", { minimumFractionDigits: 0 })} ARS`;
  };

  // Función para mostrar toast de notificación
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--gradient-primary);
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      font-weight: 500;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  // Función para configurar los botones de copiar
  const setupCopyButtons = () => {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const textToCopy = btn.dataset.copy;
        
        try {
          await navigator.clipboard.writeText(textToCopy);
          
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i>';
          btn.classList.add('copied');
          
          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('copied');
          }, 2000);
          
          showToast('¡Copiado al portapapeles!');
        } catch (err) {
          console.error('Error al copiar:', err);
          showToast('Error al copiar', 'error');
        }
      });
    });
  };

  // Función para abrir el modal de pago
  const openPaymentModal = (cartItems, totalAmount) => {
    const productList = document.getElementById('payment-product-list');
    const totalAmountSpan = document.getElementById('payment-total-amount');
    
    if (!paymentModal || !productList || !totalAmountSpan) return;
    
    totalAmountSpan.textContent = totalAmount;
    
    if (cartItems && cartItems.length > 0) {
      productList.innerHTML = cartItems.map(item => `
        <div class="product-list-item">
          <img src="${item.image}" alt="${item.name}" onerror="this.src='/src/assets/default_placeholder.png'">
          <div class="product-list-info">
            <div class="product-list-name">${item.name}</div>
            <div class="product-list-quantity">Cantidad: ${item.quantity}</div>
          </div>
          <div class="product-list-price">${formatPrice(item.price * item.quantity)}</div>
        </div>
      `).join('');
    }
    
    const aliasDisplay = document.getElementById('payment-alias-display');
    const cvuDisplay = document.getElementById('payment-cvu-display');
    
    if (aliasDisplay) {
      aliasDisplay.textContent = 'joasz16';
      const copyBtn = aliasDisplay.parentElement.querySelector('.copy-btn');
      if (copyBtn) copyBtn.dataset.copy = 'joasz16';
    }
    if (cvuDisplay) {
      cvuDisplay.textContent = '0000003100019492380130';
      const copyBtn = cvuDisplay.parentElement.querySelector('.copy-btn');
      if (copyBtn) copyBtn.dataset.copy = '0000003100019492380130';
    }
    
    paymentModal.style.display = 'block';
    setupCopyButtons();
  };

  // Función para compra directa (Buy Now)
  const openDirectPurchaseModal = (product) => {
    const cartItems = [{ ...product, quantity: 1 }];
    const totalAmount = formatPrice(product.price);
    openPaymentModal(cartItems, totalAmount);
  };

  const updateCartCount = () => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = totalItems;
    cartCountSpan.style.display = totalItems > 0 ? "flex" : "none";

    if (checkoutButton) {
      checkoutButton.disabled = totalItems === 0;
    }

    if (emptyCartMessage) {
      emptyCartMessage.style.display = totalItems > 0 ? "none" : "block";
    }
  };

  const calculateCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (cartSubtotalSpan) cartSubtotalSpan.textContent = formatPrice(subtotal);
    if (cartTotalSpan) cartTotalSpan.textContent = formatPrice(subtotal);
  };

  const renderCartItems = () => {
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "";
    } else {
      cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" onerror="this.src='/src/assets/default_placeholder.png'">
          <div class="item-details">
            <h3>${item.name}</h3>
            <p class="item-price-single">${formatPrice(item.price)} c/u</p>
          </div>
          <div class="item-quantity-control">
            <button class="minus-btn" data-id="${item.id}">-</button>
            <span class="item-quantity">${item.quantity}</span>
            <button class="plus-btn" data-id="${item.id}">+</button>
          </div>
          <span class="item-total">${formatPrice(item.price * item.quantity)}</span>
          <button class="remove-item-btn" data-id="${item.id}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `).join("");
    }
    updateCartCount();
    calculateCartTotals();
  };

  const updateItemQuantity = (productId, change) => {
    const item = cart.find((item) => item.id === productId);
    const maxStock = productStock[productId] || 0;

    if (item) {
      const newQuantity = item.quantity + change;

      if (newQuantity > maxStock && change > 0) {
        showToast(`¡Stock limitado! Máximo ${maxStock} unidad(es)`, 'warning');
        return;
      }

      if (newQuantity <= 0) {
        removeItemFromCart(productId);
      } else {
        item.quantity = newQuantity;
        localStorage.setItem(cartKey, JSON.stringify(cart));
        updateCartCount();
        calculateCartTotals();
        renderCartItems();
      }
    }
  };

  const removeItemFromCart = (productId) => {
    const itemIndex = cart.findIndex((item) => item.id === productId);

    if (itemIndex > -1) {
      cart.splice(itemIndex, 1);
      localStorage.setItem(cartKey, JSON.stringify(cart));
      updateCartCount();
      calculateCartTotals();
      renderCartItems();
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    const maxStock = productStock[product.id] || 0;
    const currentInCart = existingItem ? existingItem.quantity : 0;

    if (maxStock === 0) {
      showToast(`¡Producto agotado!`, 'error');
      return false;
    }

    if (currentInCart + 1 > maxStock) {
      showToast(`¡Stock limitado! Máximo ${maxStock} unidad(es)`, 'warning');
      return false;
    }

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartCount();
    showToast(`${product.name} añadido al carrito`);
    return true;
  };

  const setupCartListeners = () => {
    if (cartItemsContainer) {
      cartItemsContainer.addEventListener("click", (e) => {
        const target = e.target.closest("button");
        if (!target) return;
        const productId = target.dataset.id;
        if (!productId) return;

        if (target.classList.contains("remove-item-btn")) {
          if (confirm("¿Estás seguro de que quieres eliminar este artículo del carrito?")) {
            removeItemFromCart(productId);
          }
        } else if (target.classList.contains("minus-btn")) {
          updateItemQuantity(productId, -1);
        } else if (target.classList.contains("plus-btn")) {
          updateItemQuantity(productId, 1);
        }
      });
    }

    if (checkoutButton) {
      checkoutButton.addEventListener("click", () => {
        if (cart.length > 0) {
          const totalAmount = cartTotalSpan.textContent;
          openPaymentModal(cart, totalAmount);
          if (cartModal) cartModal.style.display = "none";
        } else {
          showToast("Tu carrito está vacío", 'warning');
        }
      });
    }

    const cartIcon = document.querySelector(".cart-icon");
    if (cartIcon && cartModal) {
      cartIcon.addEventListener("click", () => {
        renderCartItems();
        cartModal.style.display = "block";
      });
    }

    if (cartCloseBtn && cartModal) {
      cartCloseBtn.addEventListener("click", () => {
        cartModal.style.display = "none";
      });
    }

    const paymentCloseBtn = document.querySelector(".payment-close-btn");
    if (paymentCloseBtn && paymentModal) {
      paymentCloseBtn.addEventListener("click", () => {
        paymentModal.style.display = "none";
        document.body.style.overflow = '';
      });
    }

    window.addEventListener("click", (e) => {
      if (e.target === cartModal) cartModal.style.display = "none";
      if (e.target === paymentModal) {
        paymentModal.style.display = "none";
        document.body.style.overflow = '';
      }
    });
  };

  // Cerrar modales con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (paymentModal && paymentModal.style.display === 'block') {
        paymentModal.style.display = 'none';
        document.body.style.overflow = '';
      }
      if (cartModal && cartModal.style.display === 'block') {
        cartModal.style.display = 'none';
      }
      if (imageModal && imageModal.style.display === 'block') {
        closeImageModal();
      }
    }
  });

  // ============================================
  // PRODUCT STOCK COMPLETO - TODOS LOS IDs
  // ============================================
  const productStock = {
    "KuromiBackPack": 1,
    "PompompurinBackPack": 1,
    "CinnamorollBackPack": 1,
    "HatKirby": 1,
    "KirbyPet": 1,
    "KeroppiBackpack": 1,
    "PochaccoBackpack": 1,
    "ChococatPet": 1,
    "GafasPompompurin": 1,
    "ChainKirby": 1,
    "GlassKirby": 1,
    "AretesKirby": 1
  };

  const themeToggle = document.getElementById("theme-toggle");
  const currentTheme = localStorage.getItem("theme") || "light";

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }

  setTheme(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const newTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(newTheme);
    });
  }

  const preloader = document.getElementById("preloader");
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add("hidden");
    }, 1000);
  }

  const initializeStore = () => {
    document.querySelectorAll(".package-card, .carousel-slide").forEach((element) => {
      const id = element.dataset.productId;

      if (!id || productStock[id] === undefined) return;

      const stock = productStock[id];
      const isPackageCard = element.classList.contains("package-card");

      if (isPackageCard) {
        const stockElement = element.querySelector(".stock-badge");
        if (stockElement) {
          stockElement.textContent = `📦 Stock: ${stock} unidad${stock !== 1 ? "es" : ""}`;
          if (stock === 0) {
            stockElement.style.color = "#ef4444";
          }
        }
      }

      const buttons = element.querySelectorAll(".add-to-cart-btn, .buy-now-btn");
      if (stock === 0) {
        buttons.forEach((button) => {
          button.disabled = true;
          button.innerHTML = '<i class="fas fa-times"></i> AGOTADO';
          button.style.opacity = "0.5";
        });
      } else {
        buttons.forEach((button) => {
          button.disabled = false;
          button.style.opacity = "1";
          // Restaurar texto original si estaba en AGOTADO
          if (button.classList.contains("add-to-cart-btn") && button.innerHTML.includes("AGOTADO")) {
            button.innerHTML = '<i class="fas fa-shopping-bag"></i> Agregar';
          }
          if (button.classList.contains("buy-now-btn") && button.innerHTML.includes("AGOTADO")) {
            button.innerHTML = '<i class="fas fa-bolt"></i> Comprar';
          }
        });
      }
    });

    document.querySelectorAll(".add-to-cart-btn, .buy-now-btn").forEach((button) => {
      if (button.disabled) return;

      button.addEventListener("click", (e) => {
        const buttonData = e.currentTarget.dataset;
        const parentElement = e.currentTarget.closest("[data-product-id]");
        const id = parentElement ? parentElement.dataset.productId : null;

        if (!id) {
          console.error("No se encontró el data-product-id para el botón.");
          return;
        }

        let imageSrc = buttonData.imgSrc;
        if (!imageSrc) {
          const imageElement = parentElement.querySelector("img.zoomable-img") ||
                               parentElement.querySelector(".ugc-card-image img");
          if (imageElement) {
            imageSrc = imageElement.src;
          }
        }

        const product = {
          id: id,
          name: buttonData.productName,
          price: parseInt(buttonData.price),
          image: imageSrc || "/src/assets/default_placeholder.png",
        };

        if (e.currentTarget.classList.contains("buy-now-btn")) {
          openDirectPurchaseModal(product);
        } else {
          addToCart(product);
        }
      });
    });
  };

  const revealElements = document.querySelectorAll(".package-card, .section-title, .section-header");
  const checkReveal = () => {
    const triggerBottom = window.innerHeight * 0.85;
    revealElements.forEach((element) => {
      const elementTop = element.getBoundingClientRect().top;
      if (elementTop < triggerBottom) {
        element.classList.add("reveal", "active");
      } else {
        element.classList.remove("active");
      }
    });
  };
  window.addEventListener("scroll", checkReveal);
  checkReveal();

  const track = document.querySelector(".carousel-track");
  const slides = Array.from(document.querySelectorAll(".carousel-slide"));
  const nextButton = document.querySelector(".next-btn");
  const prevButton = document.querySelector(".prev-btn");
  const dotsNav = document.querySelector(".carousel-nav");

  if (track && slides.length > 0) {
    const slideWidth = slides[0].getBoundingClientRect().width;
    let slideIndex = 0;

    slides.forEach((slide, index) => {
      slide.style.left = slideWidth * index + "px";
    });

    const moveToSlide = (track, currentSlide, targetSlide) => {
      track.style.transform = "translateX(-" + targetSlide.style.left + ")";
      currentSlide.classList.remove("current-slide");
      targetSlide.classList.add("current-slide");
      slideIndex = slides.findIndex((slide) => slide === targetSlide);
    };

    const updateDots = (currentDot, targetDot) => {
      currentDot.classList.remove("current-slide");
      targetDot.classList.add("current-slide");
    };

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        const currentSlide = track.querySelector(".current-slide") || slides[0];
        const nextSlide = currentSlide.nextElementSibling || slides[0];
        const currentDot = dotsNav.querySelector(".current-slide");
        const nextDot = currentDot.nextElementSibling || dotsNav.firstElementChild;

        moveToSlide(track, currentSlide, nextSlide);
        updateDots(currentDot, nextDot);
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        const currentSlide = track.querySelector(".current-slide") || slides[0];
        const prevSlide = currentSlide.previousElementSibling || slides[slides.length - 1];
        const currentDot = dotsNav.querySelector(".current-slide");
        const prevDot = currentDot.previousElementSibling || dotsNav.lastElementChild;

        moveToSlide(track, currentSlide, prevSlide);
        updateDots(currentDot, prevDot);
      });
    }

    if (dotsNav) {
      Array.from(dotsNav.children).forEach((dot) => {
        dot.addEventListener("click", (e) => {
          const targetDot = e.target;
          const targetIndex = Array.from(dotsNav.children).findIndex(child => child === targetDot);
          const targetSlide = slides[targetIndex];
          const currentSlide = track.querySelector(".current-slide");
          const currentDot = dotsNav.querySelector(".current-slide");

          moveToSlide(track, currentSlide, targetSlide);
          updateDots(currentDot, targetDot);
        });
      });
    }

    const adjustSlidePositions = () => {
      const newSlideWidth = slides[0].getBoundingClientRect().width;
      slides.forEach((slide, index) => {
        slide.style.left = newSlideWidth * index + "px";
      });
      const currentSlide = track.querySelector(".current-slide") || slides[0];
      if (currentSlide) {
        track.style.transform = "translateX(-" + currentSlide.style.left + ")";
      }
    };

    window.addEventListener("resize", adjustSlidePositions);
  }

  const imageModal = document.getElementById("image-modal");
  const modalImg = document.getElementById("full-image");
  const captionText = document.getElementById("image-caption");
  const imgCloseBtn = imageModal ? imageModal.querySelector(".modal-close-btn") : null;

  const closeImageModal = () => {
    if (imageModal) {
      imageModal.style.display = "none";
      document.body.style.overflow = '';
    }
  };

  document.querySelectorAll(".zoomable-img").forEach((img) => {
    img.addEventListener("click", function () {
      if (imageModal) {
        modalImg.src = this.src;
        modalImg.alt = this.alt;
        
        const productCard = this.closest('.package-card, .ugc-card');
        let caption = this.alt || 'Vista previa del artículo';
        
        if (productCard) {
          const productName = productCard.querySelector('h3');
          if (productName) {
            caption = productName.textContent;
          }
        }
        
        captionText.textContent = caption;
        imageModal.style.display = "block";
        document.body.style.overflow = 'hidden';
      }
    });
  });

  if (imgCloseBtn) {
    imgCloseBtn.addEventListener("click", closeImageModal);
  }

  if (imageModal) {
    imageModal.addEventListener("click", (e) => {
      if (e.target === imageModal) {
        closeImageModal();
      }
    });
  }

  const brainrotGrid = document.querySelector(".package-grid");
  if (brainrotGrid) {
    const items = Array.from(brainrotGrid.querySelectorAll(".package-card"));
    let currentPage = 1;
    const itemsPerPage = 6;
    const totalPages = Math.ceil(items.length / itemsPerPage);

    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    const pageInfoSpan = document.getElementById("page-info");

    function displayPage(page) {
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      items.forEach((item, index) => {
        item.style.display = index >= startIndex && index < endIndex ? "block" : "none";
      });

      if (prevPageBtn) prevPageBtn.disabled = page === 1;
      if (nextPageBtn) nextPageBtn.disabled = page === totalPages;
      if (pageInfoSpan) pageInfoSpan.textContent = `Página ${page} de ${totalPages}`;

      checkReveal();
    }

    if (items.length > 0) {
      displayPage(currentPage);
    }

    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          displayPage(currentPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          displayPage(currentPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.innerHTML = '<i class="fas fa-bars"></i>';

    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      navToggle.innerHTML = navLinks.classList.contains("active") ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    document.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        navToggle.innerHTML = '<i class="fas fa-bars"></i>';
      });
    });
  }

  initializeStore();
  setupCartListeners();
  updateCartCount();
});