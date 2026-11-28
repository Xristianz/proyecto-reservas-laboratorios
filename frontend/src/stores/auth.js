import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authService } from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref(JSON.parse(localStorage.getItem('usuario') || 'null'));
  const token = ref(localStorage.getItem('token') || null);

  async function login(email, password) {
    const data = await authService.login(email, password);
    token.value = data.token;
    usuario.value = data.usuario;
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
  }

  function logout() {
    token.value = null;
    usuario.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  return { usuario, token, login, logout };
});
