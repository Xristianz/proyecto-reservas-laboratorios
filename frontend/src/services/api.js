const API_URL = 'http://localhost:3000/api';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la petición');
  return data;
}

export const authService = {
  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};
export const usuarioService = {
  listar: () => apiFetch('/usuarios'),
  crear: (u) => apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(u) }),
  editar: (id, u) => apiFetch(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(u) }),
  eliminar: (id) => apiFetch(`/usuarios/${id}`, { method: 'DELETE' }),
};

export const labService = {
  listar: () => apiFetch('/laboratorios'),
  crear: (lab) => apiFetch('/laboratorios', { method: 'POST', body: JSON.stringify(lab) }),
  editar: (id, lab) => apiFetch(`/laboratorios/${id}`, { method: 'PUT', body: JSON.stringify(lab) }),
  eliminar: (id) => apiFetch(`/laboratorios/${id}`, { method: 'DELETE' }),
};

export const equipoService = {
  listar: () => apiFetch('/equipos'),
  crear: (eq) => apiFetch('/equipos', { method: 'POST', body: JSON.stringify(eq) }),
  editar: (id, eq) => apiFetch(`/equipos/${id}`, { method: 'PUT', body: JSON.stringify(eq) }),
  eliminar: (id) => apiFetch(`/equipos/${id}`, { method: 'DELETE' }),
};