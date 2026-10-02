<script setup>
import { RouterLink } from 'vue-router'

</script>

<template>
  <section class="page-intro">
    <div class="section-shell">
      <span class="eyebrow">PUNTOZERO · NUESTRA HISTORIA</span>
      <h1>La tecnología nos conecta<span>.</span></h1>
      <p>Conocé el equipo y la idea detrás de cada experiencia PuntoZero.</p>
    </div>
  </section>

  <section class="about-layout section-shell">
    <div class="about-copy">
      <span class="eyebrow">QUIÉNES SOMOS</span>
      <h2>Más cerca de lo que te gusta.</h2>
      <p>Nacimos con una idea simple: acercar la tecnología que hace más fácil y disfrutable cada día.</p>
      <p>Seleccionamos productos originales, marcas confiables y opciones para distintos estilos de vida.</p>
      <p>Queremos que comprar tecnología sea una experiencia clara, segura y acompañada de principio a fin.</p>
    </div>

    <aside class="about-highlight">
      <span class="about-highlight-icon" aria-hidden="true">✦</span>
      <span class="eyebrow">NUESTRO PROPÓSITO</span>
      <h3>Elegir mejor.<br />Disfrutar más.</h3>
      <p>Tecnología seleccionada con atención, para acompañarte en todos tus días.</p>
      <div class="about-values">
        <span><strong>01</strong> Confianza</span>
        <span><strong>02</strong> Calidad</span>
        <span><strong>03</strong> Cercanía</span>
      </div>
    </aside>
  </section>

  <section class="about-bottom section-shell">
    <span class="eyebrow">CERCA TUYO, SIEMPRE</span>
    <h2>Tu próxima experiencia empieza acá.</h2>
    <RouterLink class="primary-button" to="/productos">Explorar productos <span aria-hidden="true">→</span></RouterLink>
  </section>
</template>
