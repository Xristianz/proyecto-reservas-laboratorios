import { Router } from 'express';
import db from '../db/database.js';
import { verificarToken, permitirRoles } from '../middleware/auth.js';

const router = Router();

// Listar equipos con el nombre de su laboratorio
router.get('/', verificarToken, (req, res) => {
  const equipos = db.prepare(`
    SELECT e.*, l.nombre AS laboratorio_nombre
    FROM equipos e
    JOIN laboratorios l ON e.laboratorio_id = l.id
  `).all();
  res.json(equipos);
});

// Crear equipo (solo admin)
router.post('/', verificarToken, permitirRoles('admin'), (req, res) => {
  const { codigo, tipo, laboratorio_id, estado } = req.body;
  const estadoFinal = estado || 'operativo';

  if (!codigo?.trim() || !tipo?.trim() || !laboratorio_id) {
    return res.status(400).json({ error: 'Código, tipo y laboratorio son obligatorios' });
  }
  if (!['operativo', 'danado', 'en_reparacion'].includes(estadoFinal)) {
    return res.status(400).json({ error: 'Estado de equipo inválido' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO equipos (codigo, tipo, laboratorio_id, estado) VALUES (?, ?, ?, ?)
    `).run(codigo.trim(), tipo.trim(), laboratorio_id, estadoFinal);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'El código de equipo ya existe' });
    }
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(400).json({ error: 'El laboratorio seleccionado no es válido' });
    }
    res.status(400).json({ error: 'No se pudo crear el equipo' });
  }
});

// Editar equipo (solo admin)
router.put('/:id', verificarToken, permitirRoles('admin'), (req, res) => {
  const { codigo, tipo, laboratorio_id, estado } = req.body;

  if (!codigo?.trim() || !tipo?.trim() || !laboratorio_id) {
    return res.status(400).json({ error: 'Código, tipo y laboratorio son obligatorios' });
  }
  if (!['operativo', 'danado', 'en_reparacion'].includes(estado)) {
    return res.status(400).json({ error: 'Estado de equipo inválido' });
  }

  try {
    const info = db.prepare(`
      UPDATE equipos SET codigo = ?, tipo = ?, laboratorio_id = ?, estado = ? WHERE id = ?
    `).run(codigo.trim(), tipo.trim(), laboratorio_id, estado, req.params.id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.json({ mensaje: 'Equipo actualizado' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Ese código ya pertenece a otro equipo' });
    }
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(400).json({ error: 'El laboratorio seleccionado no es válido' });
    }
    res.status(400).json({ error: 'No se pudo actualizar el equipo' });
  }
});

// Eliminar equipo (solo admin)
router.delete('/:id', verificarToken, permitirRoles('admin'), (req, res) => {
  try {
    const info = db.prepare('DELETE FROM equipos WHERE id = ?').run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.json({ mensaje: 'Equipo eliminado' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(400).json({
        error: 'No se puede eliminar el equipo porque tiene reservas o incidencias asociadas',
      });
    }
    res.status(500).json({ error: 'Error al eliminar el equipo' });
  }
});

export default router;