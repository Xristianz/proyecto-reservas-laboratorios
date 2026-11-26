import fs from 'fs';
import db from './database.js';

const schema = fs.readFileSync('./db/schema.sql', 'utf-8');
db.exec(schema);
console.log('Base de datos y tablas creadas correctamente.');