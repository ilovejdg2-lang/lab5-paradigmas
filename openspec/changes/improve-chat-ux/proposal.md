## Why

La pantalla del chat es una barra negra y una lista sin título, con textos en inglés y un nombre vacío que se muestra como "Anomimo". Quien entra no entiende qué es la página, y una imagen o un video de 560 px se sale del ancho de la ventana. La mejora es solo de presentación: el envío de texto, imágenes, videos y el bloqueo de scripts se quedan igual.

## What Changes

- La página muestra un encabezado del chat y, mientras no hay mensajes, un aviso de que la conversación está vacía.
- El compositor queda en español: nombre, mensaje y botón "Enviar". Si el nombre está vacío, el mensaje se publica como "Anónimo".
- Cada mensaje sigue en la lista, con el nombre en el color elegido y el cuerpo debajo, y la imagen o el reproductor caben en el ancho de la ventana.
- El campo de mensaje se vacía después de enviar.
- No cambian el evento de socket, los ids `#nombre`, `#m` y `#messages`, ni la validación de texto, imagen, YouTube o scripts.

## Capabilities

### New Capabilities

- `chat-screen`: presentación de la pantalla del chat, el compositor y la forma en que se lee un mensaje, sin cambiar qué contenido se acepta.

### Modified Capabilities

- Ninguna. No hay specs principales en `openspec/specs/`. El comportamiento de URLs y de scripts no se modifica.

## Impact

- `index.html`: estructura, estilos y el texto por defecto del nombre.
- Pruebas existentes: `npm test`, `npm run test:integration` y `npm run test:e2e` deben seguir pasando sin cambiar sus selectores.
- Sin dependencias nuevas y sin cambios en `libs/unalib.js` ni en `server.js`.
