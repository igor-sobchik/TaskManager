<template>
  <div id="app" class="h-[100dvh] flex flex-col max-w-4xl mx-auto bg-white shadow-2xl relative overflow-hidden">
    <!-- Removed Global Header to allow Views to control their own headers -->

    <main class="flex-1 overflow-y-auto relative scroll-smooth flex flex-col">
      <router-view></router-view>
    </main>

    <router-link
      v-if="isDashboard"
      to="/task/new"
      class="absolute bottom-8 right-6 bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition transform z-50"
    >
      <i class="fa-solid fa-plus text-xl"></i>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
// import { useRouter, useRoute } from 'vue-router';
import { useRoute } from 'vue-router';

// const router = useRouter();
const route = useRoute();
const isAuthenticated = ref(!!localStorage.getItem('authToken'));

const isDashboard = computed(() => route.path === '/');

// Logout logic is now handled in specific views or we could expose it if needed,
// but for simplicity, we can let the Dashboard handle its own logout since the button is moving there.
// However, to keep auth state consistent, we listen to the event.

onMounted(() => {
  window.addEventListener('auth-changed', () => {
    isAuthenticated.value = !!localStorage.getItem('authToken');
  });
});
</script>