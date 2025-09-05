export const routes = [
  {
    path: '/',
    name: 'home',
    redirect: '/chat',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@renderer/pages/Login.vue'),
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('@renderer/pages/Chat.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@renderer/pages/Dashboard.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@renderer/pages/Settings.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@renderer/pages/NotFound.vue'),
  },
]
