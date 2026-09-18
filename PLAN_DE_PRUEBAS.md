# OpenRed — Plan de pruebas (QA manual)

Guía para testear la web tras el rediseño. Marca cada caso con ✅ (pasa), ❌ (falla) o ⚠️ (parcial / con observaciones). Anota navegador, resolución y pasos exactos cuando algo falle.

---

## 0. Preparación

- **URL de pruebas:** _(rellenar — p.ej. `http://localhost:3000` en local o la URL de staging)_
- **Backend:** `https://api.open-red.es`
- **Cuenta de prueba:** email `__________` / contraseña `__________`
- **Navegadores objetivo:** Chrome (principal), Firefox, Safari. Probar al menos en Chrome.
- **Resoluciones:** escritorio (≥1280px) y móvil (≤480px, con DevTools responsive).
- Abre la **consola del navegador** (F12 → Console) durante todas las pruebas: **no debe haber errores en rojo**.

### Smoke test rápido (5 min)
1. Abre la home `/` → carga el mapa en **modo oscuro**, sin pantallazos blancos.
2. Inicia sesión → entras y vuelves al mapa.
3. Cambia el rango de fechas en el panel de filtros → el mapa recarga datos.
4. Abre `/statistics`, `/tracks`, `/profile` → todas en oscuro, sin zonas claras/azules.
5. Cierra sesión → vuelves a la home como invitado.

Si el smoke test pasa, continúa con el detalle.

---

## 1. Apariencia global (rediseño)

Aplica a **todas** las páginas:

- [ ] Fondo general **oscuro** (casi negro). Ninguna página con fondo blanco, gris claro o azul.
- [ ] Tipografía: textos en **IBM Plex Sans**; cifras, etiquetas, coordenadas, fechas y unidades en **IBM Plex Mono** (monoespaciada).
- [ ] El color de acento es **cian** y aparece poco: enlace activo del menú, botón principal, foco de inputs, líneas de selección. **Los números NO van en cian ni en rojo.**
- [ ] No hay **emojis** en ningún sitio (ni botones, ni tooltips, ni labels).
- [ ] Sin gradientes de color de fondo, sin curvas/ondas decorativas, sin imágenes hero.

---

## 2. Topbar (barra superior)

- [ ] Altura compacta (~48px), fondo oscuro con línea inferior.
- [ ] Izquierda: **OPENRED / NETWORK** + indicador **LIVE** (punto verde) + reloj **UTC** que avanza cada segundo.
- [ ] Centro: enlaces **Map** y **Statistics** (el de la página actual, resaltado en cian).
- [ ] **No existe** enlace "Tracks" en la barra (se accede desde el menú del avatar).
- [ ] Derecha (con sesión): menú "⋮" con App Móvil / Acerca de / Privacidad / Términos, y avatar con inicial → menú **Mis Tracks / Mi Perfil / Cerrar Sesión**.
- [ ] Derecha (sin sesión): botones **Iniciar Sesión** y **Registrarse**.
- [ ] Click en OPENRED → va a la home.

---

## 3. Autenticación

### 3.1 Login (`/login`)
- [ ] La página se ve oscura, con una **tarjeta centrada** (sin card blanca, sin fondo gris).
- [ ] En las pantallas de auth, la topbar muestra **solo** marca + LIVE/reloj (sin nav ni botones login/registro).
- [ ] Labels de campos en mono mayúsculas; inputs con fondo gris oscuro (no azul).
- [ ] Login con **email + contraseña** correctos → entra y redirige al mapa.
- [ ] Credenciales incorrectas → aparece un aviso (banner) en rojo, legible.
- [ ] Validación: email vacío/!inválido y contraseña corta muestran error **debajo** del campo.
- [ ] **Autofill de Chrome:** si el navegador autocompleta email/contraseña, el campo se ve **gris oscuro** (no azul). Escribirlo a mano se ve igual.
- [ ] Enlace "¿Olvidaste tu contraseña?" → va a `/reset-password`.
- [ ] Separador "o continúa con" visible.
- [ ] Botón **Continuar con Google** → abre el flujo de Google. _(Nota: el login Google puede estar limitado; verificar al menos que abre el popup.)_
- [ ] Footer "¿No tienes cuenta? Regístrate aquí" → va a `/register`.

