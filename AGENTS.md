# AGENTS.md

## TL;DR

El comportamiento lo definen las pruebas y, cuando hay un cambio planificado, OpenSpec. Si una prueba falla, se ajusta el código al comportamiento que la prueba fija. Si el usuario cambia ese comportamiento, se actualizan las pruebas en el mismo cambio. Un mensaje del chat solo puede volverse imagen o reproductor por una URL completa y permitida; el resto se escapa. El chat exige access token Auth0 (JWT) en Socket.IO. Después de tocar la validación, la pantalla, auth o las dependencias se corren `npm test`, `npm run test:integration` y `npm run test:e2e`. No se hace commit si no lo piden.

## Memoria del Laboratorio 8 (fuera de este repo)

Este clon vive en `Repos/lab5-paradigmas/` del workspace oficial
`my-team-workspace/my-team-workspace/`. La memoria persistente **no** está
dentro de este repositorio: está en `../../brain/` (es decir,
`my-team-workspace/my-team-workspace/brain/`).

Al iniciar una sesión abierta solo sobre este repo, lee primero
`../../brain/daily-log/status.md` y el diario del día si existe.

**No se realizará el paso 3 del Laboratorio 8: Preparar y utilizar el harness. Por decisión de alcance, no se instalará ni utilizará rsc-harness.**

## Contrato que no se rompe

- Selectores: `#nombre`, `#m`, `#messages`, `#vacio`, `form button`.
- Evento de Socket.IO: `Evento-Mensaje-Server`.
- Cuerpo: `{ nombre, mensaje, color }`. Nombre vacío se muestra como `Anónimo`. El color solo vale si es `#` y seis hexadecimales; si no, `#000000`.
- Imagen de referencia: `http://image.com/image.jpg` y el gif equivalente, con la etiqueta exacta que esperan las pruebas.
- Video de referencia: el id de YouTube `qYwlqx-JLok`, incluidos `youtu.be`, `watch` con parámetros y `shorts`.
- Un script escrito en el nombre, el mensaje o el color se muestra como texto y no se ejecuta.

## Pruebas

- Unitarias con Mocha en `test/test.js`: `npm test`. Cubren teléfono, imagen, video y cada ángulo de inyección.
- Integración con Jest en `integration/chat.test.js`: `npm run test:integration`. Dos clientes Socket.IO contra un puerto libre.
- Extremo a extremo con Playwright en `e2e/chat.spec.js`: `npm run test:e2e`. Navegador visible, `slowMo` y espera de 1 segundo (`e2e/retraso.js`), servidor propio en el puerto 3100.
- La verificación de pantalla mira el comportamiento: que el iframe exista, que su `src` sea el esperado y que su alto sea mayor que cero. Una captura no basta.
- En PowerShell los comandos se separan con `;`. `&&` no sirve.

## Mensajes y medios

La validación vive en `libs/unalib.js`, en `validateMessage`. El cliente pinta con jQuery `.html()`, así que un `<script>` no corre, pero un iframe o un `onerror` sí.

- Una imagen es la URL completa, `http` o `https`, terminada en jpg, jpeg, gif, png o bmp. Un texto que solo contiene `.jpg` no es imagen.
- Un video no se arma pegando la URL del usuario dentro del HTML. Se extrae un id permitido y el servidor construye el `src`.
- Reproductores: YouTube, Instagram (`reel`, `reels`, `p`, `tv`), Google Drive (`/file/d/ID` o `?id=`), Vimeo, TikTok, Dailymotion, Facebook Watch y archivos mp4, webm u ogg.
- Un enlace `google.com/url?q=` se abre antes de clasificarlo. Si dentro hay un video de YouTube, se muestra ese reproductor.
- En `index.html`, iframe y video tienen alto explícito (400 px). `height: auto` dentro de un `li` con `overflow: hidden` los deja en cero y el video parece no existir.
- `server.js` exporta `start(port)` y solo escucha cuando es el proceso principal. Las pruebas usan su propio puerto. Tras cambiar `unalib.js` hay que reiniciar `npm start`: el proceso viejo conserva el módulo anterior. Si el puerto 3000 está ocupado, se libera antes de arrancar otro servidor.

## OpenSpec

El esquema es `spec-driven`. Proponer un cambio genera proposal, specs, design y tasks, y en ese paso no se implementa. Aplicar recorre las tareas. Archivar solo cuando la implementación está hecha y el usuario lo pide. Un change con tareas sin marcar no está terminado.

## Dependencias

`npm run security` ejecuta `snyk test`. Se reparan primero las vulnerabilidades críticas y altas. Si subir Express, Mocha o Socket.IO no mueve una dependencia transitiva, se fija con `overrides` la versión que corrige el aviso y se vuelve a escanear con umbral alto. `snyk auth` lo hace la persona: es interactivo. No se suben `.env` ni tokens.
