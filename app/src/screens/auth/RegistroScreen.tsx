import React, { useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { AuthProps } from '../../navigation';
import { useAuth } from '../../auth';
import { mensajeError } from '../../api';
import { Boton, Campo, Tarjeta } from '../../components/ui';
import { Aparecer } from '../../components/extra';
import { C } from '../../theme';

export default function RegistroScreen({ navigation, route }: AuthProps<'Registro'>) {
  const { rol } = route.params;
  const esMedico = rol === 'medico';
  const { registrar } = useAuth();
  const [f, setF] = useState({
    email: '',
    password: '',
    confirmar: '',
    nombres: '',
    apellidos: '',
    matricula: '',
    especialidad: '',
    centro: '',
    telefono: '',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  useLayoutEffect(() => {
    navigation.setOptions({ title: esMedico ? 'Registro de médico' : 'Crear cuenta' });
  }, [navigation, esMedico]);

  const enviar = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setError('Ese correo no es válido');
    if (f.password.length < 6) return setError('La contraseña necesita al menos 6 caracteres');
    if (f.password !== f.confirmar) return setError('Las contraseñas no coinciden');
    if (esMedico && (!f.nombres.trim() || !f.apellidos.trim() || f.matricula.trim().length < 3))
      return setError('Completa nombres, apellidos y matrícula profesional');

    setCargando(true);
    try {
      const { confirmar, ...datos } = f;
      await registrar(
        esMedico
          ? { ...datos, rol }
          : { email: datos.email, password: datos.password, rol },
      );
      // Al registrarse, la app cambia sola al flujo del rol
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Aparecer>
          <Text style={st.sub}>
            {esMedico
              ? 'Con tu cuenta de médico podrás escanear el QR de los pacientes y registrar consultas en su historial.'
              : 'Crea tu cuenta y después te guiamos paso a paso para armar tu ficha médica y tu QR.'}
          </Text>

          <Tarjeta titulo="Cuenta" icono="🔐">
            <Campo etiqueta="Correo" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" placeholder="tu@correo.com" />
            <Campo etiqueta="Contraseña" value={f.password} onChangeText={set('password')} secureTextEntry placeholder="Mínimo 6 caracteres" />
            <Campo etiqueta="Repite la contraseña" value={f.confirmar} onChangeText={set('confirmar')} secureTextEntry />
          </Tarjeta>

          {esMedico && (
            <Tarjeta titulo="Datos profesionales" icono="🩺">
              <Campo etiqueta="Nombres *" value={f.nombres} onChangeText={set('nombres')} />
              <Campo etiqueta="Apellidos *" value={f.apellidos} onChangeText={set('apellidos')} />
              <Campo etiqueta="Matrícula profesional *" value={f.matricula} onChangeText={set('matricula')} placeholder="Ej. MP-L-4521" autoCapitalize="characters" />
              <Campo etiqueta="Especialidad" value={f.especialidad} onChangeText={set('especialidad')} placeholder="Ej. Medicina general" />
              <Campo etiqueta="Centro de salud" value={f.centro} onChangeText={set('centro')} placeholder="Ej. Hospital de Clínicas" />
              <Campo etiqueta="Teléfono" value={f.telefono} onChangeText={set('telefono')} keyboardType="phone-pad" />
            </Tarjeta>
          )}

          {error ? <Text style={st.error}>{error}</Text> : null}
          <Boton titulo={cargando ? 'Creando cuenta…' : 'Crear cuenta'} grande onPress={enviar} disabled={cargando} />
        </Aparecer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  sub: { fontSize: 15, color: C.muted, marginBottom: 16, lineHeight: 21 },
  error: { color: C.primary, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
});
