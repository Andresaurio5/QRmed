import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { AuthStack, MedicoStack, PacienteStack } from './src/navigation';
import { C } from './src/theme';
import { Cargando } from './src/components/extra';

import BienvenidaScreen from './src/screens/auth/BienvenidaScreen';
import EntrarScreen from './src/screens/auth/EntrarScreen';
import RegistroScreen from './src/screens/auth/RegistroScreen';
import Registro1Screen from './src/screens/paciente/Registro1Screen';
import InicioPacienteScreen from './src/screens/paciente/InicioPacienteScreen';
import EditarPerfilScreen from './src/screens/paciente/EditarPerfilScreen';
import { AccesosScreen, DocumentosScreen, HistorialScreen, MiFichaScreen } from './src/screens/paciente/OtrasPaciente';
import { EscanerScreen, FichaPacienteScreen, InicioMedicoScreen } from './src/screens/medico/MedicoScreens';

const A = createNativeStackNavigator<AuthStack>();
const P = createNativeStackNavigator<PacienteStack>();
const M = createNativeStackNavigator<MedicoStack>();

const cabecera: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: C.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '800' },
  headerShadowVisible: false,
  animation: 'slide_from_right',
};

const tema = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.bg, primary: C.primary } };

function Rutas() {
  const { usuario, cargando } = useAuth();

  if (cargando) return <Cargando texto="Abriendo QR Médico…" />;

  if (!usuario) {
    return (
      <A.Navigator screenOptions={cabecera}>
        <A.Screen name="Bienvenida" component={BienvenidaScreen} options={{ headerShown: false }} />
        <A.Screen name="Entrar" component={EntrarScreen} />
        <A.Screen name="Registro" component={RegistroScreen} />
      </A.Navigator>
    );
  }

  if (usuario.rol === 'medico') {
    return (
      <M.Navigator screenOptions={cabecera}>
        <M.Screen name="InicioMedico" component={InicioMedicoScreen} options={{ title: 'QR Médico' }} />
        <M.Screen name="Escaner" component={EscanerScreen} options={{ title: 'Escanear QR' }} />
        <M.Screen name="FichaPaciente" component={FichaPacienteScreen} options={{ title: 'Ficha' }} />
      </M.Navigator>
    );
  }

  // Paciente: la primera vez solo ve el registro guiado
  if (!usuario.perfilCompleto) {
    return (
      <P.Navigator screenOptions={cabecera}>
        <P.Screen name="Registro1" component={Registro1Screen} options={{ title: 'Arma tu ficha médica' }} />
      </P.Navigator>
    );
  }

  return (
    <P.Navigator screenOptions={cabecera}>
      <P.Screen name="InicioPaciente" component={InicioPacienteScreen} options={{ title: 'Mi QR médico' }} />
      <P.Screen name="EditarPerfil" component={EditarPerfilScreen} options={{ title: 'Editar mis datos' }} />
      <P.Screen name="Documentos" component={DocumentosScreen} options={{ title: 'Mis documentos' }} />
      <P.Screen name="Historial" component={HistorialScreen} options={{ title: 'Mi historial' }} />
      <P.Screen name="Accesos" component={AccesosScreen} options={{ title: 'Quién vio mi ficha' }} />
      <P.Screen name="MiFicha" component={MiFichaScreen} options={{ title: 'Mi ficha' }} />
    </P.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={tema}>
          <StatusBar style="light" />
          <Rutas />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
