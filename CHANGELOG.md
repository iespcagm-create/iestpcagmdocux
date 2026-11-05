# Changelog

Todos los cambios relevantes de DOCUX se registran en este archivo.

El formato sigue la idea de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado semántico. En esta fase el proyecto es privado y no se publica en ningún registro.

## [No publicado] - 2026-11-05

### Añadido

- Preparación para publicación estática en Cloudflare Pages mediante subida directa de `dist/` (ADR 004).
- `public/_headers` con cabeceras de seguridad, incluida una política de contenido que no requiere `unsafe-inline`.
- `public/robots.txt` y `meta robots` para mantener la vista previa fuera de los buscadores.
- `.nvmrc` con Node.js 26.13.0 y sección «Publicación» en el README.
- Entradas defensivas en `.gitignore` para CLI de hosting, paquetes `.zip`, certificados y cachés.

### Cambiado

- La documentación de dependencias, limitaciones conocidas y plan de pruebas refleja el estado real de la publicación.

### No incluido

- Repositorio Git, commits, integración continua y despliegue automático.
- URL pública: el despliegue queda pendiente de ejecutarse en la cuenta de Cloudflare.

## [0.1.0] - 2026-11-05

### Añadido

- Base PWA local-first con Vite, React, TypeScript y React Router.
- Shell adaptable con barra lateral en escritorio (desde 901 px) y navegación inferior en móvil y tableta (hasta 900 px).
- Rutas de **Acceso**, **Panel**, **Escanear**, **Mis documentos**, **Copias de seguridad** y **Configuración**.
- Guard de rutas basado en una interfaz `SessionStore` y una sesión de vista previa en memoria.
- Pantalla de acceso transparente que explica que la vista previa **no es autenticación**.
- Aviso persistente de modo vista previa y acción para salir de ella.
- Página 404, recuperación ante errores de interfaz y anuncios de cambio de página para lectores de pantalla.
- Enlace «Saltar al contenido», foco gestionado al cambiar de ruta, anillo de enfoque de dos tonos y estilos para `prefers-reduced-motion`.
- Estilos responsivos verificados en 320, 375, 768 y 1366 px.
- Pruebas automatizadas de rutas protegidas, navegación, sesión, cierre de vista previa, 404 y límite de errores.
- Documentación de arquitectura, seguridad, modelo de datos, dependencias, manual de usuario, limitaciones, plan de pruebas y evidencias.
- ADRs 001, 002 y 003.
- Arnés local `testing/responsive-harness.html` para revisar la interfaz en anchos exactos sin dependencias adicionales.

### Cambiado

- El anillo de enfoque pasó de cian a un anillo azul con halo blanco para mantener contraste tanto sobre fondos claros como oscuros.
- La etiqueta del landmark lateral se generalizó a «Barra de navegación» porque en móvil se presenta como barra inferior.

### Corregido

- Se corrigieron imports relativos de las utilidades de prueba y del catálogo de navegación.
- Se eliminó un `setState` síncrono dentro de un efecto en el layout, reemplazándolo por contenido derivado y un anuncio `aria-live` estable.
- Se corrigieron identificadores duplicados potenciales en los estados vacíos mediante `useId`.

### Verificado

- `npm run typecheck`: sin errores.
- `npm run lint`: sin errores.
- `npm test`: 3 archivos y 14 pruebas aprobadas.
- `npm run build`: correcto; JS 330.66 kB (103.87 kB gzip), CSS 14.16 kB (3.81 kB gzip), HTML 0.88 kB (0.49 kB gzip).
- `npm audit --omit=dev`: 0 vulnerabilidades de producción.
- `npm audit` completo: 10 vulnerabilidades moderadas en herramientas de desarrollo, 0 altas y 0 críticas.
- Lighthouse sobre el acceso en producción: Accesibilidad 100, Buenas prácticas 100, SEO 83 por `robots.txt` del servidor local.
- Navegación y consola sin errores en Chromium 152 (Electron 44.9.1).
- Sin peticiones de red fuera de `127.0.0.1:5173` durante la revisión local.

### No incluido

- Autenticación local real, registro, contraseña, recuperación y persistencia de sesión.
- Cámara, captura, procesamiento de imágenes, documentos, PDF, búsqueda, historial y respaldos.
- Manifiesto, service worker, instalación PWA y funcionamiento sin conexión.
- Backend, sincronización, telemetría, analítica o servicios de pago.
- Publicación, repositorio Git, commit o despliegue.

### Nota de seguridad

Esta versión no debe describirse como «inicio de sesión» ni como una medida de seguridad. La sesión de vista previa es efímera, no solicita credenciales y no protege ningún dato.
