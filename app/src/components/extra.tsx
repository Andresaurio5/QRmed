import React, { ReactNode, useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Boton } from './ui';
import { C } from '../theme';

/** Entrada suave: aparece subiendo un poquito */
export function Aparecer({ children, retraso = 0, style }: { children: ReactNode; retraso?: number; style?: ViewStyle }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 380, delay: retraso, useNativeDriver: true }).start();
  }, [v, retraso]);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

export function Cargando({ texto }: { texto?: string }) {
  return (
    <View style={st.cargando}>
      <ActivityIndicator size="large" color={C.primary} />
      {texto ? <Text style={st.cargandoTxt}>{texto}</Text> : null}
    </View>
  );
}

export function BarraProgreso({ valor }: { valor: number }) {
  const v = useRef(new Animated.Value(valor)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: valor, duration: 300, useNativeDriver: false }).start();
  }, [v, valor]);
  return (
    <View style={st.barra}>
      <Animated.View
        style={[st.barraRelleno, { width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
      />
    </View>
  );
}

/** Tarjeta grande clicable del menú */
export function Opcion({
  icono,
  titulo,
  sub,
  onPress,
  color = C.primary,
}: {
  icono: string;
  titulo: string;
  sub?: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.opcion, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}>
      <View style={[st.opcionIcono, { backgroundColor: color + '18' }]}>
        <Text style={{ fontSize: 22 }}>{icono}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.opcionTitulo}>{titulo}</Text>
        {sub ? <Text style={st.opcionSub}>{sub}</Text> : null}
      </View>
      <Text style={{ color: C.muted, fontSize: 22 }}>›</Text>
    </Pressable>
  );
}

/** Editor genérico de listas de objetos (medicamentos, contactos) */
export function ListaObjetos<T extends object>({
  items,
  onChange,
  vacio,
  textoAgregar,
  render,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  vacio: () => T;
  textoAgregar: string;
  render: (item: T, set: (cambios: Partial<T>) => void, index: number) => ReactNode;
}) {
  return (
    <View>
      {items.map((it, i) => (
        <View key={i} style={st.subItem}>
          <View style={st.subCabecera}>
            <Text style={st.subNum}>#{i + 1}</Text>
            <Pressable onPress={() => onChange(items.filter((_, k) => k !== i))} hitSlop={10}>
              <Text style={st.quitar}>Quitar</Text>
            </Pressable>
          </View>
          {render(it, (c) => onChange(items.map((x, k) => (k === i ? { ...x, ...c } : x))), i)}
        </View>
      ))}
      <Boton titulo={textoAgregar} icono="➕" variante="secundario" onPress={() => onChange([...items, vacio()])} />
    </View>
  );
}

export function ErrorCaja({ texto, onReintentar }: { texto: string; onReintentar?: () => void }) {
  return (
    <View style={st.cargando}>
      <Text style={{ fontSize: 40 }}>📡</Text>
      <Text style={[st.cargandoTxt, { color: C.text, fontWeight: '700' }]}>{texto}</Text>
      {onReintentar ? <Boton titulo="Reintentar" onPress={onReintentar} style={{ marginTop: 16, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

const st = StyleSheet.create({
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: C.bg },
  cargandoTxt: { color: C.muted, marginTop: 14, fontSize: 15, textAlign: 'center' },
  barra: { height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' },
  barraRelleno: { height: '100%', backgroundColor: C.primary, borderRadius: 4 },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
  opcionIcono: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  opcionTitulo: { fontSize: 16, fontWeight: '800', color: C.text },
  opcionSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  subItem: { backgroundColor: C.bg, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  subCabecera: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subNum: { fontWeight: '800', color: C.muted },
  quitar: { color: C.primary, fontWeight: '700' },
});
