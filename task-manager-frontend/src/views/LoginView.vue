<template>
  <div class="h-full flex flex-col justify-center items-center p-6 bg-gray-50">
      <div class="w-full max-w-xs">
          <div class="text-center mb-10">
              <i class="fa-solid fa-layer-group text-5xl text-blue-600 mb-4"></i>
              <h2 class="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p class="text-gray-500 text-sm">Please enter your password</p>
          </div>
          <form @submit.prevent="handleLogin" class="space-y-4">
              <input v-model="password" type="password" placeholder="Password (try: admin)" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition" required>
              <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
              <button type="submit" :disabled="loading" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50 flex justify-center">
                  <span v-if="loading"><i class="fa-solid fa-circle-notch fa-spin"></i></span>
                  <span v-else>Login</span>
              </button>
          </form>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import TaskService from '../services/TaskService';

const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();

const handleLogin = async () => {
    loading.value = true;
    error.value = '';
    try {
        const response = await TaskService.login(password.value);
        if (response.token) {
            localStorage.setItem('authToken', response.token);
            window.dispatchEvent(new Event('auth-changed'));
            router.push('/');
        } else {
            error.value = 'Invalid response from server';
        }
    } catch (e: any) {
        error.value = e.message || 'Login failed';
    } finally {
        loading.value = false;
    }
};
</script>