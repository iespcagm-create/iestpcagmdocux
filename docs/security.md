# Seguridad y privacidad de DOCUX

- **Alcance:** Subfase 1A de la Fase 1
- **Última actualización:** 2026-11-05
- **Estado:** documentación de una base visual; **no hay autenticación real ni datos de documentos**

## 1. Resumen para personas no técnicas

En esta entrega, DOCUX **no pide contraseña**, **no crea cuentas**, **no guarda documentos** y **no envía información a internet**. La pantalla de acceso solo permite recorrer la interfaz en un modo llamado «vista previa». Al recargar la página, ese modo desaparece.

Por eso:

- no se debe usar DOCUX 1A para documentos reales;
- no se debe escribir información personal, institucional o confidencial;
- no se debe presentar la vista previa como «inicio de sesión»;
- la protección real de documentos será un trabajo de la Subfase 1B y siguientes.

## 2. Modelo de amenaza de la Subfase 1A

| Activo | ¿Existe en 1A? | Protección actual |
| --- | --- | --- |
| Documentos escaneados | No | No aplica. |
| Imágenes o PDF | No | No aplica. |
| Credenciales o contraseñas | No se solicitan | No aplica. |
| Sesión de usuario | Solo vista previa en memoria | Se pierde al recargar; no se persiste. |
| Datos institucionales | No se usan | Prohibidos en pruebas. |
| Secretos de configuración | No | No hay `.env` ni claves. |
| Telemetría o analítica | No | No hay SDK ni envío de eventos. |

La superficie de ataque de 1A es pequeña porque la aplicación es estática, no tiene backend, no acepta archivos y no procesa datos personales. Los riesgos principales son de **cadena de suministro** y de **expectativa incorrecta** sobre la seguridad.

## 3. Qué es y qué no es la vista previa

`InMemorySessionStore` crea un objeto:

```ts
{
  kind: 'preview',
  label: 'Vista previa de interfaz',
  startedAt: '<fecha ISO>'
}
```

Características:

- vive solo en la memoria del navegador;
- no se guarda en `localStorage`, `sessionStorage`, cookies ni IndexedDB;
- no pide usuario, contraseña, PIN ni biometría;
- no concede acceso a datos reales porque no existen;
- se borra al recargar o cerrar la pestaña;
- el botón «Salir de la vista previa» la elimina de inmediato.

`ProtectedLayout` redirige a `/acceso` cuando no hay sesión. Ese guard es una **simulación de flujo de interfaz**. No es una frontera de seguridad: alguien con acceso al código o a las herramientas del navegador puede modificarlo. En 1B, la autenticación real deberá añadir verificación criptográfica y un modelo de amenaza específico.

## 4. Manejo de datos

- No se ha implementado almacenamiento de documentos.
- No se ha implementado ninguna base de datos.
- No se han añadido formularios que recojan datos personales.
- Las pruebas usan datos sintéticos y nombres genéricos.
- El logotipo es el original del proyecto; se copió sin modificar y se verificó su hash SHA-256.
- No se incluyen `.env`, tokens, claves API ni credenciales.

Hash de la copia usada por la aplicación:

```text
public/branding/docux-logo.jpg
SHA-256: 40EC9B06D6A214EFBC79D7C4FF11379644E8C76C006974CCA9EF72C6CEAEB89A
```

## 5. Red y comunicaciones

Revisión del código:

- no hay `fetch`, `XMLHttpRequest`, `axios` ni WebSocket propio en `src/`;
- no hay enlaces a servicios externos;
- no hay analítica, publicidad, mapas, fuentes remotas ni CDN.

Revisión en el navegador durante el desarrollo:

- todas las peticiones observadas se dirigieron a `127.0.0.1:5173`;
- la única conexión WebSocket fue la recarga en caliente de Vite;
- no se observaron errores en la consola.

La versión de producción se sirve como archivos estáticos y no incorpora llamadas de red en el código de la aplicación. La futura PWA podrá funcionar sin conexión; eso se implementará en 1G.

