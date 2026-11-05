# ADR 002: Monolito modular con dependencias hacia el dominio

- **Estado:** Aceptado
- **Fecha:** 2026-11-05
- **Subfase:** 1A
- **Decisores:** equipo del proyecto DOCUX

## Contexto

DOCUX crecerá por módulos: acceso, escaneo, documentos, respaldos y configuración. Sin una regla de dependencias clara, la UI, el almacenamiento y las librerías externas terminarían acoplados y sería difícil probar o sustituir piezas.

En 1A no existe todavía una base de datos ni lógica de negocio compleja. Aun así, conviene fijar la estructura antes de añadir cámara, IndexedDB o PDF.

## Decisión

Adoptar un **monolito modular** con esta dirección de dependencias:

```text
UI (React)
   ↓
Aplicación (casos de uso)
   ↓
Dominio (entidades, reglas y puertos)
   ↑
Infraestructura (adaptadores: memoria, IndexedDB, cámara, PDF)
```

Reglas concretas:

1. `src/app/` es la raíz de composición: crea el router, monta providers y conecta adaptadores.
2. Cada módulo vive en `src/modules/<módulo>/` y puede tener `domain/`, `application/`, `infrastructure/` y `ui/`.
3. El dominio no importa React, React Router, Dexie, PDF ni adaptadores concretos.
4. La aplicación depende de puertos del dominio, no de implementaciones.
5. La UI consume casos de uso o contextos; no accede directamente a la infraestructura.
6. `src/shared/` contiene UI y utilidades transversales sin lógica de negocio.
7. ESLint bloquea imports de React, UI o infraestructura desde `domain/` y `application/`.

En 1A, el módulo `auth` es el único que necesita las cuatro capas:

```text
src/modules/auth/
  domain/session.ts                     puerto SessionStore y tipo AppSession
  infrastructure/InMemorySessionStore.ts adaptador efímero de vista previa
  ui/SessionProvider.tsx                 provider de React
  ui/sessionContext.ts                   contexto y hook
  ui/AccessPage.tsx                      pantalla de entrada
```

Los módulos `scanner`, `documents`, `backup` y `settings` son, por ahora, pantallas de UI sin lógica de negocio. No se crean carpetas vacías ni interfaces ficticias.

## Alternativas consideradas

| Alternativa | Motivo para no elegirla |
| --- | --- |
| Una sola carpeta `components/` y `pages/` | Se vuelve difícil separar responsabilidades cuando llegan cámara, PDF y respaldos. |
| Microfrontends o paquetes separados | Exceso de complejidad operativa para un equipo pequeño y una PWA local. |
| Arquitectura hexagonal completa con muchas interfaces vacías | Añade ceremonia sin valor en 1A; se introducen puertos solo cuando hay una necesidad real. |
| Dependencias libres sin lint | Permite atajos que rompen la testeabilidad y la sustitución de adaptadores. |

## Consecuencias

### Positivas

- La lógica futura podrá probarse sin navegador.
- Cambiar IndexedDB, cámara o PDF por otro adaptador no debería reescribir la UI.
- Las fronteras quedan verificadas automáticamente por ESLint.
- La estructura se puede explicar y revisar sin herramientas especiales.

### Negativas y riesgos

- Hay más archivos y carpetas que en una aplicación pequeña sin capas.
- La disciplina debe mantenerse cuando el equipo crezca.
- Algunas abstracciones de 1A son mínimas; no se deben sobreingenierizar antes de tener casos de uso reales.

## Criterios de cumplimiento

- `src/modules/auth/domain/session.ts` no importa React ni infraestructura.
- `InMemorySessionStore` implementa `SessionStore` y puede sustituirse en pruebas.
- `SessionProvider` recibe el store por props y no lo crea internamente.
- ESLint falla si `domain/` o `application/` importan React, UI o adaptadores.
- Los tests de rutas inyectan un store nuevo por prueba.

## Referencias

- [ADR 001](001-pwa-local-first.md)
- [Arquitectura de DOCUX](../architecture.md)
- [Reglas de ESLint](../../eslint.config.js)
