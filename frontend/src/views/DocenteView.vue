<template>
  <div class="docente-panel">
    <header>
      <h1>Panel de Docente</h1>
      <button @click="cerrarSesion">Cerrar Sesión</button>
    </header>
    <CalendarioSemanal/>
    <ReportarIncidencia/>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import CalendarioSemanal from '@/components/CalendarioSemanal.vue';
import ReportarIncidencia from '@/components/ReportarIncidencia.vue';
const auth = useAuthStore();
const router = useRouter();

function cerrarSesion() {
  auth.logout();
  router.push('/login');
}
</script>