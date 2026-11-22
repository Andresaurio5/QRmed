// Páginas web simples: inicio (con link de descarga del APK) y la que se abre si escanean con otra app

const APK_URL = process.env.APK_URL || '';

const estilo = `
  *{box-sizing:border-box} body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  background:#F3F5F8;color:#0F172A;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
  .c{background:#fff;border:1px solid #E2E8F0;border-radius:20px;max-width:420px;width:100%;padding:32px 24px;text-align:center;
  box-shadow:0 10px 30px rgba(15,23,42,.06)}
  .logo{width:72px;height:72px;border-radius:20px;background:#C8102E;color:#fff;font-size:44px;font-weight:900;
  display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
  h1{margin:0 0 8px;font-size:26px} p{color:#64748B;line-height:1.5;margin:0 0 20px}
  a.b{display:block;background:#C8102E;color:#fff;text-decoration:none;font-weight:700;padding:16px;border-radius:14px;font-size:17px}
  .s{font-size:13px;margin-top:16px}
`;

const html = (titulo, cuerpo) => `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title><style>${estilo}</style></head>
<body><div class="c"><div class="logo">✚</div>${cuerpo}</div></body></html>`;

const boton = APK_URL
  ? `<a class="b" href="${APK_URL}">Descargar app para Android</a>
     <p class="s">Al instalar, Android puede pedirte permitir “orígenes desconocidos”.</p>`
  : `<p class="s">El instalador todavía no está publicado.</p>`;

export const paginaInicio = () =>
  html(
    'QR Médico',
    `<h1>QR Médico</h1><p>Tu ficha médica de emergencia en un QR. Los pacientes registran sus datos y documentos; los médicos escanean y ven el historial al instante.</p>${boton}`,
  );

export const paginaQR = () =>
  html(
    'Ficha médica protegida',
    `<h1>Ficha médica protegida</h1><p>Este QR contiene la ficha médica de un paciente. Por privacidad solo se puede abrir desde la app <b>QR Médico</b> con una cuenta de médico.</p>${boton}`,
  );
