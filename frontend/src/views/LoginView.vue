<template>
    <main class="login-box">
        <h1>Reserva de Laboratorios</h1>
        <form @submit.prevent="iniciarSesion">
            <input v-model="email" type="email" placeholder="Correo institucional" required />
            <input v-model="password" type="password" placeholder="Contraseña" required />
            <button type="submit">Ingresar</button>
            <p v-if="error" class="error">{{ error }}</p>
        </form>
    </main>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const email = ref('');
const password = ref('');
const error = ref('');
const auth = useAuthStore();
const router = useRouter();

async function iniciarSesion() {
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    router.push(`/${auth.usuario.rol}`);
  } catch (e) {
    error.value = e.message;
  }
}
</script>