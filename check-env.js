// Script para verificar las variables de entorno
require('dotenv').config();

console.log('Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('REACT_APP_MAPBOX_TOKEN:', process.env.REACT_APP_MAPBOX_TOKEN);
console.log('REACT_APP_MAPBOX_TOKEN length:', (process.env.REACT_APP_MAPBOX_TOKEN || '').length);
console.log('All REACT_APP_ variables:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));

// Verificar si el token es válido según nuestra lógica
const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
const isValidMapboxToken = MAPBOX_ACCESS_TOKEN && 
  MAPBOX_ACCESS_TOKEN.startsWith('pk.') && 
  !MAPBOX_ACCESS_TOKEN.includes('example_token_here');
console.log('isValidMapboxToken:', isValidMapboxToken);
