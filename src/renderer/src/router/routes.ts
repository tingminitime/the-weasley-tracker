import Index from '@renderer/pages/index.vue'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: Index,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@renderer/pages/NotFound.vue'),
  },
]
