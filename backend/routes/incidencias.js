import { Router } from 'express';
import db from '../db/database.js';
import { verificarToken, permitirRoles } from '../middleware/auth.js';

const router = Router();

// Listar incidencias
router.get('/', verificarToken, (req, res) => {
  const baseQuery = `
    SELECT i.*, e.codigo AS equipo_codigo, e.estado AS equipo_estado,
           l.nombre AS laboratorio_nombre, u.nombre AS reportado_por
    FROM incidencias i
    JOIN equipos e ON i.equipo_id = e.id
    JOIN laboratorios l ON e.laboratorio_id = l.id
    JOIN usuarios u ON i.usuario_id = u.id
  `;

  if (req.usuario.rol === 'admin') {
    return res.json(db.prepare(`${baseQuery} ORDER BY i.fecha_reporte DESC`).all());
  }

  const mias = db.prepare(`${baseQuery} WHERE i.usuario_id = ? ORDER BY i.fecha_reporte DESC`)
    .all(req.usuario.id);
  res.json(mias);
});

// Reportar daño en un equipo
router.post('/', verificarToken, permitirRoles('docente', 'estudiante'), (req, res) => {
  const { equipo_id, descripcion, prioridad } = req.body;

  const equipo = db.prepare('SELECT * FROM equipos WHERE id = ?').get(equipo_id);
  if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });

  const info = db.prepare(`
    INSERT INTO incidencias (equipo_id, usuario_id, descripcion, prioridad)
    VALUES (?, ?, ?, ?)
  `).run(equipo_id, req.usuario.id, descripcion, prioridad);

  const admins = db.prepare("SELECT id FROM usuarios WHERE rol = 'admin'").all();
  const insertNotif = db.prepare('INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)');
  for (const a of admins) {
    insertNotif.run(a.id, `Nueva incidencia (${prioridad}) en equipo ${equipo.codigo}: ${descripcion}`);
  }

  res.status(201).json({ id: info.lastInsertRowid });
});

// Actualizar estado de la incidencia Y del equipo (solo Admin)
router.patch('/:id', verificarToken, permitirRoles('admin'), (req, res) => {
  const { estado, estado_equipo } = req.body;

  const inc = db.prepare('SELECT * FROM incidencias WHERE id = ?').get(req.params.id);
  if (!inc) return res.status(404).json({ error: 'Incidencia no encontrada' });

  db.prepare('UPDATE incidencias SET estado = ? WHERE id = ?').run(estado, req.params.id);

  if (estado_equipo) {
    db.prepare('UPDATE equipos SET estado = ? WHERE id = ?').run(estado_equipo, inc.equipo_id);
  }

  db.prepare('INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)').run(
    inc.usuario_id,
    `Tu incidencia #${inc.id} cambió a "${estado}" (Equipo: ${estado_equipo || 'sin cambio'}).`
  );

  res.json({ mensaje: 'Incidencia y equipo actualizados' });
});

export default router;