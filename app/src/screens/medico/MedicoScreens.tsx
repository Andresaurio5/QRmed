import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { MedProps } from '../../navigation';
import { api, mensajeError } from '../../api';
import { useAuth } from '../../auth';
import { Ficha, Reciente } from '../../types';
import { Boton, Tarjeta, Vacio } from '../../components/ui';
import { Aparecer, Cargando, ErrorCaja } from '../../components/extra';
import { abrirEnlace } from '../../components/Documentos';
import FichaView from '../../components/FichaView';
import { FormEvento } from '../paciente/OtrasPaciente';
import { haceCuanto } from '../../utils';
import { C } from '../../theme';

// ---------------------------------------------------------------- Inicio
export function InicioMedicoScreen({ navigation }: MedProps<'InicioMedico'>) {
  const { usuario, salir } = useAuth();
  const [recientes, setRecientes] = useState<Reciente[] | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const pulso = useRef(new Animated.Value(0)).current;

  const cargar = useCallback(async () => {
    try {
      setRecientes(await api.get<Reciente[]>('/api/medico/recientes'));
    } catch {
      setRecientes((r) => r ?? []);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  useFocusEffect(
    useCallback(() => {
      const a = Animated.loop(Animated.timing(pulso, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }));
      a.start();
      return () => a.stop();
    }, [pulso]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          hitSlop={10}
          onPress={() => Alert.alert('Cerrar sesión', '¿Salir de tu cuenta?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Salir', style: 'destructive', onPress: salir }])}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Salir</Text>
        </Pressable>
      ),
    });
  }, [navigation, salir]);

  const m = usuario?.medico;

  return (
    <ScrollView
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          tintColor={C.primary}
          onRefresh={async () => {
            setRefrescando(true);
            await cargar();
            setRefrescando(false);
          }}
        />
      }
    >
      <View style={st.cabecera}>
        <Aparecer>
          <Text style={st.hola}>Dr(a). {m ? `${m.nombres} ${m.apellidos}` : usuario?.nombre}</Text>
          <Text style={st.holaSub}>{[m?.especialidad, m?.centro].filter(Boolean).join(' · ') || 'Personal de salud'}</Text>
        </Aparecer>
      </View>

      <View style={st.zonaBoton}>
        <Animated.View
          style={[
            st.onda,
            {
              opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
            },
          ]}
        />
        <Pressable onPress={() => navigation.navigate('Escaner')} style={({ pressed }) => [st.botonEscanear, pressed && { transform: [{ scale: 0.96 }] }]}>
          <Text style={{ fontSize: 46 }}>📷</Text>
          <Text style={st.botonTxt}>Escanear QR</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Text style={st.seccion}>Pacientes recientes</Text>
        {recientes === null ? (
          <ActivityIndicator color={C.primary} />
        ) : recientes.length === 0 ? (
          <Vacio texto="Todavía no escaneaste ningún QR. Los pacientes que veas aparecerán aquí." />
        ) : (
          recientes.map((r, i) => (
            <Aparecer key={r.id} retraso={Math.min(i, 8) * 40}>
              <Pressable onPress={() => navigation.navigate('FichaPaciente', { id: r.id })} style={({ pressed }) => [st.item, pressed && { opacity: 0.7 }]}>
                <View style={st.avatar}>
                  <Text style={st.avatarTxt}>{r.tipoSangre === '?' ? '—' : r.tipoSangre}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.nombre}>{r.nombre}</Text>
                  <Text style={st.sub}>
                    {haceCuanto(r.ultima)} · {r.veces} {r.veces === 1 ? 'vez' : 'veces'}
                  </Text>
                  {r.alergias.length > 0 && (
                    <Text style={st.alergia} numberOfLines={1}>⚠️ {r.alergias.join(', ')}</Text>
                  )}
                </View>
                <Text style={{ color: C.muted, fontSize: 22 }}>›</Text>
              </Pressable>
            </Aparecer>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------- Escáner
export function EscanerScreen({ navigation }: MedProps<'Escaner'>) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [linterna, setLinterna] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const bloqueado = useRef(false);
  const linea = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      bloqueado.current = false;
      setBuscando(false);
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(linea, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(linea, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      a.start();
      return () => a.stop();
    }, [linea]),
  );

  const alEscanear = async ({ data }: BarcodeScanningResult) => {
    if (bloqueado.current) return;
    bloqueado.current = true;
    setBuscando(true);
    try {
      const ficha = await api.post<Ficha>('/api/medico/escanear', { qr: data });
      navigation.replace('FichaPaciente', { id: ficha.paciente.id, desdeEscaneo: true });
    } catch (e) {
      setBuscando(false);
      Alert.alert('No se pudo abrir', mensajeError(e), [{ text: 'Seguir escaneando', onPress: () => (bloqueado.current = false) }]);
    }
  };

  if (!permiso) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!permiso.granted) {
    return (
      <View style={st.permiso}>
        <Text style={{ fontSize: 52, marginBottom: 12 }}>📷</Text>
        <Text style={st.permisoTitulo}>Necesito la cámara</Text>
        <Text style={st.permisoTexto}>Para leer el QR del paciente hay que darle permiso a la cámara.</Text>
        {permiso.canAskAgain ? (
          <Boton titulo="Dar permiso" onPress={pedirPermiso} style={{ alignSelf: 'stretch' }} />
        ) : (
          <Boton titulo="Abrir ajustes" onPress={() => Linking.openSettings()} style={{ alignSelf: 'stretch' }} />
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={linterna}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={buscando ? undefined : alEscanear}
      />
      <View style={st.overlay} pointerEvents="box-none">
        <Text style={st.ayuda}>{buscando ? 'Abriendo ficha…' : 'Apunta al QR del paciente'}</Text>
        <View style={st.marco}>
          <View style={[st.esquina, { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5 }]} />
          <View style={[st.esquina, { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5 }]} />
          <View style={[st.esquina, { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5 }]} />
          <View style={[st.esquina, { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5 }]} />
          {buscando ? (
            <ActivityIndicator size="large" color="#fff" style={{ flex: 1 }} />
          ) : (
            <Animated.View style={[st.laser, { transform: [{ translateY: linea.interpolate({ inputRange: [0, 1], outputRange: [10, 250] }) }] }]} />
          )}
        </View>
        <Boton titulo={linterna ? 'Apagar linterna' : 'Encender linterna'} icono="🔦" variante="secundario" onPress={() => setLinterna((l) => !l)} style={{ marginTop: 32 }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Ficha
export function FichaPacienteScreen({ route, navigation }: MedProps<'FichaPaciente'>) {
  const { id, desdeEscaneo } = route.params;
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);

  const cargar = useCallback(() => {
    setError('');
    api.get<Ficha>(`/api/medico/pacientes/${id}`).then(setFicha).catch((e) => setError(mensajeError(e)));
  }, [id]);
  useFocusEffect(cargar);

  useLayoutEffect(() => {
    navigation.setOptions({ title: desdeEscaneo ? 'Ficha escaneada' : 'Ficha del paciente' });
  }, [navigation, desdeEscaneo]);

  if (error) return <ErrorCaja texto={error} onReintentar={cargar} />;
  if (!ficha) return <Cargando texto="Cargando ficha…" />;

  return (
    <>
      <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 100 }}>
        <FichaView ficha={ficha} onAbrirDoc={(doc) => abrirEnlace(`/api/medico/pacientes/${id}/documentos/${doc}/enlace`)} />
      </ScrollView>

      <Pressable onPress={() => setModal(true)} style={({ pressed }) => [st.fab, pressed && { transform: [{ scale: 0.95 }] }]}>
        <Text style={st.fabTxt}>➕ Registrar consulta</Text>
      </Pressable>

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={st.modalFondo}>
          <View style={st.modal}>
            <View style={st.modalTirador} />
            <ScrollView keyboardShouldPersistTaps="handled">
              <Tarjeta titulo={`Consulta para ${ficha.paciente.nombres}`} icono="🩺">
                <FormEvento
                  textoBoton="Guardar en el historial"
                  onGuardar={async (e) => {
                    setFicha(await api.post<Ficha>(`/api/medico/pacientes/${id}/historial`, e));
                    setModal(false);
                  }}
                />
              </Tarjeta>
              <Boton titulo="Cancelar" variante="fantasma" onPress={() => setModal(false)} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  cabecera: { backgroundColor: C.primary, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 70 },
  hola: { color: '#fff', fontSize: 24, fontWeight: '900' },
  holaSub: { color: '#FFD9DE', fontSize: 14, marginTop: 4, fontWeight: '600' },
  zonaBoton: { alignItems: 'center', marginTop: -56, marginBottom: 24 },
  onda: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: C.primary },
  botonEscanear: { width: 150, height: 150, borderRadius: 75, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  botonTxt: { fontWeight: '900', color: C.primary, marginTop: 4, fontSize: 15 },
  seccion: { fontSize: 13, fontWeight: '800', color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: C.primary, fontWeight: '900', fontSize: 17 },
  nombre: { fontSize: 16, fontWeight: '800', color: C.text },
  sub: { fontSize: 13, color: C.muted, marginTop: 2 },
  alergia: { fontSize: 13, color: C.primary, marginTop: 4, fontWeight: '600' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ayuda: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 24, textShadowColor: '#000', textShadowRadius: 6 },
  marco: { width: 260, height: 260 },
  esquina: { position: 'absolute', width: 44, height: 44, borderColor: '#fff', borderRadius: 4 },
  laser: { position: 'absolute', left: 14, right: 14, height: 3, borderRadius: 2, backgroundColor: '#FF4D5E', shadowColor: '#FF4D5E', shadowOpacity: 1, shadowRadius: 8, elevation: 4 },
  permiso: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  permisoTitulo: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8 },
  permisoTexto: { fontSize: 15, color: C.muted, textAlign: 'center', marginBottom: 24 },
  fab: { position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: C.info, paddingVertical: 15, paddingHorizontal: 24, borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
  modalFondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  modal: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 28, maxHeight: '88%' },
  modalTirador: { width: 44, height: 5, borderRadius: 3, backgroundColor: C.border, alignSelf: 'center', marginBottom: 12 },
});
