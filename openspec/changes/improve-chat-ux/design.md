## Context

See proposal.md for why this change exists. The page is a single `index.html`: a list `#messages`, a form with `#nombre`, `#m`, and a submit button, and a socket handler that appends each payload as HTML inside a new `li`. Images and YouTube players are HTML produced by the server. The unit, integration, and end-to-end tests address `#nombre`, `#m`, `form button`, `#messages li`, `#messages img`, and `#messages iframe`.

## Goals / Non-Goals

**Goals:**

- Restyle the existing page so the heading, the empty notice, the Spanish composer, and the fitted media match the spec.
- Leave the socket event name and the message HTML string unchanged.
- Prove the current suites still pass after the layout change.

**Non-Goals:**

- Editing `libs/unalib.js` or `server.js`.
- Adding accounts, timestamps, or a new CSS framework.
- Changing the selectors the current tests use.

## Decisions

### Stay inside index.html

The layout, the empty notice, and the default name "Anónimo" live in `index.html`. A separate stylesheet or a component library would be a new dependency for a one-page chat. The alternative, changing the server HTML for images and iframes, would force every test that asserts the exact `img` string to change. Width is limited with CSS (`max-width: 100%`) on images and players already inserted in the list.

### Hide the empty notice when the first item appears

The notice is an element outside `#messages`, hidden by the same submit handler that already appends the `li`. Keeping it inside `#messages` would make the end-to-end text assertions see the notice in the list. The notice starts visible and is hidden on the first send.

### Do not rename the controls

Placeholders and the button label change to Spanish. The ids `#nombre`, `#m`, and `#messages`, and the button remaining a `form button`, stay so the current Playwright tests keep finding them. The button text becomes "Enviar"; those tests click the button, they do not read its label.

## Risks / Trade-offs

- [A fixed player width of 560 px overflows a narrow window] → CSS caps the player and the image at the width of the list. The `src` attributes stay the same.
- [Hiding the empty notice from script fails if the socket echoes before the handler runs] → Hide the notice in the submit handler, which runs before the echo is required for the notice to disappear. The spec only requires the notice before the first send.
- [The default name change from "Anomimo" to "Anónimo" is visible] → It is the intended copy fix. Tests that type a name are unaffected.

## Migration Plan

Replace the page markup and styles, then restart `npm start`. Rollback is restoring the previous `index.html`. No stored messages exist.

## Open Questions

None.
