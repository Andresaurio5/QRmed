export const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '?'] as const;
export type TipoSangre = (typeof TIPOS_SANGRE)[number];
export type Sexo = 'M' | 'F' | 'O' | '';

export const TIPOS_EVENTO = ['Consulta', 'Emergencia', 'Hospitalización', 'Cirugía', 'Estudio', 'Otro'] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export const CATEGORIAS_DOC = ['Análisis', 'Receta', 'Imagen / Rayos X', 'Informe médico', 'Seguro', 'Identificación', 'Otro'] as const;
export type CategoriaDoc = (typeof CATEGORIAS_DOC)[number];

export type Rol = 'paciente' | 'medico';

export interface Usuario {
  id: string;
  email: string;
  rol: Rol;
  nombre: string;
  perfilCompleto?: boolean;
  medico?: { nombres: string; apellidos: string; matricula: string; especialidad: string; centro: string; telefono: string };
}

export interface Contacto {
  nombre: string;
  relacion: string;
  telefono: string;
}

export interface Medicamento {
  nombre: string;
  dosis: string;
  frecuencia: string;
}

export interface Perfil {
  id: string;
  perfilCompleto: boolean;
  nombres: string;
  apellidos: string;
  documento: string;
  fechaNacimiento: string;
  sexo: Sexo;
  tipoSangre: TipoSangre;
  pesoKg: string;
  alturaCm: string;
  alergias: string[];
  condiciones: string[];
  medicamentos: Medicamento[];
  dispositivos: string[];
  vacunas: string[];
  contactos: Contacto[];
  medicoNombre: string;
  medicoTelefono: string;
  seguro: string;
  donante: boolean | null;
  notas: string;
  actualizado: string;
}

export interface Evento {
  id: string;
  fecha: string;
  tipo: TipoEvento;
  descripcion: string;
  centro: string;
  medico: string | null;
  creadoEn: string;
}

export interface Documento {
  id: string;
  nombre: string;
  categoria: CategoriaDoc;
  mime: string;
  tamano: number;
  creadoEn: string;
}

export interface Ficha {
  paciente: Perfil;
  historial: Evento[];
  documentos: Documento[];
}

export interface Acceso {
  fecha: string;
  medico: string;
  especialidad: string;
  centro: string;
  matricula: string;
}

export interface Reciente {
  id: string;
  nombre: string;
  tipoSangre: TipoSangre;
  alergias: string[];
  ultima: string;
  veces: number;
}
