// Inicialización del SDK frontend de Mercado Pago con tu Public Key
const mp = new MercadoPago("APP_USR-fb646e7c-f3b5-4959-94f2-f5cfa056155e", {
  locale: "es-AR",
});

const modalContainer = document.getElementById("modal-container");
const modalOverlay = document.getElementById("modal-overlay");
const cartBtn = document.getElementById("cart-btn");
const cartCounter = document.getElementById("cart-counter");

const displayCart = () => {
  modalContainer.innerHTML = "";
  modalContainer.style.display = "block";
  modalOverlay.style.display = "block";

  // Modal header
  const modalHeader = document.createElement("div");

  const modalClose = document.createElement("div");
  modalClose.innerText = "❌";
  modalClose.className = "modal-close";
  modalHeader.append(modalClose);

  modalClose.addEventListener("click", () => {
    modalContainer.style.display = "none";
    modalOverlay.style.display = "none";
  });

  const modalTitle = document.createElement("div");
  modalTitle.innerText = "Cart";
  modalTitle.className = "modal-title";
  modalHeader.append(modalTitle);

  modalContainer.append(modalHeader);

  // Modal Body
  if (cart.length > 0) {
    cart.forEach((product) => {
      const modalBody = document.createElement("div");
      modalBody.className = "modal-body";
      modalBody.innerHTML = `
      <div class="product">
        <img class="product-image" src="${product.img}" />
        <div class="product-info">
          <h4>${product.productName}</h4>
        </div>
        <div class="quantity">
          <span class="quantity-btn-decrese">-</span>
          <span class="quantity-input">${product.quanty}</span>
          <span class="quantity-btn-increase">+</span>
        </div>
        <div class="price">${product.price * product.quanty}$</div>
        <div class="delete-product">❌</div>
      </div>
      `;
      modalContainer.append(modalBody);

      // Resta de productos
      const decrese = modalBody.querySelector(".quantity-btn-decrese");
      decrese.addEventListener("click", () => {
        if (product.quanty !== 1) {
          product.quanty--;
          displayCart();
          displayCartCounter();
        }
      });

      // Suma de productos
      const increase = modalBody.querySelector(".quantity-btn-increase");
      increase.addEventListener("click", () => {
        product.quanty++;
        displayCart();
        displayCartCounter();
      });

      // Eliminar productos del carrito
      const deleteProduct = modalBody.querySelector(".delete-product");
      deleteProduct.addEventListener("click", () => {
        deleteCartProduct(product.id);
      });
    });

    // Modal footer
    const total = cart.reduce((acc, el) => acc + el.price * el.quanty, 0);

    const modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";
    modalFooter.innerHTML = `
      <div class="total-price">Total: $${total}</div>
      <button class="btn-primary" id="checkout-btn"> go to checkout </button>
      <div id="wallet_container"></div>
    `;
    modalContainer.append(modalFooter);

    const checkoutButton = modalFooter.querySelector("#checkout-btn");
    checkoutButton.addEventListener("click", function () {
      checkoutButton.innerText = "Cargando...";
      checkoutButton.disabled = true;

      const orderData = {
        quantity: 1,
        description: "Compra de ecommerce",
        price: total,
      };

      fetch("http://localhost:8080/create_preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })
        .then((response) => response.json())
        .then((preference) => {
          createCheckoutButton(preference.id);
        })
        .catch((error) => {
          console.error("Error al crear preferencia:", error);
          alert("Unexpected error");
          checkoutButton.innerText = "go to checkout";
          checkoutButton.disabled = false;
        });
    });
  } else {
    const modalText = document.createElement("h2");
    modalText.className = "modal-body";
    modalText.innerText = "Your cart is empty";
    modalContainer.append(modalText);
  }
};

cartBtn.addEventListener("click", displayCart);

const deleteCartProduct = (id) => {
  const foundId = cart.findIndex((element) => element.id === id);
  if (foundId !== -1) {
    cart.splice(foundId, 1);
    displayCart();
    displayCartCounter();
  }
};

const displayCartCounter = () => {
  const cartLength = cart.reduce((acc, el) => acc + el.quanty, 0);
  if (cartLength > 0) {
    cartCounter.style.display = "block";
    cartCounter.innerText = cartLength;
  } else {
    cartCounter.style.display = "none";
  }
};

// Render del botón oficial de Mercado Pago
const createCheckoutButton = (preferenceId) => {
  const bricksBuilder = mp.bricks();

  const renderComponent = async () => {
    // Si ya existe un botón previo lo quitamos para no duplicar
    if (window.checkoutButton) window.checkoutButton.unmount();

    // Ocultar botón original de checkout
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) checkoutBtn.style.display = "none";

    window.checkoutButton = await bricksBuilder.create(
      "wallet",
      "wallet_container",
      {
        initialization: {
          preferenceId: preferenceId,
        },
        customization: {
          texts: {
            valueProp: "smart_option",
          },
        },
      },
    );
  };

  renderComponent();
};
