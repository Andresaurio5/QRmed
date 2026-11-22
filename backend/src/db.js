import pg from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

// Las fechas (DATE) se devuelven como texto AAAA-MM-DD, no como Date con zona horaria
pg.types.setTypeParser(1082, (v) => v);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta la variable DATABASE_URL');
  process.exit(1);
}

const esLocal = /localhost|127\.0\.0\.1|@db[:/]/.test(url);
export const pool = new pg.Pool({
  connectionString: url,
  ssl: esLocal || process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 5,
});

export const q = (text, params) => pool.query(text, params);

export function nuevoTokenQR() {
  return crypto.randomBytes(18).toString('base64url');
}

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('paciente','medico')),
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medicos (
  usuario_id   UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  nombres      TEXT NOT NULL,
  apellidos    TEXT NOT NULL,
  matricula    TEXT NOT NULL,
  especialidad TEXT NOT NULL DEFAULT '',
  centro       TEXT NOT NULL DEFAULT '',
  telefono     TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS pacientes (
  usuario_id       UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  qr_token         TEXT NOT NULL UNIQUE,
  perfil_completo  BOOLEAN NOT NULL DEFAULT false,
  nombres          TEXT NOT NULL DEFAULT '',
  apellidos        TEXT NOT NULL DEFAULT '',
  documento        TEXT NOT NULL DEFAULT '',
  fecha_nacimiento DATE,
  sexo             TEXT NOT NULL DEFAULT '',
  tipo_sangre      TEXT NOT NULL DEFAULT '?',
  peso_kg          TEXT NOT NULL DEFAULT '',
  altura_cm        TEXT NOT NULL DEFAULT '',
  alergias         JSONB NOT NULL DEFAULT '[]',
  condiciones      JSONB NOT NULL DEFAULT '[]',
  medicamentos     JSONB NOT NULL DEFAULT '[]',
  dispositivos     JSONB NOT NULL DEFAULT '[]',
  vacunas          JSONB NOT NULL DEFAULT '[]',
  contactos        JSONB NOT NULL DEFAULT '[]',
  medico_nombre    TEXT NOT NULL DEFAULT '',
  medico_telefono  TEXT NOT NULL DEFAULT '',
  seguro           TEXT NOT NULL DEFAULT '',
  donante          BOOLEAN,
  notas            TEXT NOT NULL DEFAULT '',
  actualizado      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS historial (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(usuario_id) ON DELETE CASCADE,
  medico_id   UUID REFERENCES medicos(usuario_id) ON DELETE SET NULL,
  fecha       DATE NOT NULL,
  tipo        TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  centro      TEXT NOT NULL DEFAULT '',
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_historial_paciente ON historial(paciente_id, fecha DESC);

CREATE TABLE IF NOT EXISTS documentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(usuario_id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  categoria   TEXT NOT NULL,
  mime        TEXT NOT NULL,
  tamano      INTEGER NOT NULL,
  datos       BYTEA NOT NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documentos_paciente ON documentos(paciente_id);

CREATE TABLE IF NOT EXISTS accesos (
  id          BIGSERIAL PRIMARY KEY,
  medico_id   UUID NOT NULL REFERENCES medicos(usuario_id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES pacientes(usuario_id) ON DELETE CASCADE,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_accesos_medico ON accesos(medico_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_accesos_paciente ON accesos(paciente_id, fecha DESC);
`;

export async function migrar() {
  await q(ESQUEMA);
  if (process.env.SEED_DEMO !== 'false') await sembrarDemo();
}

/** Cuentas de prueba, solo se crean si no existen. */
async function sembrarDemo() {
  const existe = await q(`SELECT 1 FROM usuarios WHERE email = 'medico@qrmedico.bo'`);
  if (existe.rowCount) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hm = await bcrypt.hash('Medico123*', 10);
    const hp = await bcrypt.hash('Paciente123*', 10);

    const m = await client.query(
      `INSERT INTO usuarios(email,password_hash,rol) VALUES ('medico@qrmedico.bo',$1,'medico') RETURNING id`,
      [hm],
    );
    await client.query(
      `INSERT INTO medicos(usuario_id,nombres,apellidos,matricula,especialidad,centro,telefono)
       VALUES ($1,'Luis','Paredes Rojas','MP-L-4521','Emergenciología','Hospital de Clínicas','+591 70000010')`,
      [m.rows[0].id],
    );

    const p = await client.query(
      `INSERT INTO usuarios(email,password_hash,rol) VALUES ('paciente@qrmedico.bo',$1,'paciente') RETURNING id`,
      [hp],
    );
    const pid = p.rows[0].id;
    await client.query(
      `INSERT INTO pacientes(usuario_id,qr_token,perfil_completo,nombres,apellidos,documento,fecha_nacimiento,sexo,
         tipo_sangre,peso_kg,altura_cm,alergias,condiciones,medicamentos,dispositivos,vacunas,contactos,
         medico_nombre,medico_telefono,seguro,donante,notas)
       VALUES ($1,$2,true,'María Fernanda','Quiroga Mamani','8456123 LP','1994-03-15','F','O-','62','160',
         $3,$4,$5,'[]',$6,$7,'Dr. Luis Paredes (Neumología)','+591 2 2000000','Caja Nacional de Salud — Mat. 94-0315-QMM',true,
         'Anafilaxia previa con penicilina. Lleva inhalador en la mochila.')`,
      [
        pid,
        nuevoTokenQR(),
        JSON.stringify(['Penicilina', 'Ibuprofeno', 'Maní']),
        JSON.stringify(['Asma moderada', 'Hipotiroidismo']),
        JSON.stringify([
          { nombre: 'Levotiroxina', dosis: '75 mcg', frecuencia: 'Cada mañana en ayunas' },
          { nombre: 'Salbutamol inhalador', dosis: '2 puffs', frecuencia: 'Si hay crisis' },
        ]),
        JSON.stringify(['COVID-19 (3 dosis)', 'Tétanos 2023', 'Influenza 2026']),
        JSON.stringify([
          { nombre: 'Jorge Quiroga', relacion: 'Padre', telefono: '+591 70000001' },
          { nombre: 'Ana Mamani', relacion: 'Madre', telefono: '+591 70000002' },
        ]),
      ],
    );
    const eventos = [
      ['2026-06-10', 'Emergencia', 'Crisis asmática, nebulización y corticoide IV', 'Hospital de Clínicas'],
      ['2024-09-02', 'Cirugía', 'Apendicectomía laparoscópica sin complicaciones', 'Clínica del Sur'],
      ['2021-01-20', 'Consulta', 'Diagnóstico de hipotiroidismo, inicia levotiroxina', 'Caja Nacional de Salud'],
    ];
    for (const e of eventos) {
      await client.query(
        `INSERT INTO historial(paciente_id,fecha,tipo,descripcion,centro) VALUES ($1,$2,$3,$4,$5)`,
        [pid, ...e],
      );
    }
    await client.query('COMMIT');
    console.log('Cuentas demo creadas');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
