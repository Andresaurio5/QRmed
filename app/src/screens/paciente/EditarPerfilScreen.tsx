import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { PacProps } from '../../navigation';
import { api, mensajeError } from '../../api';
import { Perfil } from '../../types';
import { Boton, Selector } from '../../components/ui';
import { Aparecer, Cargando } from '../../components/extra';
import { BloqueContactos, BloqueMedicamentos, BloqueOtros, BloquePersonal, BloqueSalud, BloqueVital, cuerpoPerfil } from '../../components/FormPerfil';
import { fechaValida } from '../../utils';
import { C } from '../../theme';

const SECCIONES = ['Datos', 'Vitales', 'Salud', 'Medicamentos', 'Contactos', 'Otros'] as const;
type Seccion = (typeof SECCIONES)[number];

export default function EditarPerfilScreen({ navigation }: PacProps<'EditarPerfil'>) {
  const [p, setP] = useState<Perfil | null>(null);
  const [seccion, setSeccion] = useState<Seccion>('Datos');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    api.get<Perfil>('/api/paciente/perfil').then(setP).catch((e) => Alert.alert('Error', mensajeError(e)));
  }, []);

  // Si sale con cambios sin guardar, le avisamos
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!cambios || guardando) return;
        e.preventDefault();
        Alert.alert('Cambios sin guardar', '¿Salir sin guardar?', [
          { text: 'Seguir editando', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]);
      }),
    [navigation, cambios, guardando],
  );

  if (!p) return <Cargando />;

  const set = <K extends keyof Perfil>(k: K, v: Perfil[K]) => {
    setCambios(true);
    setP((x) => (x ? { ...x, [k]: v } : x));
  };

  const guardar = async () => {
    const e: Record<string, string> = {};
    if (!p.nombres.trim()) e.nombres = 'Obligatorio';
    if (!p.apellidos.trim()) e.apellidos = 'Obligatorio';
    if (!fechaValida(p.fechaNacimiento)) e.fechaNacimiento = 'Fecha inválida (AAAA-MM-DD)';
    setErrores(e);
    if (Object.keys(e).length) {
      setSeccion('Datos');
      return;
    }
    setGuardando(true);
    try {
      await api.put('/api/paciente/perfil', cuerpoPerfil(p));
      setCambios(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert('No se pudo guardar', mensajeError(err));
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Selector opciones={SECCIONES} valor={seccion} onChange={setSeccion} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <Aparecer key={seccion} style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 }}>
          {seccion === 'Datos' && <BloquePersonal p={p} set={set} errores={errores} />}
          {seccion === 'Vitales' && <BloqueVital p={p} set={set} />}
          {seccion === 'Salud' && <BloqueSalud p={p} set={set} />}
          {seccion === 'Medicamentos' && <BloqueMedicamentos p={p} set={set} />}
          {seccion === 'Contactos' && <BloqueContactos p={p} set={set} />}
          {seccion === 'Otros' && <BloqueOtros p={p} set={set} />}
        </Aparecer>
      </ScrollView>
      <View style={{ padding: 14, paddingBottom: 18, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border }}>
        <Boton titulo={guardando ? 'Guardando…' : 'Guardar cambios'} icono="💾" onPress={guardar} disabled={guardando || !cambios} />
      </View>
    </KeyboardAvoidingView>
  );
}
