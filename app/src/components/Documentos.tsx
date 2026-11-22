import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { api, mensajeError } from '../api';
import { CATEGORIAS_DOC, CategoriaDoc, Documento } from '../types';
import { Boton, Campo, Selector, Vacio } from './ui';
import { formatearFecha, pesoArchivo } from '../utils';
import { C } from '../theme';

export const iconoDoc = (mime: string) => (mime === 'application/pdf' ? '📄' : '🖼️');

/** Fila de documento reutilizable (paciente y médico) */
export function FilaDocumento({ d, onAbrir, onBorrar }: { d: Documento; onAbrir: () => void; onBorrar?: () => void }) {
  const [abriendo, setAbriendo] = useState(false);
  return (
    <Pressable
      onPress={async () => {
        setAbriendo(true);
        try {
          await onAbrir();
        } finally {
          setAbriendo(false);
        }
      }}
      style={({ pressed }) => [st.doc, pressed && { opacity: 0.7 }]}
    >
      <View style={st.docIcono}>
        {abriendo ? <ActivityIndicator color={C.primary} /> : <Text style={{ fontSize: 22 }}>{iconoDoc(d.mime)}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.docNombre} numberOfLines={1}>{d.nombre}</Text>
        <Text style={st.docSub}>
          {d.categoria} · {pesoArchivo(d.tamano)} · {formatearFecha(d.creadoEn.slice(0, 10))}
        </Text>
      </View>
      {onBorrar ? (
        <Pressable onPress={onBorrar} hitSlop={12}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export async function abrirEnlace(ruta: string) {
  try {
    const { url } = await api.get<{ url: string }>(ruta);
    await Linking.openURL(url);
  } catch (e) {
    Alert.alert('No se pudo abrir', mensajeError(e));
  }
}

type Archivo = { uri: string; name: string; type: string };

/** Lista + subida de documentos del paciente */
export function GestorDocumentos({ alCambiar }: { alCambiar?: (n: number) => void }) {
  const [docs, setDocs] = useState<Documento[] | null>(null);
  const [categoria, setCategoria] = useState<CategoriaDoc>('Análisis');
  const [nombre, setNombre] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const d = await api.get<Documento[]>('/api/paciente/documentos');
      setDocs(d);
      alCambiar?.(d.length);
    } catch (e) {
      setDocs([]);
      Alert.alert('Error', mensajeError(e));
    }
  }, [alCambiar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const subir = async (a: Archivo) => {
    setSubiendo(true);
    try {
      const form = new FormData();
      // React Native acepta este objeto como archivo en FormData
      form.append('archivo', a as unknown as Blob);
      form.append('categoria', categoria);
      form.append('nombre', nombre.trim() || `${categoria} ${formatearFecha(new Date().toISOString().slice(0, 10))}`);
      await api.subir('/api/paciente/documentos', form);
      setNombre('');
      await cargar();
    } catch (e) {
      Alert.alert('No se pudo subir', mensajeError(e));
    } finally {
      setSubiendo(false);
    }
  };

  const desdeCamara = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permiso', 'Necesito la cámara para fotografiar el documento.');
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled) {
      const a = r.assets[0];
      subir({ uri: a.uri, name: a.fileName || `foto_${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg' });
    }
  };

  const desdeGaleria = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled) {
      const a = r.assets[0];
      subir({ uri: a.uri, name: a.fileName || `imagen_${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg' });
    }
  };

  const desdeArchivos = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (!r.canceled) {
      const a = r.assets[0];
      if (a.size && a.size > 8 * 1024 * 1024) return Alert.alert('Muy pesado', 'El archivo pasa de 8 MB.');
      subir({ uri: a.uri, name: a.name, type: a.mimeType || 'application/pdf' });
    }
  };

  const borrar = (d: Documento) =>
    Alert.alert('Eliminar documento', `¿Borrar "${d.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/api/paciente/documentos/${d.id}`);
            cargar();
          } catch (e) {
            Alert.alert('Error', mensajeError(e));
          }
        },
      },
    ]);

  return (
    <View>
      <View style={st.subida}>
        <Selector etiqueta="¿Qué vas a subir?" opciones={CATEGORIAS_DOC} valor={categoria} onChange={setCategoria} />
        <Campo etiqueta="Nombre (opcional)" value={nombre} onChangeText={setNombre} placeholder="Ej. Hemograma noviembre" />
        {subiendo ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <ActivityIndicator color={C.primary} />
            <Text style={{ color: C.muted, marginTop: 8 }}>Subiendo…</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Boton titulo="Cámara" icono="📸" variante="secundario" onPress={desdeCamara} style={{ flex: 1, paddingHorizontal: 6 }} />
            <Boton titulo="Galería" icono="🖼️" variante="secundario" onPress={desdeGaleria} style={{ flex: 1, paddingHorizontal: 6 }} />
            <Boton titulo="PDF" icono="📄" variante="secundario" onPress={desdeArchivos} style={{ flex: 1, paddingHorizontal: 6 }} />
          </View>
        )}
        <Text style={st.nota}>Imágenes o PDF de hasta 8 MB.</Text>
      </View>

      <Text style={st.titulo}>Tus documentos {docs ? `(${docs.length})` : ''}</Text>
      {docs === null ? (
        <ActivityIndicator color={C.primary} style={{ margin: 16 }} />
      ) : docs.length === 0 ? (
        <Vacio texto="Todavía no subiste ningún documento" />
      ) : (
        docs.map((d) => (
          <FilaDocumento key={d.id} d={d} onAbrir={() => abrirEnlace(`/api/paciente/documentos/${d.id}/enlace`)} onBorrar={() => borrar(d)} />
        ))
      )}
    </View>
  );
}

const st = StyleSheet.create({
  subida: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 18 },
  nota: { color: C.muted, fontSize: 12, marginTop: 10, textAlign: 'center' },
  titulo: { fontWeight: '800', color: C.text, fontSize: 15, marginBottom: 10 },
  doc: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  docIcono: { width: 42, height: 42, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  docNombre: { fontSize: 15, fontWeight: '700', color: C.text },
  docSub: { fontSize: 12, color: C.muted, marginTop: 2 },
});
