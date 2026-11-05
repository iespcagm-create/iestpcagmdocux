# Evidencias de la Subfase 1A

- **Fecha de ejecución:** 2026-11-05
- **Versión:** 0.1.0
- **Alcance:** base visual, rutas, guard de vista previa, responsive y accesibilidad básica
- **Entorno:** Windows; Node.js 26.13.0 LTS; npm 11.20.0; Chromium 152 (Electron 44.9.1)
- **Servidor de desarrollo:** `http://127.0.0.1:5173/`
- **Servidor de producción:** `http://127.0.0.1:4173/`

> Estas evidencias corresponden a la Subfase 1A. No demuestran autenticación real, captura de documentos, almacenamiento, respaldos ni instalación PWA, porque esas funciones no forman parte de esta entrega.

## 1. Comandos y resultados

| Comando | Resultado | Detalle |
| --- | --- | --- |
| `npm run typecheck` | ✅ Correcto | `tsc -b --pretty false` sin errores. |
| `npm run lint` | ✅ Correcto | `eslint .` sin errores. |
| `npm test` | ✅ Correcto | 3 archivos, 14 pruebas aprobadas. |
| `npm run build` | ✅ Correcto | 46 módulos transformados. |
| `npm audit --omit=dev` | ✅ 0 vulnerabilidades | Producción. |
| `npm audit` | ⚠️ 10 moderadas | Solo herramientas de desarrollo; 0 altas y 0 críticas. |

### Salida de compilación

```text
dist/index.html                   0.88 kB │ gzip:   0.49 kB
dist/assets/index-DDud92Xi.css   14.16 kB │ gzip:   3.81 kB
dist/assets/index-DTCub6K4.js   330.66 kB │ gzip: 103.87 kB
✓ built in 2.02s
```

### Pruebas automatizadas

| Archivo | Pruebas | Estado |
| --- | --- | --- |
| `src/app/routes.test.tsx` | 10 | ✅ |
| `src/modules/auth/infrastructure/InMemorySessionStore.test.ts` | 3 | ✅ |
| `src/app/errors/AppErrorBoundary.test.tsx` | 1 | ✅ |
| **Total** | **14** | ✅ |

Duración observada: 43,66 s en la verificación final y 18,76 s en una ejecución anterior (entorno jsdom; varía según el equipo).

## 2. Matriz responsive medida

Las medidas se tomaron dentro del iframe del arnés, con el ancho CSS indicado. `scrollWidth` es el ancho del contenido; un valor menor que el viewport se debe a la barra de desplazamiento vertical.

### 2.1 Panel

| Ancho × alto | `scrollWidth` | `scrollHeight` | Desbordamiento horizontal | Barra lateral | Cabecera móvil | Margen del contenido | Enlace de navegación |
| --- | ---: | ---: | :---: | --- | --- | ---: | --- |
| 320 × 1000 | 320 | 2372 | No | Fija inferior, ancho 305 px | Visible | 0 px | 56 × 59,39 px |
| 375 × 1000 | 360 | 2227 | No | Fija inferior, ancho 360 px | Visible | 0 px | 56 × 70,39 px |
| 768 × 1000 | 753 | 1729 | No | Fija inferior, ancho 753 px | Visible | 0 px | 56 × 149 px |
| 1366 × 1000 | 1351 | 1276 | No | Fija izquierda, ancho 272 px | Oculta | 272 px | 48 × 236 px |

En los cuatro anchos:

- hay 5 enlaces de navegación;
- el enlace activo tiene `aria-label="Panel"`;
- el banner de vista previa está presente;
- `lang="es"`;
- hay exactamente un `h1`;
- el título del documento es «Panel · DOCUX».

### 2.2 Acceso

| Ancho × alto | `scrollWidth` | `scrollHeight` | Desbordamiento | Tarjeta | Botón | Logotipo |
| --- | ---: | ---: | :---: | --- | --- | --- |
| 320 × 800 | 320 | 822 | No | 296 px, margen 12 px | 246 × 62 px | 230 px |
| 1366 × 800 | 1351 | 860 | No | 500 px, centrada | 414 × 48 px | 270 px |

La tarjeta de acceso a 320 × 800 necesita 22 px de desplazamiento vertical para mostrar el pie. No hay desbordamiento horizontal.

### 2.3 Pantallas de módulos

