# Tarea 3.1. Desarrollo de la infraestructura web
**M3–M15 · IBERCIVIS, UNIZAR**

Se llevó a cabo el desarrollo de la plataforma OpenRed teniendo en cuenta las
necesidades y soluciones planteadas en las reuniones de expertos y en las
diferentes actividades del proyecto, así como el análisis de las plataformas de
proyectos similares (Tarea 2.1). El resultado es una infraestructura web propia,
abierta y escalable, concebida no solo para recopilar datos de radiación gamma,
sino para sostener una comunidad activa de ciencia ciudadana en torno al
monitoreo ambiental preventivo.

La arquitectura de la plataforma se fundamenta en un ecosistema integrado por
cinco pilares:

- **Hardware.** Dispositivos portátiles y autónomos con sensores gamma y
  conectividad (Wi-Fi, LoRa o redes móviles), capaces de registrar mediciones
  geolocalizadas en campo.
- **Capa móvil.** Una aplicación para que la ciudadanía registre datos,
  geolocalice mediciones y visualice los niveles de radiación.
- **Backend y API.** Un servidor central, alojado en la Universidad de Zaragoza,
  con base de datos espacial y un conjunto de servicios (API) para la gestión,
  validación y almacenamiento de la información.
- **Gestión y seguridad.** Herramientas para la limpieza, validación y análisis
  de los datos, garantizando el cumplimiento del RGPD y la privacidad de las
  personas usuarias.
- **Interfaz web.** Un panel público con mapas interactivos para la
  visualización de la distribución geográfica de la radiación.

Sobre estos cinco pilares se estableció la hoja de ruta de una infraestructura
modular, en la que cada componente puede evolucionar de forma independiente.
A continuación se describen las bases tecnológicas desarrolladas en el núcleo de
la plataforma —el backend y su API—, sobre las que se asientan tanto la web
pública como las aplicaciones de captura de datos.

## El núcleo de la plataforma: backend y API

El corazón de OpenRed es un servidor de aplicaciones construido sobre el
*framework* **Django** y su extensión **Django REST Framework**, que expone una
**API REST** sobre la que se apoyan todos los clientes del proyecto (la web de
visualización, la aplicación móvil y los dispositivos de medida). Esta decisión
—separar un backend de servicios de los distintos *frontales*— es la que permite
que un mismo conjunto de datos y reglas de negocio dé servicio simultáneamente a
varios canales sin duplicar lógica.

La persistencia se apoya en una base de datos **PostgreSQL** con la extensión
geoespacial **PostGIS**, que permite almacenar cada medición como un punto
georreferenciado y realizar consultas espaciales (búsqueda por área, cálculo de
distancias, agregaciones por zona) directamente en la base de datos. Sobre esta
base se añadió un sistema de indexación geoespacial jerárquica basado en la
malla **H3**, que divide el territorio en celdas hexagonales de tamaño regular y
resulta especialmente eficiente para agregar millones de puntos en mapas de
calor y resúmenes por zona.

**Modelo de datos.** La información se organiza en una jerarquía que va de lo
general a lo concreto: **Proyecto → Misión → Campaña → Track → Medición.** Un
*proyecto* define el tipo de fenómeno observado (radiación gamma o contaminación
lumínica); las *misiones* y *campañas* agrupan los esfuerzos de recogida de
datos —por ejemplo, una salida concreta en una localidad—, y pueden protegerse
con contraseña para coordinar grupos cerrados. Un *track* representa un
recorrido de medición completo, y cada *medición* individual almacena la
posición, la marca temporal, la tasa de dosis y los parámetros del detector. El
modelo contempla además los **dispositivos** (con su modelo, número de serie,
fechas de calibración y propietario) y, para la contaminación lumínica, un
conjunto de campos específicos (luminancia, temperatura de color, coordenadas
cromáticas), lo que convierte a OpenRed en una plataforma multi-fenómeno y no
exclusivamente de radiación.

