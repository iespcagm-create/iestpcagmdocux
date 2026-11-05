# Plan de pruebas de la Subfase 1A

- **Versión:** 0.1.0
- **Fecha:** 2026-11-05
- **Alcance:** base visual, navegación, guard de vista previa, manejo de errores, adaptación a anchos y accesibilidad básica
- **Responsable:** equipo del proyecto DOCUX

## 1. Objetivo

Comprobar que la Subfase 1A:

1. permite recorrer las seis pantallas previstas sin funciones simuladas;
2. protege las rutas con el flujo de vista previa sin afirmar que es autenticación;
3. se adapta sin desbordamiento horizontal entre 320 y 1366 px;
4. ofrece una base de accesibilidad usable con teclado y lectores de pantalla;
5. no introduce errores de tipos, lint, pruebas o compilación;
6. no realiza envíos de datos ni llamadas externas;
7. deja documentación, ADRs y evidencias verificables.

## 2. Fuera de alcance

- Autenticación real, criptografía, contraseñas y recuperación.
- Cámara, permisos, captura, imágenes y PDF.
- IndexedDB, documentos, búsqueda, historial y respaldos.
- Manifiesto, service worker, instalación PWA y modo sin conexión.
- Pruebas en dispositivos físicos iOS/Android.
- Pruebas de carga, penetración o accesibilidad con lectores de pantalla reales.

## 3. Entorno

| Elemento | Valor |
| --- | --- |
| Sistema | Windows, equipo local |
| Node.js | 26.13.0 LTS |
| npm | 11.20.0 |
| Navegador | Chromium 152 (Electron 44.9.1, navegador de OpenCode) |
| Servidor de desarrollo | Vite 8.3.5 en `http://127.0.0.1:5173/` |
| Servidor de producción | Vite preview en `http://127.0.0.1:4173/` (cuando se usa) |
| Datos | Solo interfaz vacía; sin datos personales |

## 4. Niveles de prueba

| Nivel | Herramienta | Qué cubre |
| --- | --- | --- |
| Tipos | `tsc -b --pretty false` | Contratos, imports y modo estricto. |
| Estilo | `eslint .` | Hooks, refresh y fronteras de capas. |
| Unidad/integración | Vitest + Testing Library + jsdom | Rutas, sesión, guard, 404 y error boundary. |
| Compilación | `tsc -b && vite build` | Build de producción y tamaños. |
| Manual responsive | Arnés HTML + navegador | 320, 375, 768 y 1366 px; desbordamiento y estructura. |
| Manual accesibilidad | Navegador + evaluación DOM | Landmarks, títulos, foco, nombres, tamaños y contraste. |
| Red/consola | Herramientas del navegador | Peticiones externas y errores. |
| Dependencias | `npm audit` | Vulnerabilidades de producción y desarrollo. |

## 5. Casos automatizados

| ID | Caso | Resultado esperado |
| --- | --- | --- |
| A-01 | Abrir `/panel` sin sesión | Redirección a `/acceso` y encabezado «Acceso local». |
| A-02 | Abrir `/panel` con vista previa | Encabezado «Tu espacio de digitalización», ruta `/panel` y banner de vista previa. |
| A-03 | Abrir `/escanear` con vista previa | Encabezado «Escanear documento» y ruta correcta. |
| A-04 | Abrir `/documentos` con vista previa | Encabezado «Tus documentos» y ruta correcta. |
| A-05 | Abrir `/respaldos` con vista previa | Encabezado «Protege tus datos locales» y ruta correcta. |
| A-06 | Abrir `/configuracion` con vista previa | Encabezado «Configuración de DOCUX» y ruta correcta. |
| A-07 | Pulsar «Explorar la interfaz en modo vista previa» | Se crea la sesión, se abre `/panel` y el store contiene `kind: 'preview'`. |
| A-08 | Navegar de Panel a Escanear con el enlace | Se abre la pantalla de escaneo. |
| A-09 | Pulsar «Salir de la vista previa» | El store queda en `null` y se vuelve a `/acceso`. |
| A-10 | Abrir una ruta inexistente | Se muestra «Esta página no existe» y la ruta se conserva. |
| A-11 | Crear `InMemorySessionStore` | Empieza en `null`. |
| A-12 | Iniciar vista previa | Devuelve una sesión `preview`, actualiza el snapshot y notifica una vez. |
| A-13 | Cancelar suscripción y limpiar | El listener no recibe la notificación posterior y el snapshot queda en `null`. |
| A-14 | Error de renderizado | Se muestra «Algo salió mal», el botón de recarga y el texto de que no se enviaron datos. |

