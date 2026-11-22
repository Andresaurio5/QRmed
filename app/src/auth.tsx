import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, cargarToken, guardarToken, onSesionVencida } from './api';
import { Rol, Usuario } from './types';

interface DatosRegistro {
  email: string;
  password: string;
  rol: Rol;
  nombres?: string;
  apellidos?: string;
  matricula?: string;
  especialidad?: string;
  centro?: string;
  telefono?: string;
}

interface Ctx {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, password: string) => Promise<void>;
  registrar: (d: DatosRegistro) => Promise<void>;
  salir: () => Promise<void>;
  refrescar: () => Promise<void>;
}

const AuthCtx = createContext<Ctx>(null as unknown as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const salir = useCallback(async () => {
    await guardarToken(null);
    setUsuario(null);
  }, []);

  const refrescar = useCallback(async () => {
    setUsuario(await api.get<Usuario>('/api/auth/yo'));
  }, []);

  useEffect(() => {
    onSesionVencida(salir);
    (async () => {
      try {
        if (await cargarToken()) await refrescar();
      } catch {
        // sin conexión o token vencido: que vuelva a entrar
      } finally {
        setCargando(false);
      }
    })();
  }, [refrescar, salir]);

  const entrar = async (email: string, password: string) => {
    const r = await api.post<{ token: string; usuario: Usuario }>('/api/auth/login', { email, password });
    await guardarToken(r.token);
    setUsuario(r.usuario);
  };

  const registrar = async (d: DatosRegistro) => {
    const r = await api.post<{ token: string; usuario: Usuario }>('/api/auth/registro', d);
    await guardarToken(r.token);
    setUsuario(r.usuario);
  };

  return <AuthCtx.Provider value={{ usuario, cargando, entrar, registrar, salir, refrescar }}>{children}</AuthCtx.Provider>;
}
