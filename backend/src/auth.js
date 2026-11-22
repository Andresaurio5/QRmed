import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const SECRET = process.env.JWT_SECRET || 'solo-para-desarrollo-cambiar';
if (!process.env.JWT_SECRET) console.warn('⚠ JWT_SECRET no definido, usando uno de desarrollo');

export function firmarToken(usuario) {
  return jwt.sign({ sub: usuario.id, rol: usuario.rol }, SECRET, { expiresIn: '30d' });
}

/** Middleware: exige sesión y, opcionalmente, un rol. */
export function requiere(rol) {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Inicia sesión' });
    try {
      const datos = jwt.verify(token, SECRET);
      req.usuario = { id: datos.sub, rol: datos.rol };
      if (rol && datos.rol !== rol) return res.status(403).json({ error: 'No tienes permiso para esto' });
      next();
    } catch {
      res.status(401).json({ error: 'Sesión vencida, vuelve a entrar' });
    }
  };
}

// Enlaces firmados para abrir documentos en el navegador del celular (duran 10 min)
export function firmarArchivo(id, minutos = 10) {
  const exp = Math.floor(Date.now() / 1000) + minutos * 60;
  const sig = crypto.createHmac('sha256', SECRET).update(`${id}.${exp}`).digest('base64url');
  return { exp, sig };
}

export function verificarArchivo(id, exp, sig) {
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const esperado = crypto.createHmac('sha256', SECRET).update(`${id}.${exp}`).digest('base64url');
  const a = Buffer.from(esperado);
  const b = Buffer.from(String(sig));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
