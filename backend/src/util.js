import { z } from 'zod';

/** Envuelve handlers async para que los errores lleguen al manejador global */
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Valida body con zod; responde 400 con el primer error legible */
export function validar(esquema, datos, res) {
  const r = esquema.safeParse(datos);
  if (!r.success) {
    const i = r.error.issues[0];
    res.status(400).json({ error: `${i.path.join('.') || 'dato'}: ${i.message}` });
    return null;
  }
  return r.data;
}

export const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'usa el formato AAAA-MM-DD')
  .refine((v) => !isNaN(new Date(v + 'T00:00:00').getTime()), 'fecha inválida');

export const TIPOS_EVENTO = ['Consulta', 'Emergencia', 'Hospitalización', 'Cirugía', 'Estudio', 'Otro'];
export const CATEGORIAS_DOC = ['Análisis', 'Receta', 'Imagen / Rayos X', 'Informe médico', 'Seguro', 'Identificación', 'Otro'];

/** Devuelve la URL pública del servidor (Render pone el proxy delante) */
export function baseUrl(req) {
  return process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
}

/** Fila de pacientes → objeto para la app */
export function pacienteDTO(r) {
  return {
    id: r.usuario_id,
    perfilCompleto: r.perfil_completo,
    nombres: r.nombres,
    apellidos: r.apellidos,
    documento: r.documento,
    fechaNacimiento: r.fecha_nacimiento || '',
    sexo: r.sexo,
    tipoSangre: r.tipo_sangre,
    pesoKg: r.peso_kg,
    alturaCm: r.altura_cm,
    alergias: r.alergias,
    condiciones: r.condiciones,
    medicamentos: r.medicamentos,
    dispositivos: r.dispositivos,
    vacunas: r.vacunas,
    contactos: r.contactos,
    medicoNombre: r.medico_nombre,
    medicoTelefono: r.medico_telefono,
    seguro: r.seguro,
    donante: r.donante,
    notas: r.notas,
    actualizado: r.actualizado,
  };
}

export const historialDTO = (r) => ({
  id: r.id,
  fecha: r.fecha,
  tipo: r.tipo,
  descripcion: r.descripcion,
  centro: r.centro,
  medico: r.medico_nombres ? `Dr(a). ${r.medico_nombres} ${r.medico_apellidos}` : null,
  creadoEn: r.creado_en,
});

export const documentoDTO = (r) => ({
  id: r.id,
  nombre: r.nombre,
  categoria: r.categoria,
  mime: r.mime,
  tamano: r.tamano,
  creadoEn: r.creado_en,
});
