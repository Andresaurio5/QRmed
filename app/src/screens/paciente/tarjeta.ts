import { Perfil } from '../../types';

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** HTML de la tarjeta imprimible (tamaño tarjeta de crédito, anverso y reverso) */
export function htmlTarjeta(p: Perfil, qrBase64: string) {
  const alergias = p.alergias.length ? p.alergias.join(', ') : 'Ninguna conocida';
  const nombre = `${p.nombres} ${p.apellidos}`.trim();
  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  @page { margin: 14mm; }
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color:#0F172A; }
  .t { width: 86mm; height: 54mm; border: 1.5px solid #C8102E; border-radius: 4mm; display:flex; overflow:hidden; margin-bottom: 8mm; }
  .izq { background:#C8102E; color:#fff; width: 30mm; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .cruz { font-size: 26pt; font-weight: 900; line-height:1; }
  .sangre { margin-top: 2mm; background:#fff; color:#C8102E; border-radius:2mm; padding:1mm 3mm; font-size:18pt; font-weight:900; }
  .lbl { font-size:6pt; letter-spacing:1px; margin-top:2mm; font-weight:700; }
  .der { flex:1; padding: 3mm 4mm; display:flex; flex-direction:column; justify-content:space-between; }
  .titulo { font-size: 7pt; font-weight:800; color:#C8102E; letter-spacing: 1px; }
  .nombre { font-size: 11pt; font-weight: 900; }
  .dato { font-size: 7pt; margin-top: 1mm; }
  .qr { width: 46mm; height: 46mm; }
  .rev { justify-content:center; align-items:center; gap: 4mm; padding: 3mm; }
  .instr { font-size: 7pt; color:#475569; width: 30mm; }
  .corte { font-size: 7pt; color:#94A3B8; margin-bottom: 3mm; }
</style></head><body>
  <div class="corte">✂ Recorta las dos caras y pégalas espalda con espalda (o plastifica).</div>
  <div class="t">
    <div class="izq"><div class="cruz">✚</div><div class="lbl">SANGRE</div>
      <div class="sangre">${esc(p.tipoSangre === '?' ? '—' : p.tipoSangre)}</div></div>
    <div class="der">
      <div><div class="titulo">FICHA MÉDICA DE EMERGENCIA</div>
        <div class="nombre">${esc(nombre)}</div>
        ${p.documento ? `<div class="dato">CI: ${esc(p.documento)}</div>` : ''}</div>
      <div><div class="dato"><b style="color:#C8102E">ALERGIAS:</b> ${esc(alergias)}</div>
        ${p.contactos[0] ? `<div class="dato"><b>Contacto:</b> ${esc(p.contactos[0].nombre)} ${esc(p.contactos[0].telefono)}</div>` : ''}</div>
    </div>
  </div>
  <div class="t rev">
    <img class="qr" src="data:image/png;base64,${qrBase64}"/>
    <div class="instr"><b>Personal de salud:</b> escanear con la app QR Médico para ver historial clínico, medicamentos, documentos y contactos.</div>
  </div>
</body></html>`;
}
