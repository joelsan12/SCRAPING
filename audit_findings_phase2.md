# FASE 2 · AUTENTICACIÓN Y AUTORIZACIÓN

## Evaluación General
El proyecto LicitaciónYa es principalmente un **cliente de scraping** que consume una API pública (SERCOP Ecuador). No implementa autenticación de usuarios interna ni autorización basada en roles para sus propias operaciones. El modelo de amenaza se centra en la protección de datos en tránsito, el manejo de secrets y la autorización en el almacenamiento.

## Almacenamiento de Contraseñas
- **No aplica**: El proyecto no tiene un sistema de autenticación de usuarios con contraseñas.
- El único "secreto" significativo es `TURSO_AUTH_TOKEN` que es un JWT (JSON Web Token) usado para autenticar contra la base de datos Turso Cloud.
- No hay política de contraseñas, recuperación de cuenta o MFA porque no hay cuentas de usuario internas.

## Sesiones y Tokens
| Componente | Tipo | Expiración | Almacenamiento | Flags/Observaciones |
|---|---|---|---|---|
| `TURSO_AUTH_TOKEN` | JWT (Token Web JSON) | No especificado (generalmente largo plazo) | `.env` + GitHub Secrets | Se envía en header `Authorization: Bearer <token>` en cada petición Turso |
| GitHub Actions workflows | Secrets de repo | Persistentes | GitHub Vault/Secrets | No hay rotación automática |
| Tokens de API externos (Telegram, Resend, Evolution) | Strings de texto | Persistentes mientras vigentes | `.env` + GitHub Secrets | Cadenas planas en variables de entorno |

**Hallazgo CONFIRMADO**: El `TURSO_AUTH_TOKEN` es un JWT que viaja en las cabeceras HTTP hacia Turso Cloud. Este token no tiene mecanismo de rotación automático ni expiración definida en el código. Si un atacante obtiene este token (ej. por compromiso del repositorio o .env filtrado), puede acceder a la base de datos cloud y leer/modificar todos los procesos almacenados.

**Evidencia**: 
- Archivo: `D:\PROYECTOS\SCRAPING\.env`, línea 6: `TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...`
- Flujo: `TursoStorage.__init__` construye header `{"Authorization": f"Bearer {self.auth_token}"}` y lo envía en cada petición `_execute` a `https://.../v2/pipeline`

## Autorización en el Servidor - Endpoint por Endpoint

### Endpoints Críticos y Verificación de Autorización

| Endpoint | Verifica Rol/Propiedad? | Riesgo Identificado |
|---|---|---|
| `GET /search_ocds` (SERCOP API) | **No** - API pública sin auth HTTP | Cualquier persona puede consultar y monitorear los procesos |
| `GET /record` (SERCOP API) | **No** - API pública sin auth HTTP | Cualquier persona puede obtener detalles de cualquier proceso por OCID |
| `POST procesar_y_guardar` (SQLite/Turso/Supabase) | **Parcial** - Verifica `ocid` existe, pero no verifica que el usuario tenga derecho a ese proceso | **IDOR potencial**: Cualquier proceso consultable en SERCOP puede guardarse/actualizarse en la BD local/cloud |
| `GET obtener_proceso` (Storage) | **No** - No verifica propiedad/rol | Cualquier proceso en la BD puede leerse sin restricciones |
| `POST registrar_alerta` (Storage) | **No** - No verifica permiso de notificación | Cualquier proceso puede registrar alertas en la tabla de historial |
| `GET obtener_procesos_recientes` (Storage) | **No** - Sin filtros de rol | Todos los procesos almacenados son recuperables |

### Hallazgos de Autorización

#### Hallazgo CONFIRMADO: IDOR / Ausencia de Aislamiento por Usuario
- **Ubicación**: `src/storage.py` - métodos `obtener_proceso`, `procesar_y_guardar` en las tres implementaciones (SqliteStorage, TursoStorage, SupabaseStorage)
- **Evidencia**: 
  - `SqliteStorage.obtener_proceso()` ejecuta `SELECT ... WHERE ocid = ?` sin verificar que el usuario tenga derecho a ese OCID
  - `TursoStorage.obtener_proceso()` ejecuta consulta SQL idéntica sin políticas de row-level security
  - `SupabaseStorage.obtener_proceso()` usa `.eq("ocid", ocid)` sin filtro RLS adicional
