CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT CHECK(rol IN ('admin', 'docente', 'estudiante')) NOT NULL
);

CREATE TABLE IF NOT EXISTS laboratorios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  capacidad INTEGER NOT NULL,
  software TEXT,
  foto TEXT,
  estado TEXT CHECK(estado IN ('disponible', 'mantenimiento')) DEFAULT 'disponible'
);

CREATE TABLE IF NOT EXISTS equipos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL,
  laboratorio_id INTEGER NOT NULL,
  estado TEXT CHECK(estado IN ('operativo', 'danado', 'en_reparacion')) DEFAULT 'operativo',
  FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS horarios_bloqueos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  laboratorio_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,         -- 'YYYY-MM-DD'
  dia_semana INTEGER NOT NULL, -- 1 (Lunes) a 6 (Sábado)
  hora_inicio TEXT NOT NULL,   -- ej: '08:00'
  hora_fin TEXT NOT NULL,      -- ej: '10:00'
  tipo TEXT CHECK(tipo IN ('atencion', 'bloqueo')) NOT NULL,
  motivo TEXT,                 -- ej: 'Clase fija', 'Mantenimiento'
  FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  laboratorio_id INTEGER NOT NULL,
  equipo_id INTEGER,           -- NULL si es docente reservando lab completo
  fecha TEXT NOT NULL,         -- 'YYYY-MM-DD'
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  asignatura TEXT,
  motivo TEXT,
  mensaje_admin TEXT,
  estado TEXT CHECK(estado IN ('Pendiente', 'Aprobada', 'Rechazada', 'Cancelada', 'Finalizada')) NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id),
  FOREIGN KEY (equipo_id) REFERENCES equipos(id)
);

CREATE TABLE IF NOT EXISTS incidencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipo_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad TEXT CHECK(prioridad IN ('baja', 'media', 'alta')) NOT NULL,
  estado TEXT CHECK(estado IN ('Abierta', 'En proceso', 'Resuelta')) DEFAULT 'Abierta',
  fecha_reporte TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipo_id) REFERENCES equipos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  mensaje TEXT NOT NULL,
  leida INTEGER DEFAULT 0,
  fecha TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);