### 3.2 Registro (`/register`)
- [ ] Campos email / contraseña / confirmar contraseña; hint "Mín. 8 caracteres" bajo la contraseña.
- [ ] Contraseñas que no coinciden → error en confirmar.
- [ ] Texto de Términos y Privacidad con enlaces que funcionan.
- [ ] Registro correcto → redirige a `/email-verification`.
- [ ] Email ya registrado → mensaje de error claro.

### 3.3 Verificación de email (`/email-verification`)
- [ ] Muestra "Revisa tu correo" con un punto de estado y un banner informativo.
- [ ] Botones "Ir al inicio de sesión" y "Volver al inicio" funcionan.

### 3.4 Verificar email (`/verify-email?key=...`)
- [ ] Con un enlace válido (desde el correo): muestra "Cuenta verificada" (punto verde) y redirige a login a los ~3s.
- [ ] Con enlace inválido/expirado: muestra "Enlace inválido" (punto rojo).

### 3.5 Recuperar contraseña (`/reset-password`)
- [ ] Input de email + botón "Enviar enlace".
- [ ] Tras enviar: estado de éxito (punto verde + banner "Email enviado").

### 3.6 Nueva contraseña (`/reset-password/confirm?uid=...&token=...`)
- [ ] Sin uid/token: muestra "Enlace inválido".
- [ ] Con enlace válido: 2 campos (nueva + confirmar), botón "Guardar"; al guardar → éxito y redirige a login.

### 3.7 Logout
- [ ] Avatar → Cerrar Sesión → vuelve a la home como invitado; la topbar muestra Iniciar Sesión/Registrarse.

---

## 4. Mapa (Home `/`)

### 4.1 Carga y proyecto
- [ ] El mapa carga en oscuro (estilo dark), **plano** (no en modo "globo").
- [ ] Selector de **Proyecto** (primer filtro): muestra el nombre + tipo + **nº de medidas** visible (p.ej. "Radiación · 266.449 medidas").
- [ ] Cambiar de proyecto recarga los datos.

### 4.2 Zoom y navegación
- [ ] **Zoom con la rueda del ratón es fluido**, sin saltos, también mientras cargan datos al cruzar niveles.
- [ ] Arrastrar (pan) mueve el mapa con normalidad.
- [ ] A zoom bajo se ven **hexágonos** (agregación); a zoom alto (~16+), **puntos individuales**.
- [ ] Arriba-izquierda: lectura de **coordenadas** (VIEW lat · lon · Z · PITCH) que se actualiza al mover.
- [ ] Abajo-centro: **barra de escala** (p.ej. "500 km") que cambia con el zoom.

### 4.3 Filtros (panel lateral izquierdo)
- [ ] El panel arranca pegado arriba; cabecera **FILTERS** + flecha para colapsar.
- [ ] Colapsar/expandir el panel funciona (flecha izquierda dentro / flecha derecha cuando está cerrado).
- [ ] **Rango de fechas**: cambiarlo recarga los datos; muestra los días a la derecha.
- [ ] Sliders **Altitud** y **Velocidad** con ticks; al **soltar** el slider se recargan los datos (no en cada micro-movimiento).
- [ ] Slider **Dose Rate** (solo proyectos de radiación).
- [ ] Selectores de **Misión** y **Campaña** (campaña se habilita al elegir misión).
- [ ] **Distribución** (histograma de barras de colores, solo radiación).
- [ ] **Total de medidas** abajo, número grande mono.
- [ ] Botón **Descargar report** → descarga un archivo.

