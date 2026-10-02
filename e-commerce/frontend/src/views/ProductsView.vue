<script setup>
import ProductCatalog from '../components/ProductCatalog.vue'

defineProps({
  products: { type: Array, required: true },
  searchQuery: { type: String, default: '' },
})

const emit = defineEmits(['add-to-cart', 'clear-search'])
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
    title="Explorá nuestro catálogo"
    eyebrow="NUESTRO CATÁLOGO"
    subtitle="Filtrá por categoría o buscá ese producto que tenés en mente."
    @add-to-cart="emit('add-to-cart', $event)"
    @clear-search="emit('clear-search')"
  />
</template>
