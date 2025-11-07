# OpenRed - React Frontend

Frontend moderno construido con React y TypeScript para la plataforma OpenRed de medición de radiación gamma mediante ciencia ciudadana.

## 🚀 Características

- **Interfaz moderna**: Construida con Material-UI v7 y componentes personalizados
- **Autenticación JWT**: Sistema seguro de login/registro conectado al backend Django
- **Gestión de dispositivos**: CRUD completo para dispositivos de medición de radiación
- **Visualización de mapas**: Integración con **Deck.gl** y **Mapbox** para visualización avanzada 3D de mediciones geoespaciales
- **Campañas y misiones**: Gestión de proyectos de ciencia ciudadana
- **Perfil de usuario**: Gestión completa del perfil con estadísticas
- **Filtros avanzados**: Filtrado de mediciones por fecha, ubicación y dispositivo
- **Responsive design**: Optimizado para dispositivos móviles y desktop
- **TypeScript**: Tipado estático para mayor robustez del código

## 🛠️ Tecnologías

- **React 19** con Hooks y Context API
- **TypeScript** para tipado estático
- **Material-UI v7** para componentes UI
- **React Router Dom** para navegación
- **Deck.gl** y **Mapbox** para visualización avanzada de mapas 3D
- **Axios** para llamadas API
- **React Hook Form** con validación Yup
- **Styled Components** para estilos personalizados

## 📁 Estructura del proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── MapComponent.tsx    # Componente de mapa con Deck.gl y Mapbox
│   └── Navbar.tsx         # Barra de navegación
├── pages/              # Páginas principales
│   ├── HomePage.tsx       # Página principal con mapa
│   ├── LoginPage.tsx      # Página de inicio de sesión
│   ├── RegisterPage.tsx   # Página de registro
│   ├── DevicesPage.tsx    # Gestión de dispositivos
│   ├── ProfilePage.tsx    # Perfil de usuario
│   └── CampaignsPage.tsx  # Campañas y misiones
├── services/           # Servicios API
│   └── api.ts            # Cliente Axios y endpoints
├── context/            # Context API
│   └── AuthContext.tsx   # Contexto de autenticación
├── types/              # Definiciones TypeScript
│   └── index.ts          # Interfaces principales
├── hooks/              # Custom hooks
├── utils/              # Utilidades
└── App.tsx             # Componente principal
```

## 🔧 Configuración

### Variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Variables disponibles:
- `REACT_APP_API_URL`: URL del backend Django (por defecto: http://localhost:8000)
- `REACT_APP_MAPBOX_TOKEN`: Token de acceso de Mapbox (requerido para los mapas)

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm start

# Construir para producción
npm run build
```

### Configuración de Mapbox

Para habilitar la visualización de mapas, necesitas obtener un token de acceso de Mapbox:

1. Ve a [Mapbox](https://www.mapbox.com/) y crea una cuenta gratuita
2. Accede a tu panel de control y obtén tu token de acceso
3. Añade el token a tu archivo `.env`:
   ```bash
   REACT_APP_MAPBOX_TOKEN=tu_token_de_mapbox_aqui
   ```

> **Nota**: Sin el token de Mapbox, los mapas no se mostrarán correctamente. El mapa utiliza Deck.gl para renderizado 3D avanzado con Mapbox como capa base.

## 🌐 Conexión con el Backend

El frontend se conecta al backend Django a través de API REST:

- **Autenticación**: `/api/auth/login/`, `/api/auth/register/`
- **Usuarios**: `/api/users/me/`, `/api/profile/`
- **Dispositivos**: `/api/devices/`, `/api/device-models/`
- **Mediciones**: `/api/measurements/`
- **Campañas**: `/api/campaigns/`
- **Misiones**: `/api/missions/`

## 📱 Funcionalidades principales

### Autenticación
- Login y registro de usuarios
- Gestión de tokens JWT
- Rutas protegidas
- Persistencia de sesión

### Mapa interactivo (Deck.gl + Mapbox)
- Visualización avanzada 3D de mediciones de radiación gamma
- Renderizado de alta performance con Deck.gl
- Colores dinámicos basados en intensidad de radiación (gradiente verde-rojo)
- Filtros interactivos por fecha, intensidad y campaña
- Tooltips informativos al hacer hover sobre los puntos
- Vista 3D con pitch y bearing ajustables
- Navegación fluida con controles táctiles

### Gestión de dispositivos
- Lista de dispositivos del usuario
- Creación y edición de dispositivos
- Asociación con modelos de dispositivos
- Estados activo/inactivo

### Perfil de usuario
- Edición de datos personales
- Estadísticas de actividad
- Estado de la cuenta

### Campañas y misiones
- Creación y gestión de campañas
- Misiones asociadas a campañas
- Estados temporales (próxima, activa, finalizada)
- Gestión de participantes

## 🎨 Diseño y UX

- **Material Design**: Seguimiento de las guías de Material-UI
- **Tema personalizado**: Colores corporativos y tipografía
- **Responsive**: Adaptado a diferentes tamaños de pantalla
- **Accesibilidad**: Cumple estándares WCAG
- **Feedback visual**: Loading states, mensajes de error/éxito

## 🔄 Migración desde Django

Este frontend React reemplaza las templates de Django manteniendo:
- Misma funcionalidad que el frontend Django original
- Mejora en experiencia de usuario
- API REST como puente entre ambos sistemas
- Posibilidad de coexistencia durante la transición

## 📚 Scripts disponibles

### `npm start`
Inicia el servidor de desarrollo en [http://localhost:3000](http://localhost:3000)

### `npm test`
Ejecuta los tests en modo watch

### `npm run build`
Construye la aplicación para producción en la carpeta `build`

### `npm run eject`
**Nota: esta operación es irreversible**

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia correspondiente a OpenRed.

## 🐛 Issues conocidos

- Los date pickers requieren configuración adicional de locales para español
- Algunos endpoints del backend pueden requerir ajustes para coincidir con la API esperada
- La geolocalización requiere HTTPS en producción

## 🔮 Próximas mejoras

- [ ] Internacionalización (i18n)
- [ ] Progressive Web App (PWA)
- [ ] Modo offline
- [ ] Notificaciones push
- [ ] Dashboard de analytics
- [ ] Exportación de datos
- [ ] Integración con más proveedores de mapas

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
