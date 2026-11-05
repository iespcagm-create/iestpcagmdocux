# ADR 001: PWA local-first con Vite, React y TypeScript

- **Estado:** Aceptado
- **Fecha:** 2026-11-05
- **Subfase:** 1A
- **Decisores:** equipo del proyecto DOCUX

## Contexto

DOCUX debe funcionar sin backend, sin coste obligatorio y con los datos en el dispositivo. La Fase 1 incluye escaneo, documentos, PDF, respaldos y uso sin conexión. La Subfase 1A solo necesita una base visual y modular, pero las decisiones de plataforma condicionan las subfases siguientes.

El usuario final no debe depender de una terminal. La aplicación se servirá como sitio estático y se abrirá desde un navegador moderno.

## Decisión

Usar una **PWA local-first** construida con:

- **Vite** como empaquetador y servidor de desarrollo.
- **React** para la interfaz.
- **TypeScript** en modo estricto.
- **React Router** con `createHashRouter`.
- **CSS propio** con variables y media queries; sin framework de UI.
- **Vitest + Testing Library + jsdom** para pruebas automatizadas.
- **ESLint** con reglas de fronteras arquitectónicas.

No se incorpora **Capacitor** en la Fase 1. La aplicación será una web instalable; si más adelante se necesita una aplicación nativa, se evaluará en una fase separada con presupuesto y autorización explícitos.

## Alternativas consideradas

| Alternativa | Motivo para no elegirla en 1A |
| --- | --- |
| Aplicación nativa con Capacitor | Añade toolchain Android/iOS, permisos y mantenimiento que no son necesarios para validar la base web. Se pospone. |
| Next.js con servidor | Introduce un backend y un coste de despliegue que contradicen el alcance local-first y el coste cero. |
| HTML/CSS/JavaScript sin framework | Dificulta el crecimiento modular, las pruebas de rutas y la accesibilidad sostenible. |
| Framework de UI con dependencias pesadas | Aumenta el tamaño, la superficie de dependencias y el coste de aprendizaje sin necesidad en 1A. |

## Consecuencias

### Positivas

- Coste obligatorio S/ 0 para desarrollo y uso local.
- Despliegue estático sencillo en cualquier hosting gratuito o en el propio dispositivo.
- TypeScript estricto y pruebas rápidas desde el primer día.
- Las dependencias de cámara, PDF, IndexedDB y PWA pueden añadirse por subfase, sin instalarlas antes de tiempo.
- El modo local-first evita enviar documentos a un servidor.

### Negativas y riesgos

- Una PWA no tiene el mismo acceso al hardware que una aplicación nativa; la cámara se resolverá con las APIs del navegador y sus límites.
- El almacenamiento del navegador puede ser borrado por el usuario o el sistema; los respaldos serán imprescindibles.
- La instalación PWA y el funcionamiento sin conexión requieren trabajo específico en la Subfase 1G.
- La seguridad local no equivale al cifrado del dispositivo; se documentará antes de la autenticación real.

## Criterios de cumplimiento

- `npm run build` genera una carpeta `dist/` estática.
- La aplicación no necesita backend para las pantallas de 1A.
- No se instalan dependencias de cámara, PDF, IndexedDB, PWA o Capacitor en 1A.
- La versión de Node y las dependencias quedan fijadas en `package.json` y `package-lock.json`.

## Referencias

- [Documentación de Vite](https://vite.dev/)
- [Documentación de React](https://react.dev/)
- [Documentación de React Router](https://reactrouter.com/)
- [MDN: Progressive web apps](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)
