import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { q, nuevoTokenQR } from '../db.js';
import { requiere, firmarArchivo } from '../auth.js';
import { h, validar, fecha, TIPOS_EVENTO, CATEGORIAS_DOC, baseUrl, pacienteDTO, historialDTO, documentoDTO } from '../util.js';

const r = Router();
r.use(requiere('paciente'));

const MAX_MB = 8;
const MAX_TOTAL_MB = 40;
const subir = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_MB * 1024 * 1024 } });

const texto = (max) => z.string().trim().max(max);
const lista = z.array(z.string().trim().min(1).max(120)).max(40);

const perfil = z
  .object({
    nombres: texto(80),
    apellidos: texto(80),
    documento: texto(40),
    fechaNacimiento: z.union([fecha, z.literal('')]),
    sexo: z.enum(['M', 'F', 'O', '']),
    tipoSangre: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '?']),
    pesoKg: texto(10),
    alturaCm: texto(10),
    alergias: lista,
    condiciones: lista,
    dispositivos: lista,
    vacunas: lista,
    medicamentos: z
      .array(z.object({ nombre: texto(100).min(1), dosis: texto(60), frecuencia: texto(80) }))
      .max(40),
    contactos: z
      .array(z.object({ nombre: texto(100), relacion: texto(40), telefono: texto(30) }))
      .max(10),
    medicoNombre: texto(120),
    medicoTelefono: texto(30),
    seguro: texto(150),
    donante: z.boolean().nullable(),
    notas: texto(1000),
    // la app lo manda en true al terminar el registro guiado
    completar: z.boolean().optional(),
  })
  .partial();

const COLUMNAS = {
  nombres: 'nombres',
  apellidos: 'apellidos',
  documento: 'documento',
  fechaNacimiento: 'fecha_nacimiento',
  sexo: 'sexo',
  tipoSangre: 'tipo_sangre',
  pesoKg: 'peso_kg',
  alturaCm: 'altura_cm',
  alergias: 'alergias',
  condiciones: 'condiciones',
  medicamentos: 'medicamentos',
  dispositivos: 'dispositivos',
  vacunas: 'vacunas',
  contactos: 'contactos',
  medicoNombre: 'medico_nombre',
  medicoTelefono: 'medico_telefono',
  seguro: 'seguro',
  donante: 'donante',
  notas: 'notas',
};
const JSONB = new Set(['alergias', 'condiciones', 'medicamentos', 'dispositivos', 'vacunas', 'contactos']);

async function cargarPerfil(id) {
  return (await q(`SELECT * FROM pacientes WHERE usuario_id = $1`, [id])).rows[0];
}

r.get(
  '/perfil',
  h(async (req, res) => {
    const p = await cargarPerfil(req.usuario.id);
    if (!p) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json(pacienteDTO(p));
  }),
);

/** Actualización parcial: solo cambia lo que llega */
r.put(
  '/perfil',
  h(async (req, res) => {
    const d = validar(perfil, req.body, res);
    if (!d) return;

    const sets = [];
    const vals = [];
    for (const [k, col] of Object.entries(COLUMNAS)) {
      if (d[k] === undefined) continue;
      let v = d[k];
      if (JSONB.has(k)) v = JSON.stringify(v);
      if (k === 'fechaNacimiento' && v === '') v = null;
      if (k === 'contactos') v = JSON.stringify(d.contactos.filter((c) => c.nombre || c.telefono));
      vals.push(v);
      sets.push(`${col} = $${vals.length}`);
    }

    if (d.completar) {
      const actual = { ...pacienteDTO(await cargarPerfil(req.usuario.id)), ...d };
      if (!actual.nombres?.trim() || !actual.apellidos?.trim())
        return res.status(400).json({ error: 'Para terminar necesitas al menos nombres y apellidos' });
      sets.push('perfil_completo = true');
    }

    if (sets.length) {
      vals.push(req.usuario.id);
      await q(`UPDATE pacientes SET ${sets.join(', ')}, actualizado = now() WHERE usuario_id = $${vals.length}`, vals);
    }
    res.json(pacienteDTO(await cargarPerfil(req.usuario.id)));
  }),
);

// ---------- QR ----------
r.get(
  '/qr',
  h(async (req, res) => {
    const p = await cargarPerfil(req.usuario.id);
    res.json({ contenido: `${baseUrl(req)}/qr/${p.qr_token}` });
  }),
);

/** Genera un QR nuevo: el anterior deja de funcionar (por si lo pierdes) */
r.post(
  '/qr/regenerar',
  h(async (req, res) => {
    const token = nuevoTokenQR();
    await q(`UPDATE pacientes SET qr_token = $1 WHERE usuario_id = $2`, [token, req.usuario.id]);
    res.json({ contenido: `${baseUrl(req)}/qr/${token}` });
  }),
);

