# Arquitectura de DOCUX

- **Alcance:** Subfase 1A de la Fase 1
- **Última actualización:** 2026-11-05
- **Decisiones relacionadas:** [ADR 001](adr/001-pwa-local-first.md), [ADR 002](adr/002-monolito-modular.md), [ADR 003](adr/003-rutas-hash-y-sesion-vista-previa.md)

## 1. Propósito

Esta entrega fija la base técnica de DOCUX: una PWA local-first, sin backend, con una estructura modular que permita añadir autenticación local, cámara, documentos, PDF, respaldos y funcionamiento sin conexión sin reescribir el shell.

La Subfase 1A **no implementa funciones de negocio**. Implementa la navegación, el diseño adaptable, los estados vacíos, el manejo de errores y un flujo de acceso de vista previa que será sustituido en 1B.

## 2. Principios

1. **Local-first:** los datos futuros vivirán en el dispositivo; no hay servidor ni sincronización en la Fase 1.
2. **Coste cero obligatorio:** solo herramientas y librerías de código abierto con licencias permisivas.
3. **Módulos antes que capas globales:** cada capacidad vive en `src/modules/<módulo>`.
4. **Dependencias hacia el dominio:** la UI no conoce IndexedDB, cámara ni PDF; conoce puertos y casos de uso.
5. **Accesibilidad desde la base:** HTML semántico, foco visible, anuncios de ruta, objetivo táctil mínimo y movimiento reducido.
6. **Transparencia:** la vista previa se etiqueta como tal; no se simulan funciones inexistentes.

## 3. Vista de capas

```text
┌──────────────────────────────────────────────────────────────┐
│ src/app/                                                     │
│ Composición: router, providers, layout, guards y páginas     │
│ del shell. Es la única capa que puede conectar adaptadores.  │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│ src/modules/*/ui/                                            │
│ Componentes React de cada módulo.                            │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│ src/modules/*/application/  (cuando exista lógica de caso)  │
│ Orquesta casos de uso. No conoce React ni adaptadores.       │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│ src/modules/*/domain/                                        │
│ Entidades, reglas y puertos. No conoce React ni librerías    │
│ de infraestructura.                                          │
└───────────────────────────────▲──────────────────────────────┘
                                │ implementa puertos
┌───────────────────────────────┴──────────────────────────────┐
│ src/modules/*/infrastructure/                                │
│ Adaptadores: memoria (1A), IndexedDB, cámara, PDF, archivos. │
└──────────────────────────────────────────────────────────────┘
```

En 1A solo `auth` necesita las cuatro capas. Los demás módulos contienen únicamente `ui/` porque todavía no tienen lógica de negocio. No se crean interfaces vacías «por si acaso».

### Regla de dependencias

```text
UI → aplicación → dominio/puertos ← infraestructura
```

- `src/app/providers.tsx` es la raíz de composición: crea `InMemorySessionStore` y lo inyecta en `SessionProvider`.
- `SessionProvider` recibe el store por props; no lo instancia.
- `useSession` es el punto de acceso de la UI al estado de sesión.
- El dominio de auth define `SessionStore` y `AppSession` sin importar React.
- `InMemorySessionStore` implementa el puerto y no conoce componentes.

ESLint aplica restricciones de importación a `src/modules/*/domain`, `src/modules/*/application` y `src/core` (si se añade en el futuro). Las reglas están en `eslint.config.js`.

## 4. Estructura del código

```text
src/
  main.tsx                         punto de entrada
  app/
    App.tsx                        error boundary + providers + router
    providers.tsx                  composición de la sesión
    router.ts                      createHashRouter
    routes.tsx                     mapa de rutas
    navigation.ts                  catálogo de navegación
    layout/AppLayout.tsx           shell, banner, foco y anuncios
    guards/AccessRoute.tsx         redirección si ya hay vista previa
    guards/ProtectedLayout.tsx     redirección si no hay sesión
    errors/AppErrorBoundary.tsx    recuperación ante errores de React
    pages/PanelPage.tsx            panel de inicio
    pages/NotFoundPage.tsx         error 404
  modules/
    auth/
      domain/session.ts
      infrastructure/InMemorySessionStore.ts
      ui/SessionProvider.tsx
      ui/sessionContext.ts
      ui/AccessPage.tsx
    scanner/ui/ScannerPage.tsx
    documents/ui/DocumentsPage.tsx
    backup/ui/BackupPage.tsx
    settings/ui/SettingsPage.tsx
  shared/
    styles/global.css
    ui/Brand.tsx
    ui/EmptyState.tsx
    ui/Icon.tsx
    ui/PageHeader.tsx
    ui/usePageTitle.ts
  test/
    setup.ts
    renderRoute.tsx
```

## 5. Rutas y navegación

El mapa de rutas está en `src/app/routes.tsx`:

| Ruta | Elemento | Acceso |
| --- | --- | --- |
| `/acceso` | `AccessRoute` → `AccessPage` | Público. Si hay vista previa, redirige a `/panel`. |
| `/` | `ProtectedLayout` → `AppLayout` | Requiere vista previa. El índice redirige a `/panel`. |
| `/panel` | `PanelPage` | Requiere vista previa. |
| `/escanear` | `ScannerPage` | Requiere vista previa. |
| `/documentos` | `DocumentsPage` | Requiere vista previa. |
| `/respaldos` | `BackupPage` | Requiere vista previa. |
| `/configuracion` | `SettingsPage` | Requiere vista previa. |
| `*` | `NotFoundPage` | Público. |

