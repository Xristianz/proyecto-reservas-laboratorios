import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { verificarToken, permitirRoles } from '../middleware/auth.js';

const router = Router();

// Listar docentes y estudiantes
router.get('/', verificarToken, permitirRoles('admin'), (req, res) => {
  const users = db.prepare(
    "SELECT id, nombre, email, rol FROM usuarios WHERE rol IN ('docente', 'estudiante')"
  ).all();
  res.json(users);
});

// Crear docente o estudiante
router.post('/', verificarToken, permitirRoles('admin'), (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!['docente', 'estudiante'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)'
    ).run(nombre.trim(), email.trim(), hash, rol);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Ese correo ya está registrado' });
    }
    res.status(400).json({ error: 'No se pudo crear el usuario' });
  }
});

// Editar usuario
router.put('/:id', verificarToken, permitirRoles('admin'), (req, res) => {
  const { nombre, email, rol } = req.body;

  if (!nombre?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
  }
  if (!['docente', 'estudiante'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  try {
    const info = db.prepare(
      'UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?'
    ).run(nombre.trim(), email.trim(), rol, req.params.id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario actualizado' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Ese correo ya está registrado por otro usuario' });
    }
    res.status(400).json({ error: 'No se pudo actualizar el usuario' });
  }
});

// Eliminar usuario
router.delete('/:id', verificarToken, permitirRoles('admin'), (req, res) => {
  try {
    const info = db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(400).json({
        error: 'No se puede eliminar el usuario porque tiene reservas, incidencias o notificaciones asociadas',
      });
    }
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

export default router;