| Pantalla | Ancho | `scrollWidth` | Desbordamiento | `h1` | Estado vacío | Barra lateral |
| --- | ---: | ---: | :---: | --- | --- | --- |
| Escanear | 375 | 375 | No | «Escanear documento» | 343 px | Inferior, 375 px |
| Escanear | 1366 | 1366 | No | «Escanear documento» | 1006 px | Izquierda, 272 px |
| Mis documentos | 375 | 375 | No | «Tus documentos» | 343 px | Inferior, 375 px |
| Mis documentos | 1366 | 1366 | No | «Tus documentos» | 1006 px | Izquierda, 272 px |
| Copias de seguridad | 375 | 375 | No | «Protege tus datos locales» | 343 px | Inferior, 375 px |
| Copias de seguridad | 1366 | 1366 | No | «Protege tus datos locales» | 1006 px | Izquierda, 272 px |
| Configuración | 375 | 360 | No | «Configuración de DOCUX» | No aplica | Inferior, 360 px |
| Configuración | 1366 | 1366 | No | «Configuración de DOCUX» | No aplica | Izquierda, 272 px |

En 1366 px, las cuatro pantallas mantienen la barra lateral y un margen de contenido de 272 px. En 375 px, la cabecera móvil está visible y el margen izquierdo es 0.

## 3. Capturas

Todas las capturas se tomaron con el arnés en el ancho CSS indicado, sin transformar el layout. La altura de captura es la indicada; si el contenido continúa debajo, el `scrollHeight` lo refleja en las tablas.

| Archivo | Qué muestra |
| --- | --- |
| [`panel-320.png`](panel-320.png) | Panel a 320 px; barra inferior y contenido en una columna. |
| [`panel-375.png`](panel-375.png) | Panel a 375 px; etiquetas completas en la barra inferior. |
| [`panel-768.png`](panel-768.png) | Panel a 768 px; barra inferior y tarjetas en varias columnas. |
| [`panel-1366.png`](panel-1366.png) | Panel a 1366 px; barra lateral y contenido amplio. |
| [`acceso-320.png`](acceso-320.png) | Acceso a 320 px; tarjeta y botón dentro del ancho. |
| [`acceso-1366.png`](acceso-1366.png) | Acceso a 1366 px; tarjeta centrada. |
| [`escanear-375.png`](escanear-375.png) | Estado vacío de escaneo en móvil. |
| [`documentos-375.png`](documentos-375.png) | Estado vacío de documentos en móvil. |
| [`respaldos-375.png`](respaldos-375.png) | Estado vacío de copias de seguridad en móvil. |
| [`configuracion-375.png`](configuracion-375.png) | Configuración en móvil. |

## 4. Accesibilidad

### 4.1 Estructura y nombres

| Comprobación | Resultado |
| --- | --- |
| `lang="es"` | ✅ |
| Un `h1` por pantalla | ✅ |
| Jerarquía de encabezados | ✅ h1 → h2 → h3 sin saltos en el panel. |
| Landmarks | ✅ 1 `main`, 1 `nav` principal, 1 `aside`, encabezados semánticos. |
| Imagen del logotipo | ✅ `alt="DOCUX. Digitaliza. Gestiona. Avanza."` |
| Enlaces y botones visibles sin nombre | ✅ Ninguno. |
| IDs duplicados | ✅ Ninguno. |
| Objetivos táctiles | ✅ Ninguno por debajo de 44 × 44 px en la revisión de escritorio. |
| `aria-current="page"` | ✅ Presente en el enlace activo. |
| Enlace de salto | ✅ Primer elemento enfocable. |
| Foco al pulsar Enter en el salto | ✅ Pasa a `main#contenido-principal`. |
| Foco visible | ✅ Anillo azul de 3 px + halo blanco de 2 px. |
| Anuncio de ruta | ✅ Región `aria-live="polite"` con «Página …». |
| Movimiento reducido | ✅ Regla `prefers-reduced-motion` presente. |

### 4.2 Contraste medido

| Elemento | Relación | Criterio |
| --- | ---: | --- |
| Texto de descripción de página | 7,18:1 | ✅ AA |
| Texto de módulo | 7,79:1 | ✅ AA |
| Enlace de módulo | 6,98:1 | ✅ AA |
| Banner de vista previa | 8,61:1 | ✅ AA |
| Navegación activa | 16,64:1 | ✅ AAA |
| Navegación inactiva | 12,02:1 | ✅ AAA |
| Pie de la barra lateral | 8,07:1 | ✅ AAA |
| Nota de estado | 5,81:1 | ✅ AA |
| Texto atenuado sobre fondo general | 5,35:1 | ✅ AA |
| Párrafo del panel de bienvenida | 10,24–12,46:1 | ✅ AAA sobre el degradado oscuro |
| Foco azul sobre blanco | 5,19:1 | ✅ |
| Foco azul sobre azul marino | 3,36:1 | ✅ (no textual) |
| Halo blanco sobre azul marino | 17,45:1 | ✅ |

