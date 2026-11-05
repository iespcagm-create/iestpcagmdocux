# DOCUX

**Digitaliza. Gestiona. Avanza.**

DOCUX es una aplicación web **local-first** para digitalizar y organizar documentos. Este repositorio contiene la **Subfase 1A de la Fase 1**: la base visual, modular y verificable sobre la que se construirán las funciones siguientes.

> **Estado de esta entrega:** Subfase 1A finalizada y verificada. La autenticación real, la cámara, el almacenamiento de documentos, los respaldos y la instalación PWA **todavía no existen**. El acceso actual es una **vista previa en memoria** y no protege datos.

## Qué puede revisarse en esta entrega

- Pantalla de **Acceso** con una entrada explícita y etiquetada al modo de vista previa.
- **Panel** con accesos a los módulos y al estado del proyecto.
- Pantallas base de **Escanear**, **Mis documentos**, **Copias de seguridad** y **Configuración**, sin botones que simulen funciones inexistentes.
- Navegación inferior en móvil y barra lateral en escritorio, con un único cambio de estructura en 900 px.
- Rutas protegidas por una interfaz de sesión, página 404 y recuperación ante errores de interfaz.
- Enlace «Saltar al contenido», foco visible, títulos de página, avisos para lectores de pantalla y respeto a `prefers-reduced-motion`.
- Documentación, ADRs, plan de pruebas y evidencias de la Subfase 1A.

## Fuera de alcance de la Subfase 1A

No se implementan todavía:

- registro, inicio de sesión real, contraseña, recuperación de acceso ni sesión persistente;
- cámara, permisos de captura, recorte o procesamiento de imágenes;
- base de datos, almacenamiento de documentos, búsqueda o historial;
- generación de PDF;
- exportación, validación o importación de copias de seguridad;
- manifiesto, service worker, instalación PWA o funcionamiento sin conexión;
- backend, sincronización, telemetría, analítica, publicidad o servicios de pago;
- datos institucionales reales, credenciales o secretos.

## Requisitos

- **Node.js 26.x** (probado con 26.13.0 LTS).
- **npm 11.x** (probado con 11.20.0).
- Un navegador moderno basado en Chromium, Firefox o Safari.
- No se necesita servidor backend ni base de datos.

La aplicación se desarrolló y verificó en Windows. Los comandos son equivalentes en macOS y Linux.

## Puesta en marcha local

Para una persona con conocimientos técnicos:

```bash
npm install
npm run dev
```

Abrir `http://127.0.0.1:5173/` y pulsar **«Explorar la interfaz en modo vista previa»**.

El manual para la persona usuaria, sin terminal, está en [`docs/manual-usuario.md`](docs/manual-usuario.md).

## Comandos disponibles

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Inicia el servidor local de desarrollo en `127.0.0.1:5173`. |
| `npm run build` | Comprueba tipos y genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve la versión de producción en `127.0.0.1:4173`. |
| `npm run typecheck` | Ejecuta TypeScript sin generar archivos. |
| `npm run lint` | Ejecuta ESLint, incluidas las reglas de fronteras entre capas. |
| `npm test` | Ejecuta las pruebas automatizadas una vez. |
| `npm run test:watch` | Ejecuta las pruebas en modo interactivo. |

## Publicación

El sitio se publica como contenido estático en **Cloudflare Pages** (plan gratuito) mediante **subida directa** de la carpeta `dist/`. La decisión está en el [ADR 004](docs/adr/004-publicacion-estatica-cloudflare-pages.md).

Requisitos y pasos:

1. Compilar en local con **Node.js 26.x** (la versión está fijada en `.nvmrc`):
   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```
2. Verificar la versión de producción:
   ```bash
   npm run preview
   ```
   Abrir `http://127.0.0.1:4173/` y `http://127.0.0.1:4173/#/acceso`.
3. En Cloudflare, **Workers & Pages → Create → Pages → Upload assets**, y subir el contenido de `dist/`.
4. Comprobar en la URL publicada: acceso, navegación, logotipo, consola sin errores y cabeceras de seguridad.

Notas:

