import { createRouter, createWebHistory } from 'vue-router'
import { accessToken, currentUser } from './stores/auth'
import HomeView from './views/HomeView.vue'
import ProductsView from './views/ProductsView.vue'
import AboutView from './views/AboutView.vue'
import ContactView from './views/ContactView.vue'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'
import ProfileView from './views/ProfileView.vue'
import MyOrdersView from './views/MyOrdersView.vue'
import AdminLayout from './views/admin/AdminLayout.vue'
import AdminOrdersView from './views/admin/AdminOrdersView.vue'
import AdminPaymentMethodsView from './views/admin/AdminPaymentMethodsView.vue'
import AdminInventoryView from './views/admin/AdminInventoryView.vue'
import AdminUsersView from './views/admin/AdminUsersView.vue'

// meta.requiereSesion: hay que estar logueado. meta.roles: lista de roles con acceso.
// meta.soloInvitados: pantallas de ingreso, que un usuario con sesión no necesita.
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/productos', name: 'products', component: ProductsView },
    { path: '/nosotros', name: 'about', component: AboutView },
    { path: '/contacto', name: 'contact', component: ContactView },
    { path: '/login', name: 'login', component: LoginView, meta: { soloInvitados: true } },
    { path: '/registro', name: 'register', component: RegisterView, meta: { soloInvitados: true } },
    { path: '/perfil', name: 'profile', component: ProfileView, meta: { requiereSesion: true } },
    { path: '/mis-ordenes', name: 'my-orders', component: MyOrdersView, meta: { requiereSesion: true } },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiereSesion: true, roles: ['ADMIN'] },
      redirect: '/admin/ordenes',
      children: [
        { path: 'ordenes', name: 'admin-orders', component: AdminOrdersView },
        { path: 'metodos-pago', name: 'admin-payment-methods', component: AdminPaymentMethodsView },
        { path: 'inventario', name: 'admin-inventory', component: AdminInventoryView },
        { path: 'usuarios', name: 'admin-users', component: AdminUsersView },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

// Guards de navegación. El backend sigue siendo la autoridad: estos checks solo evitan mostrar pantallas
// que el usuario no puede usar.
router.beforeEach((to) => {
  const hasSession = Boolean(accessToken.value && currentUser.value)

  if (to.meta.soloInvitados && hasSession) return { path: '/' }

  if (to.meta.requiereSesion && !hasSession) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (Array.isArray(to.meta.roles) && !to.meta.roles.includes(currentUser.value?.rol)) {
    return { path: '/' }
  }

  return true
})

export default router
