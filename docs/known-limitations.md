# Limitaciones conocidas de la Subfase 1A

- **Fecha:** 2026-11-05
- **Estado:** limitaciones aceptadas para esta entrega
- **Alcance:** base visual y modular; no es un producto terminado

## 1. Limitaciones funcionales

| Limitación | Impacto | Subfase prevista |
| --- | --- | --- |
| No hay autenticación real | La vista previa no protege datos ni identifica usuarios. | 1B |
| No hay registro ni recuperación de contraseña | No se puede crear una cuenta local. | 1B |
| La sesión se pierde al recargar | Es intencional; no hay sesión persistente. | 1B |
| No hay cámara ni permisos de captura | No se puede escanear. | 1C |
| No hay almacenamiento de documentos | No se pueden guardar, listar ni buscar documentos. | 1D |
| No hay generación de PDF | No se puede exportar un documento. | 1E |
| No hay respaldos | No se puede exportar ni importar datos. | 1F |
| No hay PWA instalable ni funcionamiento sin conexión | No hay manifiesto ni service worker. | 1G |
| No hay ajustes editables | Configuración solo muestra valores de referencia. | Posterior |
| No hay backend ni sincronización | Los datos no se comparten entre dispositivos. | Fuera de la Fase 1 |

## 2. Limitaciones de seguridad

- La vista previa **no es autenticación**. No se debe presentar como «inicio de sesión».
- El guard de rutas es una simulación de interfaz; no es una frontera de seguridad.
- No hay datos de documentos que proteger en 1A, pero tampoco hay que confiarse: no se deben introducir datos reales.
- La autenticación local futura no equivaldrá a cifrado del dispositivo.
- La recuperación de contraseña y el bloqueo por intentos están pendientes de diseño.
- No se ha realizado una prueba de penetración ni una revisión de seguridad externa.

## 3. Limitaciones de navegador y dispositivo

- La verificación visual se hizo en Chromium 152 (Electron 44.9.1). No se probó en Safari, Firefox, dispositivos iOS o Android reales.
- El comportamiento de `env(safe-area-inset-bottom)` no se validó en un iPhone con notch.
- La barra inferior usa iconos y etiquetas cortas; en 320 px la etiqueta «Documentos» se muestra truncada como «Documen…». El nombre accesible completo sigue disponible.
- La pantalla de acceso a 320 × 800 requiere un desplazamiento vertical mínimo (unos 22 px) para ver el pie de la tarjeta.
- El logotipo es una imagen JPEG; no se ha optimizado a WebP/AVIF ni se ha generado un favicon específico.
- No hay modo oscuro real; `color-scheme` es claro y el tema mostrado es «Claro».
- El servidor local respondía a `/robots.txt` con la página de la aplicación, por lo que Lighthouse marcó SEO 83 en la medición del 2026-11-05. Desde entonces existe `public/robots.txt` con `Disallow: /`, así que esa causa ya no aplica; la nueva puntuación de SEO no se ha vuelto a medir.

## 4. Limitaciones de accesibilidad

- Se hicieron comprobaciones manuales de estructura, foco, nombres accesibles, tamaños táctiles y contraste; no se realizó una auditoría con lectores de pantalla reales (NVDA, JAWS, VoiceOver, TalkBack).
- El foco se mueve a `main` al cambiar de ruta. Es útil para lectores de pantalla, pero implica que al pulsar **Tab** desde el contenido se continúa después del `main`; el enlace «Saltar al contenido» sigue siendo el primer elemento si se empieza desde el principio del documento.
- Las pruebas automatizadas con jsdom no validan representación visual ni contraste.
- La auditoría Lighthouse de la pantalla de acceso en la versión de producción obtuvo **Accesibilidad 100** y **Buenas prácticas 100**; SEO 83 por la ausencia de `robots.txt` en el servidor local. No se auditó con Lighthouse cada pantalla protegida porque la vista previa se pierde al recargar.

## 5. Limitaciones técnicas y de proceso

- No existe repositorio Git ni se ha hecho ningún commit. La publicación está preparada (ADR 004), pero el despliegue es manual y todavía no se ha publicado ninguna URL.
- No hay despliegue automático ni compilación en la nube: cada publicación exige `npm run build` y subir `dist/` a Cloudflare Pages. La compilación en Cloudflare fallaría por Node 26 y `engine-strict`.
- No hay integración continua (CI).
- No hay pruebas end-to-end con un navegador automatizado; se usa Vitest + jsdom y el arnés manual `testing/responsive-harness.html`.
- El arnés de anchos es una herramienta de desarrollo y no forma parte del bundle de producción.
- `npm audit` completo reporta 10 vulnerabilidades moderadas en herramientas de desarrollo (`minimatch`); producción tiene 0. La corrección requiere evaluar un cambio mayor y autorización.
- No se ha medido el rendimiento en dispositivos de gama baja ni con documentos grandes, porque no hay documentos.
- El servidor de desarrollo de Vite añade recarga en caliente y no representa el rendimiento de producción.
- El proyecto depende de Node.js 26.x; una versión distinta puede ser rechazada por `engine-strict`.

## 6. Limitaciones de contenido

- La interfaz está solo en español.
- Los textos de los módulos describen funciones futuras; no son funcionalidades activas.
- Las tarjetas «Planificado» y «Base» son informativas.
- No se usan datos institucionales reales ni se ha validado el logo con la institución en esta entrega.
- No hay textos legales, aviso de privacidad definitivo ni política de tratamiento de datos.

## 7. Riesgos aceptados para avanzar a 1B

1. La base visual es estable y está probada, pero la autenticación real puede exigir ajustes en el flujo de acceso.
2. El guard actual se reemplazará o ampliará; no se reutilizará como argumento de seguridad.
3. El almacenamiento y los respaldos pueden cambiar el modelo de datos; por eso no se instalaron todavía.
4. La PWA puede requerir cambios de caché y actualización; se abordará en 1G.

## 8. Qué **no** se considera una limitación

- No tener backend: es una decisión de alcance local-first.
- No tener telemetría: es una decisión de privacidad.
- No tener anuncios ni compras: es una decisión de coste y alcance.
- No tener datos de ejemplo persistidos: es intencional para no simular funciones inexistentes.