- **No** se publican `docs/`, `Logos/`, `testing/`, `.env` ni archivos de configuración local.
- La compilación **no** se delega a Cloudflare: su imagen usa Node.js 22 por defecto y no lee `engines`, por lo que `engine-strict` haría fallar la instalación. Se publica el `dist/` ya compilado.
- `public/robots.txt` y `X-Robots-Tag` mantienen la vista previa fuera de los buscadores. Para indexarla, hay que cambiar ambos y el `meta robots` de `index.html`.
- `public/_headers` aplica cabeceras de seguridad (CSP incluida) en Cloudflare Pages.

## Estructura

```text
src/
  app/                 composición, rutas, layout, guards y páginas del shell
  modules/
    auth/              sesión de vista previa (domain, infrastructure, ui)
    scanner/           pantalla base de escaneo
    documents/         pantalla base de documentos
    backup/            pantalla base de copias de seguridad
    settings/          pantalla base de configuración
  shared/              UI y estilos reutilizables
  test/                utilidades de prueba
docs/                  arquitectura, seguridad, datos, dependencias, ADRs y evidencias
testing/               arnés local para verificar anchos de pantalla
public/branding/       copia verificada del logotipo original de DOCUX
```

La regla de dependencias es **UI → aplicación → dominio/puertos ← infraestructura**. El detalle está en [`docs/architecture.md`](docs/architecture.md) y en el [ADR 002](docs/adr/002-monolito-modular.md).

## Verificación de la Subfase 1A

Resultados de la última ejecución (2026-11-05):

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores. |
| `npm run lint` | Sin errores. |
| `npm test` | 3 archivos, 14 pruebas aprobadas. |
| `npm run build` | Correcto. JS 330.66 kB (103.87 kB gzip); CSS 14.16 kB (3.81 kB gzip). |
| `npm audit --omit=dev` | 0 vulnerabilidades de producción. |
| Revisión visual | 320, 375, 768 y 1366 px, sin desbordamiento horizontal. |
| Lighthouse (acceso, producción) | Accesibilidad 100; Buenas prácticas 100; SEO 83 por `robots.txt` del servidor local (medición previa a la incorporación de `public/robots.txt`). |
| Consola del navegador | Sin errores durante el acceso y la navegación. |
| Red observada | Solo peticiones a `127.0.0.1:5173` en desarrollo. |

Las capturas y métricas están en [`docs/testing/results/1A/README.md`](docs/testing/results/1A/README.md).

## Privacidad y seguridad

- No hay backend, cuentas, telemetría ni envío de datos.
- La sesión de la Subfase 1A vive en memoria y desaparece al recargar.
- **La vista previa no es autenticación**; el guard de rutas es una simulación de interfaz, no una barrera de seguridad.
- No se deben introducir datos reales, credenciales ni secretos.
- La autenticación local de la Subfase 1B requerirá un diseño de seguridad específico y autorización aparte.

Ver [`docs/security.md`](docs/security.md).

## Documentación

- [Arquitectura](docs/architecture.md)
- [Seguridad](docs/security.md)
- [Modelo de datos](docs/data-model.md)
- [Dependencias y licencias](docs/dependencies.md)
- [Manual de usuario](docs/manual-usuario.md)
- [Limitaciones conocidas](docs/known-limitations.md)
- [Plan de pruebas](docs/testing/test-plan.md)
- [Evidencias de 1A](docs/testing/results/1A/README.md)
- ADRs: [001](docs/adr/001-pwa-local-first.md), [002](docs/adr/002-monolito-modular.md), [003](docs/adr/003-rutas-hash-y-sesion-vista-previa.md), [004](docs/adr/004-publicacion-estatica-cloudflare-pages.md)

## Coste y licencias

La Subfase 1A tiene **coste obligatorio S/ 0**. Todas las dependencias directas usan licencias permisivas (MIT o Apache-2.0) y no se ha contratado ningún servicio. El detalle y la verificación están en [`docs/dependencies.md`](docs/dependencies.md).

El código se distribuye como proyecto privado (`"license": "UNLICENSED"`). El logotipo original se conserva en `Logos/DOCUX logo.jpg`; la copia usada por la aplicación está en `public/branding/docux-logo.jpg` y mantiene el mismo hash SHA-256.

## Estado del repositorio

No existe repositorio Git ni se ha realizado ningún commit. La publicación está **preparada y verificada** (compilación en `dist/`, cabeceras de seguridad, `robots.txt` y ADR 004), pero el despliegue se realiza manualmente en Cloudflare Pages; todavía no se ha publicado ninguna URL. La creación de Git, la publicación y cualquier instalación adicional requieren autorización explícita.
