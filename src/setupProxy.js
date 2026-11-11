// Proxy del dev server (solo desarrollo). Las teselas SDGSAT de lostatnight.org
// no envian cabeceras CORS, asi que se sirven desde el propio origen de la app.
// En produccion, nginx debe exponer la misma ruta (ver README, seccion 4.3).
//
// The API proxy below was added for local development against the local stack.
// It replaces the `"proxy": "https://api.open-red.es"` key that used to sit in
// package.json, for two reasons:
//
//   1. It pointed at PRODUCTION. `npm start` with no configuration sent every
//      API call -- writes and sign-ins included -- to the live service, without
//      saying so. The default here is the local API, and reaching production now
//      takes an explicit environment variable.
//   2. package.json's `proxy` is a literal string and cannot read the
//      environment. This file is a function, so the target is configurable.
//
// The API does send its own CORS headers (django-cors-headers is installed and
// wired up in openred/settings.py, with CORS_ALLOW_ALL_ORIGINS while DEBUG is
// on), so a direct cross-origin call would work too. The proxy is kept because
// src/services/api.ts uses a relative baseURL in development.
const { createProxyMiddleware } = require('http-proxy-middleware');

// compose.yaml in the OpenRed repository publishes the API on 8020, not 8000: a
// development laptop already has the other Ibercivis stacks on 8000 and 8010.
const API_TARGET = process.env.OPENRED_API_PROXY || 'http://localhost:8020';
const API_PATHS = ['/api', '/dj-rest-auth', '/accounts', '/media', '/django-rq'];

module.exports = function (app) {
  app.use(
    '/sdgsat_tiles',
    createProxyMiddleware({
      target: 'https://lostatnight.org',
      changeOrigin: true,
      pathRewrite: { '^/sdgsat_tiles': '/tileset/SDGSAT_EU_UK' },
      logLevel: 'warn',
    })
  );

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(API_TARGET)) {
    console.log(`  openred-react -> API at ${API_TARGET}`);
  } else {
    console.warn(
      `\n  !!  Proxying the API to ${API_TARGET}, which is not a local address.\n` +
      `  !!  Every request this dev server makes, writes included, goes there.\n` +
      `  !!  Unset OPENRED_API_PROXY to use the local stack.\n`
    );
  }

  for (const path of API_PATHS) {
    app.use(path, createProxyMiddleware({ target: API_TARGET, changeOrigin: true, logLevel: 'warn' }));
  }
};
