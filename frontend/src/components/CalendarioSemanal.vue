<template>
  <div class="calendario">
    <div class="controles">
      <label>Laboratorio:
        <select v-model.number="labId" @change="cargarCalendario">
          <option v-for="l in labs" :key="l.id" :value="l.id">{{ l.nombre }}</option>
        </select>
      </label>
      <label>Semana (elige cualquier día):
        <input type="date" v-model="lunes" @change="alCambiarFecha" />
      </label>
    </div>

    <div class="leyenda">
      <span class="tag libre">Libre</span>
      <span class="tag reservada">Reservada</span>
      <span class="tag bloqueada">Bloqueada</span>
    </div>

    <p v-if="error" class="error-cal">{{ error }}</p>

    <div class="grid-semana">
      <div v-for="dia in dias" :key="dia.num" class="columna-dia">
        <h4>{{ dia.nombre }} ({{ fechaDelDia(dia.num) }})</h4>

        <!-- Franjas de atención y bloqueos definidos por el admin -->
        <div
          v-for="f in franjasVisiblesDelDia(dia.num)"
          :key="`franja-${f.id}`"
          class="bloque"
          :class="f.tipo === 'bloqueo' ? 'bloqueada' : 'libre'"
        >
          <div class="bloque-cabecera">
            <strong>{{ f.hora_inicio }} - {{ f.hora_fin }}</strong>
            <button
              v-if="editable"
              type="button"
              class="btn-eliminar-franja"
              title="Eliminar franja o bloqueo"
              @click="eliminarFranja(f.id)"
            >
              ×
            </button>
          </div>
          <p v-if="f.tipo === 'bloqueo'">Bloqueado: {{ f.motivo || 'Sin motivo' }}</p>
          <p v-else>Libre</p>
        </div>

        <!-- Reservas aprobadas y pendientes de ese día -->
        <div
          v-for="r in reservasDelDia(dia.num)"
          :key="`reserva-${r.id}`"
          class="bloque"
          :class="r.estado === 'Pendiente' ? 'pendiente' : 'reservada'"
        >
          <strong>{{ r.hora_inicio }} - {{ r.hora_fin }}</strong>
          <p v-if="!r.equipo_id">
            {{ r.estado === 'Pendiente' ? 'Pendiente (Lab completo)' : 'Reservada (Lab completo)' }}
          </p>
          <p v-else>
            Reservada ({{ r.equipo_codigo || `Equipo #${r.equipo_id}` }})
          </p>
          <small>{{ r.usuario_nombre }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { labService, horarioService } from '@/services/api';

const props = defineProps({
  editable: {
    type: Boolean,
    default: false,
  },
});

const labs = ref([]);
const labId = ref(null);
const lunes = ref(obtenerLunesDe());
const franjas = ref([]);
const reservas = ref([]);
const error = ref('');

const dias = [
  { num: 1, nombre: 'Lunes' },
  { num: 2, nombre: 'Martes' },
  { num: 3, nombre: 'Miércoles' },
  { num: 4, nombre: 'Jueves' },
  { num: 5, nombre: 'Viernes' },
  { num: 6, nombre: 'Sábado' },
];

function formatearFechaLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function obtenerLunesDe(fechaStr) {
  const fecha = fechaStr ? new Date(`${fechaStr}T00:00:00`) : new Date();
  const dia = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const diff = dia === 0 ? -6 : 1 - dia;
  fecha.setDate(fecha.getDate() + diff);
  return formatearFechaLocal(fecha);
}

function alCambiarFecha() {
  if (!lunes.value) return;
  lunes.value = obtenerLunesDe(lunes.value);
  cargarCalendario();
}

function fechaDelDia(numDia) {
  if (!lunes.value) return '';
  const base = new Date(`${lunes.value}T00:00:00`);
  base.setDate(base.getDate() + (numDia - 1));
  return formatearFechaLocal(base);
}

async function cargarCalendario() {
  if (!labId.value || !lunes.value) return;
  error.value = '';
  try {
    const fin = fechaDelDia(6);
    const data = await horarioService.obtenerPorLab(labId.value, lunes.value, fin);
    franjas.value = data.franjas;
    reservas.value = data.reservas;
  } catch (e) {
    error.value = e.message || 'No se pudo cargar el calendario.';
  }
}

async function eliminarFranja(id) {
  if (!confirm('¿Seguro que deseas eliminar esta franja o bloqueo?')) return;
  error.value = '';
  try {
    await horarioService.eliminar(id);
    await cargarCalendario();
  } catch (e) {
    error.value = e.message || 'No se pudo eliminar el horario.';
  }
}

function reservasDelDia(numDia) {
  const fecha = fechaDelDia(numDia);
  return reservas.value.filter((r) => r.fecha === fecha);
}

function franjaTieneReserva(franja, fecha) {
  return reservas.value.some(
    (r) =>
      r.fecha === fecha &&
      ['Aprobada', 'Pendiente'].includes(r.estado) &&
      r.hora_inicio < franja.hora_fin &&
      r.hora_fin > franja.hora_inicio
  );
}

function franjasVisiblesDelDia(numDia) {
  const fecha = fechaDelDia(numDia);
  return franjas.value.filter((f) => {
    if (f.fecha !== fecha) return false;
    if (f.tipo === 'bloqueo') return true;
    return !franjaTieneReserva(f, fecha);
  });
}

onMounted(async () => {
  labs.value = await labService.listar();
  if (labs.value.length) {
    labId.value = labs.value[0].id;
    cargarCalendario();
  }
});

defineExpose({ cargarCalendario });
</script>

<style scoped>
.calendario { margin-bottom: 1.25rem; }
.grid-semana { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
.columna-dia { border: 1px solid #ccc; padding: 0.5rem; border-radius: 6px; }
.bloque { padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 4px; font-size: 0.9rem; }
.bloque-cabecera { display: flex; justify-content: space-between; align-items: center; gap: 0.25rem; }
.bloque p { margin: 0.25rem 0 0 0; }
.bloque small { display: block; margin-top: 0.2rem; opacity: 0.85; font-size: 0.78rem; }
.btn-eliminar-franja {
  background: rgba(0, 0, 0, 0.12);
  color: inherit;
  border: none;
  border-radius: 4px;
  width: 22px;
  height: 22px;
  padding: 0;
  line-height: 1;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
}
.btn-eliminar-franja:hover { background: rgba(0, 0, 0, 0.25); }
.error-cal { color: #721c24; background: #f8d7da; padding: 0.5rem 0.75rem; border-radius: 6px; margin-top: 0.75rem; }
.libre { background: #d4edda; color: #155724; }
.reservada { background: #fff3cd; color: #856404; }
.pendiente { background: #fff8e1; color: #856404; border: 1px dashed #d39e00; }
.bloqueada { background: #f8d7da; color: #721c24; }
.leyenda { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.tag { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.85rem; }
</style>