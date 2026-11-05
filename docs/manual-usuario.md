# Manual de usuario de DOCUX 1A

**Digitaliza. Gestiona. Avanza.**

Este manual explica cómo recorrer la primera base de DOCUX. Está pensado para personas que **no necesitan usar una terminal** ni instalar nada por su cuenta.

> **Importante:** esta versión es una **vista previa de la interfaz**. Todavía no se puede iniciar sesión de verdad, escanear documentos, guardarlos ni hacer copias de seguridad. No introduzcas documentos reales.

## 1. Qué es esta versión

DOCUX será una aplicación para escanear y organizar documentos en el propio dispositivo. La Subfase 1A es el primer paso: muestra cómo se verá y cómo se navegará.

En esta versión puedes:

- abrir la pantalla de acceso;
- entrar a un modo de **vista previa**;
- recorrer el panel y las cinco pantallas principales;
- probar la navegación en computadora, tableta y teléfono;
- ver cómo se comporta la aplicación cuando una página no existe o ocurre un error.

Todavía **no** puedes:

- crear una cuenta o poner una contraseña;
- usar la cámara;
- guardar documentos;
- buscar documentos;
- generar PDF;
- exportar o importar copias de seguridad;
- instalar DOCUX como aplicación en el teléfono.

## 2. Cómo abrir DOCUX

La persona responsable del proyecto inicia la aplicación en el equipo y te comparte una dirección parecida a:

```text
http://127.0.0.1:5173/
```

Ábrela en un navegador actualizado (Chrome, Edge, Firefox o Safari). No necesitas instalar nada más.

Si la dirección no abre, avisa a la persona responsable; no intentes cambiar configuraciones del equipo.

## 3. Pantalla de acceso

Al abrir DOCUX verás el logotipo, el texto **«Acceso local»** y una explicación.

1. Lee el aviso azul: la vista previa **no es una autenticación** y la sesión se cierra al recargar.
2. Pulsa el botón **«Explorar la interfaz en modo vista previa»**.
3. La aplicación abrirá el **Panel**.

No se te pedirá usuario ni contraseña. Eso es intencional en esta etapa.

### Si recargas la página

La vista previa se cierra y vuelves a la pantalla de acceso. No es un error: así se diseñó para dejar claro que no hay una sesión real.

## 4. El aviso de vista previa

En la parte superior verás una franja amarilla:

> **Modo vista previa.** La autenticación local se habilitará en la Subfase 1B. Esta sesión no protege datos.

A la derecha está el botón **«Salir de la vista previa»**. Úsalo cuando termines de revisar la interfaz. Te devolverá a la pantalla de acceso.

## 5. Cómo moverte

### En una computadora

- Usa la **barra lateral izquierda** para ir a Panel, Escanear, Mis documentos, Copias de seguridad o Configuración.
- La opción activa aparece resaltada en blanco.
- Si la ventana es más angosta que 900 píxeles, la barra lateral se convierte en una barra inferior.

### En un teléfono o tableta

- Usa la **barra inferior** con los botones: Panel, Escanear, Documentos, Copias y Ajustes.
- El botón activo se muestra con fondo blanco.
- En pantallas muy pequeñas, la etiqueta «Documentos» puede aparecer abreviada; el icono y el nombre accesible siguen indicando la misma pantalla.

### Con el teclado

- Pulsa **Tab** para avanzar por los enlaces y botones.
- Pulsa **Mayús + Tab** para retroceder.
- Pulsa **Enter** o **Espacio** para activar el elemento enfocado.
- El primer elemento al entrar en la página es **«Saltar al contenido»**; al pulsarlo, el foco va directamente al contenido principal.
- El foco se muestra con un anillo azul y un halo blanco para que se vea tanto en fondos claros como oscuros.

## 6. Las pantallas

### 6.1 Panel

Es la pantalla de inicio de la vista previa. Muestra:

- una bienvenida;
- el botón **«Abrir pantalla de escaneo»**;
- tarjetas de acceso a Mis documentos, Copias de seguridad y Configuración;
- el estado de la Fase 1.

Las tarjetas indican «Planificado» o «Base» para no confundir lo que ya existe con lo que se hará después.

### 6.2 Escanear

Explica que la cámara todavía no está activa. **No se solicita permiso de cámara** en esta versión.

