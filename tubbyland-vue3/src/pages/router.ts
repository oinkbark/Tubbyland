import { 
  createRouter, 
  createMemoryHistory, 
  createWebHistory, 
  RouteRecordRaw 
} from 'vue-router'
import IndexPage from '@/pages/root/index.vue'
import ArtPage from '@/pages/root/Art/art.vue'
import DisplayProject from './root/Art/DisplayProject.vue'

import ApiIndexPage from '@/pages/api/index.vue'

function returnRoutes(hostname?:string): Array<RouteRecordRaw> {
  switch (hostname) {
    case 'api.tubbyland.com': {
      return [
        {
          path: '/',
          name: 'ApiIndexPage',
          component: ApiIndexPage
        }
      ]
    }
    default: {
      return [
        {
          path: '/',
          name: 'IndexPage',
          component: IndexPage
        },
        {
          path: '/art',
          name: 'ArtPage',
          component: ArtPage
        },
        {
          path: '/art/:uri',
          name: 'DisplayProjectPage',
          component: DisplayProject
        },
        {
          path: '/credits',
          name: 'CreditsPage',
          component: () => import('./root/credits.vue')
        },
        {
          path: '/build',
          name: 'BuildPage',
          component: () => import('./root/build.vue')
        },
        {
          path: '/login',
          name: 'LoginPage',
          component: () => import('./root/login.vue')
        },
        {
          path: '/:any(.*)*',
          name: '404Page',
          component: () => import('../components/404.vue')
        }
      ]
    }
  }
}


export function createServerRouter(hostname?:string) {
  return createRouter({
    // @ts-ignore
    // import.meta.env.SSR is injected by vite
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: returnRoutes(hostname)
  })
}
