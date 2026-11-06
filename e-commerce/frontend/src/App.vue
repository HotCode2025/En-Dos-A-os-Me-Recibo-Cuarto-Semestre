<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { apiRequest } from "./services/api";
import { getProducts, getProductOptions } from "./services/catalog";
import { accessToken, currentUser, isAdmin, logout } from "./stores/auth";
import { EVENTO_AVISO } from "./utils/avisos";

const searchQuery = ref("");
const route = useRoute();
const router = useRouter();
const products = ref([]);
const catalogLoading = ref(true);
const catalogLoadError = ref("");
const productOptions = ref({ marcas: [], categorias: [] });
const productSaving = ref(false);
const productSaveError = ref("");
const productSaveRevision = ref(0);
const cartItems = ref([]);
const isCartOpen = ref(false);
const isMobileMenuOpen = ref(false);
const notice = ref("");
const noticeLink = ref(null);
let noticeTimeout;

// Estados para el Modal de Checkout, Métodos de Pago y Pantalla de Éxito
const isCheckoutOpen = ref(false);
const checkoutStep = ref(1); // 1: Selección de Pago, 2: Instrucciones / Éxito locales
const metodosPago = ref([]);
const selectedMetodoPago = ref(null);
const checkoutLoading = ref(false);
const completedOrder = ref(null);

const cartCount = computed(() =>
  cartItems.value.reduce((count, product) => count + product.quantity, 0),
);
const cartTotal = computed(() =>
  cartItems.value.reduce(
    (total, product) => total + product.price * product.quantity,
    0,
  ),
);
const freeShippingThreshold = 150000;
const remainingForFreeShipping = computed(() =>
  Math.max(freeShippingThreshold - cartTotal.value, 0),
);

watch(
  () => route.name,
  (name) => {
    if (name === "home" || name === "products") loadCatalog();
    if (name === "products" && isAdmin.value) loadProductOptions();
  },
  { immediate: true },
);

watch(
  accessToken,
  (token) => {
    if (token) synchronizeCart();
    else cartItems.value = [];
  },
  { immediate: true },
);

// Mercado Pago vuelve a la página principal con ?pago=exito|pendiente|fallido
watch(
  () => route.query.pago,
  (paymentResult) => {
    if (paymentResult) handlePaymentReturn(String(paymentResult));
  },
  { immediate: true },
);

watch(isAdmin, (admin) => {
  if (admin && route.name === "products") loadProductOptions();
  else productOptions.value = { marcas: [], categorias: [] };
});

const pageProps = computed(() => {
  if (route.name === "home") {
    return {
      products: products.value,
      searchQuery: searchQuery.value,
      isAdmin: isAdmin.value,
      loading: catalogLoading.value,
      loadError: catalogLoadError.value,
    };
  }
  if (route.name === "products") {
    return {
      products: products.value,
      searchQuery: searchQuery.value,
      isAdmin: isAdmin.value,
      brands: productOptions.value.marcas,
      categoryOptions: productOptions.value.categorias,
      loading: catalogLoading.value,
      loadError: catalogLoadError.value,
      saving: productSaving.value,
      saveError: productSaveError.value,
      saveRevision: productSaveRevision.value,
    };
  }
  return {};
});

const pageEvents = computed(() => {
  if (route.name === "home") {
    return {
      "add-to-cart": addToCart,
      "clear-search": () => (searchQuery.value = ""),
    };
  }
  if (route.name === "products") {
    return {
      "add-to-cart": addToCart,
      "clear-search": () => (searchQuery.value = ""),
      "save-product": saveProduct,
      "delete-product": deleteProduct,
    };
  }
  return {};
});

const formatPrice = (price) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);

