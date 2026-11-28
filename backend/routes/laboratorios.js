import { Router } from 'express';
import db from '../db/database.js';
import { verificarToken, permitirRoles } from '../middleware/auth.js';

const router = Router();

// Listar todos
router.get('/', verificarToken, (req, res) => {
  const labs = db.prepare('SELECT * FROM laboratorios').all();
  res.json(labs);
});

// Crear
router.post('/', verificarToken, permitirRoles('admin'), (req, res) => {
  const { nombre, ubicacion, capacidad, software, foto, estado } = req.body;
  const cap = Number(capacidad);
  const estadoFinal = estado || 'disponible';

  if (!nombre?.trim() || !ubicacion?.trim()) {
    return res.status(400).json({ error: 'Nombre y ubicación son obligatorios' });
  }
  if (!Number.isInteger(cap) || cap <= 0) {
    return res.status(400).json({ error: 'La capacidad debe ser un número entero mayor a 0' });
  }
  if (!['disponible', 'mantenimiento'].includes(estadoFinal)) {
    return res.status(400).json({ error: 'Estado de laboratorio inválido' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO laboratorios (nombre, ubicacion, capacidad, software, foto, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nombre.trim(), ubicacion.trim(), cap, software || '', foto || '', estadoFinal);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'No se pudo crear el laboratorio' });
  }
});

// Editar
router.put('/:id', verificarToken, permitirRoles('admin'), (req, res) => {
  const { nombre, ubicacion, capacidad, software, foto, estado } = req.body;
  const cap = Number(capacidad);

  if (!nombre?.trim() || !ubicacion?.trim()) {
    return res.status(400).json({ error: 'Nombre y ubicación son obligatorios' });
  }
  if (!Number.isInteger(cap) || cap <= 0) {
    return res.status(400).json({ error: 'La capacidad debe ser un número entero mayor a 0' });
  }
  if (!['disponible', 'mantenimiento'].includes(estado)) {
    return res.status(400).json({ error: 'Estado de laboratorio inválido' });
  }

  try {
    const info = db.prepare(`
      UPDATE laboratorios
      SET nombre = ?, ubicacion = ?, capacidad = ?, software = ?, foto = ?, estado = ?
      WHERE id = ?
    `).run(nombre.trim(), ubicacion.trim(), cap, software || '', foto || '', estado, req.params.id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Laboratorio no encontrado' });
    }
    res.json({ mensaje: 'Laboratorio actualizado' });
  } catch {
    res.status(400).json({ error: 'No se pudo actualizar el laboratorio' });
  }
});

// Eliminar
router.delete('/:id', verificarToken, permitirRoles('admin'), (req, res) => {
  const labId = req.params.id;

  try {
    const eliminarLabEnCascada = db.transaction((id) => {
      db.prepare(`
        DELETE FROM incidencias
        WHERE equipo_id IN (SELECT id FROM equipos WHERE laboratorio_id = ?)
      `).run(id);

      db.prepare(`
        DELETE FROM reservas
        WHERE laboratorio_id = ?
           OR equipo_id IN (SELECT id FROM equipos WHERE laboratorio_id = ?)
      `).run(id, id);

      db.prepare('DELETE FROM horarios_bloqueos WHERE laboratorio_id = ?').run(id);
      db.prepare('DELETE FROM equipos WHERE laboratorio_id = ?').run(id);

      return db.prepare('DELETE FROM laboratorios WHERE id = ?').run(id);
    });

    const info = eliminarLabEnCascada(labId);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Laboratorio no encontrado' });
    }
    res.json({ mensaje: 'Laboratorio y sus registros asociados eliminados' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el laboratorio' });
  }
});

export default router;