### 4.4 Columna derecha (paneles)
- [ ] Panel **Layers**: toggles de Espectros / Capa MARNA (radiación) y Satélite. Activar/desactivar cada uno cambia el mapa.
- [ ] Panel **Dose Rate / Illumination**: leyenda de colores con su escala.
- [ ] Panel **Dose Statistics** (radiación, en modo hexágonos): Media / Máx / Mín / Desv / Samples en mono.

### 4.5 Tooltips (hover)
- [ ] Hover sobre un **hexágono** → tarjeta oscura con cabecera, media de dosis grande, min/max/desv y nº de mediciones.
- [ ] Hover sobre un **punto** (zoom alto) → valores de la medición (dosis/lux, velocidad, lat/lng, **Alt: NNN m** sin decimales, fecha, meteo si hay).
- [ ] La tarjeta del tooltip es **oscura** (no blanca) y legible.

### 4.6 Espectros (solo radiación)
- [ ] Activar el toggle **Espectros** en Layers → aparecen **pines azules** en el mapa.
- [ ] Hover sobre un pin → tooltip "Espectro #id" + coords + "Haz clic para ver el espectro".
- [ ] **Click en un pin** → se abre un **popup (modal)** con el espectro.
- [ ] En el popup: cabecera "Espectro #id", metadatos en una línea (Cuentas, Canales, Duración, Inicio, **Alt redondeada**), gráfico del espectro.
- [ ] Toggles **Log/Lineal** y **keV/Canal** cambian el gráfico.
- [ ] Si el espectro tiene calibración: se ven **líneas de isótopos** rojas (Cs-137, K-40, etc.) en modo keV.
- [ ] _Caso conocido:_ si el popup muestra un aviso amarillo "No encontré el array de cuentas… Campos recibidos: …" en vez del gráfico → **anótalo y copia esa lista de campos** (es un desajuste de nombres con el backend, no un crash).

---

## 5. Estadísticas (`/statistics`)

- [ ] Cabecera compacta: eyebrow mono `STATISTICS · RADIATION NETWORK` + título + subtítulo (en mono).
- [ ] **Rejilla de KPIs** (Total mediciones, Contribuidores, Tracks, Distancia, etc.): números en **mono color claro** (no cian, no rojo), separados por líneas.
- [ ] **Dosis mínima** muestra un valor real (p.ej. `0.000 µSv/h`), no un guion suelto.
- [ ] A la derecha, el **globo 3D** con el heatmap; hover sobre una celda → tooltip con medidas y dosis.
- [ ] Debajo del globo, **leyenda Dose Rate** con la escala de colores.
- [ ] Al hacer scroll, el globo queda **fijo (sticky)** mientras suben las stats (en pantallas anchas).
- [ ] No hay tarjetas azules, ni números en rojo, ni iconos junto a los labels.

---

## 6. Tracks (`/tracks`)

> Acceso: avatar → **Mis Tracks** (ruta protegida; sin sesión redirige a login).

- [ ] Panel lateral oscuro con la lista de tracks en **filas densas** (no tarjetas aireadas).
- [ ] Barra superior de la lista: **buscador** "find tracks…", **orden** (Recent/Oldest/Longest/Most samples) y contador "N tracks · X km total".
- [ ] Buscar por nombre/misión filtra la lista; cambiar el orden reordena.
- [ ] Cada fila muestra: nombre, **MISIÓN · CAMPAÑA** (mono), fechas colapsadas (mismo día → `… 22:34 → 22:39`), y línea de stats (`km · pts · max · avg µSv/h`) cuando hay datos.
- [ ] Pasar el ratón por una fila muestra los iconos **editar** y **borrar** a la derecha (ocultos si no hay hover); el de borrar se pone **rojo** solo al pasar por encima.
- [ ] Click en una fila → se **selecciona** (borde izquierdo cian + fondo sutil) y el mapa dibuja su recorrido.
- [ ] Sin track seleccionado: overlay oscuro "Selecciona un track para ver su recorrido".
- [ ] Mapa de tracks: dark, plano (no globo); leyenda **Dose Rate** arriba a la derecha.
- [ ] **No existe** botón "Nuevo Track" (la subida se hace desde la app móvil).
- [ ] Editar un track (lápiz) → abre diálogo; guardar actualiza.
- [ ] Borrar un track (papelera) → pide confirmación; al confirmar desaparece de la lista.

