import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, mensajeError } from '../../api';
import { useAuth } from '../../auth';
import { Perfil } from '../../types';
import { Boton } from '../../components/ui';
import { Aparecer, BarraProgreso, Cargando, ErrorCaja } from '../../components/extra';
import { BloqueContactos, BloqueMedicamentos, BloqueOtros, BloquePersonal, BloqueSalud, BloqueVital, cuerpoPerfil } from '../../components/FormPerfil';
import { GestorDocumentos } from '../../components/Documentos';
import { fechaValida } from '../../utils';
import { C } from '../../theme';

const PASOS = [
  { icono: '🪪', titulo: 'Tus datos', sub: 'Así te van a identificar en una emergencia.' },
  { icono: '🩸', titulo: 'Datos vitales', sub: 'El tipo de sangre es lo primero que buscan.' },
  { icono: '⚠️', titulo: 'Tu salud', sub: 'Alergias, enfermedades y lo que tomas. Si no tienes, sigue de largo.' },
  { icono: '📞', titulo: 'Contactos y seguro', sub: 'A quién llamar y quién te atiende normalmente.' },
  { icono: '📎', titulo: 'Documentos', sub: 'Sube análisis, recetas, rayos X o tu carnet del seguro. Puedes saltarlo y hacerlo después.' },
];

/** Registro guiado: aparece solo la primera vez que el paciente entra */
export default function Registro1Screen() {
  const { refrescar, salir } = useAuth();
  const [p, setP] = useState<Perfil | null>(null);
  const [paso, setPaso] = useState(0);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const cargar = () => {
    setErrorCarga('');
    api.get<Perfil>('/api/paciente/perfil').then(setP).catch((e) => setErrorCarga(mensajeError(e)));
  };
  useEffect(cargar, []);

  if (errorCarga) return <ErrorCaja texto={errorCarga} onReintentar={cargar} />;
  if (!p) return <Cargando texto="Preparando tu registro…" />;

  const set = <K extends keyof Perfil>(k: K, v: Perfil[K]) => setP((x) => (x ? { ...x, [k]: v } : x));

  const validar = () => {
    const e: Record<string, string> = {};
    if (paso === 0) {
      if (!p.nombres.trim()) e.nombres = 'Obligatorio';
      if (!p.apellidos.trim()) e.apellidos = 'Obligatorio';
      if (!fechaValida(p.fechaNacimiento)) e.fechaNacimiento = 'Fecha inválida (AAAA-MM-DD)';
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const siguiente = async () => {
    if (!validar()) return;
    setGuardando(true);
    try {
      const ultimo = paso === PASOS.length - 1;
      // Se guarda en cada paso: si cierra la app no pierde lo que llenó
      const actualizado = await api.put<Perfil>('/api/paciente/perfil', { ...cuerpoPerfil(p), ...(ultimo ? { completar: true } : {}) });
      setP(actualizado);
      if (ultimo) {
        await refrescar(); // perfilCompleto = true → la app pasa a la pantalla del QR
      } else {
        setPaso(paso + 1);
        scroll.current?.scrollTo({ y: 0, animated: false });
      }
    } catch (e) {
      Alert.alert('No se pudo guardar', mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const info = PASOS[paso];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={st.top}>
        <View style={st.topFila}>
          <Text style={st.contador}>Paso {paso + 1} de {PASOS.length}</Text>
          <Text style={st.salir} onPress={salir}>Salir</Text>
        </View>
        <BarraProgreso valor={(paso + 1) / PASOS.length} />
      </View>

      <ScrollView ref={scroll} contentContainerStyle={{ padding: 18, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <Aparecer key={paso}>
          <Text style={st.icono}>{info.icono}</Text>
          <Text style={st.titulo}>{info.titulo}</Text>
          <Text style={st.sub}>{info.sub}</Text>

          <View style={paso === 4 ? undefined : st.caja}>
            {paso === 0 && <BloquePersonal p={p} set={set} errores={errores} />}
            {paso === 1 && <BloqueVital p={p} set={set} />}
            {paso === 2 && (
              <>
                <BloqueSalud p={p} set={set} />
                <Text style={st.subtitulo}>Medicamentos que tomas</Text>
                <BloqueMedicamentos p={p} set={set} />
              </>
            )}
            {paso === 3 && (
              <>
                <BloqueContactos p={p} set={set} />
                <View style={{ height: 18 }} />
                <BloqueOtros p={p} set={set} />
              </>
            )}
            {paso === 4 && <GestorDocumentos />}
          </View>
        </Aparecer>
      </ScrollView>

      <View style={st.pie}>
        {paso > 0 ? (
          <Boton titulo="Atrás" variante="secundario" onPress={() => setPaso(paso - 1)} style={{ flex: 1 }} disabled={guardando} />
        ) : null}
        <Boton
          titulo={guardando ? 'Guardando…' : paso === PASOS.length - 1 ? 'Terminar y ver mi QR' : 'Siguiente'}
          onPress={siguiente}
          disabled={guardando}
          style={{ flex: 2 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  top: { backgroundColor: C.card, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  topFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  contador: { fontWeight: '800', color: C.muted, fontSize: 13 },
  salir: { color: C.primary, fontWeight: '700', fontSize: 13 },
  icono: { fontSize: 40 },
  titulo: { fontSize: 26, fontWeight: '900', color: C.text, marginTop: 6 },
  sub: { fontSize: 15, color: C.muted, marginTop: 4, marginBottom: 18, lineHeight: 21 },
  caja: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 },
  subtitulo: { fontSize: 13, fontWeight: '700', color: C.muted, marginBottom: 8, marginTop: 4 },
  pie: { flexDirection: 'row', gap: 10, padding: 14, paddingBottom: 18, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
});