Archivos:

- `src/app/routes.test.tsx`
- `src/modules/auth/infrastructure/InMemorySessionStore.test.ts`
- `src/app/errors/AppErrorBoundary.test.tsx`

## 6. Matriz responsive

Se usa `testing/responsive-harness.html`, que carga la aplicación en un iframe con el ancho CSS exacto. No se instala ninguna dependencia adicional.

| ID | Ancho × alto | Pantalla | Comprobaciones |
| --- | --- | --- | --- |
| R-01 | 320 × 1000 | Panel | Barra inferior, cabecera móvil, sin desbordamiento, 5 enlaces, objetivos de 56 px. |
| R-02 | 375 × 1000 | Panel | Igual que R-01 con más espacio para etiquetas. |
| R-03 | 768 × 1000 | Panel | Barra inferior hasta 900 px, contenido en varias columnas, sin desbordamiento. |
| R-04 | 1366 × 1000 | Panel | Barra lateral fija de 272 px, cabecera móvil oculta, margen izquierdo de 272 px, sin desbordamiento. |
| R-05 | 320 × 800 | Acceso | Tarjeta dentro del ancho, botón de 62 px de alto, sin desbordamiento horizontal. |
| R-06 | 1366 × 800 | Acceso | Tarjeta centrada de 500 px, sin desbordamiento. |
| R-07 | 375 × 1000 | Escanear | Estado vacío, barra inferior y botón de retorno. |
| R-08 | 375 × 1000 | Mis documentos | Estado vacío y botón de retorno. |
| R-09 | 375 × 1000 | Copias de seguridad | Estado vacío, aviso y botón de retorno. |
| R-10 | 375 × 1000 | Configuración | Lista de detalles en una columna, sin desbordamiento. |
| R-11 | 1366 × 1000 | Escanear, documentos, respaldos y configuración | Barra lateral, contenido amplio y sin desbordamiento. |

Criterio de aceptación: `scrollWidth` no supera el ancho del viewport en ninguna pantalla (sin desplazamiento horizontal).

## 7. Casos manuales de accesibilidad

| ID | Caso | Resultado esperado |
| --- | --- | --- |
| U-01 | Idioma del documento | `lang="es"`. |
| U-02 | Título de página | Cambia a «Panel · DOCUX», «Escanear · DOCUX», etc. |
| U-03 | Encabezado principal | Exactamente un `h1` por pantalla. |
| U-04 | Jerarquía de encabezados | Sin saltos que oculten niveles (h1 → h2 → h3). |
| U-05 | Landmarks | Un `main`, una `nav` principal, un `aside` y encabezados semánticos. |
| U-06 | Imagen del logotipo | `alt` descriptivo: «DOCUX. Digitaliza. Gestiona. Avanza.». |
| U-07 | Nombres accesibles | Todos los enlaces y botones visibles tienen nombre textual o `aria-label`. |
| U-08 | Identificadores | Sin IDs duplicados. |
| U-09 | Objetivos táctiles | Enlaces y botones visibles de al menos 44 × 44 px en la revisión de escritorio. |
| U-10 | Enlace de salto | Es el primer elemento enfocable; al pulsar Enter, el foco pasa a `main`. |
| U-11 | Foco visible | Anillo azul de 3 px con halo blanco de 2 px, visible en fondos claros y oscuros. |
| U-12 | Página actual | El enlace activo tiene `aria-current="page"`. |
| U-13 | Anuncio de ruta | Región `aria-live="polite"` anuncia «Página …». |
| U-14 | Contraste de texto | Texto normal ≥ 4.5:1; texto grande ≥ 3:1. |
| U-15 | Movimiento reducido | La regla `prefers-reduced-motion` reduce transiciones y animaciones. |
| U-16 | Consola | Sin errores durante acceso, panel y navegación. |
| U-17 | Lighthouse de producción (acceso) | Accesibilidad y buenas prácticas ≥ 95; sin fallos graves de accesibilidad. |

