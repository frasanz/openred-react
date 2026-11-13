# Running the OpenRed React app locally

Against the local API and its seeded sample data — **not** against production.

This is on the `federation` branch. Note that this repository's default branch is `master`, not
`main`, so the branch was cut from `origin/master`.

## Before anything else: the dev server used to point at production

`package.json` carried `"proxy": "https://api.open-red.es"`. CRA's `proxy` key is a literal string
with no way to read the environment, so `npm start` with no configuration sent **every** API call —
sign-ins and writes included — to the live service, and said nothing about it.

That key is gone. `src/setupProxy.js` does the job instead, because it is a function and can be
configured:

```js
const API_TARGET = process.env.OPENRED_API_PROXY || 'http://localhost:8020';
```

So the default is now the local API, reaching anything else takes an explicit environment variable,
and the dev server prints which target it is using on startup — with a warning if that target is not
a local address. The pre-existing SDGSAT tile proxy in the same file is untouched.

## Two variables name the API, and they are not interchangeable

| | read by | matters during | unset |
|---|---|---|---|
| `OPENRED_API_PROXY` | `src/setupProxy.js` | `npm start` | `http://localhost:8020` |
| `REACT_APP_API_URL` | `src/config/api.ts` | `npm run build` | `https://api.open-red.es` |

`REACT_APP_API_URL` used to be read by nothing at all. It sat in `.env.example`, in the README and
in `CORS_SOLUTION.md` looking like the way to point the app at another API, while `src/services/api.ts`
and `src/hooks/useProjects.ts` each hardcoded the production host behind a copy of the same
`NODE_ENV` ternary. Those three copies are now one module, `src/config/api.ts`, and it reads the key.
A build that sets nothing behaves exactly as it did before.

**The trap worth knowing:** Create React App reads `.env` during `npm run build`, not only during
`npm start`. So a `REACT_APP_API_URL=http://localhost:8020` left in your `.env` is baked into a
production bundle, which then calls localhost from whatever server it is deployed to. `.env.example`
therefore ships that key **commented out**, and a build that needs a non-default API should pass it
for that build only:

```sh
REACT_APP_API_URL=https://api.example.org npm run build
```

Development never reads it: there the baseURL is relative and the proxy decides. `node check-env.js`
prints both variables and what each one resolves to.

## Start it

```sh
cp .env.example .env
npm ci
npm start
```

Then <http://localhost:3010>.