## 6. Dependencias y cadena de suministro

- Versiones exactas en `package.json` y `package-lock.json`.
- `.npmrc` fija `save-exact=true` y `engine-strict=true`.
- Node.js 26.13.0 LTS y npm 11.20.0.
- `npm audit --omit=dev` (2026-11-05): **0 vulnerabilidades de producción**.
- `npm audit` completo: **10 vulnerabilidades moderadas en herramientas de desarrollo**, ninguna alta ni crítica. Provienen de `minimatch` dentro de ESLint y `typescript-eslint` (`GHSA-g3hv-75wg-m249`, denegación de servicio por amplificación de patrones glob). No afectan al código que se ejecuta en el navegador ni a las dependencias de producción.
- La corrección automática sugerida implicaría un cambio mayor o una degradación de ESLint; se pospone hasta evaluar compatibilidad y contar con autorización. Mientras tanto, el riesgo se limita al entorno de desarrollo local.
- `fsevents` aparece como dependencia opcional con script de instalación, pero es específica de macOS y no se ejecuta en Windows.

El detalle está en [Dependencias](dependencies.md) y en los reportes crudos:

- [`testing/results/1A/npm-audit-prod.json`](testing/results/1A/npm-audit-prod.json)
- [`testing/results/1A/npm-audit-dev.json`](testing/results/1A/npm-audit-dev.json)

## 7. Riesgos conocidos de 1A

| Riesgo | Impacto | Mitigación actual |
| --- | --- | --- |
| Confundir la vista previa con autenticación | Alto si se usa con datos reales | Avisos visibles, textos explícitos y documentación; no hay datos que proteger. |
| Guard eludible | Alto en una app con datos; nulo en 1A | Se documenta como simulación; no se promete seguridad. |
| Pérdida de la sesión al recargar | Bajo en 1A | Comportamiento intencional y documentado. |
| Dependencias de desarrollo con vulnerabilidades moderadas | Bajo | No se ejecutan en producción; revisión pendiente. |
| Almacenamiento del navegador borrado por el sistema | No aplica en 1A | Se abordará con respaldos en 1F. |
| Acceso físico al dispositivo | No aplica en 1A | Se documentará en 1B; el cifrado del dispositivo no lo resuelve la app. |
| XSS en contenido futuro | No aplica en 1A | React escapa texto por defecto; se revisará al aceptar contenido de usuario. |

## 8. Requisitos mínimos para la Subfase 1B

Antes de habilitar el acceso real se deberá:

1. Definir el modelo de amenaza local (acceso casual, dispositivo compartido, pérdida o robo, copia de IndexedDB).
2. Elegir un algoritmo de derivación de claves disponible en el navegador, con sal única y parámetros documentados. WebCrypto ofrece PBKDF2; Argon2 requeriría una dependencia adicional y evaluación.
3. No almacenar contraseñas en texto plano ni en un formato reversible.
4. Implementar bloqueo por intentos, mensajes de error que no filtren información y tiempos de espera razonables.
5. Definir la duración y el cierre de sesión, y si la sesión se recordará en el dispositivo.
6. Diseñar la recuperación sin crear un bypass trivial.
7. Documentar que la autenticación local no cifra el dispositivo ni protege frente a un atacante con acceso físico y herramientas.
8. Añadir pruebas de los casos de error, bloqueo y cierre de sesión.
9. Revisar la política de contenido (CSP) cuando exista un despliegue real.
10. Obtener autorización explícita antes de instalar nuevas dependencias o cambiar el modelo de seguridad.

## 9. Reporte de problemas

Este es un proyecto privado sin canal público de divulgación. Cualquier problema de seguridad debe comunicarse directamente a la persona responsable del proyecto, sin publicar detalles ni datos sensibles en un repositorio público.

## 10. Declaración de alcance

La Subfase 1A **no es un producto seguro para documentos reales**. Es una base de interfaz y arquitectura. La seguridad efectiva empieza con la autenticación local de 1B y se completa con el almacenamiento, los respaldos y las pruebas de la Fase 1.