Se usa `createHashRouter` porque el fragmento de URL no necesita reescrituras del servidor. Ver [ADR 003](adr/003-rutas-hash-y-sesion-vista-previa.md).

### Flujo de vista previa

```text
[Acesso /acceso]
      │ pulsar «Explorar la interfaz en modo vista previa»
      ▼
SessionStore.startPreview()
      │ sesión { kind: 'preview' } en memoria
      ▼
[Panel /panel] ── navegación ──► [Módulos]
      │
      │ recargar la página
      ▼
sesión = null → ProtectedLayout redirige a /acceso
```

La sesión se pierde al recargar **por diseño**. No se escribe en `localStorage`, `sessionStorage`, cookies ni IndexedDB.

## 6. Layout y adaptación

`AppLayout` contiene:

- enlace «Saltar al contenido»;
- `aside` con logotipo, `nav` principal y nota de fase;
- cabecera móvil con marca y etiqueta de vista previa;
- banner de advertencia de vista previa;
- región `aria-live` con el nombre de la página;
- `main` enfocable con `tabIndex={-1}`.

Puntos de ruptura:

| Ancho | Comportamiento |
| --- | --- |
| 901 px o más | Barra lateral fija de 272 px, cabecera móvil oculta, contenido con margen izquierdo. |
| 900 px o menos | Barra inferior fija, cabecera móvil visible, sin margen izquierdo, etiquetas cortas. |
| 520 px o menos | Una columna en tarjetas y listas; menos espacio vertical. |
| 350 px o menos | Tipografía de navegación algo menor y botones con menos relleno lateral. |

El foco se mueve a `main` al cambiar de ruta con `preventScroll`, y el título del documento se actualiza. Esto ayuda a lectores de pantalla y evita que el foco quede en un enlace de la página anterior.

## 7. Manejo de errores

| Situación | Respuesta |
| --- | --- |
| Ruta desconocida | Página 404 con enlace al inicio. |
| Error de renderizado de React | `AppErrorBoundary` muestra «Algo salió mal», explica que no se enviaron datos y ofrece recargar. |
| Sesión ausente en ruta protegida | Redirección a `/acceso`, conservando la ruta de origen en `state.from`. |
| Error de red | No aplica en 1A: no hay red ni backend. |

`AppErrorBoundary` registra el error en la consola local mediante `console.error`; no hay telemetría ni envío remoto.

## 8. Estilos y sistema visual

`src/shared/styles/global.css` contiene:

- variables de color, radios, sombras y anchos;
- componentes base: botones, etiquetas, avisos, tarjetas, estados vacíos, listas de detalle;
- diseño adaptable con media queries;
- foco visible de dos tonos;
- reglas de movimiento reducido;
- soporte de `env(safe-area-inset-bottom)` para la barra inferior.

No se usa Tailwind, Bootstrap ni otra dependencia de estilos. Esto reduce el peso y mantiene el control del contraste y del foco.

## 9. Pruebas y calidad

- `vitest` + `@testing-library/react` + `jsdom` para pruebas de rutas, sesión y error boundary.
- `renderRoute` inyecta un `InMemorySessionStore` nuevo por prueba.
- `tsc -b` en modo estricto, con `noEmit` en la configuración.
- ESLint con reglas de React Hooks, refresh y fronteras de capas.
- Arnés manual `testing/responsive-harness.html` para cargar la app en iframes de 320, 375, 768 y 1366 px sin instalar Playwright.

Ver el [plan de pruebas](testing/test-plan.md) y las [evidencias](testing/results/1A/README.md).

## 10. Evolución prevista

| Subfase | Cambio arquitectónico esperado | Contrato que se conserva |
| --- | --- | --- |
| 1B | Adaptador de autenticación local real; reemplazo de `InMemorySessionStore`. | `SessionStore`, `ProtectedLayout` y `AccessPage`. |
| 1C | Módulo de cámara con puerto de captura y adaptador de MediaDevices. | La UI de escaneo seguirá dependiendo de casos de uso, no de la cámara. |
| 1D | IndexedDB mediante un adaptador de persistencia. | Entidades de documento y puertos de repositorio. |
| 1E | Generación de PDF en un adaptador dedicado. | La UI solicitará «generar PDF», no conocerá la librería. |
| 1F | Exportación/importación de respaldos con versión e integridad. | Un puerto de respaldo y un formato versionado. |
| 1G | Manifiesto y service worker. | El shell y las rutas no cambian. |

Cada subfase debe actualizar su ADR, documentación, pruebas y evidencias antes de avanzar.

## 11. Decisiones pendientes

- Estrategia de autenticación local y derivación de claves (1B).
- Modelo de datos definitivo y migraciones (1D).
- Formato de PDF y metadatos (1E).
- Formato de respaldo, compresión y verificación de integridad (1F).
- Estrategia de caché y actualización del service worker (1G).
- Necesidad real de Capacitor después de validar la PWA en dispositivos.