The API has to be up first. See `LOCAL-DEV.md` in
[`Ibercivis/OpenRed`](https://github.com/Ibercivis/OpenRed), branch `federation`:

```sh
cd ../OpenRed
docker compose up -d --build
docker compose exec api python manage.py seed_local
```

Sign in with `ada@openred.invalid` / `devpass12345`.

**If you register an account instead**, sign-in will refuse it with *"El correo electrónico no ha
sido verificado"* — `ACCOUNT_EMAIL_VERIFICATION` is `'mandatory'`, as in production, and nothing on
screen tells you where to confirm. The mail is waiting at **<http://localhost:8026/>** (mailpit, in
the API's composition); click the link in it. The seeded accounts need none of this: they are created
already confirmed.

### `npm ci`, not `npm install`

**`npm install` produces a tree that does not compile.** `package.json` uses caret ranges, and three
transitive dependencies have moved on since the lockfile was written:

- `esp-web-tools@10.4.0` wants `@material/web@^2.2.0` and imports
  `@material/web/*/internal/*-styles.js`; `@material/web@2.5.0` ships those as `.css`. Eleven
  "Module not found" errors.
- `date-fns@4` no longer exports `Locale` from `date-fns/locale`, which `src/utils/i18nFormat.ts`
  imports. `TS2305`.

`package-lock.json` is committed and pins the combination that works (`esp-web-tools@10.2.1`,
`@material/web@2.4.1`), and `npm ci` installs exactly that and compiles cleanly. So use `npm ci`,
and **do not commit a regenerated lockfile** as part of local-development work.

One caveat: `npm ci` deletes `node_modules`, and it fails with `ENOTEMPTY` on
`node_modules/.cache/babel-loader` if the dev server is running. Stop the dev server first.

### Ports

| | |
|---|---|
| 3010 | this app — set in `.env`, because **3000 and 3001 are taken** by the other Ibercivis frontends on a development laptop |
| 8020 | the local OpenRed API |

## CORS, which turned out not to be a problem

`CORS_SOLUTION.md` in this repository is about an older state of things and its "install
django-cors-headers" section is no longer needed. `django-cors-headers` **is** installed in OpenRed,
is in `INSTALLED_APPS`, and `CorsMiddleware` is ahead of `CommonMiddleware`; `openred/settings.py`
sets `CORS_ALLOW_ALL_ORIGINS = True` whenever `DEBUG` is on. So the API does send the headers and a
direct cross-origin call works.

The proxy is kept anyway, for two reasons that have nothing to do with CORS: `src/services/api.ts`
uses an empty `baseURL` in development and therefore issues relative URLs, and the proxy keeps
cookies same-origin.

### CSRF, which was a problem

Signing in used to fail with `CSRF Failed: CSRF token missing.` for anyone who had logged into the
API's `/admin/` first. This app authenticates with a token and never sends an `X-CSRFToken` header,
but DRF's `SessionAuthentication` would pick up the admin's session cookie — **cookies ignore the
port**, so `localhost:8020` reaches `localhost:3010` — authenticate the request from it, and then
demand CSRF.

Fixed on the API side: `compose.yaml` there sets `ENABLE_SESSION_AUTH=False`, so the session cookie
is ignored and token auth is the only path. Nothing is needed here, and no cookie-clearing ritual.
If you ever see that error again, you are pointing at an API that does not have that setting.

## What works, and what cannot

Verified against the seeded dataset: the statistics screens, the histogram, the H3 heatmap, tracks
and their spectra, devices, device models, stations (including the offline one), the PDF reports, and
sign-in.

Three things do not, and none of them is caused by the dataset:

**1. The map has no points.** It gets them from `GET /api/{radiation,light-pollution}-measurements/compact/`,
which does not exist on OpenRed's `federation` branch — only on the unmerged
`origin/feature/weather-cache-and-stats`, commit `69eb384`. `getCompact` in
`src/services/measurements/BaseMeasurementService.ts` throws rather than falling back, so the layer
renders nothing. That branch was deliberately left unmerged.

Four more endpoints this app calls 404 on the API as it stands: `/api/stats/activity/` and
`/api/stats/records/` exist on no branch (`StatsViewSet` has only `global` and `heatmap`);
`/api/missions/` and `/api/campaigns/` exist only as **nested** routes under a project or a mission;
`/api/profile/` does not exist.

**2. `/login` dies without a Google client id, and takes email/password with it.**
`src/index.tsx` mounts `GoogleOAuthProvider` unconditionally with
`process.env.REACT_APP_GOOGLE_CLIENT_ID || ''`, and `LoginPage` calls `useGoogleLogin` as a
top-level hook. With no client id, Google's `gsi/client` throws *"Missing required parameter
client_id"* as the page mounts, and CRA's error overlay covers the screen — so the sign-in form is
unusable even though that path needs no Google at all. A hook cannot be called conditionally, so
there is no fix here that does not restructure the page; instead `.env.example` carries a
**correctly-shaped placeholder** client id, which is enough for the script to initialise. Signing in
with Google will not work locally in any case: that needs a real OAuth client with
`http://localhost:3010` registered as an authorised origin.

If you see that error, your `.env` predates this: copy `.env.example` again and **restart the dev
server** — CRA reads `.env` only at startup — then hard-reload the page.

**3. The map has no basemap, because we have no Mapbox token.** Everything else works without one.
`check-env.js` reports whether a token is present and whether it looks valid (it must start with
`pk.`). Put one in `REACT_APP_MAPBOX_TOKEN` in `.env` if you have a free Mapbox account; nothing
else needs it.

### The mock-data fallback will mislead you

`src/services/api.ts` catches a failed call to measurements, missions or campaigns and silently
returns invented Zaragoza data, with only a `console.warn`:

```ts
console.warn('Failed to fetch measurements from backend, using mock data:', error);
return mockMeasurements;
```

**So a screen full of plausible measurements is not evidence that the API is reachable or that
seeding worked.** Missions and campaigns in particular are *always* mock data right now, because the
flat endpoints do not exist. To check what is real:

```sh
curl http://localhost:3010/api/radiation-measurements/count/
# {"total":384,"movement":240,"static":144}
```

A seeded row carries `raw_data.source == "Safecast"`; a mock row has `id: 1` and the note
"Medición de prueba en Zaragoza centro".

## No production data, anywhere

The sample in the API is built from public sources — Safecast (CC0) and Globe at Night (CC BY 4.0) —
with every field that could name a contributor or an instrument dropped before it reaches the
repository. The accounts, devices and projects are invented. Nothing is copied from production and
there is nothing to anonymise. The reasoning is in `LOCAL-DEV.md` in the OpenRed repository.
