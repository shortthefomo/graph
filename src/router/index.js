import { createRouter, createWebHistory } from 'vue-router'
import Graph from '../views/Graph.vue'

export const routes = [
    {
        path: '/',
        name: 'Graph',
        component: Graph,
        meta: { layout: 'MainLayout' }
    },
]

const history = createWebHistory()

const router = createRouter({
    history,
    routes,
})

export default router