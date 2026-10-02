<script setup>
import { computed, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import products from './data/products'

const searchQuery = ref('')
const cartItems = ref([])
const isCartOpen = ref(false)
const isMobileMenuOpen = ref(false)
const notice = ref('')
let noticeTimeout

const cartCount = computed(() =>
  cartItems.value.reduce((count, product) => count + product.quantity, 0),
)
const cartTotal = computed(() =>
  cartItems.value.reduce((total, product) => total + product.price * product.quantity, 0),
)
const freeShippingThreshold = 150000
const remainingForFreeShipping = computed(() =>
  Math.max(freeShippingThreshold - cartTotal.value, 0),
)

const formatPrice = (price) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)

function addToCart(product) {
  const existingProduct = cartItems.value.find((item) => item.id === product.id)

  if (existingProduct) {
    existingProduct.quantity += 1
  } else {
    cartItems.value.push({ ...product, quantity: 1 })
  }

  showNotice(`${product.name} se agregó al carrito`)
}

function changeQuantity(productId, amount) {
  const item = cartItems.value.find((product) => product.id === productId)

  if (!item) return

  item.quantity += amount

  if (item.quantity <= 0) {
    cartItems.value = cartItems.value.filter((product) => product.id !== productId)
  }
}

function showNotice(message) {
  notice.value = message
  window.clearTimeout(noticeTimeout)
  noticeTimeout = window.setTimeout(() => {
    notice.value = ''
  }, 3000)
}

function startCheckout() {
  showNotice('¡Gracias! El checkout estará disponible próximamente.')
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div class="announcement">
    <span>TECNOLOGÍA PARA TODOS LOS DÍAS</span>
    <span class="announcement-divider" aria-hidden="true">✦</span>
    <span>Envío gratis en compras desde $150.000</span>
  </div>

  <header class="site-header">
    <RouterLink class="brand" to="/" aria-label="PuntoZero, inicio" @click="closeMobileMenu">
      <span class="brand-mark" aria-hidden="true">P</span>
      <span>Punto<span class="brand-accent">Zero</span></span>
    </RouterLink>

    <nav
      class="desktop-nav"
      :class="{ 'mobile-nav-open': isMobileMenuOpen }"
      aria-label="Navegación principal"
    >
      <RouterLink to="/" @click="closeMobileMenu">Inicio</RouterLink>
      <RouterLink to="/productos" @click="closeMobileMenu">Productos</RouterLink>
      <RouterLink to="/#nosotros" @click="closeMobileMenu">Nosotros</RouterLink>
      <RouterLink to="/#contacto" @click="closeMobileMenu">Contacto</RouterLink>
    </nav>

    <div class="header-actions">
      <label class="search-box">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input v-model="searchQuery" type="search" placeholder="¿Qué estás buscando?" />
      </label>
      <button
        class="cart-button"
        type="button"
        :aria-label="`Abrir carrito, ${cartCount} productos`"
        @click="isCartOpen = true"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 9H6" />
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
      <component
        :is="Component"
        :products="products"
        :search-query="searchQuery"
        @add-to-cart="addToCart"
        @clear-search="searchQuery = ''"
      />
    </RouterView>
  </main>

  <footer id="contacto" class="site-footer">
    <RouterLink class="brand footer-brand" to="/" aria-label="PuntoZero, inicio">
      <span class="brand-mark" aria-hidden="true">P</span>
      <span>Punto<span class="brand-accent">Zero</span></span>
    </RouterLink>
    <p>Tecnología para todos los días.</p>
    <span class="footer-credit">© 2026 PuntoZero · Tu próxima experiencia empieza acá</span>
  </footer>

  <Transition name="toast">
    <div v-if="notice" class="toast-message" role="status" aria-live="polite">
      <span aria-hidden="true">✓</span>{{ notice }}
    </div>
  </Transition>

  <Transition name="drawer">
    <div v-if="isCartOpen" class="cart-overlay" @click.self="isCartOpen = false">
      <aside class="cart-drawer" aria-label="Carrito de compras" aria-modal="true" role="dialog">
        <div class="cart-header">
          <div>
            <span class="eyebrow">TU SELECCIÓN PUNTOZERO</span>
            <h2>Mi carrito <span>({{ cartCount }})</span></h2>
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
            Te faltan <strong>{{ formatPrice(remainingForFreeShipping) }}</strong> para el envío gratis.
          </p>
          <p v-else class="shipping-progress shipping-complete">
            ¡Listo! Tu pedido tiene envío gratis.
          </p>
          <div class="cart-items">
            <article v-for="product in cartItems" :key="product.id" class="cart-item">
              <img :src="product.image" :alt="product.imageAlt" />
              <div class="cart-item-info">
                <span class="product-category">{{ product.brand }}</span>
                <h3>{{ product.name }}</h3>
                <strong>{{ formatPrice(product.price) }}</strong>
                <div class="quantity-control" :aria-label="`Cantidad de ${product.name}`">
                  <button
                    type="button"
                    :aria-label="`Quitar una unidad de ${product.name}`"
                    @click="changeQuantity(product.id, -1)"
                  >−</button>
                  <span>{{ product.quantity }}</span>
                  <button
                    type="button"
                    :aria-label="`Agregar una unidad de ${product.name}`"
                    @click="changeQuantity(product.id, 1)"
                  >+</button>
                </div>
              </div>
            </article>
          </div>
          <div class="cart-summary">
            <div><span>Subtotal</span><strong>{{ formatPrice(cartTotal) }}</strong></div>
            <div><span>Envío</span><strong>{{ cartTotal >= freeShippingThreshold ? 'Gratis' : 'A calcular' }}</strong></div>
            <div class="cart-total"><span>Total</span><strong>{{ formatPrice(cartTotal) }}</strong></div>
            <p>Tu compra está protegida. El pago se habilitará próximamente.</p>
            <button class="primary-button checkout-button" type="button" @click="startCheckout">
              Iniciar compra
              <span aria-hidden="true">→</span>
            </button>
            <button class="continue-shopping" type="button" @click="isCartOpen = false">
              Seguir comprando
            </button>
          </div>
        </div>

        <div v-else class="cart-empty">
          <span class="empty-cart-icon" aria-hidden="true">⌑</span>
          <h3>Tu carrito está esperando</h3>
          <p>Agregá tus productos favoritos y los vas a encontrar acá.</p>
          <button class="primary-button" type="button" @click="isCartOpen = false">
            Explorar productos
          </button>
        </div>
      </aside>
    </div>
  </Transition>
</template>
