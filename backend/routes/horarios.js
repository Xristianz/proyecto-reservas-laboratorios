import { Router } from 'express';
import db from '../db/database.js';
import { verificarToken, permitirRoles } from '../middleware/auth.js';

const router = Router();

function obtenerFechaHoraLocal() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const hora = String(ahora.getHours()).padStart(2, '0');
  const min = String(ahora.getMinutes()).padStart(2, '0');
  return { fechaHoy: `${anio}-${mes}-${dia}`, horaActual: `${hora}:${min}` };
}

function obtenerDiaSemana(fechaStr) {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(anio, mes - 1, dia).getDay();
}

// Obtener horarios, bloqueos y reservas de un laboratorio para una semana
router.get('/:laboratorioId', verificarToken, (req, res) => {
  const { laboratorioId } = req.params;
  const { inicio, fin } = req.query;
  const { fechaHoy, horaActual } = obtenerFechaHoraLocal();

  db.prepare(`
    UPDATE reservas
    SET estado = 'Finalizada'
    WHERE estado = 'Aprobada'
      AND (fecha < ? OR (fecha = ? AND hora_fin <= ?))
  `).run(fechaHoy, fechaHoy, horaActual);

  let franjas = [];
  if (inicio && fin) {
    franjas = db.prepare(`
      SELECT * FROM horarios_bloqueos
      WHERE laboratorio_id = ?
        AND fecha BETWEEN ? AND ?
      ORDER BY fecha, hora_inicio
    `).all(laboratorioId, inicio, fin);
  } else {
    franjas = db.prepare(`
      SELECT * FROM horarios_bloqueos
      WHERE laboratorio_id = ?
      ORDER BY fecha, hora_inicio
    `).all(laboratorioId);
  }

  let reservas = [];
  if (inicio && fin) {
    reservas = db.prepare(`
      SELECT r.id, r.fecha, r.hora_inicio, r.hora_fin, r.estado, r.equipo_id,
             u.nombre AS usuario_nombre, e.codigo AS equipo_codigo
      FROM reservas r
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN equipos e ON r.equipo_id = e.id
      WHERE r.laboratorio_id = ?
        AND r.fecha BETWEEN ? AND ?
        AND r.estado IN ('Aprobada', 'Pendiente')
      ORDER BY r.fecha, r.hora_inicio
    `).all(laboratorioId, inicio, fin);
  }

  res.json({ franjas, reservas });
});

// Crear franja de atención o bloqueo (solo admin)
router.post('/', verificarToken, permitirRoles('admin'), (req, res) => {
  const { laboratorio_id, fecha, hora_inicio, hora_fin, tipo, motivo } = req.body;

  if (!laboratorio_id) {
    return res.status(400).json({ error: 'Debe seleccionar un laboratorio' });
  }

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ error: 'Debe seleccionar una fecha válida' });
  }

  if (hora_inicio >= hora_fin) {
    return res.status(400).json({ error: 'La hora de inicio debe ser menor a la hora de fin' });
  }

  const { fechaHoy, horaActual } = obtenerFechaHoraLocal();
  if (fecha < fechaHoy || (fecha === fechaHoy && hora_inicio <= horaActual)) {
    return res.status(400).json({
      error: 'No se pueden asignar franjas ni bloqueos en fechas u horarios pasados',
    });
  }

  const dia_semana = obtenerDiaSemana(fecha);
  if (dia_semana === 0) {
    return res.status(400).json({ error: 'No se pueden asignar franjas ni bloqueos los domingos' });
  }

  const solape = db.prepare(`
    SELECT id FROM horarios_bloqueos
    WHERE laboratorio_id = ? AND fecha = ?
      AND hora_inicio < ? AND hora_fin > ?
  `).get(laboratorio_id, fecha, hora_fin, hora_inicio);

  if (solape) {
    return res.status(400).json({ error: 'Ya existe una franja o bloqueo en esa fecha y horario' });
  }

  const info = db.prepare(`
    INSERT INTO horarios_bloqueos (laboratorio_id, fecha, dia_semana, hora_inicio, hora_fin, tipo, motivo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(laboratorio_id, fecha, dia_semana, hora_inicio, hora_fin, tipo, motivo || '');

  res.status(201).json({ id: info.lastInsertRowid });
});

// Eliminar franja o bloqueo (solo admin)
router.delete('/:id', verificarToken, permitirRoles('admin'), (req, res) => {
  db.prepare('DELETE FROM horarios_bloqueos WHERE id = ?').run(req.params.id);
  res.json({ mensaje: 'Horario eliminado' });
});

export default router;