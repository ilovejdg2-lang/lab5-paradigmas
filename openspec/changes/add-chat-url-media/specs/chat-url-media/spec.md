## Purpose

Permite que un mensaje del chat cuyo texto es una URL http(s) se muestre como imagen o como reproductor de video, y que el resto del texto siga viéndose como texto.

## ADDED Requirements

### Requirement: Image URLs render as images
The chat SHALL display a message whose entire text is an http or https URL ending in jpg, jpeg, gif, png, or bmp as an image. The image source SHALL be that same URL.

#### Scenario: JPEG URL becomes an image
- **GIVEN** a chat message whose text is `http://image.com/image.jpg`
- **WHEN** the chat prepares the message for display
- **THEN** the displayed body is an image element whose source is `http://image.com/image.jpg`

#### Scenario: GIF URL becomes an image
- **GIVEN** a chat message whose text is `http://image.com/image.gif`
- **WHEN** the chat prepares the message for display
- **THEN** the displayed body is an image element whose source is `http://image.com/image.gif`

#### Scenario: PNG URL becomes an image
- **GIVEN** a chat message whose text is `https://cdn.example.com/foto.png`
- **WHEN** the chat prepares the message for display
- **THEN** the displayed body is an image element whose source is `https://cdn.example.com/foto.png`

### Requirement: Video URLs render in a player
The chat SHALL display a YouTube watch, embed, or youtu.be URL in an embedded player whose source is `https://www.youtube.com/embed/` followed by that video id. The chat SHALL display a direct http or https video file ending in mp4, webm, or ogg in a video player whose source is that file URL and which exposes playback controls.

#### Scenario: YouTube watch URL becomes an embedded player
- **GIVEN** a chat message whose text is `https://www.youtube.com/watch?v=qYwlqx-JLok`
- **WHEN** the chat prepares the message for display
- **THEN** the displayed body is an embedded player whose source is `https://www.youtube.com/embed/qYwlqx-JLok`

#### Scenario: Short YouTube URL becomes an embedded player
- **GIVEN** a chat message whose text is `https://youtu.be/qYwlqx-JLok`
- **WHEN** the chat prepares the message for display
- **THEN** the displayed body is an embedded player whose source is `https://www.youtube.com/embed/qYwlqx-JLok`

#### Scenario: MP4 URL becomes a video player
- **GIVEN** a chat message whose text is `https://cdn.example.com/clip.mp4`
- **WHEN** the chat prepares the message for display
- **THEN** the displayed body is a video player whose source is `https://cdn.example.com/clip.mp4` and the player has playback controls

#### Scenario: WebM URL becomes a video player
- **GIVEN** a chat message whose text is `https://cdn.example.com/clip.webm`
- **WHEN** the chat prepares the message for display
- **THEN** the displayed body is a video player whose source is `https://cdn.example.com/clip.webm` and the player has playback controls

### Requirement: Non-media messages stay text
The chat SHALL display a message that is not an image URL and not a video URL as the original text, without wrapping it in an image or a player.

#### Scenario: Ordinary sentence stays text
- **GIVEN** a chat message whose text is `Hola, este es un mensaje`
- **WHEN** the chat prepares the message for display
- **THEN** the displayed body is exactly `Hola, este es un mensaje`

#### Scenario: Phone number stays text
- **GIVEN** a chat message whose text is `8297-8547`
- **WHEN** the chat prepares the message for display
- **THEN** the displayed body is exactly `8297-8547`

### Requirement: Hostile URLs are not rendered as media
The chat SHALL NOT render a message as an image or a video player when the text includes HTML or script markup. The displayed body SHALL NOT contain an executable script element.

#### Scenario: Image URL that injects a script stays inert
- **GIVEN** a chat message whose text is `http://image.com/a.jpg"><script>alert(1)</script>`
- **WHEN** the chat prepares the message for display
- **THEN** the displayed body is not an image element and does not contain a raw `<script` tag

#### Scenario: Video URL that injects a handler stays inert
- **GIVEN** a chat message whose text is `https://cdn.example.com/clip.mp4" onerror="alert(1)`
- **WHEN** the chat prepares the message for display
- **THEN** the displayed body is not a video player and does not contain a raw `onerror=` handler
