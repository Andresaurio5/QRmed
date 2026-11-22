import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ficha } from '../types';
import { Chip, Fila, Tarjeta, Vacio } from './ui';
import { Aparecer } from './extra';
import { FilaDocumento } from './Documentos';
import { calcularEdad, formatearFecha, imc, telLimpio, textoSexo } from '../utils';
import { C } from '../theme';

const llamar = (tel: string) => {
  const t = telLimpio(tel);
  if (t) Linking.openURL(`tel:${t}`);
};

/** Ficha médica completa. La usa el médico al escanear y el paciente para ver cómo se ve la suya. */
export default function FichaView({
  ficha,
  onAbrirDoc,
  pie,
}: {
  ficha: Ficha;
  onAbrirDoc?: (docId: string) => Promise<void>;
  pie?: React.ReactNode;
}) {
  const p = ficha.paciente;
  const edad = calcularEdad(p.fechaNacimiento);
  const indice = imc(p.pesoKg, p.alturaCm);

  return (
    <View>
      {/* Cabecera: lo primero que tiene que ver quien atiende */}
      <View style={st.cabecera}>
        <View style={{ flex: 1 }}>
          <Text style={st.nombre}>{p.nombres}</Text>
          <Text style={st.apellido}>{p.apellidos}</Text>
          <Text style={st.meta}>
            {[edad !== null ? `${edad} años` : null, textoSexo(p.sexo), p.documento ? `CI ${p.documento}` : null]
              .filter(Boolean)
              .join('  ·  ')}
          </Text>
        </View>
        <View style={st.sangre}>
          <Text style={st.sangreEtiqueta}>SANGRE</Text>
          <Text style={st.sangreValor}>{p.tipoSangre === '?' ? '—' : p.tipoSangre}</Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <Aparecer>
          {p.alergias.length > 0 ? (
            <Tarjeta titulo="Alergias" icono="⚠️" tono="peligro">
              <View style={st.chips}>
                {p.alergias.map((a) => (
                  <Chip key={a} texto={a} tono="peligro" />
                ))}
              </View>
            </Tarjeta>
          ) : (
            <Tarjeta titulo="Alergias" icono="✅" tono="ok">
              <Text style={{ color: C.ok, fontWeight: '600' }}>Sin alergias conocidas</Text>
            </Tarjeta>
          )}

          {p.notas ? (
            <Tarjeta titulo="Indicaciones especiales" icono="📌" tono="aviso">
              <Text style={st.parrafo}>{p.notas}</Text>
            </Tarjeta>
          ) : null}
        </Aparecer>

        <Aparecer retraso={80}>
          <Tarjeta titulo="Contactos de emergencia" icono="📞" tono="info">
            {p.contactos.length === 0 ? (
              <Vacio texto="Sin contactos registrados" />
            ) : (
              p.contactos.map((c, i) => (
                <Pressable key={i} onPress={() => llamar(c.telefono)} style={st.contacto}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.contactoNombre}>{c.nombre}</Text>
                    <Text style={st.contactoSub}>{[c.relacion, c.telefono].filter(Boolean).join(' · ')}</Text>
                  </View>
                  {c.telefono ? <Text style={st.llamar}>Llamar</Text> : null}
                </Pressable>
              ))
            )}
          </Tarjeta>

          <Tarjeta titulo="Condiciones / enfermedades" icono="🩺">
            {p.condiciones.length ? (
              <View style={st.chips}>
                {p.condiciones.map((c) => (
                  <Chip key={c} texto={c} tono="aviso" />
                ))}
              </View>
            ) : (
              <Vacio texto="Ninguna registrada" />
            )}
          </Tarjeta>

          <Tarjeta titulo="Medicamentos actuales" icono="💊">
            {p.medicamentos.length ? (
              p.medicamentos.map((m, i) => (
                <View key={i} style={[st.item, i > 0 && st.itemBorde]}>
                  <Text style={st.itemTitulo}>{m.nombre}</Text>
                  <Text style={st.itemSub}>{[m.dosis, m.frecuencia].filter(Boolean).join(' · ')}</Text>
                </View>
              ))
            ) : (
              <Vacio texto="No toma medicamentos" />
            )}
          </Tarjeta>

          {p.dispositivos.length > 0 && (
            <Tarjeta titulo="Implantes / dispositivos" icono="🔋" tono="aviso">
              <View style={st.chips}>
                {p.dispositivos.map((d) => (
                  <Chip key={d} texto={d} tono="aviso" />
                ))}
              </View>
            </Tarjeta>
          )}
        </Aparecer>

        <Aparecer retraso={160}>
          <Tarjeta titulo="Datos generales" icono="🧾">
            <Fila etiqueta="Fecha de nacimiento" valor={formatearFecha(p.fechaNacimiento)} />
            <Fila etiqueta="Peso" valor={p.pesoKg ? `${p.pesoKg} kg` : ''} />
            <Fila etiqueta="Altura" valor={p.alturaCm ? `${p.alturaCm} cm` : ''} />
            <Fila etiqueta="IMC" valor={indice} />
            <Fila etiqueta="Donante de órganos" valor={p.donante === null ? 'No especificado' : p.donante ? 'Sí' : 'No'} />
            <Fila etiqueta="Seguro médico" valor={p.seguro} />
            <Fila etiqueta="Médico de cabecera" valor={p.medicoNombre} />
            {p.medicoTelefono ? (
              <Pressable onPress={() => llamar(p.medicoTelefono)}>
                <Fila etiqueta="Tel. médico" valor={`${p.medicoTelefono}  📞`} />
              </Pressable>
            ) : null}
          </Tarjeta>

          <Tarjeta titulo="Vacunas" icono="💉">
            {p.vacunas.length ? (
              <View style={st.chips}>
                {p.vacunas.map((v) => (
                  <Chip key={v} texto={v} />
                ))}
              </View>
            ) : (
              <Vacio texto="Sin registro" />
            )}
          </Tarjeta>

          <Tarjeta titulo={`Documentos (${ficha.documentos.length})`} icono="📎">
            {ficha.documentos.length === 0 ? (
              <Vacio texto="El paciente no subió documentos" />
            ) : (
              ficha.documentos.map((d) => (
                <FilaDocumento key={d.id} d={d} onAbrir={() => (onAbrirDoc ? onAbrirDoc(d.id) : Promise.resolve())} />
              ))
            )}
          </Tarjeta>

          <Tarjeta titulo="Historial clínico" icono="📋">
            {ficha.historial.length === 0 ? (
              <Vacio texto="Sin eventos registrados" />
            ) : (
              ficha.historial.map((e, i) => (
                <View key={e.id} style={st.evento}>
                  <View style={st.linea}>
                    <View style={[st.punto, e.medico ? { backgroundColor: C.info } : null]} />
                    {i < ficha.historial.length - 1 && <View style={st.lineaV} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 14 }}>
                    <Text style={st.eventoFecha}>
                      {formatearFecha(e.fecha)} · <Text style={{ color: C.primary }}>{e.tipo}</Text>
                    </Text>
                    <Text style={st.itemTitulo}>{e.descripcion}</Text>
                    {e.centro ? <Text style={st.itemSub}>{e.centro}</Text> : null}
                    {e.medico ? <Text style={[st.itemSub, { color: C.info, fontWeight: '700' }]}>✔ Registrado por {e.medico}</Text> : null}
                  </View>
                </View>
              ))
            )}
          </Tarjeta>

          <Text style={st.actualizado}>Ficha actualizada el {formatearFecha(String(p.actualizado).slice(0, 10))}</Text>
          {pie}
        </Aparecer>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  cabecera: { backgroundColor: C.primary, padding: 20, paddingTop: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  nombre: { color: '#fff', fontSize: 24, fontWeight: '900' },
  apellido: { color: '#fff', fontSize: 20, fontWeight: '600', opacity: 0.95 },
  meta: { color: '#FFD9DE', fontSize: 14, marginTop: 6, fontWeight: '600' },
  sangre: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', minWidth: 92 },
  sangreEtiqueta: { fontSize: 11, fontWeight: '800', color: C.primaryDark, letterSpacing: 1 },
  sangreValor: { fontSize: 34, fontWeight: '900', color: C.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  parrafo: { color: C.text, fontSize: 15, lineHeight: 22 },
  contacto: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  contactoNombre: { fontSize: 16, fontWeight: '700', color: C.text },
  contactoSub: { fontSize: 14, color: C.muted, marginTop: 2 },
  llamar: { backgroundColor: C.info, color: '#fff', fontWeight: '800', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, overflow: 'hidden' },
  item: { paddingVertical: 8 },
  itemBorde: { borderTopWidth: 1, borderTopColor: C.border },
  itemTitulo: { fontSize: 15, fontWeight: '700', color: C.text },
  itemSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  evento: { flexDirection: 'row' },
  linea: { width: 20, alignItems: 'center' },
  punto: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary, marginTop: 4 },
  lineaV: { flex: 1, width: 2, backgroundColor: C.border, marginTop: 2 },
  eventoFecha: { fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 2 },
  actualizado: { textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 4, marginBottom: 12 },
});
