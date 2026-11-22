import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PacProps } from '../../navigation';
import { api, mensajeError } from '../../api';
import { useAuth } from '../../auth';
import { Perfil } from '../../types';
import { Aparecer, Cargando, ErrorCaja, Opcion } from '../../components/extra';
import { C } from '../../theme';
import { htmlTarjeta } from './tarjeta';

export default function InicioPacienteScreen({ navigation }: PacProps<'InicioPaciente'>) {
  const { salir } = useAuth();
  const [p, setP] = useState<Perfil | null>(null);
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');
  const [refrescando, setRefrescando] = useState(false);
  const refQR = useRef<any>(null);

  const cargar = useCallback(async () => {
    try {
      setError('');
      const [perfil, codigo] = await Promise.all([
        api.get<Perfil>('/api/paciente/perfil'),
        api.get<{ contenido: string }>('/api/paciente/qr'),
      ]);
      setP(perfil);
      setQr(codigo.contenido);
    } catch (e) {
      setError(mensajeError(e));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          hitSlop={10}
          onPress={() =>
            Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Salir', style: 'destructive', onPress: salir },
            ])
          }
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Salir</Text>
        </Pressable>
      ),
    });
  }, [navigation, salir]);

  const imprimir = () => {
    if (!p || !refQR.current) return;
    refQR.current.toDataURL(async (b64: string) => {
      try {
        const { uri } = await Print.printToFileAsync({ html: htmlTarjeta(p, b64) });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
        else await Print.printAsync({ uri });
      } catch (e) {
        Alert.alert('No se pudo generar el PDF', mensajeError(e));
      }
    });
  };

  const regenerar = () =>
    Alert.alert(
      'Generar un QR nuevo',
      'El QR actual dejará de funcionar (útil si perdiste tu tarjeta). ¿Seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar nuevo',
          style: 'destructive',
          onPress: async () => {
            try {
              const r = await api.post<{ contenido: string }>('/api/paciente/qr/regenerar');
              setQr(r.contenido);
            } catch (e) {
              Alert.alert('Error', mensajeError(e));
            }
          },
        },
      ],
    );

  if (error && !p) return <ErrorCaja texto={error} onReintentar={cargar} />;
  if (!p) return <Cargando texto="Cargando tu ficha…" />;

  return (
    <ScrollView
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={async () => {
            setRefrescando(true);
            await cargar();
            setRefrescando(false);
          }}
          tintColor={C.primary}
        />
      }
    >
      <View style={st.banda} />
      <Aparecer style={st.tarjeta}>
        <Text style={st.hola}>Hola, {p.nombres.split(' ')[0]} 👋</Text>
        <Text style={st.sub}>Este es tu QR médico. Muéstralo o llévalo impreso.</Text>
        <View style={st.qr}>
          {qr ? <QRCode value={qr} size={230} ecl="M" quietZone={10} getRef={(c: any) => (refQR.current = c)} /> : null}
        </View>
        <View style={st.chips}>
          <View style={st.chipSangre}>
            <Text style={st.chipSangreTxt}>🩸 {p.tipoSangre === '?' ? 'Sangre: —' : p.tipoSangre}</Text>
          </View>
          <View style={[st.chipSangre, { backgroundColor: p.alergias.length ? C.primarySoft : C.okSoft }]}>
            <Text style={[st.chipSangreTxt, { color: p.alergias.length ? C.primary : C.ok }]}>
              {p.alergias.length ? `⚠️ ${p.alergias.length} alergia${p.alergias.length > 1 ? 's' : ''}` : '✅ Sin alergias'}
            </Text>
          </View>
        </View>
      </Aparecer>

      <View style={{ paddingHorizontal: 16 }}>
        <Aparecer retraso={120}>
          <Opcion icono="✏️" titulo="Editar mis datos" sub="Alergias, medicamentos, contactos…" onPress={() => navigation.navigate('EditarPerfil')} />
          <Opcion icono="📎" titulo="Mis documentos" sub="Sube análisis, recetas y estudios" onPress={() => navigation.navigate('Documentos')} color={C.info} />
          <Opcion icono="📋" titulo="Mi historial clínico" sub="Consultas, cirugías, emergencias" onPress={() => navigation.navigate('Historial')} color={C.ok} />
          <Opcion icono="👁️" titulo="Ver mi ficha como médico" sub="Así la ven cuando escanean tu QR" onPress={() => navigation.navigate('MiFicha')} color={C.warn} />
          <Opcion icono="🛡️" titulo="Quién vio mi ficha" sub="Médicos que escanearon tu QR" onPress={() => navigation.navigate('Accesos')} color="#7C3AED" />
          <Opcion icono="🖨️" titulo="Imprimir tarjeta QR" sub="PDF tamaño billetera" onPress={imprimir} color={C.text} />
          <Opcion icono="🔄" titulo="Generar QR nuevo" sub="Si perdiste tu tarjeta" onPress={regenerar} color={C.muted} />
        </Aparecer>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  banda: { backgroundColor: C.primary, height: 90, position: 'absolute', top: 0, left: 0, right: 0 },
  tarjeta: { backgroundColor: C.card, margin: 16, borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  hola: { fontSize: 22, fontWeight: '900', color: C.text },
  sub: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 4 },
  qr: { marginVertical: 18, padding: 8, borderRadius: 16, borderWidth: 2, borderColor: C.primarySoft },
  chips: { flexDirection: 'row', gap: 8 },
  chipSangre: { backgroundColor: C.primarySoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipSangreTxt: { fontWeight: '800', color: C.primary },
});