## 8. Casos manuales de seguridad y red

| ID | Caso | Resultado esperado |
| --- | --- | --- |
| S-01 | Recargar en una ruta protegida | La sesión desaparece y se vuelve a `/acceso`. |
| S-02 | Salir de la vista previa | Se limpia el store y se vuelve a `/acceso`. |
| S-03 | Inspeccionar almacenamiento | No se crean claves en `localStorage`, `sessionStorage`, cookies ni IndexedDB. |
| S-04 | Inspeccionar red | Solo peticiones al servidor local; ninguna a un dominio externo. |
| S-05 | Buscar secretos | Sin `.env`, tokens ni credenciales en el repositorio. |
| S-06 | Auditar dependencias | 0 vulnerabilidades de producción; las de desarrollo quedan documentadas. |

## 9. Criterios de aceptación de 1A

La subfase se considera cerrada cuando:

- [x] `npm run typecheck` termina sin errores.
- [x] `npm run lint` termina sin errores.
- [x] `npm test` aprueba todas las pruebas.
- [x] `npm run build` genera `dist/` correctamente.
- [x] Las seis pantallas son alcanzables con la vista previa.
- [x] El guard redirige a `/acceso` sin sesión.
- [x] La vista previa está etiquetada como no autenticada.
- [x] No hay desbordamiento horizontal en 320, 375, 768 y 1366 px.
- [x] La consola no muestra errores en el recorrido manual.
- [x] No se observan peticiones externas en el recorrido local.
- [x] Lighthouse de producción reporta Accesibilidad 100 y Buenas prácticas 100.
- [x] Existen README, CHANGELOG, ADRs 001–003, manual y evidencias.
- [x] Se documentan limitaciones y riesgos.
- [x] El contenido de `dist/` está preparado para publicación estática: rutas hash, `robots.txt`, `_headers`, cabeceras de seguridad y ausencia de secretos.
- [ ] Repositorio Git y despliegue: pendientes. La publicación se realiza manualmente en Cloudflare Pages (ADR 004).

## 10. Cómo reproducir

Para una persona técnica:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

Abrir `http://127.0.0.1:5173/` para el recorrido normal.

Para el arnés de anchos, con el servidor de desarrollo activo:

```text
http://127.0.0.1:5173/testing/responsive-harness.html?w=375&h=1000&page=panel
```

Valores de `page`: `access`, `panel`, `escanear`, `documentos`, `respaldos`, `configuracion`.

El arnés:

1. carga la aplicación en un iframe del ancho indicado;
2. si la página no es `access`, activa la vista previa;
3. navega a la pantalla solicitada;
4. muestra `READY` cuando la interfaz está lista para la captura.

No se usa en producción ni se incluye en el bundle.

## 11. Evidencias

Los resultados reales, capturas y reportes de auditoría están en:

- [`testing/results/1A/README.md`](results/1A/README.md)
- [`testing/results/1A/panel-320.png`](results/1A/panel-320.png)
- [`testing/results/1A/panel-375.png`](results/1A/panel-375.png)
- [`testing/results/1A/panel-768.png`](results/1A/panel-768.png)
- [`testing/results/1A/panel-1366.png`](results/1A/panel-1366.png)
- [`testing/results/1A/acceso-320.png`](results/1A/acceso-320.png)
- [`testing/results/1A/acceso-1366.png`](results/1A/acceso-1366.png)
- [`testing/results/1A/escanear-375.png`](results/1A/escanear-375.png)
- [`testing/results/1A/documentos-375.png`](results/1A/documentos-375.png)
- [`testing/results/1A/respaldos-375.png`](results/1A/respaldos-375.png)
- [`testing/results/1A/configuracion-375.png`](results/1A/configuracion-375.png)
- [`testing/results/1A/npm-audit-prod.json`](results/1A/npm-audit-prod.json)
- [`testing/results/1A/npm-audit-dev.json`](results/1A/npm-audit-dev.json)
- [`testing/results/1A/lighthouse-acceso.html`](results/1A/lighthouse-acceso.html)
- [`testing/results/1A/lighthouse-acceso.json`](results/1A/lighthouse-acceso.json)