async function addToCart(product) {
  if (product.stock <= 0) {
    showNotice("Este producto no tiene stock disponible.");
    return;
  }

  if (accessToken.value) {
    try {
      await apiRequest("/carrito/agregar", {
        method: "POST",
        body: JSON.stringify({ productoId: product.id, cantidad: 1 }),
      });
      await loadCart();
      showNotice(`${product.name} se agregó al carrito`);
    } catch (error) {
      console.error("No se pudo agregar el producto al carrito:", error);
      showNotice(error.message || "No se pudo agregar el producto al carrito.");
    }
    return;
  }

  const existingProduct = cartItems.value.find(
    (item) => item.id === product.id,
  );

  if (existingProduct) {
    if (existingProduct.quantity >= product.stock) {
      showNotice("No hay stock suficiente para agregar otra unidad.");
      return;
    }
    existingProduct.quantity += 1;
  } else {
    cartItems.value.push({ ...product, quantity: 1 });
  }

  showNotice(`${product.name} se agregó al carrito`);
}

async function changeQuantity(productId, amount) {
  if (accessToken.value) {
    try {
      await apiRequest(amount < 0 ? "/carrito/restar" : "/carrito/agregar", {
        method: amount < 0 ? "PUT" : "POST",
        body: JSON.stringify({
          productoId: productId,
          cantidad: Math.abs(amount),
        }),
      });
      await loadCart();
    } catch (error) {
      console.error("No se pudo actualizar el carrito:", error);
      showNotice(error.message || "No se pudo actualizar el carrito.");
    }
    return;
  }

  const item = cartItems.value.find((product) => product.id === productId);

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cartItems.value = cartItems.value.filter(
      (product) => product.id !== productId,
    );
  }
}

// `link` ({ to, label }) agrega un enlace al aviso y lo deja visible más tiempo para poder hacer clic.
function showNotice(message, link = null) {
  notice.value = message;
  noticeLink.value = link;
  window.clearTimeout(noticeTimeout);
  noticeTimeout = window.setTimeout(
    () => {
      notice.value = "";
      noticeLink.value = null;
    },
    link ? 8000 : 3000,
  );
}

const ordersLink = { to: "/mis-ordenes", label: "Ver mis órdenes" };

// Las vistas y servicios piden mostrar un aviso con utils/avisos.js (evento de window).
function handleNoticeEvent(event) {
  showNotice(event.detail.message, event.detail.link);
}

// Esc cierra solo lo que esté abierto, en este orden de prioridad: checkout, carrito, menú móvil.
function handleEscape(event) {
  if (event.key !== "Escape") return;
  if (isCheckoutOpen.value) closeCheckout();
  else if (isCartOpen.value) isCartOpen.value = false;
  else if (isMobileMenuOpen.value) closeMobileMenu();
}

onMounted(() => {
  window.addEventListener(EVENTO_AVISO, handleNoticeEvent);
  window.addEventListener("keydown", handleEscape);
});
onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_AVISO, handleNoticeEvent);
  window.removeEventListener("keydown", handleEscape);
});

// El menú móvil se cierra al navegar a otra ruta.
watch(
  () => route.fullPath,
  () => closeMobileMenu(),
);

// Quita el producto completo del carrito (todas sus unidades)
async function removeFromCart(productId) {
  if (accessToken.value) {
    try {
      await apiRequest(`/carrito/quitar/${productId}`, { method: "DELETE" });
      await loadCart();
    } catch (error) {
      console.error("No se pudo quitar el producto del carrito:", error);
      showNotice(error.message || "No se pudo quitar el producto del carrito.");
    }
    return;
  }

  cartItems.value = cartItems.value.filter((product) => product.id !== productId);
}

async function startCheckout() {
  if (!accessToken.value) {
    isCartOpen.value = false;
    showNotice("Iniciá sesión para realizar la compra.");
    router.push("/login?redirect=/");
    return;
  }
  if (!cartItems.value.length) {
    showNotice("El carrito está vacío.");
    return;
  }

  try {
    checkoutLoading.value = true;
    isCartOpen.value = false;
    checkoutStep.value = 1;
    completedOrder.value = null;
    metodosPago.value = await apiRequest("/metodos-pago");
    selectedMetodoPago.value = metodosPago.value.length
      ? metodosPago.value[0].id
      : null;
    isCheckoutOpen.value = true;
  } catch (error) {
    console.error("Error al cargar métodos de pago:", error);
    showNotice("No se pudieron cargar los métodos de pago.");
  } finally {
    checkoutLoading.value = false;
  }
}