**Gestión de usuarios y seguridad.** La plataforma incorpora un sistema completo
de registro y autenticación de personas usuarias. El alta se realiza por correo
electrónico con verificación obligatoria de la dirección, y se ofrece además
**inicio de sesión con Google (OAuth 2.0)** para facilitar el acceso. La
comunicación entre los clientes y la API se autentica mediante *tokens*, y el
acceso a cada recurso está gobernado por un sistema de permisos: los datos
agregados y los mapas son de consulta pública, mientras que la creación,
modificación o borrado de mediciones requiere identificación y respeta la
propiedad de cada usuario sobre sus propios datos. Todo el tratamiento de datos
personales se diseñó conforme al RGPD.

**Carga de datos de medición.** En esta primera fase, la vía principal de
entrada de datos fue la **subida de recorridos completos** (*tracks*) desde la
aplicación de captura, en los formatos generados por los detectores RadiaCode
(JSON y RCTRK). Dado que un recorrido puede contener decenas de miles de puntos,
el procesamiento no se realiza de forma inmediata, sino que se delega a un
sistema de **tareas en segundo plano**: al recibir un fichero, la API responde
de inmediato y encola su análisis, de modo que el cliente puede consultar el
estado del procesamiento (pendiente, en proceso, completado o fallido) sin
bloquear la interfaz. Este procesamiento asíncrono se apoya en **Redis** como
sistema de colas y en procesos trabajadores dedicados, lo que permite absorber
picos de subida sin degradar el servicio.

**Visualización y consulta.** Sobre los datos almacenados, la API ofrece un
conjunto de servicios de consulta pensados para alimentar los mapas y paneles
del proyecto: filtrado por proyecto, campaña, dispositivo, fecha o área
geográfica; **agregación espacial mediante celdas H3** para construir mapas de
calor; histogramas de niveles de dosis, y estadísticas globales de la red
(número de mediciones, contribuyentes, kilómetros recorridos, valores extremos).
Estos servicios son los que permiten que cualquier persona, desde el navegador,
explore la distribución geográfica de la radiación de forma interactiva.

**Enriquecimiento de los datos.** Cada medición se complementa de forma
automática con información **meteorológica** del momento y lugar de la captura
(temperatura, humedad, presión, viento, nubosidad y precipitación), obtenida de
un servicio meteorológico externo de acceso abierto. Para evitar repetir
llamadas innecesarias, el sistema agrupa las mediciones próximas en el espacio y
el tiempo, de modo que una única consulta sirve a muchas mediciones cercanas.
Esta correlación entre radiación y meteorología abre la puerta a análisis más
ricos sobre el comportamiento de la radiación ambiental.

**Documentación y despliegue.** La API se publica con documentación interactiva
en formato **OpenAPI/Swagger**, lo que facilita su uso tanto por el equipo del
proyecto como por terceros (por ejemplo, los participantes de los hackathones).
En producción, la plataforma se sirve mediante un servidor de aplicaciones
**Gunicorn** tras un proxy inverso **Nginx**, con los procesos gestionados por
un supervisor que garantiza su reinicio automático, envío de correo
transaccional a través de Amazon SES y copias de seguridad diarias de la base de
datos.

## La web de visualización y el panel de usuario

Sobre la API descrita en los apartados anteriores se desarrolló la **interfaz web
de OpenRed**, el frontal con el que interactúa la ciudadanía y la puerta de
entrada principal a la plataforma. Se concibió como una **aplicación web de página
única** (*Single Page Application*) construida con **React** y **TypeScript**, que
se comunica con el servidor exclusivamente a través de la API REST. Esta
separación entre el frontal y el backend permite que la web evolucione de forma
independiente del núcleo de servicios y que la misma información alimente, sin
duplicar lógica, tanto a la web como a la aplicación móvil y a los dispositivos de
medida.

La pieza central de la interfaz es un **mapa interactivo de acceso público**, que
no requiere registro y permite a cualquier persona explorar desde el navegador la
distribución geográfica de la radiación ambiental. Para representar de forma
fluida un volumen de datos que crece de forma continua, la visualización se apoya
en la biblioteca de mapas **Deck.gl** —acelerada por hardware gráfico (WebGL)—
sobre un mapa base de **Mapbox**. El mapa se adapta de manera automática al nivel
de detalle con el que se observa el territorio: a escalas amplias muestra un **mapa
de calor** construido a partir de la malla hexagonal **H3** que proporciona la API
(con celdas tanto más finas cuanto mayor es el acercamiento), y al ampliar sobre
una zona concreta sustituye los hexágonos por las **mediciones individuales**,
coloreadas según una escala de niveles de dosis. De este modo se ofrece una visión
global de la red sin renunciar al detalle punto a punto.

