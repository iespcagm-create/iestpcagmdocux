# Dependencias y licencias de DOCUX

- **Alcance:** Subfase 1A de la Fase 1
- **Última actualización:** 2026-11-05
- **Coste obligatorio:** S/ 0
- **Método de verificación:** versiones y licencias leídas de los `package.json` instalados; auditoría con npm.

## 1. Entorno de ejecución

| Herramienta | Versión | Origen | Licencia | Notas |
| --- | --- | --- | --- | --- |
| Node.js | 26.13.0 LTS | Instalación local autorizada | MIT | Requisito de desarrollo; no se distribuye con la PWA. |
| npm | 11.20.0 | Incluido con Node.js | Artistic-2.0 | Gestor de paquetes. |
| Navegador de pruebas | Chromium 152 (Electron 44.9.1) | Navegador integrado de OpenCode | Software propietario del navegador | Solo para verificación; no es dependencia del proyecto. |

`package.json` declara `engines.node: ">=26.0.0 <27"` y `.npmrc` activa `engine-strict=true` para evitar instalaciones con una versión no prevista.

## 2. Dependencias de producción

| Paquete | Versión exacta | Licencia | Uso |
| --- | --- | --- | --- |
| `react` | 19.3.1 | MIT | Biblioteca de interfaz. |
| `react-dom` | 19.3.1 | MIT | Renderizado en el navegador. |
| `react-router-dom` | 7.18.5 | MIT | Rutas, navegación y guards. |

Total de dependencias de producción directas: **3**. El informe `npm audit --omit=dev` contabiliza 8 paquetes de producción incluyendo dependencias transitivas.

## 3. Dependencias de desarrollo

| Paquete | Versión exacta | Licencia | Uso |
| --- | --- | --- | --- |
| `@eslint/js` | 10.0.1 | MIT | Configuración base de ESLint. |
| `@testing-library/dom` | 10.4.2 | MIT | Consultas DOM en pruebas. |
| `@testing-library/jest-dom` | 7.0.1 | MIT | Matchers de accesibilidad y DOM. |
| `@testing-library/react` | 16.3.3 | MIT | Renderizado de componentes en pruebas. |
| `@testing-library/user-event` | 14.6.8 | MIT | Simulación de interacción de usuario. |
| `@types/node` | 26.6.6 | MIT | Tipos de Node para la configuración. |
| `@types/react` | 19.3.0 | MIT | Tipos de React. |
| `@types/react-dom` | 19.3.0 | MIT | Tipos de React DOM. |
| `@vitejs/plugin-react` | 6.1.2 | MIT | Transformación de React en Vite. |
| `eslint` | 10.14.0 | MIT | Análisis estático. |
| `eslint-plugin-react-hooks` | 7.1.1 | MIT | Reglas de hooks. |
| `eslint-plugin-react-refresh` | 0.5.7 | MIT | Reglas de recarga en desarrollo. |
| `globals` | 17.14.0 | MIT | Definiciones de variables globales para ESLint. |
| `jsdom` | 30.1.3 | MIT | Entorno DOM para Vitest. |
| `typescript` | 6.0.3 | Apache-2.0 | Comprobación de tipos. |
| `typescript-eslint` | 8.72.1 | MIT | Integración de TypeScript con ESLint. |
| `vite` | 8.3.5 | MIT | Servidor de desarrollo y empaquetado. |
| `vitest` | 5.0.5 | MIT | Ejecutor de pruebas. |

Todas las licencias directas son permisivas y compatibles con un proyecto privado. No se ha identificado ninguna licencia copyleft fuerte en las dependencias directas.

## 4. Fijación de versiones

- `package.json` usa versiones exactas, sin `^` ni `~`.
- `package-lock.json` fija el árbol completo de dependencias.
- `.npmrc` contiene `save-exact=true`.
- Las actualizaciones deben ser deliberadas: revisar cambios, ejecutar typecheck, lint, pruebas y build, y actualizar el lockfile en el mismo cambio.
- No se actualiza automáticamente en producción.

## 5. Auditoría de seguridad

Ejecutada el 2026-11-05 con npm 11.20.0:

| Comando | Resultado |
| --- | --- |
| `npm audit --omit=dev --audit-level=low` | 0 vulnerabilidades de producción. |
| `npm audit --audit-level=low` | 10 vulnerabilidades moderadas, 0 altas, 0 críticas. |

Las 10 moderadas están en la cadena de herramientas de desarrollo:

- `minimatch` `>=7.0.0 <11.0.1` — `GHSA-g3hv-75wg-m249`, denegación de servicio por amplificación de patrones glob;
- afecta a `eslint`, `@eslint/config-array`, `@typescript-eslint/*` y `typescript-eslint`;
- no se incluye en el bundle del navegador ni en las dependencias de producción.

La corrección automática sugerida por npm implicaría un cambio mayor o una degradación de versión. No se aplica sin evaluar compatibilidad y sin autorización. El riesgo se limita al entorno de desarrollo local y debe revisarse en la próxima actualización del toolchain.

Reportes:

- [`npm-audit-prod.json`](testing/results/1A/npm-audit-prod.json)
- [`npm-audit-dev.json`](testing/results/1A/npm-audit-dev.json)

## 6. Scripts de instalación

El lockfile marca `fsevents` como paquete opcional con script de instalación. Es una dependencia específica de macOS para observación de archivos y no se ejecuta en Windows. No se identificaron otros paquetes con `hasInstallScript` en el árbol instalado.

## 7. Dependencias deliberadamente aplazadas

No están instaladas en 1A:

| Dependencia | Subfase prevista | Motivo |
| --- | --- | --- |
| Dexie / IndexedDB | 1D | No hay documentos que guardar todavía. |
| pdf-lib u otra librería de PDF | 1E | No hay generación de PDF en 1A. |
| `vite-plugin-pwa` | 1G | No hay manifiesto ni service worker en 1A. |
| Capacitor | Fase posterior, si se autoriza | La PWA se validará primero; añadir nativo tiene coste y mantenimiento. |
| Librería de cámara | 1C | La API del navegador se evaluará antes de añadir dependencias. |
| Zod u otro validador | 1B/1F | Se añadirá cuando existan datos que validar. |

## 8. Coste

- Node.js, npm, Vite, React, TypeScript, Vitest y ESLint son gratuitos y de código abierto.
- No se ha contratado hosting, base de datos, almacenamiento, analítica ni servicio de correo.
- El desarrollo y las pruebas se ejecutan en el equipo local.
- La publicación estática está preparada y verificada: `dist/` reproducible, `public/_headers` con cabeceras de seguridad, `public/robots.txt` sin indexación y ADR 004. El despliegue se realiza manualmente en Cloudflare Pages por subida directa; la URL pública se registrará aquí cuando exista.
- No hay compras dentro de la aplicación ni suscripciones.

## 9. Licencia del proyecto

`package.json` declara `"license": "UNLICENSED"` porque DOCUX es un proyecto privado. Esto no impide usar dependencias de código abierto, pero tampoco concede permiso para redistribuir el código del proyecto.

El logotipo se conserva sin modificaciones. Cualquier uso institucional del nombre o de la marca requiere la autorización correspondiente.
