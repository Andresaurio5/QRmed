/**
 * Bloques del formulario del paciente. Se usan en el registro guiado (uno por paso)
 * y en "Editar datos" (todos juntos).
 */
import React from 'react';
import { View } from 'react-native';
import { Contacto, Medicamento, Perfil, Sexo, TIPOS_SANGRE } from '../types';
import { Campo, ListaTexto, Selector } from './ui';
import { ListaObjetos } from './extra';
import { mascaraFecha } from '../utils';

export type SetPerfil = <K extends keyof Perfil>(k: K, v: Perfil[K]) => void;
type P = { p: Perfil; set: SetPerfil; errores?: Record<string, string> };

export function BloquePersonal({ p, set, errores = {} }: P) {
  return (
    <>
      <Campo etiqueta="Nombres *" value={p.nombres} onChangeText={(v) => set('nombres', v)} error={errores.nombres} placeholder="Ej. María Fernanda" />
      <Campo etiqueta="Apellidos *" value={p.apellidos} onChangeText={(v) => set('apellidos', v)} error={errores.apellidos} placeholder="Ej. Quiroga Mamani" />
      <Campo etiqueta="Carnet de identidad" value={p.documento} onChangeText={(v) => set('documento', v)} placeholder="Ej. 8456123 LP" />
      <Campo
        etiqueta="Fecha de nacimiento"
        value={p.fechaNacimiento}
        onChangeText={(v) => set('fechaNacimiento', mascaraFecha(v))}
        error={errores.fechaNacimiento}
        placeholder="AAAA-MM-DD"
        keyboardType="number-pad"
        maxLength={10}
      />
      <Selector<Sexo | 'N/E'>
        etiqueta="Sexo"
        opciones={['M', 'F', 'O', 'N/E']}
        valor={p.sexo || 'N/E'}
        onChange={(v) => set('sexo', v === 'N/E' ? '' : v)}
        textoDe={(v) => ({ M: 'Masculino', F: 'Femenino', O: 'Otro', 'N/E': 'Prefiero no decir', '': '' })[v]}
      />
    </>
  );
}

export function BloqueVital({ p, set }: P) {
  return (
    <>
      <Selector etiqueta="Tipo de sangre" opciones={TIPOS_SANGRE} valor={p.tipoSangre} onChange={(v) => set('tipoSangre', v)} textoDe={(v) => (v === '?' ? 'No sé' : v)} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Campo etiqueta="Peso (kg)" value={p.pesoKg} onChangeText={(v) => set('pesoKg', v)} keyboardType="decimal-pad" placeholder="62" />
        </View>
        <View style={{ flex: 1 }}>
          <Campo etiqueta="Altura (cm)" value={p.alturaCm} onChangeText={(v) => set('alturaCm', v)} keyboardType="decimal-pad" placeholder="160" />
        </View>
      </View>
      <Selector<'Sí' | 'No' | 'N/E'>
        etiqueta="¿Donante de órganos?"
        opciones={['Sí', 'No', 'N/E']}
        valor={p.donante === null ? 'N/E' : p.donante ? 'Sí' : 'No'}
        onChange={(v) => set('donante', v === 'N/E' ? null : v === 'Sí')}
        textoDe={(v) => (v === 'N/E' ? 'No especificar' : v)}
      />
    </>
  );
}

export function BloqueSalud({ p, set }: P) {
  return (
    <>
      <ListaTexto etiqueta="Alergias (medicamentos, alimentos, látex…)" items={p.alergias} onChange={(v) => set('alergias', v)} placeholder="Ej. Penicilina" tono="peligro" />
      <ListaTexto etiqueta="Enfermedades o condiciones crónicas" items={p.condiciones} onChange={(v) => set('condiciones', v)} placeholder="Ej. Diabetes, Asma, Epilepsia" tono="aviso" />
      <ListaTexto etiqueta="Implantes / dispositivos" items={p.dispositivos} onChange={(v) => set('dispositivos', v)} placeholder="Ej. Marcapasos" tono="aviso" />
      <ListaTexto etiqueta="Vacunas" items={p.vacunas} onChange={(v) => set('vacunas', v)} placeholder="Ej. Tétanos 2024" />
    </>
  );
}

export function BloqueMedicamentos({ p, set }: P) {
  return (
    <ListaObjetos<Medicamento>
      items={p.medicamentos}
      onChange={(v) => set('medicamentos', v)}
      vacio={() => ({ nombre: '', dosis: '', frecuencia: '' })}
      textoAgregar="Agregar medicamento"
      render={(m, upd) => (
        <>
          <Campo etiqueta="Medicamento" value={m.nombre} onChangeText={(v) => upd({ nombre: v })} placeholder="Ej. Metformina" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Campo etiqueta="Dosis" value={m.dosis} onChangeText={(v) => upd({ dosis: v })} placeholder="850 mg" />
            </View>
            <View style={{ flex: 1 }}>
              <Campo etiqueta="Frecuencia" value={m.frecuencia} onChangeText={(v) => upd({ frecuencia: v })} placeholder="Cada 12 h" />
            </View>
          </View>
        </>
      )}
    />
  );
}

export function BloqueContactos({ p, set }: P) {
  return (
    <ListaObjetos<Contacto>
      items={p.contactos}
      onChange={(v) => set('contactos', v)}
      vacio={() => ({ nombre: '', relacion: '', telefono: '' })}
      textoAgregar="Agregar contacto de emergencia"
      render={(c, upd) => (
        <>
          <Campo etiqueta="Nombre" value={c.nombre} onChangeText={(v) => upd({ nombre: v })} placeholder="Ej. Jorge Quiroga" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Campo etiqueta="Relación" value={c.relacion} onChangeText={(v) => upd({ relacion: v })} placeholder="Padre" />
            </View>
            <View style={{ flex: 1.3 }}>
              <Campo etiqueta="Teléfono" value={c.telefono} onChangeText={(v) => upd({ telefono: v })} keyboardType="phone-pad" placeholder="+591 7…" />
            </View>
          </View>
        </>
      )}
    />
  );
}

export function BloqueOtros({ p, set }: P) {
  return (
    <>
      <Campo etiqueta="Médico de cabecera" value={p.medicoNombre} onChangeText={(v) => set('medicoNombre', v)} placeholder="Dr./Dra. y especialidad" />
      <Campo etiqueta="Teléfono del médico" value={p.medicoTelefono} onChangeText={(v) => set('medicoTelefono', v)} keyboardType="phone-pad" />
      <Campo etiqueta="Seguro médico / matrícula" value={p.seguro} onChangeText={(v) => set('seguro', v)} placeholder="Ej. CNS — Mat. 12-3456" />
      <Campo
        etiqueta="Indicaciones especiales para una emergencia"
        value={p.notas}
        onChangeText={(v) => set('notas', v)}
        multiline
        placeholder="Ej. Anafilaxia previa, llevo epinefrina en el bolso…"
      />
    </>
  );
}

/** Lo que se manda al servidor (sin id ni campos calculados) */
export function cuerpoPerfil(p: Perfil) {
  const { id, perfilCompleto, actualizado, ...resto } = p;
  return {
    ...resto,
    medicamentos: p.medicamentos.filter((m) => m.nombre.trim()),
    contactos: p.contactos.filter((c) => c.nombre.trim() || c.telefono.trim()),
  };
}
