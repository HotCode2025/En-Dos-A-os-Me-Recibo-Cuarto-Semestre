<script setup>
import { computed, ref } from 'vue'

const brands = ['Todas', 'Toyota', 'Volkswagen', 'Ford', 'Chevrolet', 'Fiat', 'Renault', 'Peugeot']

const cars = [
  {
    id: 1,
    brand: 'Toyota',
    model: 'Corolla Cross XEI',
    year: 2024,
    kilometers: '12.500 km',
    transmission: 'Automática',
    fuel: 'Nafta',
    price: 48000000,
    badge: 'DESTACADO',
    image: '/images/autos/ToyotaCorolaCrossXEI.jpg',
    imageAlt: 'Toyota Corolla Cross',
  },
  {
    id: 2,
    brand: 'Volkswagen',
    model: 'Taos Comfortline',
    year: 2023,
    kilometers: '24.000 km',
    transmission: 'Automática',
    fuel: 'Nafta',
    price: 36500000,
    badge: '',
    image: '/images/autos/VolkswagenTaosComfortline.jpg',
    imageAlt: 'Volkswagen Taos Comfortline',
  },
  {
    id: 3,
    brand: 'Ford',
    model: 'F-150',
    year: 2020,
    kilometers: '8.200 km',
    transmission: 'Automática',
    fuel: 'Diésel',
    price: 55000,
    currency: 'USD',
    badge: 'OPORTUNIDAD',
    image: '/images/autos/FordF150.avif',
    imageAlt: 'Ford F-150',
  },
  {
    id: 4,
    brand: 'Fiat',
    model: 'Cronos Precision',
    year: 2023,
    kilometers: '19.800 km',
    transmission: 'Automática',
    fuel: 'Nafta',
    price: 22500000,
    badge: '',
    image: '/images/autos/FiatCronosPrecision.jpeg',
    imageAlt: 'Fiat Cronos Precision',
  },
  {
    id: 5,
    brand: 'Renault',
    model: 'Master',
    year: 2026,
    kilometers: '6.400 km',
    transmission: 'Automática',
    fuel: 'Nafta',
    price: 63500000,
    badge: 'BAJO KM',
    image: '/images/autos/RenaultMaster.jpg',
    imageAlt: 'Renault Master',
  },
  {
    id: 6,
    brand: 'Peugeot',
    model: '208 Allure Pack',
    year: 2023,
    kilometers: '17.300 km',
    transmission: 'Manual',
    fuel: 'Nafta',
    price: 26500000,
    badge: '',
    image: '/images/autos/Peugeot208AllurePack.jpg',
    imageAlt: 'Peugeot 208 Allure Pack',
  },
  {
    id: 7,
    brand: 'Chevrolet',
    model: 'S10 Highline',
    year: 2022,
    kilometers: '32.100 km',
    transmission: 'Automática',
    fuel: 'Nafta',
    price: 46000000,
    badge: '',
    image: '/images/autos/ChevroletS10Highline.jpg',
    imageAlt: 'Chevrolet S10 Highline',
  },
  {
    id: 8,
    brand: 'Toyota',
    model: 'Hilux GRS',
    year: 2023,
    kilometers: '21.000 km',
    transmission: 'CVT',
    fuel: 'Nafta',
    price: 61900000,
    badge: '',
    image: '/images/autos/ToyotaHiluxGRS.jpg',
    imageAlt: 'Toyota Hilux GRS',
  },
]

const selectedBrand = ref('Todas')
const searchQuery = ref('')
const reservedCars = ref([])
const isReservationsOpen = ref(false)
const notice = ref('')
let noticeTimeout

const visibleCars = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('es')

  return cars.filter((car) => {
    const matchesBrand = selectedBrand.value === 'Todas' || car.brand === selectedBrand.value
    const matchesSearch =
      !query ||
      `${car.brand} ${car.model} ${car.year}`.toLocaleLowerCase('es').includes(query)

    return matchesBrand && matchesSearch
  })
})

const reservationCount = computed(() => reservedCars.value.length)

const formatPrice = (price, currency = 'ARS') =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)

function reserveCar(car) {
  if (reservedCars.value.some((reservedCar) => reservedCar.id === car.id)) {
    showNotice('Este auto ya está en tu lista de reservas.')
    return
  }

  reservedCars.value.push(car)
  showNotice(`${car.brand} ${car.model} se agregó a tus reservas`)
}

function removeReservation(carId) {
  reservedCars.value = reservedCars.value.filter((car) => car.id !== carId)
}

function showNotice(message) {
  notice.value = message
  window.clearTimeout(noticeTimeout)
  noticeTimeout = window.setTimeout(() => {
    notice.value = ''
  }, 3200)
}

function sendReservationRequest() {
  showNotice('Demo: contactá a la concesionaria para confirmar disponibilidad y condiciones.')
}
</script>

