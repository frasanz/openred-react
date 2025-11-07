# Cómo obtener un token de Mapbox para OpenRed

## 🗺️ ¿Por qué necesitas un token de Mapbox?

El token de Mapbox permite acceder a mapas base de alta calidad para la visualización con Deck.gl. Sin él, el mapa funciona en modo básico mostrando solo los puntos de medición.

## 📝 Pasos para obtener tu token GRATUITO

### 1. Crear cuenta en Mapbox
1. Ve a [mapbox.com](https://www.mapbox.com/)
2. Haz clic en "Get started for free" o "Sign up"
3. Registrate con tu email (es gratuito para uso básico)

### 2. Acceder al Dashboard
1. Una vez registrado, ve al [Mapbox Dashboard](https://account.mapbox.com/)
2. Busca la sección "Access tokens" en la página principal

### 3. Copiar tu token por defecto
1. Mapbox te proporciona un token por defecto llamado "Default public token"
2. Copia el token (empieza con `pk.eyJ...`)

### 4. Configurar en tu proyecto
1. Abre el archivo `.env` en tu proyecto React
2. Reemplaza la línea existente:
   ```
   REACT_APP_MAPBOX_TOKEN=tu_token_real_aqui
   ```

### 5. Reiniciar el servidor
```bash
# Detener el servidor actual (Ctrl+C)
# Luego reiniciar
npm start
```

## ✅ Verificar que funciona

1. Abre la aplicación en el navegador
2. Deberías ver mapas detallados en lugar del fondo gris
3. La alerta amarilla de "Token no configurado" debería desaparecer

## 🔒 Límites gratuitos de Mapbox

- **50,000 cargas de mapa por mes** (más que suficiente para desarrollo)
- **Uso no comercial** está incluido
- Si necesitas más, puedes actualizar tu plan

## 🛠️ Token de ejemplo vs Token real

### ❌ Token de ejemplo (no funciona):
```
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoiZnJhc2FueiIsImEiOiJjbGc3eWJwYTcxbGlvM29vNGc0dzh0ZjExIn0.example_token_here
```

### ✅ Token real (funciona):
```
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoidHVfdXN1YXJpbyIsImEiOiJjbG...resto_del_token_real
```

## 🚨 Troubleshooting

### Si sigues viendo errores:
1. **Verifica que el token esté completo** - Los tokens son largos (~200 caracteres)
2. **No añadas espacios** antes o después del token
3. **Reinicia el servidor React** después de cambiar .env
4. **Verifica que el token esté activo** en tu dashboard de Mapbox

### Si el token no funciona:
1. Ve al [Dashboard de Mapbox](https://account.mapbox.com/)
2. Verifica que el token no esté deshabilitado
3. Crea un nuevo token si es necesario
4. Asegúrate de que el token tenga permisos para "Public scopes"

## 🎯 Estado actual

**Mientras configuras el token:**
- ✅ El mapa funciona en modo básico
- ✅ Los puntos de medición se muestran correctamente
- ✅ Todos los filtros funcionan
- ✅ La navegación (zoom, pan) funciona
- ⚠️ Fondo gris en lugar de mapa detallado

**Después de configurar el token:**
- ✅ Mapas base detallados de Mapbox
- ✅ Mejor calidad visual
- ✅ Estilos profesionales
- ✅ Mejor experiencia de usuario

## 🔗 Enlaces útiles

- [Mapbox - Crear cuenta](https://www.mapbox.com/)
- [Dashboard de tokens](https://account.mapbox.com/)
- [Documentación de tokens](https://docs.mapbox.com/help/getting-started/access-tokens/)
- [Límites de uso gratuito](https://www.mapbox.com/pricing/)

> **Nota**: El proyecto está configurado para funcionar perfectamente sin token de Mapbox, así que no hay prisa. Puedes obtenerlo cuando quieras mejorar la calidad visual de los mapas.
