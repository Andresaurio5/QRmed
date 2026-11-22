import React, { useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthProps } from '../../navigation';
import { useAuth } from '../../auth';
import { mensajeError } from '../../api';
import { Boton, Campo } from '../../components/ui';
import { Aparecer } from '../../components/extra';
import { C } from '../../theme';

const DEMO = {
  paciente: { email: 'paciente@qrmedico.bo', password: 'Paciente123*' },
  medico: { email: 'medico@qrmedico.bo', password: 'Medico123*' },
};

export default function EntrarScreen({ navigation, route }: AuthProps<'Entrar'>) {
  const { rol } = route.params;
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: rol === 'medico' ? 'Acceso médico' : 'Acceso paciente' });
  }, [navigation, rol]);

  const enviar = async () => {
    setError('');
    if (!email.trim() || !password) return setError('Pon tu correo y contraseña');
    setCargando(true);
    try {
      await entrar(email.trim(), password);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={st.cont} keyboardShouldPersistTaps="handled">
        <Aparecer>
          <Text style={st.icono}>{rol === 'medico' ? '🩺' : '🧑'}</Text>
          <Text style={st.titulo}>{rol === 'medico' ? 'Hola, doc' : 'Bienvenido'}</Text>
          <Text style={st.sub}>Entra con tu cuenta para continuar.</Text>

          <Campo etiqueta="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="tu@correo.com" />
          <Campo etiqueta="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="••••••" onSubmitEditing={enviar} />

          {error ? <Text style={st.error}>{error}</Text> : null}
          {cargando ? <Text style={st.aviso}>Conectando… la primera vez del día puede tardar unos segundos.</Text> : null}

          <Boton titulo={cargando ? 'Entrando…' : 'Entrar'} grande onPress={enviar} disabled={cargando} />

          <View style={st.fila}>
            <Text style={{ color: C.muted }}>¿No tienes cuenta?</Text>
            <Pressable onPress={() => navigation.navigate('Registro', { rol })} hitSlop={8}>
              <Text style={st.link}>Regístrate</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              setEmail(DEMO[rol].email);
              setPassword(DEMO[rol].password);
            }}
            style={st.demo}
          >
            <Text style={st.demoTxt}>Usar cuenta de prueba ({rol})</Text>
          </Pressable>
        </Aparecer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  cont: { padding: 22, paddingTop: 30 },
  icono: { fontSize: 46 },
  titulo: { fontSize: 28, fontWeight: '900', color: C.text, marginTop: 8 },
  sub: { fontSize: 15, color: C.muted, marginTop: 4, marginBottom: 24 },
  error: { color: C.primary, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  aviso: { color: C.muted, fontSize: 13, marginBottom: 10, textAlign: 'center' },
  fila: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 },
  link: { color: C.primary, fontWeight: '800' },
  demo: { marginTop: 28, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  demoTxt: { color: C.muted, fontSize: 13, fontWeight: '600' },
});