<template>
  <div class="announcement">
    <span>Encontrá tu próximo auto</span>
    <span class="announcement-divider" aria-hidden="true">✳</span>
    <span>Financiación y toma de usados a consultar</span>
  </div>

  <header class="site-header">
    <a class="brand" href="#" aria-label="Punto Motor, inicio">
      <span class="brand-mark" aria-hidden="true">P</span>
      <span>punto<span class="brand-period">motor.</span></span>
    </a>

    <nav class="desktop-nav" aria-label="Navegación principal">
      <a href="#autos">Autos</a>
      <a href="#marcas">Marcas</a>
      <a href="#como-reservar">Cómo reservar</a>
    </nav>

    <div class="header-actions">
      <label class="search-box">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input v-model="searchQuery" type="search" placeholder="Marca, modelo o año" />
      </label>
      <button
        class="cart-button"
        type="button"
        :aria-label="`Abrir reservas, ${reservationCount} autos`"
        @click="isReservationsOpen = true"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 12h2l2-5h10l2 5h2v6h-2" />
          <path d="M7 18h10M7 18a2 2 0 1 1-4 0m4 0h10m0 0a2 2 0 1 0 4 0" />
          <path d="M7 12h10" />
        </svg>
        <span class="cart-count">{{ reservationCount }}</span>
      </button>
    </div>
  </header>

  <main>
    <section id="como-reservar" class="hero">
      <div class="hero-copy">
        <span class="eyebrow"><span class="eyebrow-dot"></span> TU PRÓXIMO AUTO ESTÁ MÁS CERCA</span>
        <h1>El camino que<br />soñás, <span>empieza acá.</span></h1>
        <p>
          Explorá autos seleccionados de las marcas que más elegimos en Argentina. Encontrá el
          indicado y agregalo a tus reservas.
        </p>
        <a class="primary-button" href="#autos">
          Ver autos disponibles
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3.5 10h12m-5-5 5 5-5 5" />
          </svg>
        </a>
        <div class="hero-social-proof">
          <span class="hero-proof-icon" aria-hidden="true">✓</span>
          <span><strong>Atención personalizada</strong> para encontrar tu próximo auto</span>
        </div>
      </div>

      <div class="hero-visual">
        <img
          class="hero-image"
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=90"
          alt="Auto deportivo en una ruta de montaña"
        />
        <div class="hero-image-wash"></div>
        <div class="hero-note">
          <span class="note-sparkle" aria-hidden="true">✳</span>
          <span><strong>Tu próximo viaje</strong><br />empieza con una buena elección</span>
        </div>
        <div class="hero-sticker" aria-hidden="true">
          <span>ENCONTRÁ</span>
          <strong>tu próximo<br />camino</strong>
          <span>✳</span>
        </div>
      </div>

      <span class="hero-decoration hero-decoration-one" aria-hidden="true">✳</span>
      <span class="hero-decoration hero-decoration-two" aria-hidden="true">✳</span>
    </section>

    <section id="marcas" class="benefits" aria-label="Ventajas de Punto Motor">
      <div class="benefit">
        <span class="benefit-icon" aria-hidden="true">⌕</span>
        <span><strong>Autos seleccionados</strong><small>Opciones para cada camino</small></span>
      </div>
      <div class="benefit">
        <span class="benefit-icon" aria-hidden="true">↗</span>
        <span><strong>Reservá tu favorito</strong><small>Guardalo mientras consultás</small></span>
      </div>
      <div class="benefit">
        <span class="benefit-icon" aria-hidden="true">$</span>
        <span><strong>Financiación</strong><small>Consultá opciones disponibles</small></span>
      </div>
      <div class="benefit">
        <span class="benefit-icon" aria-hidden="true">↔</span>
        <span><strong>Tomamos tu usado</strong><small>Pedí una tasación</small></span>
      </div>
    </section>

    <section id="autos" class="catalog section-shell">
      <div class="section-heading">
        <div>
          <span class="eyebrow">ELEGÍ TU PRÓXIMO CAMINO</span>
          <h2>Autos para salir a descubrir<span>.</span></h2>
          <p>Modelos destacados de las marcas más elegidas en Argentina.</p>
        </div>
        <a class="text-link" href="#autos">
          Ver inventario
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3.5 10h12m-5-5 5 5-5 5" />
          </svg>
        </a>
      </div>

      <div class="category-list" aria-label="Filtrar autos por marca">
        <button
          v-for="brand in brands"
          :key="brand"
          type="button"
          :class="{ active: selectedBrand === brand }"
          :aria-pressed="selectedBrand === brand"
          @click="selectedBrand = brand"
        >
          {{ brand }}
        </button>
      </div>

      <div v-if="visibleCars.length" class="product-grid">
        <article v-for="car in visibleCars" :key="car.id" class="product-card car-card">
          <div class="product-image-wrap car-image-wrap">
            <img :src="car.image" :alt="car.imageAlt" loading="lazy" />
            <span v-if="car.badge" class="product-badge">{{ car.badge }}</span>
          </div>
          <div class="product-info">
            <div class="product-title-row">
              <div>
                <span class="product-category">{{ car.brand }}</span>
                <h3>{{ car.model }}</h3>
              </div>
            </div>
            <div class="car-specs">
              <span>Año {{ car.year }}</span>
              <span>{{ car.kilometers }}</span>
              <span>{{ car.transmission }}</span>
              <span>{{ car.fuel }}</span>
            </div>
            <div class="product-price-row">
              <strong>{{ formatPrice(car.price, car.currency) }}</strong>
              <span class="review-count">precio de referencia*</span>
            </div>
            <button
              class="quick-add car-reserve-button"
              type="button"
              :disabled="reservedCars.some((reservedCar) => reservedCar.id === car.id)"
              @click="reserveCar(car)"
            >
              <span>{{
                reservedCars.some((reservedCar) => reservedCar.id === car.id)
                  ? 'Agregado a reservas'
                  : 'Reservar este auto'
              }}</span>
              <span aria-hidden="true">{{
                reservedCars.some((reservedCar) => reservedCar.id === car.id) ? '✓' : '→'
              }}</span>
            </button>
          </div>
        </article>
      </div>

      <div v-else class="empty-results">
        <span aria-hidden="true">⌕</span>
        <h3>No encontramos ese auto</h3>
        <p>Probá con otra búsqueda o elegí una marca diferente.</p>
        <button
          class="secondary-button"
          type="button"
          @click="searchQuery = ''; selectedBrand = 'Todas'"
        >
          Ver todos los autos
        </button>
      </div>
      <p class="price-disclaimer">
        * Listado de demostración. Precios, disponibilidad, kilometraje y condiciones son
        orientativos; consultá con la concesionaria antes de avanzar.
      </p>
    </section>

    <section class="reservation-banner section-shell">
      <div class="reservation-banner-icon" aria-hidden="true">↗</div>
      <div>
        <span class="eyebrow">TU AUTO, A TU TIEMPO</span>
        <h2>Reservá para consultar, sin pagar online<span>.</span></h2>
        <p>La reserva guarda tus opciones. La disponibilidad y las condiciones se confirman con la concesionaria.</p>
      </div>
      <a class="primary-button" href="#autos">
        Explorar autos
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3.5 10h12m-5-5 5 5-5 5" />
        </svg>
      </a>
    </section>
  </main>

  <footer class="site-footer">
    <a class="brand footer-brand" href="#" aria-label="Punto Motor, inicio">
      <span class="brand-mark" aria-hidden="true">P</span>
      <span>punto<span class="brand-period">motor.</span></span>
    </a>
    <p>Encontrá tu próximo auto, a tu manera.</p>
    <span class="footer-credit">Precios y disponibilidad a confirmar</span>
  </footer>

  <Transition name="toast">
    <div v-if="notice" class="toast-message" role="status" aria-live="polite">
      <span aria-hidden="true">✓</span>{{ notice }}
    </div>
  </Transition>

  <Transition name="drawer">
    <div v-if="isReservationsOpen" class="cart-overlay" @click.self="isReservationsOpen = false">
      <aside class="cart-drawer" aria-label="Mis reservas" aria-modal="true" role="dialog">
        <div class="cart-header">
          <div>
            <span class="eyebrow">TUS AUTOS ELEGIDOS</span>
            <h2>Mis reservas <span>({{ reservationCount }})</span></h2>
          </div>
          <button
            class="close-button"
            type="button"
            aria-label="Cerrar reservas"
            @click="isReservationsOpen = false"
          >
            ×
          </button>
        </div>

        <div v-if="reservedCars.length" class="cart-content">
          <div class="cart-items">
            <article v-for="car in reservedCars" :key="car.id" class="cart-item">
              <img :src="car.image" :alt="car.imageAlt" />
              <div class="cart-item-info">
                <span class="product-category">{{ car.brand }} · {{ car.year }}</span>
                <h3>{{ car.model }}</h3>
                <strong>{{ formatPrice(car.price, car.currency) }}</strong>
                <button
                  class="remove-reservation"
                  type="button"
                  @click="removeReservation(car.id)"
                >
                  Quitar de mis reservas
                </button>
              </div>
            </article>
          </div>
          <div class="cart-summary">
            <div><span>Autos seleccionados</span><strong>{{ reservationCount }}</strong></div>
            <p>No se realiza ningún pago. La reserva es una solicitud de contacto, no confirma disponibilidad.</p>
            <button class="primary-button checkout-button" type="button" @click="sendReservationRequest">
              Solicitar información
              <span aria-hidden="true">→</span>
            </button>
            <button class="continue-shopping" type="button" @click="isReservationsOpen = false">
              Seguir buscando autos
            </button>
          </div>
        </div>

        <div v-else class="cart-empty">
          <span class="empty-cart-icon" aria-hidden="true">⌕</span>
          <h3>Todavía no elegiste un auto</h3>
          <p>Guardá tus favoritos acá mientras decidís.</p>
          <button class="primary-button" type="button" @click="isReservationsOpen = false">
            Ver autos
          </button>
        </div>
      </aside>
    </div>
  </Transition>
</template>
