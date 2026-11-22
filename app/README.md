# QR Médico

App móvil (Android / iOS) hecha con **Expo + React Native + TypeScript**.
Escaneas el QR de un paciente y te muestra su ficha de emergencia: tipo de sangre,
alergias, condiciones, medicamentos, implantes, contactos (con botón de llamar),
médico, seguro, donante, vacunas e historial clínico.

**Funciona sin internet**: toda la ficha va comprimida dentro del propio QR.

## Funciones

- 📷 **Escáner QR** con linterna y manejo de permisos de cámara.
- 🩸 **Ficha de emergencia**: cabecera roja con nombre, edad, CI y tipo de sangre en grande;
  alergias resaltadas en rojo; contactos con botón "Llamar"; historial en línea de tiempo.
- ➕ **Registro de pacientes** con formulario completo (validación de fechas y obligatorios).
- 🔳 **Generador de QR** + **tarjeta imprimible en PDF** (tamaño tarjeta de crédito, anverso y reverso).
- 🗂️ **Lista de pacientes** guardados en el celular, con buscador por nombre o CI.
- 💾 Un QR escaneado se puede guardar en tus pacientes.
- Paciente de ejemplo para probar rápido (botón en la lista vacía).

## Correrla en tu celular (modo desarrollo)

```bash
npm install
npx expo start
```

Instala **Expo Go** en tu Android, escanea el QR que sale en la terminal y listo.
(Tu PC y el celular tienen que estar en la misma red Wi-Fi; si no, usa `npx expo start --tunnel`.)

## Generar el APK para descargar e instalar

Con EAS Build (gratis, compila en la nube de Expo):

```bash
npm install -g eas-cli
eas login                     # creas una cuenta gratis en expo.dev
eas build:configure           # elige Android
```

En el `eas.json` que se crea, deja el perfil `preview` así para que salga **APK** (no AAB):

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "distribution": "internal"
    }
  }
}
```

Y compilas:

```bash
eas build -p android --profile preview
```

Al terminar te da un link para descargar el `.apk`; lo pasas al celular e instalas
(activa "instalar apps de origen desconocido").

### Alternativa local (sin EAS)

Necesitas Android Studio + JDK 17:

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# APK en android/app/build/outputs/apk/release/
```

## Estructura

```
App.tsx                    Navegación (stack)
src/
  types.ts                 Modelo de datos del paciente
  codec.ts                 Codificar / decodificar la ficha en el QR (lz-string)
  storage.ts               Guardado local (AsyncStorage)
  utils.ts                 Edad, IMC, fechas, teléfonos
  demo.ts                  Paciente de ejemplo
  theme.ts                 Colores
  components/ui.tsx        Tarjetas, botones, campos, chips, selectores
  screens/
    InicioScreen.tsx
    EscanerScreen.tsx
    FichaScreen.tsx
    PacientesScreen.tsx
    EditarScreen.tsx
    QRScreen.tsx           QR + PDF imprimible
```

## Cómo va la info dentro del QR

1. El paciente se convierte a JSON con claves cortas y sin campos vacíos.
2. Se comprime con `lz-string` y se le pone el prefijo `QRMED1:`.
3. Un QR aguanta ~2.900 caracteres; una ficha normal usa ~900.
   Si el historial es enorme, se dejan fuera los eventos **más antiguos**
   (la app avisa). Lo crítico (sangre, alergias, medicamentos, contactos) siempre va.

## Ideas para la versión 2

- **Cifrado con PIN** (AES) para que solo el personal con la app/clave pueda leer el QR.
- **Backend** (Firebase / Supabase): el QR lleva solo un ID y el historial completo vive en la nube.
- Foto del paciente, exportar/importar respaldo, modo oscuro, selector de fechas nativo.