En torno al mapa, la interfaz integra un **panel de filtros** que permite acotar
la información mostrada por proyecto, misión, campaña e intervalo de fechas. Cada
ajuste se traslada a las consultas correspondientes de la API, de forma que el
usuario compone su propia vista de los datos en tiempo real. La interfaz contempla
además
la **naturaleza multi-fenómeno** de la plataforma, distinguiendo entre proyectos
de radiación gamma y de contaminación lumínica y adaptando las escalas y leyendas a
cada caso.

Más allá de la consulta pública, la web incorpora un **panel de usuario** que da
acceso, previa identificación, a las funciones de gestión y participación. El
acceso se resuelve mediante el sistema de registro y autenticación de la API: alta
por correo electrónico con verificación, inicio de sesión tradicional o con cuenta
de **Google**, y recuperación de contraseña, gestionando la web de forma
transparente la sesión y la renovación de credenciales. Una vez dentro, la persona
usuaria puede **subir sus recorridos de medición** —con seguimiento del estado de
procesamiento asíncrono que realiza el servidor— y administrar su **perfil**.

A modo de síntesis, las bases tecnológicas de la web fueron:

- **Tecnologías:** React, TypeScript, biblioteca de componentes MUI (Material UI),
  Deck.gl y Mapbox GL para la cartografía, enrutado del lado del cliente (React
  Router) y comunicación con la API mediante peticiones HTTP (Axios).
- **Vistas principales:** mapa público de visualización; inicio de sesión, registro
  y verificación de correo; subida y gestión de recorridos; y perfil de usuario.
- **Integración con la API:** consumo de los servicios de agregación H3, de consulta
  de mediciones por área y filtros, de autenticación por *token* y de subida de
  recorridos, descritos en los apartados anteriores.
- **Despliegue:** la aplicación se compila como un **conjunto de ficheros estáticos**
  (HTML, JavaScript y CSS) servidos de forma independiente y diseñados para
  funcionar en los navegadores actuales, tanto de escritorio como móviles.

Con ello, al cierre de esta tarea la plataforma disponía de un frontal web operativo
y público que, apoyado en la API, permitía visualizar la red de mediciones,
registrarse, aportar datos y consultar los resultados, completando así la cara
visible de la infraestructura tecnológica de OpenRed.

A la finalización de esta tarea (M15) la plataforma quedó **operativa**,
permitiendo el registro de usuarios, la subida y el procesamiento de datos de
medición de radiación gamma, la gestión del backend y del frontend, el panel de
administración y las API necesarias para la comunicación con todos los clientes.
Con ello se cumplió el hito **H1 (web del proyecto puesta en marcha, M3)** y
**H3 (infraestructura tecnológica finalizada, M15)**.

---

# Tarea 3.4. Detección de puntos de mejora y refinado de la infraestructura tecnológica
**M16–M30 · IBERCIVIS, UNIZAR**

Una vez la plataforma estuvo operativa y tras las primeras campañas y
hackathones, se abrió una fase de **detección de puntos de mejora** y de
refinado continuo de la infraestructura tecnológica. Esta evolución se nutrió de
dos fuentes complementarias: por un lado, la **experiencia de uso real** en las
misiones de ciencia ciudadana, que reveló necesidades no previstas en el diseño
inicial; por otro, las **colaboraciones surgidas en los hackathones**, que
aportaron nuevas soluciones de hardware y nuevos casos de uso a los que la
plataforma debía dar respuesta.

## Alianzas y casos de uso que motivaron la evolución

La participación ciudadana en los diferentes hackathones permitió, además de dar
a conocer el proyecto, entrar en contacto con entidades, asociaciones y personas
interesadas en desarrollar tecnología en torno a las necesidades de OpenRed. De
estas colaboraciones surgieron varios casos de uso que orientaron el refinado de
la infraestructura:

