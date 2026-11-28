<template>
  <div class="admin-panel">
    <header>
      <h1>Panel de Administrador</h1>
      <button @click="cerrarSesion">Cerrar Sesión</button>
    </header>

    <nav class="tabs">
      <button @click="tab = 'labs'">Laboratorios</button>
      <button @click="tab = 'equipos'">Equipos</button>
      <button @click="tab = 'usuarios'">Usuarios</button>
      <button @click="tab = 'horarios'">Horarios y Calendario</button>
    </nav>

    <CrudLaboratorios v-if="tab === 'labs'" />
    <CrudEquipos v-if="tab === 'equipos'" />
    <CrudUsuarios v-if="tab === 'usuarios'" />
    <CrudHorarios v-if="tab === 'horarios'" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import CrudLaboratorios from '@/components/admin/CrudLaboratorios.vue';
import CrudEquipos from '@/components/admin/CrudEquipos.vue';
import CrudUsuarios from '@/components/admin/CrudUsuarios.vue';
import CrudHorarios from '@/components/admin/CrudHorarios.vue';

const auth = useAuthStore();
const router = useRouter();
const tab = ref('labs');

function cerrarSesion() {
  auth.logout();
  router.push('/login');
}
</script>