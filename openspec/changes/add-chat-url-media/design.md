## Context

See proposal.md for why this change exists. The chat already sends `{ nombre, mensaje, color }` as JSON and `validateMessage` in `libs/unalib.js` rewrites `mensaje` before `index.html` inserts it with `.html()`. Image URLs that match a full-string http(s) pattern and YouTube URLs already become an `img` or an iframe. A direct video file is still escaped as text. The client has no separate media path: whatever HTML comes back in `mensaje` is what the thread shows.

## Goals / Non-Goals

**Goals:**

- Classify the whole message text as image, YouTube, direct video file, or text.
- Emit an `img` or a player only for a URL that matches that class from start to end.
- Keep the existing script-neutralization behavior for names, colors, and hostile URLs.
- Cover each spec scenario with a Mocha assertion on the message body the chat displays.

**Non-Goals:**

- Extracting a URL from the middle of a sentence.
- Supporting Vimeo, TikTok, or other hosts besides YouTube and direct files.
- Changing phone validation or the Socket.IO event names.

## Decisions

### The whole message is the URL

A message is media only when its entire text is one URL. The alternative, scanning a sentence for the first URL, would turn "mira http://image.com/a.jpg por favor" into an image and hide the rest of the sentence. The lab field is the URL itself, and the existing image and YouTube checks already work that way.

### Two players, chosen by the URL shape

YouTube watch, embed, and `youtu.be` URLs keep the iframe whose `src` is `https://www.youtube.com/embed/<id>`, with the id limited to 11 characters of letters, digits, underscore, or hyphen. Direct `.mp4`, `.webm`, and `.ogg` URLs get a `<video controls>` element whose `src` is that file. An iframe cannot play an arbitrary file, and a `<video>` element cannot play a YouTube page.

### Media HTML is emitted only after a strict match

`validateMessage` checks a safe image URL, then a YouTube URL, then a safe direct-video URL, and otherwise escapes the text. The image and file patterns are anchored and reject quotes, spaces, and angle brackets. The URL written into `src` is HTML-escaped. That closes the case where `is_valid_url_image` matches a substring and the leftover `"<script>` would be concatenated into the tag.

### Tests describe the displayed body

New tests follow the spec scenarios: given a chat payload, when `validateMessage` runs, then `mensaje` is the image, the player, or the original text. The older boolean tests for phone, image, and YouTube stay as they are.

## Risks / Trade-offs

- [A direct file URL points at a host that does not serve the video] → The chat still inserts the player; playback depends on that host. No proxy is added.
- [`safeYtId` reads the last 11 characters] → It runs only after the YouTube pattern matches, so a random string ending in 11 characters is not embedded.
- [The client trusts returned HTML] → Only the image tag and the two players are emitted unescaped, and only from a strict URL. Every other field stays escaped.

## Migration Plan

No stored messages exist. Deploy by replacing `libs/unalib.js` and restarting `npm start`. Rollback is restoring the previous library file; the client and the socket event do not change.

## Open Questions

None. Query strings on an image URL already pass the safe image pattern and do not need a separate spec scenario.