El cálculo del panel de bienvenida se hizo con los colores conocidos del degradado, porque el fondo es una imagen CSS y un cálculo automático de `backgroundColor` daría un falso negativo.

### 4.3 Prueba de teclado

1. Se enfocó el cuerpo del iframe y se pulsó **Tab**.
2. El foco llegó al enlace **«Saltar al contenido»**, visible en `top: 12px`.
3. El estilo calculado fue `outline: 3px solid rgb(9, 105, 218)` y `box-shadow: 0 0 0 2px #ffffff`.
4. Al pulsar **Enter**, el foco pasó a `main#contenido-principal`.
5. Al enfocar un enlace de navegación, se mantuvieron el anillo azul y el halo blanco.

### 4.4 Lighthouse

Auditoría ejecutada sobre la pantalla de acceso en la versión de producción (`http://127.0.0.1:4173/`):

| Categoría | Puntuación |
| --- | ---: |
| Accesibilidad | **100** |
| Buenas prácticas | **100** |
| SEO | 83 |

El único fallo de SEO es `robots.txt`: el servidor de vista previa responde con la aplicación. Es un artefacto del entorno local y no afecta al uso privado. El reporte completo está en [`lighthouse-acceso.html`](lighthouse-acceso.html) y [`lighthouse-acceso.json`](lighthouse-acceso.json).

## 5. Red y consola

| Comprobación | Resultado |
| --- | --- |
| Errores de consola durante el acceso | 0 |
| Errores de consola durante el panel | 0 |
| Peticiones externas | 0; todas a `127.0.0.1:5173`. |
| WebSocket | Solo la recarga en caliente de Vite en desarrollo. |
| `fetch`, XHR o axios en `src/` | No se encontraron. |
| `localStorage`, `sessionStorage`, cookies o IndexedDB | No se encontraron. |

La revisión de red se hizo en desarrollo. La compilación de producción no contiene llamadas de red en el código de la aplicación.

## 6. Auditoría de dependencias

| Ámbito | Total | Altas | Críticas | Moderadas | Bajas |
| --- | ---: | ---: | ---: | ---: | ---: |
| Producción | 0 | 0 | 0 | 0 | 0 |
| Desarrollo | 10 | 0 | 0 | 10 | 0 |

Las 10 moderadas de desarrollo provienen de `minimatch` (`GHSA-g3hv-75wg-m249`) dentro de ESLint y `typescript-eslint`. No se ejecutan en el navegador. La corrección implica evaluar un cambio mayor; se documenta como riesgo aceptado de 1A.

Reportes crudos:

- [`npm-audit-prod.json`](npm-audit-prod.json)
- [`npm-audit-dev.json`](npm-audit-dev.json)

## 7. Observaciones y límites de la evidencia

1. La verificación visual se hizo en Chromium 152; no sustituye pruebas en Safari, Firefox, iOS o Android reales.
2. Las capturas muestran la interfaz sin datos reales.
3. La altura de captura es 1000 px en el panel; el contenido de 1366 px mide 1276 px de alto, por lo que la captura no incluye el final de la página. La tabla de medidas documenta la altura completa.
4. En 320 px, la etiqueta «Documentos» de la barra inferior se muestra truncada; el nombre accesible completo sigue disponible.
5. La pantalla de acceso a 320 × 800 requiere 22 px de desplazamiento vertical.
6. La sesión de vista previa se pierde al recargar; las capturas protegidas se obtuvieron con el arnés, que activa la vista previa antes de navegar.
7. No se usó Playwright ni un navegador automatizado adicional; el arnés usa iframes y las mediciones se hicieron con `getComputedStyle` y `getBoundingClientRect`.
8. No hay repositorio Git ni commit; esta entrega es un conjunto de archivos locales.

## 8. Reproducción

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

Para las capturas:

```text
http://127.0.0.1:5173/testing/responsive-harness.html?w=1366&h=1000&page=panel
```

Cambiar `w`, `h` y `page` según la matriz. El arnés muestra `READY` cuando la pantalla está lista.
