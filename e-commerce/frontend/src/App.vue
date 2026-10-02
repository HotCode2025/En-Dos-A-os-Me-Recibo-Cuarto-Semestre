<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { apiRequest } from './services/api'
import { getProducts, getProductOptions } from './services/catalog'
import { accessToken, currentUser, isAdmin, logout } from './stores/auth'

const searchQuery = ref('')
const route = useRoute()
const products = ref([])
const catalogLoading = ref(true)
const catalogLoadError = ref('')
const productOptions = ref({ marcas: [], categorias: [] })
const productSaving = ref(false)
const productSaveError = ref('')
const productSaveRevision = ref(0)
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

watch(
  () => route.name,
  (name) => {
    if (name === 'home' || name === 'products') loadCatalog()
    if (name === 'products' && isAdmin.value) loadProductOptions()
  },
  { immediate: true },
)

watch(
  accessToken,
  (token) => {
    if (token) synchronizeCart()
    else cartItems.value = []
  },
  { immediate: true },
)

watch(isAdmin, (admin) => {
  if (admin && route.name === 'products') loadProductOptions()
  else productOptions.value = { marcas: [], categorias: [] }
})
const pageProps = computed(() => {
  if (route.name === 'home') {
    return {
      products: products.value,
      searchQuery: searchQuery.value,
      isAdmin: isAdmin.value,
      loading: catalogLoading.value,
      loadError: catalogLoadError.value,
    }
  }
  if (route.name === 'products') {
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
    }
  }
  return {}
})
const pageEvents = computed(() => {
  if (route.name === 'home') {
    return {
      'add-to-cart': addToCart,
      'clear-search': () => (searchQuery.value = ''),
    }
  }
  if (route.name === 'products') {
    return {
      'add-to-cart': addToCart,
      'clear-search': () => (searchQuery.value = ''),
      'save-product': saveProduct,
      'delete-product': deleteProduct,
    }
  }
  return {}
})

const formatPrice = (price) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)

async function addToCart(product) {
  if (product.stock <= 0) {
    showNotice('Este producto no tiene stock disponible.')
    return
  }

  if (accessToken.value) {
    try {
      await apiRequest('/carrito/agregar', {
        method: 'POST',
        body: JSON.stringify({ productoId: product.id, cantidad: 1 }),
      })
      await loadCart()
      showNotice(`${product.name} se agregó al carrito`)
    } catch (error) {
      console.error('No se pudo agregar el producto al carrito:', error)
      showNotice(error.message || 'No se pudo agregar el producto al carrito.')
    }
    return
  }

  const existingProduct = cartItems.value.find((item) => item.id === product.id)

  if (existingProduct) {
    if (existingProduct.quantity >= product.stock) {
      showNotice('No hay stock suficiente para agregar otra unidad.')
      return
    }
    existingProduct.quantity += 1
  } else {
    cartItems.value.push({ ...product, quantity: 1 })
  }

  showNotice(`${product.name} se agregó al carrito`)
}

