# ADR 003: Rutas hash y sesión de vista previa en memoria

- **Estado:** Aceptado
- **Fecha:** 2026-11-05
- **Subfase:** 1A
- **Decisores:** equipo del proyecto DOCUX

## Contexto

La Subfase 1A debe poder abrirse como sitio estático, sin configurar reescrituras del servidor. También necesita mostrar el comportamiento de las rutas protegidas antes de que exista la autenticación local de la Subfase 1B.

El requisito es explícito: **no falsificar la autenticación ni presentar la vista previa como un inicio de sesión real**. La base debe permitir revisar la interfaz y, al mismo tiempo, dejar claro que no protege datos.

## Decisión

### Rutas

Usar `createHashRouter` de React Router. Las direcciones tienen la forma:

```text
http://127.0.0.1:5173/#/acceso
http://127.0.0.1:5173/#/panel
http://127.0.0.1:5173/#/escanear
```

Motivos:

- El servidor solo entrega `index.html`; el fragmento `#/...` lo resuelve el navegador.
- No se necesitan reglas de reescritura en el hosting estático.
- Es compatible con abrir la aplicación desde una carpeta local o un hosting gratuito.

### Sesión de vista previa

Modelar el acceso con un puerto explícito:

```ts
export interface SessionStore {
  getSnapshot(): AppSession | null;
  subscribe(listener: () => void): () => void;
  startPreview(): AppSession;
  clear(): void;
}
```

Para 1A se implementa `InMemorySessionStore`:

- La sesión es un objeto `{ kind: 'preview', label, startedAt }`.
- No se solicitan credenciales.
- No se guarda en `localStorage`, `sessionStorage`, cookies ni IndexedDB.
- Al recargar la página, la sesión desaparece y el guard redirige a `/acceso`.
- La interfaz muestra un aviso permanente: «Modo vista previa… Esta sesión no protege datos».
- El botón «Salir de la vista previa» limpia la sesión y devuelve a `/acceso`.

`ProtectedLayout` comprueba la sesión y redirige a `/acceso` si es `null`. `AccessRoute` redirige a `/panel` si ya existe una sesión de vista previa.

### Lo que esta decisión no significa

- No es autenticación.
- No es una frontera de seguridad.
- No protege documentos, porque en 1A no hay documentos.
- No sustituye el diseño de contraseña, recuperación, bloqueo o sesión de la Subfase 1B.

## Alternativas consideradas

| Alternativa | Motivo para no elegirla |
| --- | --- |
| `BrowserRouter` con rutas limpias | Requiere configurar el servidor para devolver `index.html` en rutas desconocidas; añade fricción al despliegue estático de 1A. |
| Simular un formulario de usuario y contraseña | Sería una autenticación falsa y confundiría a la persona usuaria. Rechazado por requisito. |
| Guardar un booleano en `localStorage` | Se parecería demasiado a una sesión real sin serlo y persistiría después de recargar. Rechazado. |
| No mostrar ninguna pantalla de acceso | Impide revisar el flujo de guard, la redirección y el estado de la sesión que se necesitan en 1B. |

## Consecuencias

### Positivas

- La aplicación funciona en cualquier hosting estático sin reescrituras.
- El flujo de guard queda implementado y probado antes de añadir criptografía.
- La persona revisora entiende de inmediato que no está iniciando sesión.
- La sustitución por la autenticación real en 1B queda acotada al adaptador y a la pantalla de acceso.

### Negativas y riesgos

- Las URLs incluyen `#/`, menos limpias que las rutas del historial.
- La sesión se pierde al recargar; es intencional en 1A.
- Un usuario podría visitar `/#/ruta-inexistente` sin sesión y ver la página 404; es el comportamiento esperado y no protege datos.
- El guard no debe reutilizarse como argumento de seguridad en 1B sin revisar el modelo de amenaza.

## Criterios de cumplimiento

- `createHashRouter` se usa en `src/app/router.ts`.
- Las pruebas confirman la redirección a `/acceso` sin sesión.
- Las pruebas confirman que la vista previa permite abrir las cinco rutas protegidas.
- Las pruebas confirman que «Salir de la vista previa» limpia la sesión.
- Ningún código de 1A usa almacenamiento persistente para la sesión.

## Referencias

- [ADR 001](001-pwa-local-first.md)
- [ADR 002](002-monolito-modular.md)
- [Seguridad de DOCUX](../security.md)
- [Manual de usuario](../manual-usuario.md)
