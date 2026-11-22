import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool, q, nuevoTokenQR } from '../db.js';
import { firmarToken, requiere } from '../auth.js';
import { h, validar } from '../util.js';

const r = Router();

const base = {
  email: z.string().trim().toLowerCase().email('correo inválido'),
  password: z.string().min(6, 'mínimo 6 caracteres').max(100),
};

const registroPaciente = z.object({ ...base, rol: z.literal('paciente') });
const registroMedico = z.object({
  ...base,
  rol: z.literal('medico'),
  nombres: z.string().trim().min(1, 'obligatorio').max(80),
  apellidos: z.string().trim().min(1, 'obligatorio').max(80),
  matricula: z.string().trim().min(3, 'pon tu matrícula profesional').max(40),
  especialidad: z.string().trim().max(80).optional().default(''),
  centro: z.string().trim().max(120).optional().default(''),
  telefono: z.string().trim().max(30).optional().default(''),
});

async function datosUsuario(id) {
  const u = (await q(`SELECT id, email, rol FROM usuarios WHERE id = $1`, [id])).rows[0];
  if (!u) return null;
  if (u.rol === 'medico') {
    const m = (await q(`SELECT * FROM medicos WHERE usuario_id = $1`, [id])).rows[0];
    return { ...u, nombre: `${m.nombres} ${m.apellidos}`, medico: m };
  }
  const p = (await q(`SELECT nombres, apellidos, perfil_completo FROM pacientes WHERE usuario_id = $1`, [id])).rows[0];
  return { ...u, nombre: `${p.nombres} ${p.apellidos}`.trim(), perfilCompleto: p.perfil_completo };
}

r.post(
  '/registro',
  h(async (req, res) => {
    const esquema = req.body?.rol === 'medico' ? registroMedico : registroPaciente;
    const d = validar(esquema, req.body, res);
    if (!d) return;

    const ya = await q(`SELECT 1 FROM usuarios WHERE email = $1`, [d.email]);
    if (ya.rowCount) return res.status(409).json({ error: 'Ese correo ya está registrado' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const hash = await bcrypt.hash(d.password, 10);
      const u = (
        await client.query(`INSERT INTO usuarios(email,password_hash,rol) VALUES ($1,$2,$3) RETURNING id, rol`, [
          d.email,
          hash,
          d.rol,
        ])
      ).rows[0];
      if (d.rol === 'medico') {
        await client.query(
          `INSERT INTO medicos(usuario_id,nombres,apellidos,matricula,especialidad,centro,telefono) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [u.id, d.nombres, d.apellidos, d.matricula, d.especialidad, d.centro, d.telefono],
        );
      } else {
        await client.query(`INSERT INTO pacientes(usuario_id, qr_token) VALUES ($1,$2)`, [u.id, nuevoTokenQR()]);
      }
      await client.query('COMMIT');
      res.status(201).json({ token: firmarToken(u), usuario: await datosUsuario(u.id) });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }),
);

r.post(
  '/login',
  h(async (req, res) => {
    const d = validar(z.object(base), req.body, res);
    if (!d) return;
    const u = (await q(`SELECT id, rol, password_hash FROM usuarios WHERE email = $1`, [d.email])).rows[0];
    if (!u || !(await bcrypt.compare(d.password, u.password_hash)))
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    res.json({ token: firmarToken(u), usuario: await datosUsuario(u.id) });
  }),
);

r.get(
  '/yo',
  requiere(),
  h(async (req, res) => {
    const u = await datosUsuario(req.usuario.id);
    if (!u) return res.status(401).json({ error: 'Usuario no existe' });
    res.json(u);
  }),
);

export default r;
