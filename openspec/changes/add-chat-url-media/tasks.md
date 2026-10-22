## 1. Direct video player

- [ ] 1.1 Add a strict full-string check for http(s) URLs ending in mp4, webm, or ogg, rejecting quotes, spaces, and angle brackets
- [ ] 1.2 Emit a `<video controls>` element whose escaped `src` is that file URL, after the YouTube check and before plain-text escaping in `validateMessage`

## 2. BDD scenarios

- [ ] 2.1 Add Mocha scenarios for JPEG, GIF, and PNG image URLs, asserting the displayed body is an `img` with that source
- [ ] 2.2 Add Mocha scenarios for the YouTube watch URL and the `youtu.be` short URL, asserting the embed source `https://www.youtube.com/embed/qYwlqx-JLok`
- [ ] 2.3 Add Mocha scenarios for mp4 and webm URLs, asserting a video player with that source and playback controls
- [ ] 2.4 Add Mocha scenarios that keep `Hola, este es un mensaje` and `8297-8547` as exact text
- [ ] 2.5 Add Mocha scenarios for the hostile image URL and the hostile mp4 URL, asserting they are not media and contain no raw script or `onerror=` handler

## 3. Verification

- [ ] 3.1 Run `npm test` and keep the existing phone, image, and YouTube boolean tests passing together with the new scenarios
