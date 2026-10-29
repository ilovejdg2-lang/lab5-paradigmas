# Acciones manuales (Auth0 + Vercel + Redis)

Este archivo resume lo que **debe hacer la persona** en consolas externas. El código ya está preparado.

## A) Actualizar URLs de la Application Auth0 (SPA)

1. Entrá a [Auth0 Dashboard](https://manage.auth0.com/) → Applications → **Proyecto** (SPA).
2. Settings → reemplazá `http://localhost:5173` por:

| Campo | Valor local | Valor Vercel (cuando exista) |
|-------|-------------|------------------------------|
| Allowed Callback URLs | `http://localhost:3000` | `https://<VERCEL_DOMAIN>` |
| Allowed Logout URLs | `http://localhost:3000` | `https://<VERCEL_DOMAIN>` |
| Allowed Web Origins | `http://localhost:3000` | `https://<VERCEL_DOMAIN>` |

3. Save Changes.

## B) Verificar o crear la API (audience)

1. Applications → APIs.
2. Si no hay una API adecuada: **Create API**.
   - Name: `UNA Chat API`
   - Identifier: `https://una-chat-api` (no es una web alojada)
   - Signing Algorithm: RS256
3. Confirmá que el Identifier coincide con `AUTH0_AUDIENCE` en `.env`.
4. En la SPA, autorizá esa API (Permissions / Authorized APIs según la UI).

## C) Proveedor social (Google)

1. Authentication → Social → **Google** → Enable.
2. Si pide credenciales propias: Google Cloud Console → OAuth client → redirect URI que muestra Auth0  
   (`https://dev-no1ya3dw3r0fgsjz.us.auth0.com/login/callback`).  
   Pegá Client ID/Secret **solo en Auth0**, nunca en el repo.
3. Probá login en `http://localhost:3000`.

## D) Redis gratuito (antes de crear — condiciones)

Para que dos usuarios en **distintas instancias** de Vercel se vean:

- Opción: **Upstash Redis** (Marketplace de Vercel o upstash.com), plan **free**.
- Condiciones típicas del free: límite de comandos/día, almacenamiento pequeño, una región.
- **No se ha creado el servicio desde el agente.** Cuando lo creés:
  1. Copiá la URL `rediss://...`
  2. Pegala en Vercel como `REDIS_URL` y en `.env` local si querés probar
  3. Redeploy

El código ya usa `@socket.io/redis-adapter` si `REDIS_URL` está definida.

## E) Vercel

1. `vercel login` (o Import Git en el dashboard) sobre `lab5-paradigmas`.
2. Fluid Compute ON.
3. Variables: las de `.env.example` con Domain/Client ID reales,  
   `FRONTEND_ORIGIN` y `SOCKET_PUBLIC_URL` = `https://<dominio-real>`,  
   `AUTH0_AUDIENCE`, `REDIS_URL`.
4. Deploy → copiá el dominio → volvé al paso A.
5. Probá login + dos pestañas/usuarios.

## F) Evidencias

Seguí la lista en `evidencias/README.md` y guardá PNG allí.
