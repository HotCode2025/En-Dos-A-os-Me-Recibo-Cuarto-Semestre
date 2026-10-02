<script setup>
import { RouterLink } from 'vue-router'
import ProductCatalog from '../components/ProductCatalog.vue'

defineProps({
  products: { type: Array, required: true },
  searchQuery: { type: String, default: '' },
})

const emit = defineEmits(['add-to-cart', 'clear-search'])
</script>

<template>
  <section id="inicio" class="hero">
    <div class="hero-copy">
      <span class="eyebrow"><span class="eyebrow-dot"></span> TU PRÓXIMA EXPERIENCIA EMPIEZA ACÁ</span>
      <h1>La tecnología<br />que te <span>conecta.</span></h1>
      <p>
        Encontrá tus marcas favoritas, descubrí lo último en tecnología y disfrutá una forma más
        simple de comprar.
      </p>
      <RouterLink class="primary-button" to="/productos">
        Explorar productos
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3.5 10h12m-5-5 5 5-5 5" />
        </svg>
      </RouterLink>
      <div class="hero-assurance">
        <span aria-hidden="true">✓</span>
        <span>Compra segura <strong>·</strong> Atención personalizada</span>
      </div>
    </div>

    <div class="hero-visual">
      <img
        class="hero-image"
        src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1400&q=90"
        alt="Selección de dispositivos electrónicos y accesorios"
      />
      <div class="hero-image-wash"></div>
      <div class="hero-note">
        <span class="hero-note-icon" aria-hidden="true">✦</span>
        <span><strong>Todo lo que buscás</strong><br />en un solo lugar</span>
      </div>
      <div class="hero-sticker" aria-label="Ofertas especiales">
        <span>OFERTAS</span>
        <strong>que te<br />conectan</strong>
        <span aria-hidden="true">✦</span>
      </div>
    </div>
    <span class="hero-decoration" aria-hidden="true">✳</span>
  </section>

  <section class="benefits" aria-label="Beneficios de comprar en PuntoZero">
    <div class="benefit">
      <span class="benefit-icon" aria-hidden="true">↗</span>
      <span><strong>Envíos a todo el país</strong><small>Recibí tu compra donde estés</small></span>
    </div>
    <div class="benefit">
      <span class="benefit-icon" aria-hidden="true">✓</span>
      <span><strong>Productos originales</strong><small>Garantía oficial de fábrica</small></span>
    </div>
    <div class="benefit">
      <span class="benefit-icon" aria-hidden="true">$</span>
      <span><strong>Pagá como prefieras</strong><small>Hasta 6 cuotas sin interés</small></span>
    </div>
    <div class="benefit">
      <span class="benefit-icon" aria-hidden="true">♡</span>
      <span><strong>Estamos para ayudarte</strong><small>Atención personalizada</small></span>
    </div>
  </section>

  <ProductCatalog
    :products="products"
    :search-query="searchQuery"
    :show-categories="false"
    :limit="4"
    title="Productos destacados"
    eyebrow="LO MÁS BUSCADO"
    subtitle="Elegí tus próximos favoritos con la calidad y confianza de PuntoZero."
    @add-to-cart="emit('add-to-cart', $event)"
    @clear-search="emit('clear-search')"
  />

  <div class="catalog-more">
    <RouterLink class="secondary-button" to="/productos">Ver todos los productos →</RouterLink>
  </div>

  <section id="nosotros" class="promo-banner section-shell">
    <div class="promo-icon" aria-hidden="true">✦</div>
    <div>
      <span class="eyebrow">PUNTOZERO, CERCA TUYO</span>
      <h2>Encontrá eso que te conecta<span>.</span></h2>
      <p>Marcas que conocés, precios para aprovechar y atención que hace la diferencia.</p>
    </div>
    <RouterLink class="primary-button" to="/productos">
      Ver productos
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3.5 10h12m-5-5 5 5-5 5" />
      </svg>
    </RouterLink>
  </section>
</template>
