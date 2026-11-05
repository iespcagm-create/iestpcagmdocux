# Modelo de datos de DOCUX

- **Alcance:** Subfase 1A de la Fase 1
- **Última actualización:** 2026-11-05
- **Estado:** no existe base de datos ni persistencia de documentos

## 1. Modelo implementado en 1A

La única estructura de datos que existe es la **sesión de vista previa**, mantenida en memoria:

```ts
export interface PreviewSession {
  readonly kind: 'preview';
  readonly label: string;
  readonly startedAt: string; // ISO 8601
}

export type AppSession = PreviewSession;

export interface SessionStore {
  getSnapshot(): AppSession | null;
  subscribe(listener: () => void): () => void;
  startPreview(): AppSession;
  clear(): void;
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `kind` | `'preview'` | Sí | Discriminante que impide confundirla con una sesión real. |
| `label` | `string` | Sí | Texto visible: «Vista previa de interfaz». |
| `startedAt` | `string` ISO 8601 | Sí | Momento en que se abrió la vista previa. |

### Invariantes

- `AppSession` solo puede ser una `PreviewSession` en 1A.
- No se guarda en ningún almacenamiento persistente.
- `clear()` deja el store en `null` y notifica a los suscriptores.
- `startPreview()` es idempotente mientras la vista previa esté activa.
- La sesión no contiene identidad, correo, contraseña, roles ni permisos.

### Implementación

`InMemorySessionStore` mantiene una variable privada `current` y un `Set` de suscriptores. `SessionProvider` usa `useSyncExternalStore` para leerla desde React.

No hay migraciones, versiones de esquema ni índices porque no hay base de datos.

## 2. Datos que **no** existen en 1A

| Entidad | Estado | Subfase prevista |
| --- | --- | --- |
| Usuario o perfil local | No implementado | 1B |
| Credencial o hash de contraseña | No implementado | 1B |
| Documento | No implementado | 1D |
| Página o imagen capturada | No implementado | 1C–1D |
| Archivo PDF generado | No implementado | 1E |
| Copia de seguridad | No implementado | 1F |
| Preferencias editables | No implementado | Posterior a 1A |
| Historial de eventos | No implementado | 1D/1F |

Las pantallas de 1A usan textos y estados vacíos; no crean registros ni datos de ejemplo en el navegador.

## 3. Modelo conceptual previsto (no implementado)

Esta sección sirve para orientar las subfases siguientes. **No es un esquema aprobado ni código existente.** Cualquier cambio requerirá su propio ADR y pruebas.

### 3.1 Perfil local (1B)

```text
LocalProfile
  id                 identificador local
  displayName        nombre visible, opcional
  createdAt          fecha ISO
  lastAccessAt       fecha ISO
  passwordHash       derivación con sal y parámetros versionados
  passwordParams     algoritmo, sal, iteraciones, versión
  failedAttempts     contador de bloqueo
  lockedUntil        fecha ISO o null
```

### 3.2 Documento (1D)

```text
Document
  id                 identificador local
  title              título editable
  createdAt          fecha ISO
  updatedAt          fecha ISO
  pageCount          número de páginas
  status             borrador | listo | archivado
  notes              texto opcional
  tags               lista de etiquetas
```

### 3.3 Página (1C–1D)

```text
DocumentPage
  id                 identificador local
  documentId         referencia al documento
  order              posición dentro del documento
  imageBlob          imagen local (Blob)
  width, height      dimensiones
  mimeType           tipo de imagen
  createdAt          fecha ISO
  ocrText            texto opcional, si se habilita en el futuro
```

### 3.4 Respaldo (1F)

```text
BackupEnvelope
  formatVersion      versión del formato
  createdAt          fecha ISO
  appVersion         versión de DOCUX
  schemaVersion      versión del esquema de datos
  checksum           hash de integridad
  payload            documentos, páginas y metadatos
```

La copia de seguridad deberá validarse antes de importar y no deberá sobrescribir datos existentes sin confirmación explícita.

## 4. Decisiones de persistencia pendientes

- Motor: IndexedDB es la opción prevista para datos estructurados e imágenes; Dexie se evaluará en 1D y **no está instalado**.
- Separación entre metadatos e imágenes: evaluar si las imágenes van en el mismo registro o en un almacén separado.
- Límites de tamaño y cuota del navegador.
- Estrategia de migraciones y compatibilidad hacia atrás.
- Borrado seguro y recuperación de espacio.
- Exportación a un formato legible y verificable.

## 5. Política de datos de prueba

- Usar únicamente datos sintéticos, genéricos y no vinculados a personas o instituciones reales.
- No incluir nombres, números de documento, direcciones, firmas, sellos ni imágenes institucionales reales.
- No usar credenciales reales.
- Las capturas de evidencia deben mostrar solo la interfaz vacía o datos ficticios.

## 6. Relación con la seguridad

La Subfase 1A no almacena datos, por lo que no hay que proteger registros todavía. La autenticación local de 1B y el cifrado o control de acceso a IndexedDB se diseñarán antes de guardar el primer documento real. Ver [Seguridad](security.md).
