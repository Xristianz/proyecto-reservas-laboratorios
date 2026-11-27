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
  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)'
    ).run(nombre, email, hash, rol);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'Ese correo ya está registrado' });
  }
});

// Editar usuario
router.put('/:id', verificarToken, permitirRoles('admin'), (req, res) => {
  const { nombre, email, rol } = req.body;
  db.prepare('UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?')
    .run(nombre, email, rol, req.params.id);
  res.json({ mensaje: 'Usuario actualizado' });
});

// Eliminar usuario
router.delete('/:id', verificarToken, permitirRoles('admin'), (req, res) => {
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
  res.json({ mensaje: 'Usuario eliminado' });
});

export default router;