## Why

El chat solo trata el campo de texto como texto plano. Los usuarios necesitan pegar una URL y ver la imagen o el video en el hilo, sin salir del chat. La detección parcial que ya existe no cubre archivos de video ni está descrita como comportamiento aceptable del chat.

## What Changes

- El mensaje cuyo contenido es una URL http(s) se clasifica como imagen, video o texto.
- Una URL de imagen (jpg, jpeg, gif, png, bmp) se muestra como imagen en el chat.
- Una URL de video de YouTube, o un archivo de video directo (mp4, webm, ogg), se muestra con un reproductor.
- Un mensaje que no es una URL de imagen ni de video se conserva como texto.
- Una URL que intenta inyectar HTML o script no se convierte en medio; se neutraliza como texto.
- La validación de teléfonos no cambia.

## Capabilities

### New Capabilities

- `chat-url-media`: detectar una URL de imagen o de video en el mensaje del chat y devolver el HTML que la muestra (imagen o reproductor).

### Modified Capabilities

- Ninguna. No hay specs previas en `openspec/specs/`.

## Impact

- `libs/unalib.js`: clasificación de la URL y generación de la etiqueta de imagen o del reproductor, dentro de `validateMessage`.
- `test/test.js`: escenarios BDD del mensaje validado.
- `index.html`: ya inserta el mensaje como HTML, así que la imagen y el reproductor se ven sin un canal nuevo.
- `server.js`: ya pasa cada mensaje por `validateMessage`.
- Sin dependencias nuevas.