---

## 7. Perfil (`/profile`)

> Ruta protegida (sin sesión → login).

- [ ] Bloque de identidad: avatar circular cian con iniciales, nombre, línea mono `CONTRIBUTOR · MIEMBRO DESDE …`, email en mono.
- [ ] Sección **Editar perfil**: input de email (gris oscuro, sin icono dentro), botón **Guardar cambios** (cian) + **Cancelar**.
- [ ] Cambiar el email y Guardar → mensaje de éxito (snackbar).
- [ ] Sección **Tus estadísticas**: filas con label a la izquierda y valor mono a la derecha; **Dosis máxima** con unidad µSv/h. **Ningún número en rojo.**
- [ ] Sección **Periodo de actividad**: Primera/Última medición (fechas cortas mono) + **Días activo** calculado.
- [ ] Sección **Cuenta** → botón **Cerrar sesión** funciona.

---

## 8. Páginas de contenido

### 8.1 About (`/about`)
- [ ] Sin gradiente morado ni título cian gigante. Cabecera: kicker `CIENCIA CIUDADANA` + **Openred** + subtítulo.
- [ ] Fila de botones: **Crear cuenta** (cian) · Iniciar sesión · Ver mapa.
- [ ] Rejilla 2×2 de características (Mapa / Datos / Comunidad / App) **sin tarjetas ni iconos**.
- [ ] Footer con enlaces (GitHub, App móvil, Privacidad, Términos, Contacto) que funcionan.

### 8.2 App móvil (`/mobile-app`)
- [ ] Título "Aplicación móvil" (sin icono Android verde).
- [ ] Aviso "Aplicación en desarrollo" como **banner ámbar** (sin emoji ⚠).
- [ ] Características y limitaciones en lista densa.
- [ ] Botón **Descargar OpenRed.apk** descarga el APK.

### 8.3 Privacidad (`/privacy-policy`) y Términos (`/terms-of-service`)
- [ ] Cabecera `LEGAL` + título + "Última actualización".
- [ ] Secciones con `h2` (sin numeración tipo "1."), texto legible, enlace "Volver a la página principal".

---

## 9. Responsive (móvil)

Con DevTools en ~390px de ancho:
- [ ] Topbar usable; el panel de filtros del mapa se abre como cajón a casi pantalla completa.
- [ ] Páginas de auth centradas y legibles.
- [ ] Statistics/Tracks/Profile no se desbordan horizontalmente.

---

## 10. Regresión / cosas a vigilar

- [ ] **Consola sin errores** en rojo en ninguna página (warnings de React son tolerables, errores no).
- [ ] Ningún input se ve azul saturado (ni al autocompletar).
- [ ] Ningún texto ilegible por bajo contraste (gris sobre gris).
- [ ] Los filtros del mapa **persisten** al recargar (se guardan en el navegador).
- [ ] Tras login, refrescar la página **mantiene la sesión**.

---

## Cómo reportar un fallo

Para cada bug, anota:
1. **Página/ruta** y qué estabas haciendo.
2. **Pasos exactos** para reproducirlo.
3. **Esperado** vs **observado**.
4. **Navegador + versión + resolución**.
5. **Captura de pantalla** y, si hay, el **error de la consola** (texto en rojo).
6. ¿Es **bloqueante** (no se puede usar), **mayor** (funciona mal) o **menor** (cosmético)?
