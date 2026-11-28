<template>
  <section>
    <h2>Definir Franjas Horarias y Bloqueos</h2>
    <form @submit.prevent="guardar">
      <select v-model.number="form.laboratorio_id" required>
        <option disabled value="">Laboratorio</option>
        <option v-for="l in labs" :key="l.id" :value="l.id">{{ l.nombre }}</option>
      </select>

      <input
        v-model="form.fecha"
        type="date"
        :min="hoy"
        required
      />

      <input v-model="form.hora_inicio" type="time" required />
      <input v-model="form.hora_fin" type="time" required />

      <select v-model="form.tipo">
        <option value="atencion">Franja de atenciÃ³n (Libre)</option>
        <option value="bloqueo">Bloqueo (Clase fija / Mantenimiento / Feriado)</option>
      </select>

      <input
        v-if="form.tipo === 'bloqueo'"
        v-model="form.motivo"
        placeholder="Motivo del bloqueo"
        required
      />

      <button type="submit">Agregar</button>
    </form>

    <p v-if="mensaje" class="feedback-ok">{{ mensaje }}</p>
    <p v-if="error" class="feedback-error">{{ error }}</p>

    <hr />
    <h3>Vista de Calendario Semanal</h3>
    <CalendarioSemanal ref="calendarioRef" :editable="true" />
  </section>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { labService, horarioService } from '@/services/api';
import CalendarioSemanal from '@/components/CalendarioSemanal.vue';

function obtenerFechaHoraLocal() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const hora = String(ahora.getHours()).padStart(2, '0');
  const min = String(ahora.getMinutes()).padStart(2, '0');
  return { fechaHoy: `${anio}-${mes}-${dia}`, horaActual: `${hora}:${min}` };
}

const { fechaHoy: hoy } = obtenerFechaHoraLocal();
const labs = ref([]);
const calendarioRef = ref(null);
const mensaje = ref('');
const error = ref('');

const form = ref({
  laboratorio_id: '',
  fecha: hoy,
  hora_inicio: '08:00',
  hora_fin: '10:00',
  tipo: 'atencion',
  motivo: '',
});

async function guardar() {
  mensaje.value = '';
  error.value = '';

  const { fechaHoy, horaActual } = obtenerFechaHoraLocal();

  if (form.value.hora_inicio >= form.value.hora_fin) {
    error.value = 'La hora de inicio debe ser menor a la hora de fin.';
    return;
  }

  if (
    form.value.fecha < fechaHoy ||
    (form.value.fecha === fechaHoy && form.value.hora_inicio <= horaActual)
  ) {
    error.value = 'No se pueden asignar franjas ni bloqueos en fechas u horarios pasados.';
    return;
  }

  try {
    await horarioService.crear({
      ...form.value,
      motivo: form.value.tipo === 'bloqueo' ? form.value.motivo : '',
    });
    mensaje.value = 'Horario registrado correctamente.';
    form.value.motivo = '';
    calendarioRef.value?.cargarCalendario();
  } catch (e) {
    error.value = e.message || 'No se pudo guardar el horario.';
  }
}

onMounted(async () => {
  labs.value = await labService.listar();
});
</script>

<style scoped>
.feedback-ok {
  color: #155724;
  background: #d4edda;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin-top: 0.75rem;
}

.feedback-error {
  color: #721c24;
  background: #f8d7da;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin-top: 0.75rem;
}
</style>