# UNA Chat — Laboratorio 5 + Lab 8 (US-01 Auth0)

Chat en tiempo real (Express + Socket.IO + HTML/jQuery) con autenticación social vía Auth0 (Authorization Code + PKCE) usando `@auth0/auth0-spa-js`.

**No se realizará el paso 3 del Laboratorio 8: Preparar y utilizar el harness. Por decisión de alcance, no se instalará ni utilizará rsc-harness.**

## Requisitos

- Node.js 18+
- Cuenta Auth0 con una Application tipo **Single Page Application**
- (Producción) Proyecto Vercel + Redis gratuito si hay varias instancias (ver más abajo)

## Estructura relevante

```
server.js              Backend Express + Socket.IO + JWT
server-vercel.js       Entrada Vercel
index.html             UI + puerta de autenticación
public/chat-auth.js    Cliente Auth0 SPA + socket autenticado
libs/unalib.js         Validación de mensajes (Lab 5)
libs/auth-config.js    Variables de entorno
libs/auth-jwt.js       Verificación access token (jose)
libs/redis-adapter.js  Fan-out multi-instancia (opcional)
.env.example           Plantilla de variables
evidencias/            Guía de capturas
```

Memoria del Lab 8 (workspace): desde este repo está en `../../brain/`.

## Ejecución local (Windows / PowerShell)

1. En Cursor, abrí el workspace o la carpeta del proyecto UNA Chat:  
   `lab6-paradigma\my-team-workspace\my-team-workspace\Repos\lab5-paradigmas`
2. Terminal en **esa misma carpeta** (`Repos\lab5-paradigmas`).
3. Dependencias (solo la primera vez o si cambió `package.json`):

```powershell
npm install
```

4. Asegurate de tener `.env` (ya debe existir; si no: `Copy-Item .env.example .env` y completarlo). **No** subas `.env`.
5. Arrancar:

```powershell
npm start
```

