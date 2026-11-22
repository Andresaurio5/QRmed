import { Router } from 'express';
import { q } from '../db.js';
import { requiere, firmarArchivo } from '../auth.js';
import { h, validar, baseUrl, pacienteDTO, historialDTO, documentoDTO } from '../util.js';
import { eventoSchema } from './paciente.js';

const r = Router();
r.use(requiere('medico'));

/** Acepta el contenido completo del QR (https://.../qr/TOKEN) o solo el token */
function extraerToken(texto) {
  const s = String(texto || '').trim();
  const m = s.match(/\/qr\/([A-Za-z0-9_-]{10,})\/?$/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{10,}$/.test(s) ? s : null;
}

async function fichaCompleta(req, pacienteId) {
  const p = (await q(`SELECT * FROM pacientes WHERE usuario_id = $1`, [pacienteId])).rows[0];
  const historial = (
    await q(
      `SELECT h.*, m.nombres AS medico_nombres, m.apellidos AS medico_apellidos
       FROM historial h LEFT JOIN medicos m ON m.usuario_id = h.medico_id
       WHERE h.paciente_id = $1 ORDER BY h.fecha DESC, h.creado_en DESC`,
      [pacienteId],
    )
  ).rows.map(historialDTO);
  const documentos = (
    await q(
      `SELECT id,nombre,categoria,mime,tamano,creado_en FROM documentos WHERE paciente_id = $1 ORDER BY creado_en DESC`,
      [pacienteId],
    )
  ).rows.map(documentoDTO);
  return { paciente: pacienteDTO(p), historial, documentos };
}

/** Puede ver al paciente si lo escaneó alguna vez */
async function tieneAcceso(medicoId, pacienteId) {
  return (await q(`SELECT 1 FROM accesos WHERE medico_id = $1 AND paciente_id = $2 LIMIT 1`, [medicoId, pacienteId]))
    .rowCount > 0;
}

/** El médico escanea el QR → se abre la ficha y queda registrado el acceso */
r.post(
  '/escanear',
  h(async (req, res) => {
    const token = extraerToken(req.body?.qr);
    if (!token) return res.status(400).json({ error: 'Ese QR no es de QR Médico' });
    const p = (await q(`SELECT usuario_id, perfil_completo FROM pacientes WHERE qr_token = $1`, [token])).rows[0];
    if (!p) return res.status(404).json({ error: 'QR no válido o ya fue reemplazado por el paciente' });
    await q(`INSERT INTO accesos(medico_id, paciente_id) VALUES ($1,$2)`, [req.usuario.id, p.usuario_id]);
    res.json(await fichaCompleta(req, p.usuario_id));
  }),
);

r.get(
  '/pacientes/:id',
  h(async (req, res) => {
    if (!(await tieneAcceso(req.usuario.id, req.params.id)))
      return res.status(403).json({ error: 'Escanea el QR del paciente para ver su ficha' });
    res.json(await fichaCompleta(req, req.params.id));
  }),
);

/** El médico agrega una consulta / evento al historial */
r.post(
  '/pacientes/:id/historial',
  h(async (req, res) => {
    if (!(await tieneAcceso(req.usuario.id, req.params.id)))
      return res.status(403).json({ error: 'Escanea el QR del paciente primero' });
    const d = validar(eventoSchema, req.body, res);
    if (!d) return;
    await q(`INSERT INTO historial(paciente_id,medico_id,fecha,tipo,descripcion,centro) VALUES ($1,$2,$3,$4,$5,$6)`, [
      req.params.id,
      req.usuario.id,
      d.fecha,
      d.tipo,
      d.descripcion,
      d.centro,
    ]);
    res.status(201).json(await fichaCompleta(req, req.params.id));
  }),
);

r.get(
  '/pacientes/:id/documentos/:doc/enlace',
  h(async (req, res) => {
    if (!(await tieneAcceso(req.usuario.id, req.params.id))) return res.status(403).json({ error: 'Sin acceso' });
    const d = await q(`SELECT 1 FROM documentos WHERE id = $1 AND paciente_id = $2`, [req.params.doc, req.params.id]);
    if (!d.rowCount) return res.status(404).json({ error: 'Documento no encontrado' });
    const { exp, sig } = firmarArchivo(req.params.doc);
    res.json({ url: `${baseUrl(req)}/archivos/${req.params.doc}?exp=${exp}&sig=${sig}` });
  }),
);

/** Pacientes que este médico escaneó, el más reciente primero */
r.get(
  '/recientes',
  h(async (req, res) => {
    const rows = (
      await q(
        `SELECT p.usuario_id, p.nombres, p.apellidos, p.tipo_sangre, p.alergias, x.ultima, x.veces
         FROM (SELECT paciente_id, max(fecha) AS ultima, count(*)::int AS veces
               FROM accesos WHERE medico_id = $1 GROUP BY paciente_id) x
         JOIN pacientes p ON p.usuario_id = x.paciente_id
         ORDER BY x.ultima DESC LIMIT 30`,
        [req.usuario.id],
      )
    ).rows;
    res.json(
      rows.map((x) => ({
        id: x.usuario_id,
        nombre: `${x.nombres} ${x.apellidos}`.trim() || 'Sin nombre',
        tipoSangre: x.tipo_sangre,
        alergias: x.alergias,
        ultima: x.ultima,
        veces: x.veces,
      })),
    );
  }),
);

export default r;
