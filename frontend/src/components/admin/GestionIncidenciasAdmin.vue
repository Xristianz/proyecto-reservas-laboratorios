<template>
  <section>
    <h2>Reportar Daño en Equipo</h2>
    <form @submit.prevent="reportar">
      <select v-model.number="form.equipo_id" required>
        <option disabled value="">Seleccione equipo</option>
        <option v-for="e in equipos" :key="e.id" :value="e.id">
          {{ e.codigo }} - {{ e.laboratorio_nombre }} ({{ e.estado }})
        </option>
      </select>
      <input v-model="form.descripcion" placeholder="Describe el daño" required />
      <select v-model="form.prioridad">
        <option value="baja">Prioridad Baja</option>
        <option value="media">Prioridad Media</option>
        <option value="alta">Prioridad Alta</option>
      </select>
      <button type="submit">Enviar Reporte</button>
    </form>
    <p v-if="mensaje">{{ mensaje }}</p>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { equipoService, incidenciaService } from '@/services/api';

const equipos = ref([]);
const mensaje = ref('');
const form = ref({ equipo_id: '', descripcion: '', prioridad: 'media' });

async function reportar() {
  mensaje.value = '';
  const descripcionLimpia = form.value.descripcion.trim();
  if (!descripcionLimpia) {
    mensaje.value = 'Error: Debes describir el daño del equipo.';
    return;
  }

  try {
    await incidenciaService.crear({
      ...form.value,
      descripcion: descripcionLimpia,
    });
    mensaje.value = 'Incidencia reportada correctamente.';
    form.value = { equipo_id: '', descripcion: '', prioridad: 'media' };
  } catch (e) {
    mensaje.value = `Error: ${e.message || 'No se pudo enviar el reporte.'}`;
  }
}

onMounted(async () => {
  equipos.value = await equipoService.listar();
});
</script>