async function confirmOrder() {
  const metodoElegido = metodosPago.value.find(
    (m) => m.id === selectedMetodoPago.value,
  );
  if (!metodoElegido) {
    showNotice("Seleccioná un método de pago.");
    return;
  }
  const nombreMetodo = String(metodoElegido.nombre || "").toLowerCase();

  try {
    checkoutLoading.value = true;

    // 1. Guardar la orden en PostgreSQL (estado Pendiente)
    const response = await apiRequest("/ordenes", {
      method: "POST",
      body: JSON.stringify({
        metodoPagoId: selectedMetodoPago.value,
      }),
    });

    // 2. Integración con Mercado Pago para tarjetas o pasarela
    if (
      nombreMetodo.includes("mercado pago") ||
      nombreMetodo.includes("tarjeta")
    ) {
      showNotice("Redirigiendo a Mercado Pago...");

      // La orden ya existe y el backend vació el carrito: reflejarlo aunque falle el link de pago
      await loadCart();

      try {
        // El monto se calcula en el backend a partir de la orden guardada
        const pagoResponse = await apiRequest("/pagos/crear-preferencia", {
          method: "POST",
          body: JSON.stringify({ ordenId: response.orden.id }),
        });
        window.location.href = pagoResponse.init_point; // Redirección a la pasarela real
      } catch (error) {
        console.error("No se pudo generar el link de pago:", error);
        closeCheckout();
        showNotice(
          `La orden #${response.orden.id} quedó pendiente, pero no se pudo generar el link de pago: ${error.message}`,
        );
      }
      return;
    }

    // 3. Flujo local si elige Efectivo o Transferencia Bancaria
    completedOrder.value = {
      ...response.orden,
      items: response.items || [],
      metodoPago: metodoElegido,
    };

    await loadCart();
    checkoutStep.value = 2; // Avanzar a pantalla de instrucciones
    showNotice(`¡Orden #${response.orden.id} creada exitosamente!`);
  } catch (error) {
    console.error("No se pudo procesar la compra:", error);
    showNotice(error.message || "No se pudo crear la orden.");
  } finally {
    checkoutLoading.value = false;
  }
}

async function handlePaymentReturn(paymentResult) {
  const paymentId = route.query.payment_id;
  const externalReference = route.query.external_reference;
  // Limpiamos los parámetros de Mercado Pago para que un refresh no repita el aviso
  await router.replace({ path: "/", query: {} });

  if (paymentResult === "pendiente") {
    showNotice(
      "Tu pago quedó pendiente de acreditación.",
      accessToken.value ? ordersLink : null,
    );
    return;
  }
  if (paymentResult !== "exito") {
    showNotice("El pago no se completó. Tu orden quedó pendiente.");
    return;
  }
  if (!accessToken.value) {
    showNotice("Iniciá sesión para verificar tu pago en Mis órdenes.");
    return;
  }

  try {
    // Con payment_id se confirma ese pago; si no, se concilia la orden (o todas las pendientes).
    let result;
    if (/^\d+$/.test(String(paymentId || ""))) {
      result = await apiRequest("/pagos/confirmar", {
        method: "POST",
        body: JSON.stringify({ paymentId: String(paymentId) }),
      });
    } else if (/^\d+$/.test(String(externalReference || ""))) {
      result = await apiRequest(`/pagos/sincronizar/${externalReference}`, { method: "POST" });
    } else {
      const sync = await apiRequest("/pagos/sincronizar-pendientes", { method: "POST" });
      result = {
        orden: (sync.ordenes || []).find((order) => sync.pagadas?.includes(order.id)),
      };
    }

    if (result.reembolsado) {
      showNotice(
        `La orden #${result.orden.id} estaba cancelada, así que te devolvimos el pago.`,
      );
      return;
    }
    // Solo se dice "aprobado" cuando el estado real de la orden es Pagado.
    showNotice(
      result.orden?.estado === "Pagado"
        ? `¡Pago aprobado! Tu orden #${result.orden.id} está confirmada.`
        : "Estamos verificando tu pago; revisalo en Mis órdenes.",
      ordersLink,
    );
  } catch (error) {
    console.error("No se pudo confirmar el pago:", error);
    showNotice(error.message || "No pudimos confirmar el pago todavía.");
  }
}

