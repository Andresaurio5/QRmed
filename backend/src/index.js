import express from 'express';
import cors from 'cors';
import { migrar, q } from './db.js';
import { verificarArchivo } from './auth.js';
import { h } from './util.js';
import rutasAuth from './routes/auth.js';
import rutasPaciente from './routes/paciente.js';
import rutasMedico from './routes/medico.js';
import { paginaInicio, paginaQR } from './paginas.js';

const app = express();
app.set('trust proxy', 1); // Render va detrás de un proxy (https)
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', h(async (_req, res) => {
  await q('SELECT 1');
  res.json({ ok: true });
}));

app.use('/api/auth', rutasAuth);
app.use('/api/paciente', rutasPaciente);
app.use('/api/medico', rutasMedico);

/** Descarga/visualiza un documento con enlace firmado (temporal) */
app.get(
  '/archivos/:id',
  h(async (req, res) => {
    if (!verificarArchivo(req.params.id, req.query.exp, req.query.sig))
      return res.status(403).send('Enlace vencido. Vuelve a abrirlo desde la app.');
    const d = (await q(`SELECT nombre, mime, datos FROM documentos WHERE id = $1`, [req.params.id])).rows[0];
    if (!d) return res.status(404).send('No existe');
    res.setHeader('Content-Type', d.mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(d.nombre)}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(d.datos);
  }),
);

// Si alguien escanea el QR con la cámara normal del celular, cae aquí
app.get('/qr/:token', (_req, res) => res.type('html').send(paginaQR()));
app.get('/', (_req, res) => res.type('html').send(paginaInicio()));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejador de errores
app.use((err, _req, res, _next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'El archivo pesa más de 8 MB' });
  if (err?.code === '22P02') return res.status(400).json({ error: 'Identificador inválido' });
  console.error(err);
  res.status(500).json({ error: 'Error del servidor' });
});

const PORT = process.env.PORT || 3000;
migrar()
  .then(() => app.listen(PORT, () => console.log(`QR Médico API escuchando en :${PORT}`)))
  .catch((e) => {
    console.error('No se pudo preparar la base de datos', e);
    process.exit(1);
  });
