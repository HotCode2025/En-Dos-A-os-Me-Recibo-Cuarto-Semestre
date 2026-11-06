<script setup>
import { RouterLink, RouterView } from 'vue-router'

const tabs = [
  { to: '/admin/ordenes', label: 'Órdenes' },
  { to: '/admin/metodos-pago', label: 'Métodos de pago' },
  { to: '/admin/inventario', label: 'Inventario' },
  { to: '/admin/usuarios', label: 'Usuarios' },
]
</script>

<template>
  <section class="products-intro">
    <div class="section-shell">
      <span class="eyebrow">PUNTOZERO · ADMINISTRACIÓN</span>
      <h1>Panel de administración<span>.</span></h1>
      <p>Gestioná órdenes, métodos de pago, stock y usuarios. El catálogo de productos se edita desde <RouterLink to="/productos" class="admin-inline-link">Productos</RouterLink>.</p>
    </div>
  </section>

  <div class="section-shell account-panel">
    <nav class="admin-tabs" aria-label="Secciones de administración">
      <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to">{{ tab.label }}</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
.admin-inline-link {
  color: var(--accent-dark);
  font-weight: 600;
  text-decoration: underline;
}
</style>