async function changeQuantity(productId, amount) {
  if (accessToken.value) {
    try {
      await apiRequest(amount < 0 ? '/carrito/restar' : '/carrito/agregar', {
        method: amount < 0 ? 'PUT' : 'POST',
        body: JSON.stringify({ productoId: productId, cantidad: Math.abs(amount) }),
      })
      await loadCart()
    } catch (error) {
      console.error('No se pudo actualizar el carrito:', error)
      showNotice(error.message || 'No se pudo actualizar el carrito.')
    }
    return
  }

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

async function loadCatalog() {
  try {
    catalogLoading.value = true
    catalogLoadError.value = ''
    products.value = await getProducts()
  } catch (error) {
    console.error('No se pudo cargar el catálogo desde el backend:', error)
    catalogLoadError.value = error.message || 'No se pudo conectar con el catálogo.'
  } finally {
    catalogLoading.value = false
  }
}

async function loadProductOptions() {
  try {
    productOptions.value = await getProductOptions()
    productSaveError.value = ''
  } catch (error) {
    console.error('No se pudieron cargar marcas y categorías:', error)
    productSaveError.value = error.message
  }
}

async function loadCart() {
  try {
    const cart = await apiRequest('/carrito')
    if (!Array.isArray(cart.items)) {
      throw new Error('El carrito recibido del servidor no tiene el formato esperado.')
    }
    cartItems.value = cart.items.map((item) => ({
      id: Number(item.producto_id),
      name: item.nombre,
      brand: item.marca || '',
      category: item.categoria || '',
      price: Number(item.precio_unitario),
      quantity: Number(item.cantidad),
      image: item.imagen_url || '',
      imageAlt: item.nombre,
    }))
  } catch (error) {
    console.error('No se pudo cargar el carrito desde el backend:', error)
    showNotice(error.message || 'No se pudo cargar el carrito.')
  }
}

async function synchronizeCart() {
  const guestItems = [...cartItems.value]
  await loadCart()
  if (!guestItems.length) return

  try {
    for (const item of guestItems) {
      await apiRequest('/carrito/agregar', {
        method: 'POST',
        body: JSON.stringify({ productoId: item.id, cantidad: item.quantity }),
      })
    }
    await loadCart()
    showNotice('Tu carrito se sincronizó con tu cuenta.')
  } catch (error) {
    console.error('No se pudo sincronizar el carrito de invitado:', error)
    showNotice(error.message || 'No se pudo sincronizar el carrito de invitado.')
  }
}

async function saveProduct({ id, product }) {
  if (!isAdmin.value) return
  productSaving.value = true
  productSaveError.value = ''
  try {
    await apiRequest(id ? `/productos/${id}` : '/productos', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(product),
    })
    await loadCatalog()
    productSaveRevision.value += 1
    showNotice(id ? 'Producto actualizado en la base de datos.' : 'Producto agregado al catálogo.')
  } catch (error) {
    console.error('No se pudo guardar el producto:', error)
    productSaveError.value = error.message || 'No se pudo guardar el producto.'
  } finally {
    productSaving.value = false
  }
}

async function deleteProduct(productId) {
  if (!isAdmin.value) return
  try {
    await apiRequest(`/productos/${productId}`, { method: 'DELETE' })
    await loadCatalog()
    showNotice('Producto eliminado del catálogo.')
  } catch (error) {
    console.error('No se pudo eliminar el producto:', error)
    showNotice(error.message || 'No se pudo eliminar el producto.')
  }
}

function signOut() {
  logout()
  closeMobileMenu()
  showNotice('Cerraste sesión.')
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
      <RouterLink to="/nosotros" @click="closeMobileMenu">Nosotros</RouterLink>
      <RouterLink to="/contacto" @click="closeMobileMenu">Contacto</RouterLink>
      <span v-if="currentUser" class="nav-role">
        {{ isAdmin ? 'Administrador' : 'Usuario' }}
      </span>
      <RouterLink v-else to="/login" @click="closeMobileMenu">Ingresar</RouterLink>
      <button v-if="currentUser" class="nav-logout" type="button" @click="signOut">
        Salir
      </button>
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
        v-bind="pageProps"
        v-on="pageEvents"
      />
    </RouterView>
  </main>

  <footer class="site-footer">
    <RouterLink class="brand footer-brand" to="/" aria-label="PuntoZero, inicio">
      <span class="brand-mark" aria-hidden="true">P</span>
      <span>Punto<span class="brand-accent">Zero</span></span>
    </RouterLink>
    <p>Tecnología para todos los días.</p>
    <RouterLink class="footer-contact-link" to="/contacto">Contactanos</RouterLink>
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
          <RouterLink class="primary-button" to="/productos" @click="isCartOpen = false">
            Explorar productos
          </RouterLink>
        </div>
      </aside>
    </div>
  </Transition>
</template>
