<template>
  <section>
    <h2>Gestión de Laboratorios</h2>
    <form @submit.prevent="guardar">
      <input v-model="form.nombre" placeholder="Nombre" required />
      <input v-model="form.ubicacion" placeholder="Ubicación" required />
      <input v-model.number="form.capacidad" type="number" min="1" placeholder="Capacidad" required />
      <input v-model="form.software" placeholder="Software instalado" />
      <input v-model="form.foto" placeholder="URL de foto (opcional)" />
      <select v-model="form.estado">
        <option value="disponible">Disponible</option>
        <option value="mantenimiento">En mantenimiento</option>
      </select>
      <button type="submit">{{ form.id ? 'Actualizar' : 'Crear' }}</button>
    </form>

    <p v-if="error" class="error-msg">{{ error }}</p>

    <table>
      <thead>
        <tr><th>Nombre</th><th>Ubicación</th><th>Capacidad</th><th>Estado</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        <tr v-for="l in labs" :key="l.id">
          <td>{{ l.nombre }}</td>
          <td>{{ l.ubicacion }}</td>
          <td>{{ l.capacidad }}</td>
          <td>{{ l.estado }}</td>
          <td>
            <button @click="form = { ...l }">Editar</button>
            <button @click="borrar(l.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { labService } from '@/services/api';

const labs = ref([]);
const error = ref('');
const formInicial = () => ({ nombre: '', ubicacion: '', capacidad: 20, software: '', foto: '', estado: 'disponible' });
const form = ref(formInicial());

async function cargar() {
  labs.value = await labService.listar();
}

async function guardar() {
  error.value = '';
  try {
    if (form.value.id) await labService.editar(form.value.id, form.value);
    else await labService.crear(form.value);
    form.value = formInicial();
    await cargar();
  } catch (e) {
    error.value = e.message || 'No se pudo guardar el laboratorio.';
  }
}

async function borrar(id) {
  if (!confirm('¿Seguro que deseas eliminar este laboratorio y sus registros asociados?')) return;
  error.value = '';
  try {
    await labService.eliminar(id);
    await cargar();
  } catch (e) {
    error.value = e.message || 'No se pudo eliminar el laboratorio.';
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