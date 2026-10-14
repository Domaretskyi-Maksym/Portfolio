import { createRouter, createWebHistory } from 'vue-router'
import { findProduct } from '../data/products'

declare module 'vue-router' {
  interface RouteMeta {
    /** Showroom pages manage their own scroll so the shared-element transition can measure it. */
    showroom?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'kinetic',
      component: () => import('../views/KineticView.vue'),
    },
    {
      path: '/shop',
      component: () => import('../views/showroom/ShowroomLayout.vue'),
      children: [
        {
          path: '',
          name: 'catalog',
          component: () => import('../views/showroom/CatalogPage.vue'),
          meta: { showroom: true },
        },
        {
          path: 'p/:id',
          name: 'product',
          component: () => import('../views/showroom/ProductPage.vue'),
          props: true,
          meta: { showroom: true },
          beforeEnter: (to) => (findProduct(String(to.params.id)) ? true : { name: 'catalog' }),
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.meta.showroom && from.meta.showroom) return false
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return savedPosition ?? { top: 0 }
  },
})

export default router