- **Comunidad TTN-Madrid.** Como contemplaba el convenio, existía interés en
  colaborar con la comunidad de *The Things Network* de Madrid en soluciones de
  comunicación en tiempo real. La participación en los hackathones de febrero
  dio como fruto el trabajo en una solución *standalone* en la que un detector
  **Radiacode 102** se comunica directamente con un dispositivo **M5Stack** que,
  a su vez, transmite los datos a la plataforma OpenRed. Esta línea apuntaba
  también hacia la realización de **mediciones estacionarias en tiempo real.**
- **NonFiction.** La participación de una *spin-off* letona en el hackathon de
  Madrid permitió conocer una solución *standalone* con aporte de datos en
  tiempo real y autogestión de batería. Se mantuvieron reuniones para valorar su
  implementación, que finalmente se desestimó por motivos logísticos y
  económicos.
- **Grupo de investigación de la Universidad del País Vasco (UPV/EHU).** A raíz
  del hackathon de Bilbao, varios participantes del máster de Telecomunicaciones
  mostraron interés en seguir realizando medidas e integrar los detectores en
  aplicaciones propias, incluidas aplicaciones subacuáticas. Con ellos se han
  realizado campañas y se han cedido dispositivos en el marco de una
  colaboración continua.

El denominador común de estas colaboraciones —y muy especialmente de la solución
*standalone* con M5Stack— era una necesidad que la infraestructura inicial no
cubría: la de **dispositivos autónomos y headless** (sin pantalla ni aplicación
móvil que construya el recorrido) capaces de enviar lecturas **una a una y en
tiempo real**, incluyendo el caso de **estaciones fijas** que miden de forma
continua desde una ubicación. Atender esta necesidad fue el principal motor del
refinado del API descrito a continuación.

## Refinado del API: mejoras implementadas

Sobre las bases establecidas en la Tarea 3.1, se acometió un conjunto de mejoras
en el backend y su API para robustecer la plataforma y dar cabida a los nuevos
casos de uso:

**1. Ingesta de observaciones individuales.** Se incorporó una nueva vía de
entrada de datos, complementaria a la subida de recorridos completos, que
permite a los dispositivos autónomos enviar **cada medición de forma
individual** en el momento en que se produce. Esta vía resuelve directamente el
caso de la solución *standalone* con M5Stack, para la que construir el fichero de
recorrido completo en el propio dispositivo resultaba impracticable. Se
contemplan dos modos de captura: el modo **«en movimiento»**, en el que el
dispositivo envía su posición con cada lectura, y el modo **«estático»**,
pensado para estaciones fijas. La ingesta es **idempotente** (la repetición de
un envío no genera duplicados), lo que aporta tolerancia frente a reintentos y
cortes de conexión, habituales en dispositivos de campo.

**2. Autenticación por dispositivo.** Para que estos dispositivos autónomos
puedan operar sin la intervención de una persona usuaria, se introdujo un sistema
de **credenciales por dispositivo** (*token* de ingesta): cada dispositivo
dispone de una clave propia, que se entrega una sola vez en el momento del alta y
se almacena cifrada en el servidor, pudiendo **regenerarse** si se ve
comprometida. De este modo, la identidad y la propiedad de los datos quedan
determinadas por el propio dispositivo, sin necesidad de incrustar credenciales
de usuario en el firmware.

**3. Estaciones fijas y vigilancia de su estado.** Para dar soporte a las
**mediciones estacionarias en tiempo real** —la línea de trabajo abierta con
TTN-Madrid— se incorporó el concepto de **estación**: un dispositivo asociado a
una ubicación fija que produce una serie temporal de lecturas. Las lecturas de
una estación heredan automáticamente su localización, lo que simplifica el
firmware. Asociado a ello, se desarrolló un **proceso de vigilancia** que
comprueba periódicamente que cada estación sigue reportando con la cadencia
esperada y marca su estado (en línea / fuera de línea), sentando la base para
futuras alertas ante caídas de servicio.

