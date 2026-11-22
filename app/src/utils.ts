export function calcularEdad(fecha: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  const nac = new Date(fecha + 'T00:00:00');
  if (isNaN(nac.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad >= 0 && edad < 150 ? edad : null;
}

export function fechaValida(fecha: string): boolean {
  if (!fecha) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  return !isNaN(new Date(fecha + 'T00:00:00').getTime());
}

/** Mientras escribes "20000501" lo va dejando como "2000-05-01" */
export function mascaraFecha(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

export function formatearFecha(fecha: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(fecha)) return fecha;
  const [a, m, d] = fecha.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

export function haceCuanto(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 7) return `hace ${Math.floor(s / 86400)} d`;
  return formatearFecha(iso.slice(0, 10));
}

export function textoSexo(s: string): string {
  return s === 'M' ? 'Masculino' : s === 'F' ? 'Femenino' : s === 'O' ? 'Otro' : '';
}

export function imc(pesoKg: string, alturaCm: string): string | null {
  const p = parseFloat(pesoKg.replace(',', '.'));
  const h = parseFloat(alturaCm.replace(',', '.')) / 100;
  if (!p || !h) return null;
  return (p / (h * h)).toFixed(1);
}

export function telLimpio(t: string): string {
  return t.replace(/[^\d+]/g, '');
}

export function pesoArchivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
