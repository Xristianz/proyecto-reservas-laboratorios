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

// Listar reservas
router.get('/', verificarToken, (req, res) => {
  const baseQuery = `
    SELECT r.*, u.nombre AS usuario_nombre, u.rol AS usuario_rol,
           l.nombre AS laboratorio_nombre, e.codigo AS equipo_codigo
    FROM reservas r
    JOIN usuarios u ON r.usuario_id = u.id
    JOIN laboratorios l ON r.laboratorio_id = l.id
    LEFT JOIN equipos e ON r.equipo_id = e.id
  `;

  if (req.usuario.rol === 'admin') {
    const todas = db.prepare(`${baseQuery} ORDER BY r.fecha DESC, r.hora_inicio DESC`).all();
    return res.json(todas);
  }

  const mias = db.prepare(
    `${baseQuery} WHERE r.usuario_id = ? ORDER BY r.fecha DESC, r.hora_inicio DESC`
  ).all(req.usuario.id);
  res.json(mias);
});

// Crear solicitud de laboratorio
router.post('/', verificarToken, permitirRoles('docente'), (req, res) => {
  const { laboratorio_id, fecha, hora_inicio, hora_fin, asignatura, motivo } = req.body;
  const { fechaHoy, horaActual } = obtenerFechaHoraLocal();

  if (hora_inicio >= hora_fin) {
    return res.status(400).json({ error: 'La hora de inicio debe ser menor a la de fin' });
  }
  if (fecha < fechaHoy || (fecha === fechaHoy && hora_inicio <= horaActual)) {
    return res.status(400).json({ error: 'No puedes reservar en fechas u horarios pasados' });
  }

  const lab = db.prepare('SELECT * FROM laboratorios WHERE id = ?').get(laboratorio_id);
  if (!lab || lab.estado !== 'disponible') {
    return res.status(400).json({ error: 'El laboratorio no está disponible' });
  }

  const bloqueo = db.prepare(`
    SELECT * FROM horarios_bloqueos
    WHERE laboratorio_id = ? AND fecha = ? AND tipo = 'bloqueo'
      AND hora_inicio < ? AND hora_fin > ?
  `).get(laboratorio_id, fecha, hora_fin, hora_inicio);

  if (bloqueo) {
    return res.status(400).json({ error: `Franja bloqueada: ${bloqueo.motivo || 'No disponible'}` });
  }

  const solape = db.prepare(`
    SELECT id FROM reservas
    WHERE laboratorio_id = ? AND fecha = ? AND estado = 'Aprobada'
      AND hora_inicio < ? AND hora_fin > ?
  `).get(laboratorio_id, fecha, hora_fin, hora_inicio);

  if (solape) {
    return res.status(400).json({ error: 'Ya existe una reserva aprobada en ese horario' });
  }

  const info = db.prepare(`
    INSERT INTO reservas (usuario_id, laboratorio_id, equipo_id, fecha, hora_inicio, hora_fin, asignatura, motivo, estado)
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'Pendiente')
  `).run(req.usuario.id, laboratorio_id, fecha, hora_inicio, hora_fin, asignatura || '', motivo || '');

  const admins = db.prepare("SELECT id FROM usuarios WHERE rol = 'admin'").all();
  const insertNotif = db.prepare('INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)');
  for (const a of admins) {
    insertNotif.run(a.id, `Nueva solicitud de ${req.usuario.nombre} para ${lab.nombre} (${fecha})`);
  }

  res.status(201).json({ id: info.lastInsertRowid, estado: 'Pendiente' });
});

// Aprobar/rechazar solicitud
router.patch('/:id/resolver', verificarToken, permitirRoles('admin'), (req, res) => {
  const { estado, mensaje_admin } = req.body;
  if (!['Aprobada', 'Rechazada'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);
  if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

  if (reserva.estado !== 'Pendiente') {
    return res.status(400).json({ error: 'Solo se pueden resolver solicitudes en estado Pendiente' });
  }

  if (estado === 'Aprobada') {
    const { fechaHoy, horaActual } = obtenerFechaHoraLocal();
    if (
      reserva.fecha < fechaHoy ||
      (reserva.fecha === fechaHoy && reserva.hora_inicio <= horaActual)
    ) {
      return res.status(400).json({
        error: 'No se puede aprobar una solicitud cuya fecha u horario ya pasó',
      });
    }

    const lab = db.prepare('SELECT * FROM laboratorios WHERE id = ?').get(reserva.laboratorio_id);
    if (!lab || lab.estado !== 'disponible') {
      return res.status(400).json({ error: 'El laboratorio no está disponible actualmente' });
    }

    const bloqueo = db.prepare(`
      SELECT motivo FROM horarios_bloqueos
      WHERE laboratorio_id = ? AND fecha = ? AND tipo = 'bloqueo'
        AND hora_inicio < ? AND hora_fin > ?
    `).get(reserva.laboratorio_id, reserva.fecha, reserva.hora_fin, reserva.hora_inicio);

    if (bloqueo) {
      return res.status(400).json({
        error: `No se puede aprobar: franja bloqueada (${bloqueo.motivo || 'No disponible'})`,
      });
    }

    const conflicto = db.prepare(`
      SELECT id FROM reservas
      WHERE laboratorio_id = ? AND fecha = ? AND estado = 'Aprobada'
        AND id != ?
        AND hora_inicio < ? AND hora_fin > ?
    `).get(
      reserva.laboratorio_id,
      reserva.fecha,
      reserva.id,
      reserva.hora_fin,
      reserva.hora_inicio
    );

    if (conflicto) {
      return res.status(400).json({
        error: 'No se puede aprobar: ya existe otra reserva aprobada en esa fecha y horario',
      });
    }
  }

  db.prepare('UPDATE reservas SET estado = ?, mensaje_admin = ? WHERE id = ?')
    .run(estado, mensaje_admin || '', req.params.id);

  db.prepare('INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)').run(
    reserva.usuario_id,
    `Tu solicitud del ${reserva.fecha} fue ${estado}. ${mensaje_admin ? 'Mensaje: ' + mensaje_admin : ''}`
  );

  res.json({ mensaje: `Reserva ${estado}` });
});

// Cancelar reserva
router.patch('/:id/cancelar', verificarToken, (req, res) => {
  const reserva = db.prepare('SELECT * FROM reservas WHERE id = ? AND usuario_id = ?')
    .get(req.params.id, req.usuario.id);

  if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
  if (!['Pendiente', 'Aprobada'].includes(reserva.estado)) {
    return res.status(400).json({ error: 'Solo se pueden cancelar reservas Pendientes o Aprobadas' });
  }

  const { fechaHoy, horaActual } = obtenerFechaHoraLocal();
  if (reserva.fecha < fechaHoy || (reserva.fecha === fechaHoy && reserva.hora_inicio <= horaActual)) {
    return res.status(400).json({ error: 'No puedes cancelar una reserva que ya inició' });
  }

  db.prepare("UPDATE reservas SET estado = 'Cancelada' WHERE id = ?").run(req.params.id);
  res.json({ mensaje: 'Reserva cancelada' });
});

export default router;