**4. Agrupación automática de recorridos.** Dado que los dispositivos en modo
«movimiento» envían puntos sueltos, se añadió un proceso automático que los
**agrupa en recorridos** (*tracks*) en función del dispositivo y de las pausas
temporales entre lecturas, recalculando las estadísticas del recorrido. Así, los
datos enviados punto a punto acaban integrándose de forma transparente en la
misma estructura que los recorridos subidos como fichero.

**5. Unificación y robustez del enriquecimiento meteorológico.** El proceso de
asociación de datos meteorológicos se **unificó** en un único mecanismo común a
todas las vías de entrada (recorridos subidos, puntos en movimiento y lecturas de
estación). Este mecanismo agrupa las mediciones por celda geográfica y franja
horaria y rellena la información del clima de forma diferida y resiliente,
reintentando los casos fallidos sin bloquear la entrada de datos y reduciendo
drásticamente el número de llamadas al servicio meteorológico externo.

**6. Estadísticas e informes automáticos.** Se ampliaron los servicios de
análisis con **estadísticas globales** de la red y con la **generación
automática de informes en PDF** a partir de los datos filtrados (por proyecto,
campaña, área o fechas). Estos informes recogen mapas, histogramas de niveles,
series temporales, distribuciones horarias y correlaciones con la meteorología,
y constituyen una herramienta directa para devolver resultados a la ciudadanía
participante y a las entidades colaboradoras.

**7. Seguridad e integridad de los datos.** La experiencia operativa puso de
manifiesto un riesgo en el borrado de dispositivos, que podía arrastrar en
cascada sus mediciones asociadas. Se reforzó el modelo de datos para **proteger
las mediciones** frente a borrados accidentales: ahora no es posible eliminar un
dispositivo que conserve datos sin reasignarlos o eliminarlos explícitamente, lo
que blinda la integridad del histórico de la red. En paralelo se consolidó la
política de **copias de seguridad diarias** de la base de datos.

**8. Rendimiento y escalabilidad.** Por último, se introdujeron mejoras de
rendimiento orientadas a sostener el crecimiento de la red: **paginación** de los
listados de mediciones, nuevos **índices** para acelerar las consultas por fecha
y por rango de valores, y la ejecución de las **agregaciones espaciales H3
directamente en la base de datos**, lo que permite construir los mapas de calor
sobre volúmenes crecientes de datos sin penalizar los tiempos de respuesta.

## Refinado de la web: mejoras implementadas

En paralelo al refinado del API, y nutriéndose de las mismas fuentes —la
experiencia de uso real en las campañas y las colaboraciones surgidas en los
hackathones—, la interfaz web fue objeto de una evolución significativa orientada a
mejorar la experiencia de uso, a dar visibilidad a los nuevos casos de uso
(singularmente las **estaciones fijas en tiempo real**) y a sostener el crecimiento
de la red. Las principales mejoras fueron:

**1. Rediseño integral de la interfaz y sistema de diseño.** Se acometió una
renovación completa del aspecto y la estructura de la web, adoptando la biblioteca
de componentes **MUI (Material UI)** y un **sistema de diseño propio** basado en una
paleta y una tipografía unificadas. El resultado es una interfaz más coherente,
legible y profesional, con un panel lateral de filtros replegable y paneles
flotantes sobre el mapa que aprovechan mejor el espacio de pantalla, manteniendo un
**diseño adaptable** (*responsive*) para su uso tanto en ordenador como en
dispositivos móviles.

**2. Internacionalización (español e inglés).** La web se preparó para una
audiencia internacional mediante un sistema de **internacionalización** que ofrece
la interfaz completa en **español e inglés**. Los textos se externalizaron a
ficheros de traducción organizados por áreas funcionales (mapa, filtros,
estadísticas, dispositivos, registro, etc.), y se incorporó la **detección
automática del idioma** del navegador, un selector manual y el recuerdo de la
preferencia del usuario, junto con el formateo de fechas y cifras según la
convención local. Esta mejora amplía el alcance del proyecto más allá del ámbito
hispanohablante, en línea con las colaboraciones internacionales surgidas en los
hackathones.

