# ADR 004: Publicación estática en Cloudflare Pages

- **Estado:** Aceptado
- **Fecha:** 2026-11-05
- **Subfase:** 1A
- **Decisores:** equipo del proyecto DOCUX

## Contexto

La Subfase 1A es un sitio estático generado con Vite: no tiene backend, no procesa datos personales y usa rutas hash (`createHashRouter`), por lo que no necesita reescrituras del servidor. El proyecto debe poder mostrarse en internet con **coste S/ 0** y sin exponer código fuente, documentación interna ni evidencias.

El proyecto exige **Node.js 26.x** y `.npmrc` activa `engine-strict=true`. La imagen de compilación de Cloudflare Pages usa Node.js 22.23.4 por defecto y su sistema v3 **no deduce la versión desde `engines`**, por lo que una compilación en la nube fallaría con `EBADENGINE`.

## Decisión

1. Publicar el contenido de `dist/` como **sitio estático en Cloudflare Pages** (plan Free).
2. Desplegar mediante **subida directa de assets** (*Direct Upload*) desde el equipo local, no mediante compilación en la nube.
3. Compilar siempre en local con Node.js 26.13.0, fijado en `.nvmrc`.
4. Mantener **desactivada la indexación** mientras DOCUX 1A sea una vista previa de interfaz, mediante `public/robots.txt` y `X-Robots-Tag`.
5. Publicar únicamente el resultado de la compilación. `docs/`, `Logos/`, `testing/` y el código fuente no forman parte del sitio.
6. Añadir `public/_headers` con cabeceras de seguridad para Cloudflare Pages.

La URL pública será la asignada por Cloudflare Pages (subdominio `*.pages.dev`).

## Alternativas consideradas

| Alternativa | Motivo para no elegirla en 1A |
| --- | --- |
| Compilación en Cloudflare desde Git | Node 22 por defecto y `engine-strict` rompen la instalación; exigiría `NODE_VERSION=26.13.0`, una versión muy reciente en la imagen de compilación. Se revisará cuando abunden versiones 26 estables en CI. |
| GitHub Pages | Requiere Git y repositorio público, y un subdirectorio exige cambiar `base` en Vite. Se reserva para cuando exista control de versiones. |
| Netlify Drop | Válido y gratuito, pero la URL gratuita es aleatoria y el plan limita minutos de compilación. Cloudflare Pages ofrece URL estable y sin límite de peticiones. |
| Servidor propio o VPS | Introduce coste y mantenimiento, contrarios al alcance local-first y de coste cero. |

## Consecuencias

### Positivas

- Publicación gratuita, con HTTPS y CDN, sin backend.
- Ningún dato del entorno de desarrollo ni secreto viaja al hosting.
- La compilación local garantiza que se publica exactamente lo verificado con `typecheck`, `lint`, `test` y `build`.
- Las rutas hash funcionan sin configuración de servidor.

### Negativas y riesgos

- El despliegue es **manual**: cada cambio exige `npm run build` y volver a subir `dist/`.
- No hay integración continua ni despliegues de vista previa.
- La URL `*.pages.dev` no es un dominio propio.
- El sitio es público para cualquiera que tenga el enlace, aunque no se indexe.
- La CSP y las cabeceras deben verificarse después de cada cambio que añada recursos externos.

## Criterios de cumplimiento

- `npm run build` genera `dist/index.html` en la raíz y rutas de assets bajo `/assets/`.
- `dist/` incluye `robots.txt`, `_headers` y `branding/docux-logo.jpg`.
- El sitio responde en `/#/acceso`, `/#/panel` y el resto de rutas sin reescrituras.
- No se publican `docs/`, `Logos/`, `testing/`, `.env` ni archivos de configuración local.
- La compilación se ejecuta con Node.js 26.x.

## Referencias

- [ADR 001](001-pwa-local-first.md)
- [ADR 003](003-rutas-hash-y-sesion-vista-previa.md)
- [Seguridad de DOCUX](../security.md)
- [Dependencias](../dependencies.md)
- [Documentación de Cloudflare Pages](https://developers.cloudflare.com/pages/)
