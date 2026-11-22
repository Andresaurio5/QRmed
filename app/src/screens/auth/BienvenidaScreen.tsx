import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProps } from '../../navigation';
import { Rol } from '../../types';
import { Aparecer } from '../../components/extra';
import { C } from '../../theme';

function Latido() {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1.12, duration: 260, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1.08, duration: 220, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [v]);
  return (
    <Animated.View style={[st.logo, { transform: [{ scale: v }] }]}>
      <Text style={st.logoTxt}>✚</Text>
    </Animated.View>
  );
}

export default function BienvenidaScreen({ navigation }: AuthProps<'Bienvenida'>) {
  const ir = (rol: Rol) => navigation.navigate('Entrar', { rol });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={st.cont}>
        <Aparecer style={{ alignItems: 'center' }}>
          <Latido />
          <Text style={st.titulo}>QR Médico</Text>
          <Text style={st.sub}>Tu ficha médica de emergencia, siempre contigo.</Text>
        </Aparecer>

        <Text style={st.pregunta}>¿Cómo vas a usar la app?</Text>

        <Aparecer retraso={120}>
          <Pressable onPress={() => ir('paciente')} style={({ pressed }) => [st.rol, pressed && st.presionado]}>
            <Text style={st.rolIcono}>🧑</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.rolTitulo}>Soy paciente</Text>
              <Text style={st.rolSub}>Registro mis datos médicos y documentos, y obtengo mi QR.</Text>
            </View>
            <Text style={st.flecha}>›</Text>
          </Pressable>
        </Aparecer>

        <Aparecer retraso={220}>
          <Pressable onPress={() => ir('medico')} style={({ pressed }) => [st.rol, st.rolMedico, pressed && st.presionado]}>
            <Text style={st.rolIcono}>🩺</Text>
            <View style={{ flex: 1 }}>
              <Text style={[st.rolTitulo, { color: '#fff' }]}>Soy médico</Text>
              <Text style={[st.rolSub, { color: '#FFD9DE' }]}>Escaneo el QR del paciente y veo su historial al instante.</Text>
            </View>
            <Text style={[st.flecha, { color: '#fff' }]}>›</Text>
          </Pressable>
        </Aparecer>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  cont: { padding: 22, paddingTop: 40, flexGrow: 1, justifyContent: 'center' },
  logo: { width: 92, height: 92, borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  logoTxt: { color: '#fff', fontSize: 56, fontWeight: '900', marginTop: -4 },
  titulo: { fontSize: 32, fontWeight: '900', color: C.text, marginTop: 18 },
  sub: { fontSize: 16, color: C.muted, textAlign: 'center', marginTop: 6 },
  pregunta: { fontSize: 14, fontWeight: '800', color: C.muted, marginTop: 44, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  rol: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 18, marginBottom: 12 },
  rolMedico: { backgroundColor: C.primary, borderColor: C.primary },
  presionado: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  rolIcono: { fontSize: 34 },
  rolTitulo: { fontSize: 19, fontWeight: '900', color: C.text },
  rolSub: { fontSize: 14, color: C.muted, marginTop: 3, lineHeight: 19 },
  flecha: { fontSize: 28, color: C.muted },
});
