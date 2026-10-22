## 1. Chat screen

- [x] 1.1 Add a heading that names the chat and an empty-conversation notice outside `#messages`, visible on load
- [x] 1.2 Set Spanish placeholders on `#nombre` and `#m`, label the submit button "Enviar", and use "Anónimo" when the name field is empty
- [x] 1.3 Hide the empty notice on submit and keep clearing only `#m`
- [x] 1.4 Constrain images and video players inside the message list to the window width without changing their `src`

## 2. Regression

- [x] 2.1 Run `npm test` and confirm the Mocha unit tests pass
- [x] 2.2 Run `npm run test:integration` and confirm the Jest socket tests pass
- [x] 2.3 Run `npm run test:e2e` and confirm the Playwright browser tests pass
