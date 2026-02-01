import { createRouter, createWebHashHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import EditTaskView from '../views/EditTaskView.vue';

const routes = [
  { path: '/login', component: LoginView },
  { path: '/', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/task/:_id', component: EditTaskView, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  const auth = localStorage.getItem('authToken');
  if (to.meta.requiresAuth && !auth) next('/login');
  else next();
});

export default router;