// Script para verificar las variables de entorno
require('dotenv').config();

console.log('Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Dos variables, dos momentos distintos. OPENRED_API_PROXY la lee
// src/setupProxy.js en `npm start`; REACT_APP_API_URL la lee src/config/api.ts
// y solo cuenta en `npm run build`. En desarrollo no se usa: alli la baseURL es
// relativa y el destino lo fija el proxy.
console.log('OPENRED_API_PROXY (dev server):', process.env.OPENRED_API_PROXY || '(sin definir -> http://localhost:8020)');
console.log('REACT_APP_API_URL (solo build):', process.env.REACT_APP_API_URL || '(sin definir -> https://api.open-red.es)');
console.log('REACT_APP_MAPBOX_TOKEN:', process.env.REACT_APP_MAPBOX_TOKEN);
console.log('REACT_APP_MAPBOX_TOKEN length:', (process.env.REACT_APP_MAPBOX_TOKEN || '').length);
console.log('All REACT_APP_ variables:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));

// Verificar si el token es válido según nuestra lógica
const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
const isValidMapboxToken = MAPBOX_ACCESS_TOKEN && 
  MAPBOX_ACCESS_TOKEN.startsWith('pk.') && 
  !MAPBOX_ACCESS_TOKEN.includes('example_token_here');
console.log('isValidMapboxToken:', isValidMapboxToken);