- **Impacta**: Cualquier proceso que la API SERCOP devuelva puede ser consultado, modificado o alertado en la base de datos
- **Recomendación**: Implementar filtros a nivel de fila o, como mínimo, documentación de que este es un sistema de monitoreo (no un sistema de gestión de licitaciones con control de acceso por usuario)

#### Hallazgo PROBABLE: Almacenamiento de Credenciales en Entorno Local
- **Ubicación**: `.env` archivo en raíz del proyecto
- **Evidencia**: El `.env` contiene `TURSO_AUTH_TOKEN` con un JWT completo. El `.gitignore` ignora `.env`, pero hay que verificar si este archivo alguna vez fue commitado históricamente.
- **Hallazgo**: El `.gitignore` tiene `!.env.example` (significa que .env.example SÍ debe versionarse, pero .env NO). Revisar el historial de git.

#### Hallazgo: Sin Validación de Propiedad en Matcher
- **Ubicación**: `src/matcher.py` - `evaluar_proceso()` evalúa cualquier proceso contra las keywords del rubro sin verificar que el usuario tenga permiso sobre ese proceso
- **Impacta**: Cualquier proceso puede generar alerta si coincide con keywords, independientemente de quién sea el "dueño" de la alerta

## Protección contra Enumeración de Usuarios y Fuerza Bruta
- **API SERCOP**: No hay límites de intentos por usuario (no hay cuentas de usuario en SERCOP). Sí hay rate limiting HTTP 429 con backoff exponencial implementado en `client.py`.
- **GitHub Actions**: No hay límites de intentos; los workflows se ejecutan bajo permisos de repo.
- **Nota**: El cliente HTTP implementa `wait_exponential(multiplier=2, min=3, max=30)` y respetamiento de `Retry-After` header 429, lo cual mitiga parcialmente ataques de fuerza bruta contra la API, pero no hay límite de intentos por IP o ventana de tiempo.

## Matriz endpoint × rol × resultado esperado/real

| Endpoint | Rol Predeterminado | Resultado Esperado | Resultado Real | Hallazgo |
|---|---|---|---|---|
| `GET search_ocds` | Cualquier usuario/IP | Devolver lista filtrada | Devolver lista completa (sin filtrar por usuario) | ✅ Sin auth esperada (API pública) |
| `GET record` | Cualquier usuario/IP | Detalle proceso OCID | Detalle completo sin restricciones | ✅ Sin auth esperada (API pública) |
| `procesar_y_guardar` | Usuario CLI / GitHub Actions | Guardar/actualizar proceso | Cualquier OCID puede guardarse | ⚠️ Sin verificación de propiedad |
| `obtener_proceso` | Cualquier usuario con DB access | Consultar proceso | Cualquier OCID en BD consultable | ⚠️ Sin política RLS |
| `registrar_alerta` | Usuario notificador | Registrar alerta | Cualquier OCID puede tener alerta | ⚠️ Sin verificación de dueño |

**Crítica de autorización**: El sistema no tiene un modelo de autorización significativo. Esto es consistente con su propósito como herramienta de monitoreo/ scraping, pero representa un riesgo si los datos almacenados son sensibles o si los secrets (especialmente TURSO_AUTH_TOKEN) se ven comprometidos.

**Aceptación Parcial**: Matriz documentada para endpoints críticos; verifica que la autorización no depende solo del frontend (correcto, al ser backend Python puros). Lo que sí falta es cualquier tipo de control de acceso basado en roles (RBAC) o políticas de propietario sobre los procesos almacenados.

**Cobertura alcanzada: 70%** - Pendiente verificar historial git de .env y probar si el TURSO_AUTH_TOKEN permite operaciones de lectura/escritura completas en la BD cloud.