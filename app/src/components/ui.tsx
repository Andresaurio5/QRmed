import React, { ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { C, R } from '../theme';

type Tono = 'normal' | 'peligro' | 'ok' | 'aviso' | 'info';

const tonos: Record<Tono, { bg: string; borde: string; titulo: string }> = {
  normal: { bg: C.card, borde: C.border, titulo: C.text },
  peligro: { bg: C.primarySoft, borde: '#F5B5BE', titulo: C.primaryDark },
  ok: { bg: C.okSoft, borde: '#B7E1C3', titulo: C.ok },
  aviso: { bg: C.warnSoft, borde: '#F6D29C', titulo: C.warn },
  info: { bg: C.infoSoft, borde: '#C3D3FB', titulo: C.info },
};

export function Tarjeta({
  titulo,
  icono,
  tono = 'normal',
  children,
  style,
}: {
  titulo?: string;
  icono?: string;
  tono?: Tono;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const t = tonos[tono];
  return (
    <View style={[s.tarjeta, { backgroundColor: t.bg, borderColor: t.borde }, style]}>
      {titulo ? (
        <Text style={[s.tarjetaTitulo, { color: t.titulo }]}>
          {icono ? `${icono}  ` : ''}
          {titulo.toUpperCase()}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export function Fila({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <View style={s.fila}>
      <Text style={s.filaEtiqueta}>{etiqueta}</Text>
      <Text style={s.filaValor}>{valor}</Text>
    </View>
  );
}

export function Chip({ texto, tono = 'normal', onQuitar }: { texto: string; tono?: Tono; onQuitar?: () => void }) {
  const t = tonos[tono];
  return (
    <View style={[s.chip, { backgroundColor: tono === 'normal' ? C.bg : t.bg, borderColor: t.borde }]}>
      <Text style={[s.chipTexto, { color: tono === 'normal' ? C.text : t.titulo }]}>{texto}</Text>
      {onQuitar ? (
        <Pressable onPress={onQuitar} hitSlop={10}>
          <Text style={[s.chipX, { color: t.titulo }]}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return <Text style={s.vacio}>{texto}</Text>;
}

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro';

export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  icono,
  grande,
  style,
  disabled,
}: {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icono?: string;
  grande?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const v = {
    primario: { bg: C.primary, fg: '#fff', borde: C.primary },
    secundario: { bg: C.card, fg: C.text, borde: C.border },
    fantasma: { bg: 'transparent', fg: C.primary, borde: 'transparent' },
    peligro: { bg: C.card, fg: C.primary, borde: '#F5B5BE' },
  }[variante];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.boton,
        grande && s.botonGrande,
        { backgroundColor: v.bg, borderColor: v.borde, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <Text style={[s.botonTexto, grande && s.botonTextoGrande, { color: v.fg }]}>
        {icono ? `${icono}  ` : ''}
        {titulo}
      </Text>
    </Pressable>
  );
}

export function Campo({ etiqueta, error, ...props }: TextInputProps & { etiqueta: string; error?: string }) {
  return (
    <View style={s.campo}>
      <Text style={s.campoEtiqueta}>{etiqueta}</Text>
      <TextInput
        placeholderTextColor="#94A3B8"
        {...props}
        style={[s.input, props.multiline && { minHeight: 80, textAlignVertical: 'top' }, error ? { borderColor: C.primary } : null, props.style]}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

export function Selector<T extends string>({
  etiqueta,
  opciones,
  valor,
  onChange,
  textoDe,
}: {
  etiqueta?: string;
  opciones: readonly T[];
  valor: T;
  onChange: (v: T) => void;
  textoDe?: (v: T) => string;
}) {
  return (
    <View style={s.campo}>
      {etiqueta ? <Text style={s.campoEtiqueta}>{etiqueta}</Text> : null}
      <View style={s.selector}>
        {opciones.map((o) => {
          const activo = o === valor;
          return (
            <Pressable
              key={o}
              onPress={() => onChange(o)}
              style={[s.opcion, activo && { backgroundColor: C.primary, borderColor: C.primary }]}
            >
              <Text style={[s.opcionTexto, activo && { color: '#fff' }]}>{textoDe ? textoDe(o) : o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Editor de listas de texto (alergias, condiciones, vacunas...) */
export function ListaTexto({
  etiqueta,
  items,
  onChange,
  placeholder,
  tono,
}: {
  etiqueta: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  tono?: Tono;
}) {
  const [texto, setTexto] = useState('');
  const agregar = () => {
    const t = texto.trim();
    if (!t) return;
    if (!items.some((i) => i.toLowerCase() === t.toLowerCase())) onChange([...items, t]);
    setTexto('');
  };
  return (
    <View style={s.campo}>
      <Text style={s.campoEtiqueta}>{etiqueta}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          onSubmitEditing={agregar}
          returnKeyType="done"
          blurOnSubmit={false}
          style={[s.input, { flex: 1 }]}
        />
        <Pressable onPress={agregar} style={s.botonMas}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>+</Text>
        </Pressable>
      </View>
      {items.length > 0 ? (
        <View style={[s.chips, { marginTop: 8 }]}>
          {items.map((i, idx) => (
            <Chip key={i + idx} texto={i} tono={tono} onQuitar={() => onChange(items.filter((_, k) => k !== idx))} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const s = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: R.md, padding: 14, marginBottom: 12 },
  tarjetaTitulo: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: 12 },
  filaEtiqueta: { color: C.muted, fontSize: 14 },
  filaValor: { color: C.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipTexto: { fontSize: 14, fontWeight: '600' },
  chipX: { fontSize: 13, fontWeight: '700' },
  vacio: { color: C.muted, fontStyle: 'italic', fontSize: 14 },
  boton: { borderWidth: 1, borderRadius: R.md, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  botonGrande: { paddingVertical: 18, borderRadius: R.lg },
  botonTexto: { fontSize: 15, fontWeight: '700' },
  botonTextoGrande: { fontSize: 18 },
  campo: { marginBottom: 14 },
  campoEtiqueta: { fontSize: 13, fontWeight: '700', color: C.muted, marginBottom: 6 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: C.text },
  error: { color: C.primary, fontSize: 12, marginTop: 4 },
  selector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: R.sm, paddingVertical: 8, paddingHorizontal: 14 },
  opcionTexto: { fontSize: 14, fontWeight: '700', color: C.text },
  botonMas: { backgroundColor: C.primary, width: 46, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center' },
});
