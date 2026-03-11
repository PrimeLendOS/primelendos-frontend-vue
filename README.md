
<!-- PrimeLendOS Logo -->
<p align="center">
  <img src="public/primelendos-logo.svg" alt="PrimeLendOS Logo" width="180" />
</p>

# PrimeLendOS Frontend

**Modern Lending System Platform**

---

## Run (Simple)

1. Make sure backend is running first (`lending_system_nodejs`):

```sh
docker compose up -d
npm install
npm run seed:dummy
npm run dev
```

2. Run frontend:

```sh
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Login Values

Seeded demo account (created by backend `npm run seed:dummy`):

- Email: `demo.owner@lending.local`
- Password: `Passw0rd!`

You can also register your own account in the app.

## Reports Preference Storage

- Reports cashflow chart remembers selected trend window (`7/30/60`) and series (`Net/Inflows/Outflows`).
- Preferences are stored per user account in browser localStorage.
- Legacy global keys are migrated automatically on first load after update.

## Quick Backend/DB Info

- Backend URL: `http://localhost:3000`
- Adminer URL: `http://localhost:8081`
- MySQL port: `3307`

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
