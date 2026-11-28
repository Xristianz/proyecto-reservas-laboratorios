<template>
  <section>
    <h2>Gestión de Equipos</h2>
    <form @submit.prevent="guardar">
      <input v-model="form.codigo" placeholder="Código (ej. PC-01)" required />
      <input v-model="form.tipo" placeholder="Tipo (Computadora, Proyector...)" required />
      <select v-model.number="form.laboratorio_id" required>
        <option disabled value="">Seleccione laboratorio</option>
        <option v-for="l in labs" :key="l.id" :value="l.id">{{ l.nombre }}</option>
      </select>
      <select v-model="form.estado">
        <option value="operativo">Operativo</option>
        <option value="danado">Dañado</option>
        <option value="en_reparacion">En reparación</option>
      </select>
      <button type="submit">{{ form.id ? 'Actualizar' : 'Crear' }}</button>
    </form>

    <p v-if="error" class="error-msg">{{ error }}</p>

    <table>
      <thead>
        <tr><th>Código</th><th>Tipo</th><th>Laboratorio</th><th>Estado</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        <tr v-for="e in equipos" :key="e.id">
          <td>{{ e.codigo }}</td>
          <td>{{ e.tipo }}</td>
          <td>{{ e.laboratorio_nombre }}</td>
          <td>{{ e.estado }}</td>
          <td>
            <button @click="form = { ...e }">Editar</button>
            <button @click="borrar(e.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { equipoService, labService } from '@/services/api';

const equipos = ref([]);
const labs = ref([]);
const error = ref('');
const formInicial = () => ({ codigo: '', tipo: '', laboratorio_id: '', estado: 'operativo' });
const form = ref(formInicial());

async function cargar() {
  equipos.value = await equipoService.listar();
  labs.value = await labService.listar();
}

async function guardar() {
  error.value = '';
  try {
    if (form.value.id) await equipoService.editar(form.value.id, form.value);
    else await equipoService.crear(form.value);
    form.value = formInicial();
    await cargar();
  } catch (e) {
    error.value = e.message || 'No se pudo guardar el equipo.';
  }
}

async function borrar(id) {
  if (!confirm('¿Seguro que deseas eliminar este equipo?')) return;
  error.value = '';
  try {
    await equipoService.eliminar(id);
    await cargar();
  } catch (e) {
    error.value = e.message || 'No se pudo eliminar el equipo.';
  }
}

onMounted(cargar);
</script>

<style scoped>
.error-msg {
  color: #721c24;
  background: #f8d7da;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin: 0.75rem 0;
}
</style>