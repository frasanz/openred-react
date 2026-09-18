// Proxy del dev server (solo desarrollo). Las teselas SDGSAT de lostatnight.org
// no envian cabeceras CORS, asi que se sirven desde el propio origen de la app.
// En produccion, nginx debe exponer la misma ruta (ver README, seccion 4.3).
const { createProxyMiddleware } = require('http-proxy-middleware');

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
};
