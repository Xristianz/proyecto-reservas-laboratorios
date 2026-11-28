import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import LoginView from '@/views/LoginView.vue';
import AdminView from '@/views/AdminView.vue';
import DocenteView from '@/views/DocenteView.vue';
import EstudianteView from '@/views/EstudianteView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/admin', component: AdminView, meta: { requiresAuth: true, rol: 'admin' } },
    { path: '/docente', component: DocenteView, meta: { requiresAuth: true, rol: 'docente' } },
    { path: '/estudiante', component: EstudianteView, meta: { requiresAuth: true, rol: 'estudiante' } },
    { path: '/', redirect: '/login' },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.token) {
    return '/login';
  }
  if (to.meta.rol && auth.usuario?.rol !== to.meta.rol) {
    return `/${auth.usuario.rol}`; 
  }
});

export default router;