<script setup>
import ProductCatalog from '../components/ProductCatalog.vue'

defineProps({
  products: { type: Array, required: true },
  searchQuery: { type: String, default: '' },
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
</script>

<template>
  <section class="products-intro">
    <div class="section-shell">
      <span class="eyebrow">PUNTOZERO · TIENDA ONLINE</span>
      <h1>Todos los productos<span>.</span></h1>
      <p>Encontrá tecnología para trabajar, jugar y disfrutar cada día.</p>
    </div>
  </section>
  <ProductCatalog
    :products="products"
    :search-query="searchQuery"
    :is-admin="isAdmin"
    :brands="brands"
    :category-options="categoryOptions"
    :loading="loading"
    :load-error="loadError"
    :saving="saving"
    :save-error="saveError"
    :save-revision="saveRevision"
    title="Explorá nuestro catálogo"
    eyebrow="NUESTRO CATÁLOGO"
    subtitle="Filtrá por categoría o buscá ese producto que tenés en mente."
    @add-to-cart="emit('add-to-cart', $event)"
    @clear-search="emit('clear-search')"
    @save-product="emit('save-product', $event)"
    @delete-product="emit('delete-product', $event)"
  />
</template>