function closeCheckout() {
  isCheckoutOpen.value = false;
  checkoutStep.value = 1;
  completedOrder.value = null;
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}

async function loadCatalog() {
  try {
    catalogLoading.value = true;
    catalogLoadError.value = "";
    products.value = await getProducts();
  } catch (error) {
    console.error("No se pudo cargar el catálogo desde el backend:", error);
    catalogLoadError.value =
      error.message || "No se pudo conectar con el catálogo.";
  } finally {
    catalogLoading.value = false;
  }
}

async function loadProductOptions() {
  try {
    productOptions.value = await getProductOptions();
    productSaveError.value = "";
  } catch (error) {
    console.error("No se pudieron cargar marcas y categorías:", error);
    productSaveError.value = error.message;
  }
}

async function loadCart() {
  try {
    const cart = await apiRequest("/carrito");
    if (!Array.isArray(cart.items)) {
      throw new Error(
        "El carrito recibido del servidor no tiene el formato esperado.",
      );
    }
    cartItems.value = cart.items.map((item) => ({
      id: Number(item.producto_id),
      name: item.nombre,
      brand: item.marca || "",
      category: item.categoria || "",
      price: Number(item.precio_unitario),
      quantity: Number(item.cantidad),
      image: item.imagen_url || "",
      imageAlt: item.nombre,
    }));
  } catch (error) {
    console.error("No se pudo cargar el carrito desde el backend:", error);
    showNotice(error.message || "No se pudo cargar el carrito.");
  }
}

async function synchronizeCart() {
  const guestItems = [...cartItems.value];
  await loadCart();
  if (!guestItems.length) return;

  // Cada ítem va por separado: uno sin stock no corta el pase de los demás.
  const noSePudieron = [];
  for (const item of guestItems) {
    try {
      await apiRequest("/carrito/agregar", {
        method: "POST",
        body: JSON.stringify({ productoId: item.id, cantidad: item.quantity }),
      });
    } catch (error) {
      console.error(`No se pudo pasar "${item.name}" al carrito de la cuenta:`, error);
      noSePudieron.push(item.name);
    }
  }
  await loadCart();
  showNotice(
    noSePudieron.length
      ? `Tu carrito se sincronizó, pero no pudimos pasar: ${noSePudieron.join(", ")}.`
      : "Tu carrito se sincronizó con tu cuenta.",
  );
}

async function saveProduct({ id, product }) {
  if (!isAdmin.value) return;
  productSaving.value = true;
  productSaveError.value = "";
  try {
    await apiRequest(id ? `/productos/${id}` : "/productos", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(product),
    });
    await loadCatalog();
    productSaveRevision.value += 1;
    showNotice(
      id
        ? "Producto actualizado en la base de datos."
        : "Producto agregado al catálogo.",
    );
  } catch (error) {
    console.error("No se pudo guardar el producto:", error);
    productSaveError.value = error.message || "No se pudo guardar el producto.";
  } finally {
    productSaving.value = false;
  }
}

async function deleteProduct(productId) {
  if (!isAdmin.value) return;
  try {
    await apiRequest(`/productos/${productId}`, { method: "DELETE" });
    await loadCatalog();
    showNotice("Producto eliminado del catálogo.");
  } catch (error) {
    console.error("No se pudo eliminar el producto:", error);
    showNotice(error.message || "No se pudo eliminar el producto.");
  }
}

function signOut() {
  logout();
  closeMobileMenu();
  // Si estaba en una pantalla que exige sesión (perfil, órdenes, admin), vuelve al inicio.
  if (route.matched.some((r) => r.meta?.requiereSesion)) router.push("/");
  showNotice("Cerraste sesión.");
}
</script>

