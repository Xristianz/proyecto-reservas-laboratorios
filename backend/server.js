import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db/database.js';
import { SECRET } from './middleware/auth.js';
import usuarioRoutes from './routes/usuarios.js';
import labRoutes from './routes/laboratorios.js';
import equipoRoutes from './routes/equipos.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign(
    { id: user.id, nombre: user.nombre, rol: user.rol },
    SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, usuario: { id: user.id, nombre: user.nombre, rol: user.rol } });
});

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/laboratorios', labRoutes);
app.use('/api/equipos', equipoRoutes);

app.listen(3000, () => console.log('API corriendo en http://localhost:3000'));