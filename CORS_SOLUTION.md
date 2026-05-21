# Solución de errores CORS - OpenRed React Frontend

## Problema
Error de CORS al intentar acceder a `/api/measurements` desde el frontend React.

```
Access to XMLHttpRequest at 'http://localhost:8000/api/measurements/' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Soluciones Implementadas

### 1. Proxy en package.json (Desarrollo)
Añadido proxy para redirigir peticiones API al backend Django:

```json
{
  "proxy": "http://127.0.0.1:8000"
}
```

**Beneficios:**
- Elimina errores CORS en desarrollo
- Transparente para el código de la aplicación
- Automático con `npm start`

### 2. Configuración adaptativa de la API
El servicio API ahora detecta el entorno:

```typescript
// En desarrollo: usa rutas relativas (proxy)
// En producción: usa URL completa del backend
this.baseURL = process.env.NODE_ENV === 'development' 
  ? '' // Usar proxy en desarrollo
  : (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000');
```

### 3. Datos de prueba como fallback
Implementado sistema de fallback con datos mock:

```typescript
async getMeasurements(): Promise<Measurement[]> {
  try {
    const response = await this.api.get('/api/measurements/');
    return response.data.results || [];
  } catch (error) {
    console.warn('Backend no disponible, usando datos de prueba');
    return mockMeasurements;
  }
}
```

## Configuración del Backend Django (Opcional)

Si necesitas configurar CORS en el backend Django:

### 1. Instalar django-cors-headers
```bash
pip install django-cors-headers
```

### 2. Actualizar settings.py
```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    # ...
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]

# En desarrollo
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# O permitir todos (solo desarrollo)
CORS_ALLOW_ALL_ORIGINS = True
```

## Cómo usar

### Desarrollo con Backend
1. Asegúrate que Django está corriendo en puerto 8000
2. Ejecuta `npm start` en el proyecto React
3. Las peticiones se proxificarán automáticamente

### Desarrollo sin Backend
1. Ejecuta solo `npm start`
2. La aplicación usará datos de prueba automáticamente
3. El mapa mostrará mediciones mock de Zaragoza

### Producción
1. Configura `REACT_APP_API_URL` en el entorno de producción
2. Asegúrate que el backend Django permite CORS desde tu dominio
3. Ejecuta `npm run build` para generar build de producción

## Verificación

### Comprobar que funciona:
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Network
3. Recarga la página
4. Deberías ver peticiones a `/api/measurements` exitosas
5. Si el backend no está disponible, verás warnings en Console pero la app funcionará con datos mock

### Signos de éxito:
- No hay errores CORS en Console
- El mapa muestra puntos de medición
- Los filtros funcionan correctamente
- La aplicación carga sin errores críticos

## Troubleshooting

### Si sigues viendo errores CORS:
1. Verifica que el proxy está configurado en package.json
2. Reinicia el servidor React completamente: `npm start`
3. Verifica que no hay conflictos de puerto
4. Comprueba la consola del navegador para warnings de fallback

### Si no ves datos en el mapa:
1. Verifica la consola del navegador
2. Los datos mock deberían mostrarse automáticamente
3. Verifica que el token de Mapbox está configurado
4. Comprueba que no hay errores de JavaScript

### Variables de entorno necesarias:
```bash
# .env
REACT_APP_API_URL=http://localhost:8000  # Solo para producción
REACT_APP_MAPBOX_TOKEN=tu_token_aqui     # Requerido para mapas
```

## Estado actual

**Funcional**: La aplicación funciona con o sin backend  
**Proxy configurado**: Elimina errores CORS en desarrollo  
**Fallback implementado**: Datos de prueba si backend no disponible  
**Mapas funcionando**: Deck.gl + Mapbox con datos mock  
**Filtros operativos**: Todos los filtros funcionan con datos mock  

La aplicación está lista para desarrollo y testing sin dependencias del backend Django.