<template>
  <div class="announcement">
    <span>TECNOLOGÍA PARA TODOS LOS DÍAS</span>
    <span class="announcement-divider" aria-hidden="true">✦</span>
    <span>Envío gratis en compras desde {{ formatPrice(freeShippingThreshold) }}</span>
  </div>

  <header class="site-header">
    <RouterLink
      class="brand"
      to="/"
      aria-label="PuntoZero, inicio"
      @click="closeMobileMenu"
    >
      <span class="brand-mark" aria-hidden="true">P</span>
      <span>Punto<span class="brand-accent">Zero</span></span>
    </RouterLink>

    <nav
      class="desktop-nav"
      :class="{ 'mobile-nav-open': isMobileMenuOpen }"
      aria-label="Navegación principal"
    >
      <RouterLink to="/" @click="closeMobileMenu">Inicio</RouterLink>
      <RouterLink to="/productos" @click="closeMobileMenu"
        >Productos</RouterLink
      >
      <RouterLink to="/nosotros" @click="closeMobileMenu">Nosotros</RouterLink>
      <RouterLink to="/contacto" @click="closeMobileMenu">Contacto</RouterLink>
      <template v-if="currentUser">
        <RouterLink to="/perfil" @click="closeMobileMenu">Mi perfil</RouterLink>
        <RouterLink to="/mis-ordenes" @click="closeMobileMenu"
          >Mis órdenes</RouterLink
        >
        <RouterLink v-if="isAdmin" to="/admin" @click="closeMobileMenu"
          >Administración</RouterLink
        >
        <span class="nav-role">
          {{ isAdmin ? "Administrador" : "Usuario" }}
        </span>
      </template>
      <template v-else>
        <RouterLink to="/login" @click="closeMobileMenu">Ingresar</RouterLink>
        <RouterLink to="/registro" @click="closeMobileMenu"
          >Crear cuenta</RouterLink
        >
      </template>
      <button
        v-if="currentUser"
        class="nav-logout"
        type="button"
        @click="signOut"
      >
        Salir
      </button>
    </nav>

    <div class="header-actions">
      <label class="search-box">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          aria-label="Buscar productos"
          placeholder="¿Qué estás buscando?"
        />
      </label>
      <button
        class="cart-button"
        type="button"
        :aria-label="`Abrir carrito, ${cartCount} productos`"
        @click="isCartOpen = true"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 9H6"
          />
          <circle cx="10" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </svg>
        <span class="cart-count">{{ cartCount }}</span>
      </button>
      <button
        class="mobile-menu-toggle"
        type="button"
        :aria-expanded="isMobileMenuOpen"
        :aria-label="isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>

  <main>
    <RouterView v-slot="{ Component }">
      <component :is="Component" v-bind="pageProps" v-on="pageEvents" />
    </RouterView>
  </main>

  <footer class="site-footer">
    <RouterLink
      class="brand footer-brand"
      to="/"
      aria-label="PuntoZero, inicio"
    >
      <span class="brand-mark" aria-hidden="true">P</span>
      <span>Punto<span class="brand-accent">Zero</span></span>
    </RouterLink>
    <p>Tecnología para todos los días.</p>
    <RouterLink class="footer-contact-link" to="/contacto"
      >Contactanos</RouterLink
    >
    <span class="footer-credit"
      >© 2026 PuntoZero · Tu próxima experiencia empieza acá</span
    >
  </footer>

  <Transition name="toast">
    <div v-if="notice" class="toast-message" role="status" aria-live="polite">
      <span aria-hidden="true">✓</span>{{ notice }}
      <RouterLink
        v-if="noticeLink"
        class="notice-link"
        :to="noticeLink.to"
        @click="notice = ''"
        >{{ noticeLink.label }}</RouterLink
      >
    </div>
  </Transition>

  <!-- Drawer Carrito -->
  <Transition name="drawer">
    <div
      v-if="isCartOpen"
      class="cart-overlay"
      @click.self="isCartOpen = false"
    >
      <aside
        class="cart-drawer"
        aria-label="Carrito de compras"
        aria-modal="true"
        role="dialog"
      >
        <div class="cart-header">
          <div>
            <span class="eyebrow">TU SELECCIÓN PUNTOZERO</span>
            <h2>
              Mi carrito <span>({{ cartCount }})</span>
            </h2>
          </div>
          <button
            class="close-button"
            type="button"
            aria-label="Cerrar carrito"
            @click="isCartOpen = false"
          >
            ×
          </button>
        </div>

        <div v-if="cartItems.length" class="cart-content">
          <p v-if="remainingForFreeShipping" class="shipping-progress">
            Te faltan
            <strong>{{ formatPrice(remainingForFreeShipping) }}</strong> para el
            envío gratis.
          </p>
          <p v-else class="shipping-progress shipping-complete">
            ¡Listo! Tu pedido tiene envío gratis.
          </p>
          <div class="cart-items">
            <article
              v-for="product in cartItems"
              :key="product.id"
              class="cart-item"
            >
              <img v-if="product.image" :src="product.image" :alt="product.imageAlt" />
              <div v-else class="cart-item-no-image" aria-hidden="true"></div>
              <div class="cart-item-info">
                <span class="product-category">{{ product.brand }}</span>
                <h3>{{ product.name }}</h3>
                <strong>{{ formatPrice(product.price) }}</strong>
                <div
                  class="quantity-control"
                  :aria-label="`Cantidad de ${product.name}`"
                >
                  <button
                    type="button"
                    :aria-label="`Quitar una unidad de ${product.name}`"
                    @click="changeQuantity(product.id, -1)"
                  >
                    −
                  </button>
                  <span>{{ product.quantity }}</span>
                  <button
                    type="button"
                    :aria-label="`Agregar una unidad de ${product.name}`"
                    @click="changeQuantity(product.id, 1)"
                  >
                    +
                  </button>
                </div>
                <button
                  class="cart-item-remove"
                  type="button"
                  :aria-label="`Quitar ${product.name} del carrito`"
                  @click="removeFromCart(product.id)"
                >
                  Quitar
                </button>
              </div>
            </article>
          </div>
          <div class="cart-summary">
            <div>
              <span>Subtotal</span><strong>{{ formatPrice(cartTotal) }}</strong>
            </div>
            <div>
              <span>Envío</span
              ><strong>{{
                cartTotal >= freeShippingThreshold ? "Gratis" : "A calcular"
              }}</strong>
            </div>
            <div class="cart-total">
              <span>Total</span><strong>{{ formatPrice(cartTotal) }}</strong>
            </div>
            <p>Tu compra está protegida.</p>
            <button
              class="primary-button checkout-button"
              type="button"
              @click="startCheckout"
            >
              Iniciar compra
              <span aria-hidden="true">→</span>
            </button>
            <button
              class="continue-shopping"
              type="button"
              @click="isCartOpen = false"
            >
              Seguir comprando
            </button>
          </div>
        </div>

        <div v-else class="cart-empty">
          <span class="empty-cart-icon" aria-hidden="true">⌑</span>
          <h3>Tu carrito está esperando</h3>
          <p>Agregá tus productos favoritos y los vas a encontrar acá.</p>
          <RouterLink
            class="primary-button"
            to="/productos"
            @click="isCartOpen = false"
          >
            Explorar productos
          </RouterLink>
        </div>
      </aside>
    </div>
  </Transition>

  <!-- Modal de Checkout / Instrucciones de Pago / Redirección -->
  <Transition name="drawer">
    <div v-if="isCheckoutOpen" class="cart-overlay" @click.self="closeCheckout">
      <div
        class="cart-drawer"
        style="max-width: 500px; padding: 2rem"
        role="dialog"
        aria-modal="true"
      >
        <!-- PASO 1: SELECCIÓN DE MÉTODO DE PAGO -->
        <div v-if="checkoutStep === 1">
          <div class="cart-header">
            <div>
              <span class="eyebrow">FINALIZAR COMPRA</span>
              <h2>Seleccioná tu método de pago</h2>
            </div>
            <button
              class="close-button"
              type="button"
              aria-label="Cerrar"
              @click="closeCheckout"
            >
              ×
            </button>
          </div>

          <div
            v-if="checkoutLoading"
            style="padding: 2rem 0; text-align: center"
          >
            <p>Procesando información y redirigiendo de forma segura...</p>
          </div>

          <div
            v-else
            style="
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
              margin-top: 1rem;
            "
          >
            <div style="display: flex; flex-direction: column; gap: 0.8rem">
              <label
                v-for="metodo in metodosPago"
                :key="metodo.id"
                style="
                  display: flex;
                  align-items: flex-start;
                  gap: 0.8rem;
                  padding: 0.8rem;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  cursor: pointer;
                "
              >
                <input
                  type="radio"
                  name="metodoPago"
                  :value="metodo.id"
                  v-model="selectedMetodoPago"
                  style="margin-top: 0.2rem"
                />
                <div>
                  <strong>{{ metodo.nombre }}</strong>
                  <p
                    style="
                      font-size: 0.85rem;
                      color: #6b7280;
                      margin: 0.2rem 0 0 0;
                    "
                  >
                    {{ metodo.descripcion }}
                  </p>
                </div>
              </label>
            </div>

            <div class="cart-summary">
              <div class="cart-total">
                <span>Total a pagar</span>
                <strong>{{ formatPrice(cartTotal) }}</strong>
              </div>
              <button
                class="primary-button checkout-button"
                type="button"
                :disabled="checkoutLoading || !selectedMetodoPago"
                @click="confirmOrder"
              >
                Confirmar y pagar →
              </button>
            </div>
          </div>
        </div>

        <!-- PASO 2: CONFIRMACIÓN LOCAL (Solo para Transferencia / Efectivo) -->
        <div v-else-if="checkoutStep === 2 && completedOrder">
          <div class="cart-header">
            <div>
              <span class="eyebrow" style="color: #059669"
                >¡COMPRA REGISTRADA!</span
              >
              <h2>Orden #{{ completedOrder.id }}</h2>
            </div>
            <button
              class="close-button"
              type="button"
              aria-label="Cerrar"
              @click="closeCheckout"
            >
              ×
            </button>
          </div>

          <div
            style="
              display: flex;
              flex-direction: column;
              gap: 1.2rem;
              margin-top: 1rem;
            "
          >
            <div
              style="
                background-color: #f0fdf4;
                border: 1px solid #bbf7d0;
                padding: 1rem;
                border-radius: 8px;
                color: #166534;
              "
            >
              <p style="margin: 0; font-weight: bold">
                Estado del pedido: {{ completedOrder.estado }}
              </p>
              <p style="margin: 0.3rem 0 0 0; font-size: 0.9rem">
                Total registrado:
                <strong>{{ formatPrice(Number(completedOrder.total)) }}</strong>
              </p>
            </div>

            <div
              style="
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                padding: 1rem;
                border-radius: 8px;
              "
            >
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: #111827">
                Instrucciones para completar el pago:
              </h3>
              <p
                style="margin: 0 0 0.8rem 0; font-size: 0.9rem; color: #4b5563"
              >
                <strong>Método elegido:</strong>
                {{ completedOrder.metodoPago?.nombre }}
              </p>

              <div
                style="
                  font-size: 0.88rem;
                  line-height: 1.4;
                  color: #374151;
                  background: #ffffff;
                  padding: 0.8rem;
                  border-radius: 6px;
                  border: 1px solid #f3f4f6;
                "
              >
                {{
                  completedOrder.metodoPago?.instrucciones ||
                  "Procesá el pago según las indicaciones brindadas."
                }}
              </div>
            </div>

            <button
              class="primary-button"
              type="button"
              style="width: 100%; justify-content: center; margin-top: 0.5rem"
              @click="closeCheckout"
            >
              Entendido / Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