6. Navegador: [http://localhost:3000](http://localhost:3000)
7. Detener: en la terminal, `Ctrl+C`. Volver a iniciar: otra vez `npm start` en la misma carpeta.

Si el puerto 3000 está ocupado, cerrá solo el proceso que esté sirviendo UNA Chat o cambiá `PORT` en `.env`.

## Instalación

```powershell
npm install
Copy-Item .env.example .env
```

Completá `.env` (no lo subas al repositorio).

## Variables de entorno

| Variable | Dónde | Descripción |
|----------|--------|-------------|
| `PORT` | servidor | Puerto local (default 3000) |
| `FRONTEND_ORIGIN` | servidor | Origen permitido CORS / Auth0 returnTo |
| `SOCKET_PUBLIC_URL` | servidor → `/auth-config` | URL del socket para el cliente |
| `AUTH0_DOMAIN` | público | Tenant Auth0 |
| `AUTH0_CLIENT_ID` | público | Client ID de la SPA |
| `AUTH0_ISSUER_BASE_URL` | servidor | Emisor JWT, p. ej. `https://TENANT.us.auth0.com/` |
| `AUTH0_AUDIENCE` | ambos | API Identifier (propuesto: `https://una-chat-api`) |
| `REDIS_URL` | servidor | Opcional; obligatorio en Vercel multi-instancia |
| `AUTH_JWT_PUBLIC_KEY` | solo tests | PEM RS256 de prueba (no usar en prod) |

Las variables que alimentan el frontend llegan por `GET /auth-config` (solo datos públicos). Si falta una obligatoria, la API responde error claro.

En Vercel, tras cambiar variables usadas en build/runtime, **redeploy**. No hay `VITE_*` en esta arquitectura.

## Tres configuraciones distintas (no mezclar)

### 1) URLs de la Application Auth0 (SPA)

Dashboard → Applications → tu SPA → Settings:

| Campo | Local | Vercel |
|-------|-------|--------|
| Allowed Callback URLs | `http://localhost:3000` | `https://<VERCEL_DOMAIN>` |
| Allowed Logout URLs | `http://localhost:3000` | `https://<VERCEL_DOMAIN>` |
| Allowed Web Origins | `http://localhost:3000` | `https://<VERCEL_DOMAIN>` |

Separá con comas si van ambos ambientes. Sin comodines amplios.

Si antes tenías `http://localhost:5173`, **reemplazalo por `http://localhost:3000`**.

### 2) Callback del proveedor social → Auth0

No es la URL de UNA Chat. En Authentication → Social → Google (u otro), Auth0 muestra la **Authorized redirect URI** que debés pegar en Google Cloud (o el proveedor). Ejemplo típico Auth0:

`https://dev-no1ya3dw3r0fgsjz.us.auth0.com/login/callback`

### 3) CORS del backend UNA Chat

Controlado por `FRONTEND_ORIGIN` en Express (`Access-Control-Allow-Origin`). Debe coincidir con el origen del navegador (`http://localhost:3000` o `https://<VERCEL_DOMAIN>`). **No** se configura en el mismo formulario de “Allowed Callback URLs” de Auth0.

## API / Audience en Auth0

1. Dashboard → Applications → APIs → Create API (o revisar si ya existe).
2. **Identifier** propuesto: `https://una-chat-api` (no necesita alojar una página).
3. Signing algorithm: RS256.
4. En la SPA → APIs / Authorized, autorizá esta API.
5. Poné el mismo identifier en `AUTH0_AUDIENCE`.

Hasta confirmarlo en el Dashboard, el valor se trata como **propuesto**.

## Proveedor social (Google)

1. Authentication → Social → Google → enable.
2. Si Auth0 pide Client ID/Secret propios de Google Cloud para producción, crealos en Google Cloud Console (OAuth client) y pegá solo en Auth0 (nunca en el frontend ni en el repo).
3. Agregá la redirect URI de Auth0 (sección 2 arriba) en Google.

No marques el criterio de login social como cumplido hasta un login real exitoso.

## Ejecución local

```bash
npm start
```

Abrí `http://localhost:3000`.

## Pruebas

```bash
npm test                 # Mocha: unalib + JWT real (jose RS256)
npm run test:integration # Jest: socket auth + Lab 5
npm run test:e2e         # Playwright (usa tokens de prueba inyectados; no tu contraseña)
```

Las pruebas de auth **firman y verifican JWT** con un par RSA de prueba; no sustituyen el middleware por un “siempre autorizado”.

## Redis / chat entre instancias (Vercel)

En Vercel, dos clientes pueden caer en distintas instancias: `io.emit` en memoria no alcanza. El código usa `@socket.io/redis-adapter` cuando existe `REDIS_URL`.

**Propuesta gratuita (antes de crear el servicio):**

- **Upstash Redis** vía Vercel Marketplace (tier gratuito con límites de comandos/almacenamiento).
- Condiciones típicas del free tier: cuota diaria de comandos, región única, sin SLA de producción enterprise.
- Alternativa: Upstash directo (cuenta free) y pegar `REDIS_URL` (`rediss://...`) en Vercel.

**No se ha creado ni contratado ningún servicio de pago.** Cuando autorices, creá el Redis free, copiá la URL a `REDIS_URL` y redesplegá.

Sin `REDIS_URL`, el chat local (un proceso) funciona; en Vercel multi-instancia los mensajes pueden no verse entre usuarios.

El cliente reconecta con backoff; el servidor desconecta al vencer el `exp` del access token.

## Despliegue en Vercel

1. Importá el repo `lab5-paradigmas` en Vercel (root = este proyecto).
2. Activá **Fluid Compute** si el proyecto es antiguo.
3. Variables de entorno: las de `.env.example` con valores reales + `FRONTEND_ORIGIN`/`SOCKET_PUBLIC_URL` = `https://<VERCEL_DOMAIN>` + `REDIS_URL`.
4. Deploy. Anotá el dominio real y actualizá Auth0 (sección 1).
5. `vercel.json` enruta todo a `server-vercel.js` (`maxDuration` 300).

Hasta probar login + chat entre dos usuarios en ese dominio, el despliegue queda **pendiente de verificación**. URL: `<VERCEL_DOMAIN>` (sin inventar).

## Memoria del laboratorio

Workspace oficial: `my-team-workspace/my-team-workspace/`. Brain: `brain/`. Desde este clon: `../../brain/`.

## Errores frecuentes

| Síntoma | Qué revisar |
|---------|-------------|
| `/auth-config` 500 | Variables Auth0 faltantes en `.env` |
| Redirect mismatch | Callback URLs con `localhost:3000` (no 5173) |
| Socket `AUTH_REQUIRED` | No hay sesión / audience distinto |
| Login OK pero API rechaza token | API Identifier ≠ `AUTH0_AUDIENCE` |
| Usuarios en Vercel no se ven | Falta `REDIS_URL` + adapter |
| Logout y “Atrás” | El access token/sesión del SDK no debe restaurar el socket sin login |

## Aclaración de alcance

**No se realizará el paso 3 del Laboratorio 8: Preparar y utilizar el harness. Por decisión de alcance, no se instalará ni utilizará rsc-harness.**
