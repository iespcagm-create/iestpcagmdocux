# Registros de decisiones de arquitectura (ADR)

Cada ADR documenta una decisión estructural, su contexto, las alternativas y sus consecuencias. Las decisiones se revisan cuando cambia el alcance o aparece información nueva; no se reescriben en silencio.

| ADR | Decisión | Estado | Fecha |
| --- | --- | --- | --- |
| [001](001-pwa-local-first.md) | PWA local-first con Vite, React y TypeScript; sin Capacitor en Fase 1. | Aceptado | 2026-11-05 |
| [002](002-monolito-modular.md) | Monolito modular con dependencias hacia el dominio y puertos explícitos. | Aceptado | 2026-11-05 |
| [003](003-rutas-hash-y-sesion-vista-previa.md) | Rutas hash y sesión de vista previa en memoria, explícitamente no autenticada. | Aceptado | 2026-11-05 |
| [004](004-publicacion-estatica-cloudflare-pages.md) | Publicación estática en Cloudflare Pages por subida directa de `dist/`, sin indexación en 1A. | Aceptado | 2026-11-05 |

## Decisiones previstas para subfases posteriores

No son ADR aceptados todavía; se registrarán cuando se autorice la subfase correspondiente:

- 1B: diseño de autenticación local, derivación de claves, bloqueo y recuperación.
- 1C: acceso a cámara, perfiles de resolución y liberación de recursos.
- 1D: IndexedDB, esquema de documentos y migraciones.
- 1E: generación y almacenamiento de PDF.
- 1F: formato, versión e integridad de los respaldos.
- 1G: manifiesto, service worker, caché y criterios de instalación PWA.
