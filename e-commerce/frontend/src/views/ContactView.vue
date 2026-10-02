<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const contactContent = {
  email: 'hola@puntozero.com',
  phone: '+54 2604 123456',
  address: 'Mendoza, Argentina',
}
const form = ref({ name: '', email: '', message: '' })
const formMessage = ref('')

function sendMessage() {
  const subject = encodeURIComponent(`Consulta desde PuntoZero — ${form.value.name}`)
  const body = encodeURIComponent(
    `${form.value.message}\n\nContacto: ${form.value.name} (${form.value.email})`,
  )
  window.location.href = `mailto:${contactContent.email}?subject=${subject}&body=${body}`
  formMessage.value = 'Abrimos tu aplicación de correo para que puedas enviar el mensaje.'
}
</script>

<template>
  <section class="page-intro">
    <div class="section-shell">
      <span class="eyebrow">PUNTOZERO · ESTAMOS PARA AYUDARTE</span>
      <h1>Hablemos<span>.</span></h1>
      <p>¿Tenés una consulta? Elegí el canal que te quede más cómodo.</p>
    </div>
  </section>

  <section class="contact-layout section-shell">
    <div class="contact-copy">
      <span class="eyebrow">CONTACTO DIRECTO</span>
      <h2>Estamos cerca para ayudarte.</h2>
      <p>Escribinos o dejanos tu consulta. Nuestro equipo te va a orientar con tu compra.</p>

      <div class="contact-details">
        <div class="contact-detail">
          <span class="contact-detail-icon" aria-hidden="true">@</span>
          <div>
            <span class="eyebrow">EMAIL</span>
            <a :href="`mailto:${contactContent.email}`">{{ contactContent.email }}</a>
          </div>
        </div>
        <div class="contact-detail">
          <span class="contact-detail-icon" aria-hidden="true">↗</span>
          <div>
            <span class="eyebrow">TELÉFONO</span>
            <a :href="`tel:${contactContent.phone.replaceAll(' ', '')}`">{{ contactContent.phone }}</a>
          </div>
        </div>
        <div class="contact-detail">
          <span class="contact-detail-icon" aria-hidden="true">⌖</span>
          <div>
            <span class="eyebrow">UBICACIÓN</span>
            <span>{{ contactContent.address }}</span>
          </div>
        </div>
      </div>

    </div>

    <form class="contact-form" @submit.prevent="sendMessage">
      <span class="eyebrow">ENVIANOS TU CONSULTA</span>
      <h2>¿En qué podemos ayudarte?</h2>
      <label class="form-field">
        Nombre
        <input v-model.trim="form.name" autocomplete="name" required />
      </label>
      <label class="form-field">
        Email
        <input v-model.trim="form.email" type="email" autocomplete="email" required />
      </label>
      <label class="form-field">
        Mensaje
        <textarea v-model.trim="form.message" rows="4" required></textarea>
      </label>
      <button class="primary-button" type="submit">Preparar mensaje <span aria-hidden="true">→</span></button>
      <p class="contact-form-note">Se abrirá tu aplicación de correo para completar el envío.</p>
      <p v-if="formMessage" class="form-success" role="status">{{ formMessage }}</p>
    </form>
  </section>

  <section class="contact-bottom section-shell">
    <p>¿Preferís mirar primero?</p>
    <RouterLink class="secondary-button" to="/productos">Explorar productos</RouterLink>
  </section>
</template>