**3. Gestión de dispositivos y estaciones fijas en tiempo real.** Como reflejo en
el frontal del refinado del API, la web incorporó una vista de **gestión de
dispositivos** y **estaciones fijas** que da soporte a los nuevos dispositivos
autónomos. Desde ella, la persona usuaria da de alta sus dispositivos y obtiene su
**credencial de ingesta** (*token*) —que se muestra una única vez y puede
regenerarse—, e instala estaciones fijas fijando su **ubicación sobre un mapa
interactivo**. La interfaz facilita además la puesta en marcha de estos
dispositivos *headless* ofreciendo un ejemplo de envío de mediciones, de modo que
las soluciones *standalone* (como la basada en M5Stack) puedan integrarse con la
plataforma de forma guiada.

**4. Nuevas visualizaciones sobre el mapa.** Se enriqueció el mapa con capas y
vistas adicionales que aportan contexto científico a los datos: la integración de
la **capa MARNA** (Mapa de Radiación Natural) como referencia superpuesta de la
radiación natural del terreno; un **conmutador de mapa base** entre vista
cartográfica oscura y vista de satélite; y la **visualización de espectros gamma**,
que permite seleccionar puntos con espectro asociado y consultar su histograma de
energías en detalle. Estas vistas convierten el mapa en una herramienta de
exploración más rica, no limitada a la mera representación de niveles.

**5. Rendimiento y fluidez del mapa.** Para sostener volúmenes crecientes de datos
sin penalizar la experiencia, se introdujeron diversas optimizaciones en el
cliente: la **resolución de la malla H3 se ajusta automáticamente** al nivel de
zoom, solicitando al servidor solo el grado de detalle necesario en cada momento;
las consultas se restringen al **área visible** (con un margen de caché que evita
recargas al desplazarse por zonas ya consultadas); las actualizaciones de la vista
al desplazar o ampliar el mapa se **amortiguan** para no saturar la API; y se añadió
una **barra de progreso** que informa del estado de carga de los datos. En
conjunto, estas mejoras permiten explorar la red de forma fluida incluso sobre
grandes cantidades de mediciones.

**6. Filtrado avanzado y descarga de informes.** El panel de filtros se amplió con
controles para acotar las mediciones por **altitud, velocidad y tasa de dosis**,
además de por fecha, misión y campaña, conservando las preferencias del usuario
entre sesiones. Asimismo, la web habilitó la **descarga directa de informes**
generados por el servidor a partir de la vista filtrada, lo que acerca a la
ciudadanía y a las entidades colaboradoras la posibilidad de obtener resultados
elaborados sin salir del navegador.

**7. Estadísticas de la red.** Se incorporó una vista de **estadísticas** que
resume el estado global de la red a partir de los servicios de análisis de la API:
número de mediciones, de personas contribuyentes y de recorridos registrados,
distancia total recorrida, valores extremos de dosis y cobertura geográfica, entre
otros indicadores. Esta vista ofrece una panorámica inmediata del alcance del
proyecto y refuerza el componente de retorno a la comunidad participante.

En conjunto, estas mejoras consolidaron la web de OpenRed como un frontal maduro,
internacionalizado y preparado para los nuevos casos de uso surgidos durante el
proyecto, en coherencia con la evolución del API descrita en los apartados
anteriores.

## La aplicación móvil de captura

Durante esta fase se desarrolló y maduró la **aplicación móvil de OpenRed**, la
herramienta con la que la ciudadanía captura datos en campo y los aporta a la
plataforma. Se trata de una **aplicación nativa multiplataforma** construida con el
*framework* **Flutter**, lo que permite mantener una única base de código para
**Android e iOS**, y que culminó con su **publicación en App Store y Google Play**.
La aplicación cierra así el ciclo completo del dato —captura, envío, validación y
visualización— al integrarse con el mismo backend a través de la API REST descrita
en los apartados anteriores.