El botón **«Volver al panel»** regresa al inicio.

### 6.3 Mis documentos

Muestra el estado vacío: todavía no hay almacenamiento de documentos. No se pueden crear, abrir ni borrar documentos en 1A.

El botón **«Volver al panel»** regresa al inicio.

### 6.4 Copias de seguridad

Explica que los respaldos serán archivos locales con versión, validación e integridad. Todavía no se puede exportar ni importar nada.

El botón **«Volver al panel»** regresa al inicio.

### 6.5 Configuración

Muestra los valores de referencia de esta base:

- tema claro;
- idioma español;
- almacenamiento previsto: IndexedDB local;
- sesión: se implementará en la Subfase 1B;
- respaldo: se implementará en la Subfase 1F;
- instalación PWA: prevista para la Subfase 1G.

No hay ajustes editables en esta versión. Los valores son informativos.

## 7. Si una página no existe

Si la dirección no corresponde a ninguna pantalla, verás **«Esta página no existe»** con el botón **«Volver al inicio»**. Es una página 404 normal; no se ha perdido nada.

## 8. Si aparece un error

Si la interfaz falla, verás **«Algo salió mal»**. El mensaje indica que no se enviaron datos a ningún servidor y ofrece el botón **«Recargar aplicación»**.

1. Pulsa **«Recargar aplicación»**.
2. Si el problema continúa, cierra la pestaña y vuelve a abrir DOCUX.
3. Si sigue ocurriendo, avisa a la persona responsable e indica qué pantalla estabas viendo.

No necesitas enviar capturas con datos personales.

## 9. Cómo terminar

- Pulsa **«Salir de la vista previa»** para volver al acceso.
- También puedes cerrar la pestaña o recargar: la vista previa desaparece.
- No hay datos guardados que borrar en esta versión.

## 10. Privacidad y cuidado de los datos

- No introduzcas nombres, documentos, imágenes ni datos de personas o instituciones reales.
- No escribas contraseñas: la vista previa no las pide ni las guarda.
- DOCUX 1A no envía información a internet.
- La vista previa no protege datos porque todavía no hay datos que proteger.
- Cuando se habilite el acceso real, se publicará un manual de seguridad actualizado.

## 11. Preguntas frecuentes

**¿Por qué no me pide contraseña?**  
Porque la autenticación real se implementará en la Subfase 1B. Esta versión solo permite revisar la interfaz.

**¿Por qué se cierra la sesión al recargar?**  
Porque la sesión de vista previa vive en memoria. Es una decisión intencional para no confundirla con un inicio de sesión real.

**¿Puedo escanear un documento?**  
Todavía no. La cámara y la captura se implementarán en la Subfase 1C.

**¿Mis documentos quedan guardados?**  
No hay almacenamiento de documentos en esta versión. No se guarda nada.

**¿Puedo instalarla en el teléfono?**  
Todavía no. La instalación PWA se trabajará en la Subfase 1G.

**¿Se enviará algo a la nube?**  
No. DOCUX es local-first y la Fase 1 no tiene backend ni sincronización.

**¿Qué hago si veo la barra lateral en la computadora y la barra inferior en el teléfono?**  
Es el comportamiento adaptable previsto: desde 901 píxeles se usa barra lateral; hasta 900 píxeles, barra inferior.

## 12. Glosario sencillo

| Palabra | Significado |
| --- | --- |
| **Local-first** | La aplicación funciona con datos en el propio dispositivo, sin depender de un servidor. |
| **Vista previa** | Modo de revisión de la interfaz; no es una cuenta ni una sesión segura. |
| **PWA** | Aplicación web que puede instalarse y funcionar como una app. Se implementará más adelante. |
| **IndexedDB** | Almacenamiento del navegador previsto para los documentos. Todavía no se usa. |
| **Respaldo** | Archivo que permite recuperar los datos. Se implementará en la Subfase 1F. |
| **Subfase** | Etapa pequeña y verificable dentro de la Fase 1. |

## 13. Ayuda

Si algo no coincide con este manual, anota:

- la pantalla donde estabas;
- el texto del mensaje;
- el ancho aproximado de la ventana (teléfono, tableta o computadora);
- si habías recargado la página.

Comparte esa información con la persona responsable del proyecto. No adjuntes documentos reales.
