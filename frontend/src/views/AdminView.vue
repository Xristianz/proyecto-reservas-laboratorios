<template>
  <div class="admin-panel">
    <header>
      <h1>Panel de Administrador</h1>
      <button @click="cerrarSesion">Cerrar Sesión</button>
    </header>

    <nav class="tabs">
      <button @click="tab = 'usuarios'">Usuarios</button>
    </nav>

    <CrudUsuarios v-if="tab === 'usuarios'" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import CrudUsuarios from '@/components/admin/CrudUsuarios.vue';

const auth = useAuthStore();
const router = useRouter();
const tab = ref('usuarios');

function cerrarSesion() {
  auth.logout();
  router.push('/login');
}
</script>