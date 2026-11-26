import bcrypt from 'bcryptjs';
import db from './database.js';

const hash = bcrypt.hashSync('123456', 10);


const insertUser = db.prepare(`
  INSERT OR IGNORE INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)
`);
insertUser.run('Admin UPS', 'admin@ups.edu.ec', hash, 'admin');
insertUser.run('Ing. Cristian Docente', 'docente@ups.edu.ec', hash, 'docente');
insertUser.run('Juan Estudiante', 'estudiante@ups.edu.ec', hash, 'estudiante');


const insertLab = db.prepare(`
  INSERT OR IGNORE INTO laboratorios (id, nombre, ubicacion, capacidad, software, estado)
  VALUES (?, ?, ?, ?, ?, ?)
`);
insertLab.run(1, 'Lab Redes y Web', 'Edificio B - Piso 2', 20, 'VS Code, Node.js, Packet Tracer', 'disponible');

const insertEquipo = db.prepare(`
  INSERT OR IGNORE INTO equipos (codigo, tipo, laboratorio_id, estado) VALUES (?, ?, ?, ?)
`);
insertEquipo.run('PC-LAB1-01', 'Computadora', 1, 'operativo');
insertEquipo.run('PC-LAB1-02', 'Computadora', 1, 'operativo');

console.log('Datos semilla (seed) cargados con éxito.');