El elemento diferencial de la aplicación es su **conexión directa con los
dispositivos de medida por Bluetooth de baja energía** (BLE). La persona usuaria
empareja su detector desde la propia aplicación y visualiza las lecturas **en tiempo
real** mediante indicadores tipo *gauge* y escalas de color por nivel. En coherencia
con el carácter **multi-fenómeno** de la plataforma, la aplicación soporta tanto
detectores de **radiación gamma** (familia RadiaCode), incluyendo la **captura del
espectro gamma**, como sensores de **contaminación lumínica** (luxómetro Opple
LM3), sobre una arquitectura de dispositivos extensible a nuevos modelos. La
incorporación del sensor de contaminación lumínica Opple LM3 se llevó a cabo en
**colaboración con el proyecto europeo PLAN-B**, financiado por la Unión Europea en
el marco del programa **Horizonte Europa** (*Research and Innovation Action*,
convocatoria HORIZON-CL6-2023-BIODIV-01, *Grant Agreement* nº 101135308). Esta
colaboración constituye el primer paso de una estrategia más amplia: convertir a
OpenRed en un **estándar abierto de recopilación de datos de sensores para la
ciencia ciudadana**, capaz de integrar de forma homogénea distintos tipos de
instrumentos y fenómenos ambientales bajo un mismo modelo de datos y una misma
infraestructura.

La función central es la **grabación de recorridos de medición geolocalizados**: la
aplicación combina la lectura del dispositivo con la posición **GPS** del teléfono y
registra el trayecto punto a punto. Para no perder datos durante salidas
prolongadas, la grabación continúa **en segundo plano** —apoyándose en un servicio
en primer plano y en el bloqueo de suspensión del dispositivo—, de modo que el
seguimiento prosigue aunque la pantalla esté apagada o se usen otras aplicaciones.
Una vez completado, el recorrido se **sube a la plataforma**, donde es procesado e
incorporado a la red de datos común.

La aplicación incorpora además un **mapa interactivo** (sobre cartografía Mapbox y
con la capa de referencia **MARNA**) para situar las mediciones en su contexto
geográfico, así como las funciones de cuenta necesarias para operar de forma
autónoma. En síntesis:

- **Tecnología:** Flutter (Dart), aplicación nativa para **Android e iOS**, publicada
  en **App Store y Google Play**.
- **Pantallas principales:** dispositivo y lecturas en tiempo real; recorridos
  (*tracks*); mapa; perfil de usuario; e información del proyecto.
- **Captura:** conexión BLE con detectores de radiación gamma (RadiaCode, con captura
  de espectro) y de contaminación lumínica (Opple LM3); grabación de recorridos
  geolocalizados con funcionamiento en segundo plano.
- **Integración con la API:** autenticación por contraseña o cuenta de **Google**,
  subida de recorridos y consumo de los servicios de la plataforma.
- **Internacionalización:** interfaz disponible en **español e inglés**.

Con esta aplicación, OpenRed completó su canal principal de participación ciudadana,
poniendo en manos de cualquier persona —con un dispositivo compatible y un teléfono—
la capacidad de contribuir a la red de monitorización ambiental. La apertura a
sensores de distinta naturaleza, iniciada con la integración del Opple LM3 junto al
proyecto Plan-B, refuerza la vocación de OpenRed de erigirse en una infraestructura
de referencia para la recogida normalizada de datos de sensores en ciencia
ciudadana, más allá del ámbito original de la radiación gamma.

## Acciones previstas hasta el 31/03/2026

- **Colaboración con la comunidad TTN para la solución *standalone*.** Estudio y
  testeo de la implementación de la solución de comunicación *standalone* y
  realización de un evento que muestre los avances del grupo TTN-Madrid,
  incluyendo nuevas utilidades como las mediciones estacionarias en tiempo real.
- **Solución EHU/UPV-Bilbao.** Comunicación de los resultados obtenidos por el
  grupo de investigadores y estudiantes de la UPV/EHU, dejando abierta la
  ideación de nuevas soluciones para futuras aplicaciones en OpenRed.
- **Pruebas piloto y seguimiento.** Desarrollo de pruebas piloto para el testeo
  de la infraestructura tecnológica y seguimiento e implantación de nuevas
  soluciones (nuevos dispositivos, nuevas herramientas y utilidades, mejoras de
  interfaz) a partir de la experiencia acumulada en las campañas de OpenRed.
