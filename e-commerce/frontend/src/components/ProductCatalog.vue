<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  products: { type: Array, required: true },
  searchQuery: { type: String, default: '' },
  showCategories: { type: Boolean, default: true },
  limit: { type: Number, default: 0 },
  title: { type: String, default: 'Productos destacados' },
  eyebrow: { type: String, default: 'LO MÁS BUSCADO' },
  subtitle: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  brands: { type: Array, default: () => [] },
  categoryOptions: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  saving: { type: Boolean, default: false },
  saveError: { type: String, default: '' },
  saveRevision: { type: Number, default: 0 },
})

const emit = defineEmits(['add-to-cart', 'clear-search', 'save-product', 'delete-product'])
const selectedCategory = ref('Todos')
const editingProductId = ref(null)
const draft = reactive(createEmptyDraft())
const formError = ref('')
const categories = computed(() => [
  'Todos',
  ...new Set(props.products.map((product) => product.category).filter(Boolean)),
])
const canCreateProduct = computed(
  () => props.brands.length > 0 && props.categoryOptions.length > 0,
)

watch(
  () => props.saveRevision,
  () => {
    editingProductId.value = null
    formError.value = ''
  },
)

function createEmptyDraft() {
  return {
    nombre: '',
    descripcion: '',
    precio: '',
    id_marca: '',
    id_categoria: '',
    stock: 0,
    imagen_url: '',
    es_destacado: false,
  }
}

function openNewProduct() {
  editingProductId.value = 'new'
  Object.assign(draft, createEmptyDraft())
  formError.value = ''
}

function openEditProduct(product) {
  editingProductId.value = product.id
  Object.assign(draft, {
    nombre: product.name,
    descripcion: product.description,
    precio: product.price,
    id_marca: product.brandId,
    id_categoria: product.categoryId,
    stock: product.stock,
    imagen_url: product.image,
    es_destacado: product.featured,
  })
  formError.value = ''
}

function submitProduct() {
  formError.value = ''
  if (!draft.nombre.trim()) {
    formError.value = 'Ingresá el nombre del producto.'
    return
  }
  const price = Number(draft.precio)
  const stock = Number(draft.stock)
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    formError.value = 'Revisá el precio y el stock ingresados.'
    return
  }
  if (!draft.id_marca || !draft.id_categoria) {
    formError.value = 'Seleccioná una marca y una categoría.'
    return
  }

  emit('save-product', {
    id: editingProductId.value === 'new' ? null : editingProductId.value,
    product: {
      ...draft,
      nombre: draft.nombre.trim(),
      descripcion: draft.descripcion.trim() || null,
      precio: price,
      stock,
      id_marca: Number(draft.id_marca),
      id_categoria: Number(draft.id_categoria),
      imagen_url: draft.imagen_url.trim() || null,
    },
  })
}

function requestDelete(product) {
  if (window.confirm(`¿Querés eliminar "${product.name}" del catálogo?`)) {
    emit('delete-product', product.id)
  }
}

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

    <div v-if="isAdmin && showCategories" class="catalog-admin-bar">
      <p>Los cambios se guardan en el catálogo de la base de datos.</p>
      <button
        v-if="editingProductId === null"
        class="primary-button"
        type="button"
        :disabled="!canCreateProduct"
        @click="openNewProduct"
      >
        Agregar producto
      </button>
    </div>
    <p v-if="isAdmin && saveError && editingProductId === null" class="form-error" role="alert">
      {{ saveError }}
    </p>

    <form
      v-if="isAdmin && showCategories && editingProductId !== null"
      class="product-editor"
      @submit.prevent="submitProduct"
    >
      <div class="product-editor-heading">
        <div>
          <span class="eyebrow">ADMINISTRACIÓN DEL CATÁLOGO</span>
          <h3>{{ editingProductId === 'new' ? 'Nuevo producto' : 'Editar producto' }}</h3>
        </div>
        <button class="secondary-button" type="button" :disabled="saving" @click="editingProductId = null">
          Cancelar
        </button>
      </div>
      <div class="product-editor-grid">
        <label class="form-field">
          Nombre
          <input v-model="draft.nombre" required maxlength="150" />
        </label>
        <label class="form-field">
          Precio
          <input v-model="draft.precio" type="number" min="0" step="0.01" required />
        </label>
        <label class="form-field">
          Marca
          <select v-model="draft.id_marca" required>
            <option value="" disabled>Seleccioná una marca</option>
            <option v-for="brand in brands" :key="brand.id" :value="brand.id">{{ brand.nombre }}</option>
          </select>
        </label>
        <label class="form-field">
          Categoría
          <select v-model="draft.id_categoria" required>
            <option value="" disabled>Seleccioná una categoría</option>
            <option v-for="category in categoryOptions" :key="category.id" :value="category.id">
              {{ category.nombre }}
            </option>
          </select>
        </label>
        <label class="form-field">
          Stock
          <input v-model="draft.stock" type="number" min="0" step="1" required />
        </label>
        <label class="form-field">
          URL de imagen
          <input v-model="draft.imagen_url" type="url" />
        </label>
        <label class="form-field product-description-field">
          Descripción
          <textarea v-model="draft.descripcion" rows="3"></textarea>
        </label>
        <label class="featured-toggle">
          <input v-model="draft.es_destacado" type="checkbox" />
          Mostrar como destacado
        </label>
      </div>
      <p v-if="formError || saveError" class="form-error" role="alert">{{ formError || saveError }}</p>
      <button class="primary-button" type="submit" :disabled="saving">
        {{ saving ? 'Guardando…' : 'Guardar en catálogo' }}
      </button>
    </form>

    <div v-if="loading" class="catalog-state" role="status">Cargando productos del catálogo…</div>
    <div v-else-if="loadError" class="catalog-state catalog-state-error" role="alert">
      <h3>No pudimos cargar los productos</h3>
      <p>{{ loadError }}</p>
    </div>

    <template v-else>
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
          <img v-if="product.image" :src="product.image" :alt="product.imageAlt" loading="lazy" />
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
              <strong>{{ formatPrice(product.price) }}</strong>
            </div>
            <span class="installments">{{ product.stock }} en stock</span>
          </div>
          <div class="product-card-actions">
            <button
              class="quick-add"
              type="button"
              :disabled="product.stock <= 0"
              @click="emit('add-to-cart', product)"
            >
              <span>{{ product.stock > 0 ? 'Agregar al carrito' : 'Sin stock' }}</span>
              <span aria-hidden="true">+</span>
            </button>
            <template v-if="isAdmin && showCategories">
              <button class="product-admin-action" type="button" @click="openEditProduct(product)">
                Editar
              </button>
              <button class="product-admin-action product-delete-action" type="button" @click="requestDelete(product)">
                Eliminar
              </button>
            </template>
          </div>
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
    </template>
  </section>
</template>
