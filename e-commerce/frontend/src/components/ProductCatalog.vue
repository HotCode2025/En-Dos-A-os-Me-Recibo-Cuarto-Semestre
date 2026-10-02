<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  products: { type: Array, required: true },
  searchQuery: { type: String, default: '' },
  showCategories: { type: Boolean, default: true },
  limit: { type: Number, default: 0 },
  title: { type: String, default: 'Productos destacados' },
  eyebrow: { type: String, default: 'LO MÁS BUSCADO' },
  subtitle: { type: String, default: '' },
})

const emit = defineEmits(['add-to-cart', 'clear-search'])
const selectedCategory = ref('Todos')
const categories = computed(() => [
  'Todos',
  ...new Set(props.products.map((product) => product.category)),
])

const visibleProducts = computed(() => {
  const query = props.searchQuery.trim().toLocaleLowerCase('es')
  const filtered = props.products.filter((product) => {
    const matchesCategory =
      !props.showCategories ||
      selectedCategory.value === 'Todos' ||
      product.category === selectedCategory.value
    const matchesSearch =
      !query ||
      `${product.brand} ${product.name} ${product.category}`.toLocaleLowerCase('es').includes(query)

    return matchesCategory && matchesSearch
  })

  return props.limit ? filtered.slice(0, props.limit) : filtered
})

const formatPrice = (price) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)
</script>

<template>
  <section class="catalog section-shell" :class="{ 'catalog-full-page': showCategories }">
    <div class="section-heading">
      <div>
        <span class="eyebrow">{{ eyebrow }}</span>
        <h2>{{ title }}<span>.</span></h2>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <span class="catalog-count">{{ visibleProducts.length }} productos</span>
    </div>

    <div v-if="showCategories" class="category-list" aria-label="Filtrar productos por categoría">
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        :class="{ active: selectedCategory === category }"
        :aria-pressed="selectedCategory === category"
        @click="selectedCategory = category"
      >
        {{ category }}
      </button>
    </div>

    <div v-if="visibleProducts.length" class="product-grid">
      <article v-for="product in visibleProducts" :key="product.id" class="product-card">
        <div class="product-image-wrap">
          <img :src="product.image" :alt="product.imageAlt" loading="lazy" />
          <span v-if="product.badge" class="product-badge">{{ product.badge }}</span>
        </div>
        <div class="product-info">
          <span class="product-category">{{ product.brand }} · {{ product.category }}</span>
          <h3>{{ product.name }}</h3>
          <div class="rating" :aria-label="`Calificación ${product.rating} de 5`">
            <span aria-hidden="true">★</span>
            <strong>{{ product.rating }}</strong>
            <span class="review-count">({{ product.reviews }} opiniones)</span>
          </div>
          <div class="product-price-row">
            <div>
              <del v-if="product.originalPrice">{{ formatPrice(product.originalPrice) }}</del>
              <strong>{{ formatPrice(product.price) }}</strong>
            </div>
            <span class="installments">6 cuotas sin interés</span>
          </div>
          <button class="quick-add" type="button" @click="emit('add-to-cart', product)">
            <span>Agregar al carrito</span>
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </article>
    </div>

    <div v-else class="empty-results">
      <span aria-hidden="true">⌕</span>
      <h3>No encontramos ese producto</h3>
      <p>Probá con otra búsqueda o explorá todas las categorías.</p>
      <button
        class="secondary-button"
        type="button"
        @click="selectedCategory = 'Todos'; emit('clear-search')"
      >
        Ver todos los productos
      </button>
    </div>
  </section>
</template>
