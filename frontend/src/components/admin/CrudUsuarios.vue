<template>
  <section>
    <h2>Gestión de Docentes y Estudiantes</h2>
    <form @submit.prevent="guardar">
      <input v-model="form.nombre" placeholder="Nombre completo" required />
      <input v-model="form.email" type="email" placeholder="Correo" required />
      <input v-if="!form.id" v-model="form.password" type="password" placeholder="Contraseña" required />
      <select v-model="form.rol">
        <option value="docente">Docente</option>
        <option value="estudiante">Estudiante</option>
      </select>
      <button type="submit">{{ form.id ? 'Actualizar' : 'Crear' }}</button>
    </form>

    <p v-if="error" class="error-msg">{{ error }}</p>

    <table>
      <thead>
        <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        <tr v-for="u in usuarios" :key="u.id">
          <td>{{ u.nombre }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.rol }}</td>
          <td>
            <button @click="form = { ...u }">Editar</button>
            <button @click="borrar(u.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usuarioService } from '@/services/api';

const usuarios = ref([]);
const error = ref('');
const formInicial = () => ({ nombre: '', email: '', password: '', rol: 'estudiante' });
const form = ref(formInicial());

async function cargar() {
  usuarios.value = await usuarioService.listar();
}

async function guardar() {
  error.value = '';
  try {
    if (form.value.id) await usuarioService.editar(form.value.id, form.value);
    else await usuarioService.crear(form.value);
    form.value = formInicial();
    await cargar();
  } catch (e) {
    error.value = e.message || 'No se pudo guardar el usuario.';
  }
}

async function borrar(id) {
  if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
  error.value = '';
  try {
    await usuarioService.eliminar(id);
    await cargar();
  } catch (e) {
    error.value = e.message || 'No se pudo eliminar el usuario.';
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