import * as SecureStore from 'expo-secure-store';

// Dirección del servidor. Se fija al compilar (eas.json) o en un archivo .env para desarrollo.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://qrmed.onrender.com').replace(/\/$/, '');

const CLAVE_TOKEN = 'qrmed_token';
let token: string | null = null;

export async function cargarToken() {
  token = await SecureStore.getItemAsync(CLAVE_TOKEN);
  return token;
}

export async function guardarToken(t: string | null) {
  token = t;
  if (t) await SecureStore.setItemAsync(CLAVE_TOKEN, t);
  else await SecureStore.deleteItemAsync(CLAVE_TOKEN);
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Si la sesión vence, el contexto de auth se entera por aquí
let alVencerSesion: (() => void) | null = null;
export const onSesionVencida = (fn: () => void) => (alVencerSesion = fn);

async function pedir<T>(metodo: string, ruta: string, body?: unknown, esForm = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !esForm) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    // Render gratis "se duerme": la primera petición puede tardar ~50 s
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90_000);
    res = await fetch(API_URL + ruta, {
      method: metodo,
      headers,
      body: body === undefined ? undefined : esForm ? (body as FormData) : JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch {
    throw new ApiError('No hay conexión con el servidor. Revisa tu internet e intenta otra vez.', 0);
  }

  if (res.status === 204) return undefined as T;
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) alVencerSesion?.();
    throw new ApiError(datos.error || `Error ${res.status}`, res.status);
  }
  return datos as T;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>('GET', ruta),
  post: <T>(ruta: string, body?: unknown) => pedir<T>('POST', ruta, body ?? {}),
  put: <T>(ruta: string, body: unknown) => pedir<T>('PUT', ruta, body),
  del: (ruta: string) => pedir<void>('DELETE', ruta),
  subir: <T>(ruta: string, form: FormData) => pedir<T>('POST', ruta, form, true),
};

export const mensajeError = (e: unknown) => (e instanceof Error ? e.message : 'Algo salió mal');
