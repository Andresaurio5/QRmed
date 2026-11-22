# QRmed — Ficha médica de emergencia con QR

App móvil con **dos perfiles**:

- **Paciente:** la primera vez se registra paso a paso (datos personales, tipo de sangre, alergias,
  enfermedades, medicamentos, contactos de emergencia, seguro) y **sube sus documentos**
  (fotos o PDF de análisis, recetas, rayos X, carnet del seguro…). Después, cada vez que entra,
  ve **su QR** y puede editar datos, administrar documentos, llevar su historial, imprimir una
  tarjeta en PDF y ver **qué médicos escanearon su ficha**.
- **Médico:** escanea el QR y ve la ficha completa (alergias resaltadas, contactos con botón de
  llamar, medicamentos, historial, documentos). Puede **registrar consultas** en el historial del paciente.

## Arquitectura

```
app/       App móvil — Expo + React Native + TypeScript
backend/   API REST — Node.js + Express + PostgreSQL
Dockerfile           Imagen del backend (la usa Render)
docker-compose.yml   Backend + Postgres para correr en local
render.yaml          Configuración del servicio en Render
```

| Pieza | Servicio |
|---|---|
| Código | GitHub |
| Base de datos (PostgreSQL) | Neon |
| Backend (contenedor Docker) | Render |
| Compilación del APK | Expo EAS Build |

### Seguridad

- Contraseñas con **bcrypt**, sesiones con **JWT** (30 días), guardadas en el celular con **SecureStore**.
- El QR **no contiene datos médicos**: solo un enlace con un token aleatorio. Sin cuenta de médico no se ve nada.
- El paciente puede **generar un QR nuevo** y el anterior deja de funcionar.
- Un médico solo puede volver a abrir una ficha si escaneó ese QR antes. Cada escaneo queda registrado.
- Los documentos se guardan en la base de datos y se abren con **enlaces firmados que vencen en 10 minutos**.

### Base de datos

`usuarios`, `medicos`, `pacientes`, `historial`, `documentos`, `accesos`.
Las tablas se crean solas al arrancar el backend (`backend/src/db.js`).

## Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Médico | medico@qrmedico.bo | `Medico123*` |
| Paciente | paciente@qrmedico.bo | `Paciente123*` |

## Correr en local

```bash
# Backend + base de datos
docker compose up --build        # API en http://localhost:3000

# App
cd app
npm install
echo "EXPO_PUBLIC_API_URL=http://IP-DE-TU-PC:3000" > .env
npx expo start                   # escanea con Expo Go
```

## Descargar la app (Android)

👉 **https://github.com/Andresaurio5/QRmed/releases/latest/download/QRmed.apk**

GitHub Actions compila el APK automáticamente cada vez que cambia la carpeta `app/`
(`.github/workflows/android.yml`) y lo publica en *Releases*.
También se puede compilar con Expo EAS: `cd app && npx eas-cli build -p android --profile preview`.

## API

| Método | Ruta | Quién |
|---|---|---|
| POST | `/api/auth/registro` · `/api/auth/login` | todos |
| GET | `/api/auth/yo` | con sesión |
| GET/PUT | `/api/paciente/perfil` | paciente |
| GET | `/api/paciente/qr` · POST `/api/paciente/qr/regenerar` | paciente |
| GET/POST/DELETE | `/api/paciente/historial` | paciente |
| GET/POST/DELETE | `/api/paciente/documentos` | paciente |
| GET | `/api/paciente/accesos` | paciente |
| POST | `/api/medico/escanear` | médico |
| GET | `/api/medico/pacientes/:id` · `/api/medico/recientes` | médico |
| POST | `/api/medico/pacientes/:id/historial` | médico |
