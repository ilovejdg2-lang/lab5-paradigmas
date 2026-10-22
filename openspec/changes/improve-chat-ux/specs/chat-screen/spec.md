## Purpose

Hace que la pantalla del chat se entienda al entrar y que los mensajes, las imágenes y los videos quepan en la ventana, sin cambiar qué se puede enviar.

## ADDED Requirements

### Requirement: The screen identifies the chat
The page SHALL show a heading that names the chat. Before any message is sent, the page SHALL show a notice that the conversation is empty. The name field, the message field, the send button, and the message list SHALL remain on the page.

#### Scenario: Empty conversation
- **GIVEN** a visitor opens the chat and has not sent a message
- **WHEN** the page finishes loading
- **THEN** a heading naming the chat is visible, an empty-conversation notice is visible, and the name field, the message field, and the send button are present

### Requirement: The composer is in Spanish
The name field SHALL use a Spanish placeholder. The message field SHALL use a Spanish placeholder. The send button SHALL be labeled "Enviar". Sending a message SHALL clear the message field and SHALL leave the name field unchanged.

#### Scenario: Sending keeps the name and clears the message
- **GIVEN** the name field contains "Ana" and the message field contains "Hola"
- **WHEN** the visitor sends the message
- **THEN** the message field is empty and the name field still contains "Ana"

### Requirement: An empty name is shown as Anónimo
The chat SHALL display the name "Anónimo" when the visitor sends a message with an empty name field.

#### Scenario: Blank name
- **GIVEN** the name field is empty
- **WHEN** the visitor sends the text "Hola"
- **THEN** the message list shows "Anónimo" together with "Hola"

### Requirement: Messages stay readable inside the window
Each sent message SHALL appear as an item in the message list, with the sender name and the message body. An image or a video player in that item SHALL fit within the width of the window.

#### Scenario: Image does not overflow the window
- **GIVEN** the visitor sends `http://image.com/image.jpg`
- **WHEN** the chat shows the image
- **THEN** the image is inside the message list and its rendered width is not greater than the window width

#### Scenario: Video player does not overflow the window
- **GIVEN** the visitor sends `https://youtu.be/qYwlqx-JLok?si=AbCdEfGh12`
- **WHEN** the chat shows the player
- **THEN** the player is inside the message list and its rendered width is not greater than the window width

### Requirement: Existing message results stay the same
The chat SHALL keep showing a plain sentence as that sentence, an image URL as an image with that URL as its source, a shared YouTube URL as a player whose source is `https://www.youtube.com/embed/` plus the video id, and a script tag as visible text that is not an executable script element.

#### Scenario: Plain text is unchanged
- **GIVEN** the visitor named "Ana" sends "Hola, este es un mensaje"
- **WHEN** the chat shows the message
- **THEN** the list item contains "Ana" and "Hola, este es un mensaje" and contains no image

#### Scenario: A script is shown as text
- **GIVEN** the visitor sends `<script>alert("xss")</script>`
- **WHEN** the chat shows the message
- **THEN** the list shows that text and the message list contains no script element
