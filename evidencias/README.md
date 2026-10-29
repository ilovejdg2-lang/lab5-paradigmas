# Evidencias — Lab 8 US-01

No fabricar capturas. Actualizar estado solo con archivos reales en esta carpeta.

| # | Qué demostrar | Archivo | Estado |
|---|---------------|---------|--------|
| 1 | Aplicación SPA Auth0 | `01-auth0-aplicacion.png` | pendiente |
| 2 | Proveedor social | `02-auth0-social.png` | pendiente |
| 3 | URLs Auth0 / error de callback | `03-auth0-callback-mismatch-localhost3000.png` | **capturado** (Auth0 rechaza `http://localhost:3000` hasta agregarlo en Allowed Callback URLs) |
| 4 | API audience | `04-auth0-api.png` | pendiente |
| 5 | Login local OK | `05-login-local.png` | pendiente (bloqueado por #3) |
| 6 | Identidad local | `06-identidad-local.png` | pendiente |
| 7 | Login Vercel | `07-login-vercel.png` | pendiente |
| 8 | Identidad Vercel | `08-identidad-vercel.png` | pendiente |
| 9 | Logout | `09-logout.png` | pendiente |
| 10 | Cancel/reintento | `10-cancel-reintento.png` | pendiente |
| 11 | Dos usuarios | `11-chat-dos-usuarios.png` | pendiente |

## Verificación navegador (agente, 2026-10-28)

- SDK real cargado: `window.auth0.createAuth0Client` = function.
- Chat oculto sin sesión; botón «Iniciar sesión» visible.
- Clic → redirección real a Auth0 con PKCE (`code_challenge`, `audience=https://una-chat-api`, `redirect_uri=http://localhost:3000`).
- Auth0 respondió: **Callback URL mismatch** — falta autorizar `http://localhost:3000` en la SPA.
