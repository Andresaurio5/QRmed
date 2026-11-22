/** Pantallas cortas del paciente: documentos, historial, accesos y vista previa de su ficha */
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, mensajeError } from '../../api';
import { Acceso, Documento, Evento, Ficha, Perfil, TIPOS_EVENTO, TipoEvento } from '../../types';
import { Boton, Campo, Selector, Tarjeta, Vacio } from '../../components/ui';
import { Aparecer, Cargando, ErrorCaja } from '../../components/extra';
import { GestorDocumentos, abrirEnlace } from '../../components/Documentos';
import FichaView from '../../components/FichaView';
import { fechaValida, formatearFecha, haceCuanto, hoyISO, mascaraFecha } from '../../utils';
import { C } from '../../theme';

export function DocumentosScreen() {
  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Aparecer>
        <GestorDocumentos />
      </Aparecer>
    </ScrollView>
  );
}

/** Formulario para agregar un evento al historial (lo usan paciente y médico) */
export function FormEvento({ onGuardar, textoBoton = 'Agregar al historial' }: { onGuardar: (e: Omit<Evento, 'id' | 'medico' | 'creadoEn'>) => Promise<void>; textoBoton?: string }) {
  const [fecha, setFecha] = useState(hoyISO());
  const [tipo, setTipo] = useState<TipoEvento>('Consulta');
  const [descripcion, setDescripcion] = useState('');
  const [centro, setCentro] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const enviar = async () => {
    if (!fechaValida(fecha) || !fecha) return setError('Fecha inválida (AAAA-MM-DD)');
    if (descripcion.trim().length < 3) return setError('Describe qué pasó');
    setError('');
    setGuardando(true);
    try {
      await onGuardar({ fecha, tipo, descripcion: descripcion.trim(), centro: centro.trim() });
      setDescripcion('');
      setCentro('');
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View>
      <Campo etiqueta="Fecha" value={fecha} onChangeText={(v) => setFecha(mascaraFecha(v))} keyboardType="number-pad" maxLength={10} placeholder="AAAA-MM-DD" />
      <Selector etiqueta="Tipo" opciones={TIPOS_EVENTO} valor={tipo} onChange={setTipo} />
      <Campo etiqueta="Diagnóstico / tratamiento" value={descripcion} onChangeText={setDescripcion} multiline placeholder="Qué pasó y qué se hizo" />
      <Campo etiqueta="Centro de salud" value={centro} onChangeText={setCentro} placeholder="Ej. Hospital Obrero" />
      {error ? <Text style={{ color: C.primary, fontWeight: '700', marginBottom: 10 }}>{error}</Text> : null}
      <Boton titulo={guardando ? 'Guardando…' : textoBoton} icono="➕" onPress={enviar} disabled={guardando} />
    </View>
  );
}

export function HistorialScreen() {
  const [lista, setLista] = useState<Evento[] | null>(null);
  const [abierto, setAbierto] = useState(false);

  const cargar = useCallback(() => {
    api.get<Evento[]>('/api/paciente/historial').then(setLista).catch((e) => Alert.alert('Error', mensajeError(e)));
  }, []);
  useFocusEffect(cargar);

  const borrar = (e: Evento) =>
    Alert.alert('Borrar evento', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => api.del(`/api/paciente/historial/${e.id}`).then(cargar).catch((er) => Alert.alert('Error', mensajeError(er))),
      },
    ]);

  if (!lista) return <Cargando />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {abierto ? (
          <Tarjeta titulo="Nuevo evento" icono="➕">
            <FormEvento
              onGuardar={async (e) => {
                setLista(await api.post<Evento[]>('/api/paciente/historial', e));
                setAbierto(false);
              }}
            />
            <Boton titulo="Cancelar" variante="fantasma" onPress={() => setAbierto(false)} style={{ marginTop: 6 }} />
          </Tarjeta>
        ) : (
          <Boton titulo="Agregar evento" icono="➕" onPress={() => setAbierto(true)} style={{ marginBottom: 16 }} />
        )}

        {lista.length === 0 ? (
          <Vacio texto="Tu historial está vacío. Agrega consultas, cirugías o emergencias pasadas." />
        ) : (
          lista.map((e, i) => (
            <Aparecer key={e.id} retraso={Math.min(i, 8) * 40}>
              <View style={st.evento}>
                <View style={{ flex: 1 }}>
                  <Text style={st.fecha}>
                    {formatearFecha(e.fecha)} · <Text style={{ color: C.primary }}>{e.tipo}</Text>
                  </Text>
                  <Text style={st.desc}>{e.descripcion}</Text>
                  {e.centro ? <Text style={st.sub}>{e.centro}</Text> : null}
                  {e.medico ? <Text style={[st.sub, { color: C.info, fontWeight: '700' }]}>✔ Registrado por {e.medico}</Text> : null}
                </View>
                {!e.medico ? (
                  <Pressable onPress={() => borrar(e)} hitSlop={10}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </Pressable>
                ) : null}
              </View>
            </Aparecer>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AccesosScreen() {
  const [lista, setLista] = useState<Acceso[] | null>(null);
  useFocusEffect(
    useCallback(() => {
      api.get<Acceso[]>('/api/paciente/accesos').then(setLista).catch((e) => Alert.alert('Error', mensajeError(e)));
    }, []),
  );
  if (!lista) return <Cargando />;
  return (
    <FlatList
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      data={lista}
      keyExtractor={(_, i) => String(i)}
      ListHeaderComponent={<Text style={st.intro}>Cada vez que un médico escanea tu QR queda registrado aquí.</Text>}
      ListEmptyComponent={<Vacio texto="Ningún médico ha escaneado tu QR todavía." />}
      renderItem={({ item, index }) => (
        <Aparecer retraso={Math.min(index, 8) * 40}>
          <View style={st.evento}>
            <Text style={{ fontSize: 26 }}>🩺</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.desc}>{item.medico}</Text>
              <Text style={st.sub}>{[item.especialidad, item.centro].filter(Boolean).join(' · ')}</Text>
              <Text style={st.sub}>Matrícula {item.matricula}</Text>
            </View>
            <Text style={st.cuando}>{haceCuanto(item.fecha)}</Text>
          </View>
        </Aparecer>
      )}
    />
  );
}

export function MiFichaScreen() {
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [error, setError] = useState('');
  const cargar = useCallback(() => {
    setError('');
    Promise.all([
      api.get<Perfil>('/api/paciente/perfil'),
      api.get<Evento[]>('/api/paciente/historial'),
      api.get<Documento[]>('/api/paciente/documentos'),
    ])
      .then(([paciente, historial, documentos]) => setFicha({ paciente, historial, documentos }))
      .catch((e) => setError(mensajeError(e)));
  }, []);
  useFocusEffect(cargar);
  if (error) return <ErrorCaja texto={error} onReintentar={cargar} />;
  if (!ficha) return <Cargando />;
  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 30 }}>
      <FichaView ficha={ficha} onAbrirDoc={(id) => abrirEnlace(`/api/paciente/documentos/${id}/enlace`)} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  evento: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 10 },
  fecha: { fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 2 },
  desc: { fontSize: 15, fontWeight: '700', color: C.text },
  sub: { fontSize: 13, color: C.muted, marginTop: 2 },
  intro: { color: C.muted, marginBottom: 14, fontSize: 14 },
  cuando: { fontSize: 12, color: C.muted, fontWeight: '700' },
});