// ---------- Historial ----------
const SQL_HISTORIAL = `
  SELECT h.*, m.nombres AS medico_nombres, m.apellidos AS medico_apellidos
  FROM historial h LEFT JOIN medicos m ON m.usuario_id = h.medico_id
  WHERE h.paciente_id = $1 ORDER BY h.fecha DESC, h.creado_en DESC`;

r.get(
  '/historial',
  h(async (req, res) => {
    res.json((await q(SQL_HISTORIAL, [req.usuario.id])).rows.map(historialDTO));
  }),
);

export const eventoSchema = z.object({
  fecha,
  tipo: z.enum(TIPOS_EVENTO),
  descripcion: z.string().trim().min(3, 'describe qué pasó').max(1000),
  centro: z.string().trim().max(150).optional().default(''),
});

r.post(
  '/historial',
  h(async (req, res) => {
    const d = validar(eventoSchema, req.body, res);
    if (!d) return;
    await q(`INSERT INTO historial(paciente_id,fecha,tipo,descripcion,centro) VALUES ($1,$2,$3,$4,$5)`, [
      req.usuario.id,
      d.fecha,
      d.tipo,
      d.descripcion,
      d.centro,
    ]);
    res.status(201).json((await q(SQL_HISTORIAL, [req.usuario.id])).rows.map(historialDTO));
  }),
);

r.delete(
  '/historial/:id',
  h(async (req, res) => {
    // El paciente solo puede borrar lo que él mismo registró, no lo que puso un médico
    const del = await q(`DELETE FROM historial WHERE id = $1 AND paciente_id = $2 AND medico_id IS NULL`, [
      req.params.id,
      req.usuario.id,
    ]);
    if (!del.rowCount) return res.status(403).json({ error: 'No se puede borrar (o lo registró un médico)' });
    res.status(204).end();
  }),
);

// ---------- Documentos ----------
r.get(
  '/documentos',
  h(async (req, res) => {
    const rows = (
      await q(
        `SELECT id,nombre,categoria,mime,tamano,creado_en FROM documentos WHERE paciente_id = $1 ORDER BY creado_en DESC`,
        [req.usuario.id],
      )
    ).rows;
    res.json(rows.map(documentoDTO));
  }),
);

r.post(
  '/documentos',
  subir.single('archivo'),
  h(async (req, res) => {
    const f = req.file;
    if (!f) return res.status(400).json({ error: 'No llegó ningún archivo' });
    if (!/^image\/|^application\/pdf$/.test(f.mimetype))
      return res.status(400).json({ error: 'Solo se aceptan imágenes o PDF' });

    const categoria = CATEGORIAS_DOC.includes(req.body.categoria) ? req.body.categoria : 'Otro';
    const nombre = String(req.body.nombre || f.originalname || 'Documento').trim().slice(0, 120);

    const usado = (await q(`SELECT COALESCE(SUM(tamano),0)::int AS t FROM documentos WHERE paciente_id = $1`, [req.usuario.id]))
      .rows[0].t;
    if (usado + f.size > MAX_TOTAL_MB * 1024 * 1024)
      return res.status(400).json({ error: `Llegaste al límite de ${MAX_TOTAL_MB} MB en documentos` });

    const row = (
      await q(
        `INSERT INTO documentos(paciente_id,nombre,categoria,mime,tamano,datos) VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id,nombre,categoria,mime,tamano,creado_en`,
        [req.usuario.id, nombre, categoria, f.mimetype, f.size, f.buffer],
      )
    ).rows[0];
    res.status(201).json(documentoDTO(row));
  }),
);

r.delete(
  '/documentos/:id',
  h(async (req, res) => {
    await q(`DELETE FROM documentos WHERE id = $1 AND paciente_id = $2`, [req.params.id, req.usuario.id]);
    res.status(204).end();
  }),
);

r.get(
  '/documentos/:id/enlace',
  h(async (req, res) => {
    const d = await q(`SELECT 1 FROM documentos WHERE id = $1 AND paciente_id = $2`, [req.params.id, req.usuario.id]);
    if (!d.rowCount) return res.status(404).json({ error: 'Documento no encontrado' });
    const { exp, sig } = firmarArchivo(req.params.id);
    res.json({ url: `${baseUrl(req)}/archivos/${req.params.id}?exp=${exp}&sig=${sig}` });
  }),
);

// ---------- Quién vio mi ficha ----------
r.get(
  '/accesos',
  h(async (req, res) => {
    const rows = (
      await q(
        `SELECT a.fecha, m.nombres, m.apellidos, m.especialidad, m.centro, m.matricula
         FROM accesos a JOIN medicos m ON m.usuario_id = a.medico_id
         WHERE a.paciente_id = $1 ORDER BY a.fecha DESC LIMIT 50`,
        [req.usuario.id],
      )
    ).rows;
    res.json(
      rows.map((x) => ({
        fecha: x.fecha,
        medico: `Dr(a). ${x.nombres} ${x.apellidos}`,
        especialidad: x.especialidad,
        centro: x.centro,
        matricula: x.matricula,
      })),
    );
  }),
);

export default r;
