import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Rol } from './types';

export type AuthStack = {
  Bienvenida: undefined;
  Entrar: { rol: Rol };
  Registro: { rol: Rol };
};

export type PacienteStack = {
  Registro1: undefined; // registro guiado (primera vez)
  InicioPaciente: undefined;
  EditarPerfil: undefined;
  Documentos: undefined;
  Historial: undefined;
  Accesos: undefined;
  MiFicha: undefined;
};

export type MedicoStack = {
  InicioMedico: undefined;
  Escaner: undefined;
  FichaPaciente: { id: string; desdeEscaneo?: boolean };
};

export type AuthProps<T extends keyof AuthStack> = NativeStackScreenProps<AuthStack, T>;
export type PacProps<T extends keyof PacienteStack> = NativeStackScreenProps<PacienteStack, T>;
export type MedProps<T extends keyof MedicoStack> = NativeStackScreenProps<MedicoStack, T>;
