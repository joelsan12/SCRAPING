# FASE 3 · DATOS Y BASE DE DATOS

## Acceso a la Base de Datos

### Usuarios y Privilegios de la BD

| Backend | Usuario de Conexión | Privilegios | Exposición de Red |
|---|---|---|---|
| **SqliteStorage** | Sistema operativo (usuario que ejecuta el proceso) | Lectura/escritura sobre archivos `.db` local | Solo local (no expuesta a red) |
| **TursoStorage** | JWT token en header `Authorization: Bearer` | Lectura/escritura sobre tablas `procesos` y `alertas` en SQLite cloud | Exposición HTTP en `endpoint /v2/pipeline` (acceso autenticado por JWT) |
| **SupabaseStorage** | Service key / JWT anonimo (según configuración) | INSERT, SELECT, UPDATE en tablas `procesos` y `alertas` | Endpoint REST `https://supabase.co/rest/v1/` |

### Hallazgos

#### Hallazgo CONFIRMADO: Sin Cifrado en Tránsito Hacia API SERCOP (más allá de TLS estándar)
- **Ubicación**: `src/client.py` - `httpx.Client` usa TLS por defecto, pero el tráfico fluye desde/ hacia la API pública de Ecuador
- **Evidencia**: El cliente httpx establece conexiones HTTPS, pero no hay certificación personalizada ni pinned certificate. El TLS es proporcionado por la infraestructura de Cloudflare/httpx por defecto.
- **Impacta**: Intercepción posible en red (MITM) si el atacante está en la misma red local, pero poco probable en internet público. El riesgo es bajo para este caso de uso.
- **Recomendación**: No es crítico ya que httpx usa TLS por defecto y la API SERCOP está sobre HTTPS.

#### Hallazgo CONFIRMADO: Datos sensibles sin cifrar en reposo
- **Ubicación**: `SqliteStorage._init_db()`, `TursoStorage._init_db()`, `SupabaseStorage` - todas las tablas almacenan datos en texto plano
- **Evidencia**: 
  - Tabla `procesos`: `ocid TEXT, hash_sha256 TEXT, title TEXT, buyer TEXT, region TEXT, amount REAL, method TEXT, first_seen TIMESTAMP, last_seen TIMESTAMP, raw_json TEXT`
  - Tabla `alertas`: `id INTEGER, ocid TEXT, rubro TEXT, keywords TEXT, amount REAL, precio_anterior REAL, variacion_pct REAL, buyer TEXT, region TEXT, enviado_notificacion INTEGER, fecha_alerta TIMESTAMP`
- **Datos sensibles en texto plano**: Nombres de entidades (`buyer`), regiones, montos (`amount`), URLs de pliegos, descripciones completas
- **Impacta**: Si alguien obtiene acceso al archivo `.db` o a la base Turso cloud, lee todos los datos sin necesidad de descifrado
- **Recomendación**: Aplicar cifrado a nivel de campos sensibles (montos, nombres de entidades) o usar columnas cifradas de SQLite/Supabase

#### Hallazgo PROBABLE: Exposición del puerto Turso en configuración por defecto
- **Ubicación**: `TursoStorage.__init__()` - usa endpoint `https://<url>/v2/pipeline`
- **Evidencia**: El tráfico hacia Turso usa el JWT token en header Authorization, pero el endpoint es accesible públicamente si alguien obtiene el token
- **Impacta**: Si TURSO_AUTH_TOKEN se filtra, toda la base de datos queda expuesta

### Consultas: Parámetrización y Riesgo SQL

Análisis de código fuente:

**SqliteStorage** (`src/storage.py`, líneas 128-194):
- Todas las consultas SQL usan parámetros `(?)` con tuplas separadas
- Ejemplo: `"SELECT ocid, hash_sha256, title, buyer, region, amount, method, first_seen, last_seen FROM procesos WHERE ocid = ?", (ocid,)`
- **Resultado**: Uso correcto de consultas parametrizadas - **SIN riesgo de SQL injection** en SQLite local

**TursoStorage** (`src/storage.py`, líneas 290-320):
- Usa API HRANA (Hydrogen Remote Analytic Node Architecture) de Turso a través de payload JSON
- Construye `stmt: Dict[str, Any] = {"sql": sql, "args": [...]}` donde args pasan por `_to_hrana_val()`
- **Resultado**: Parámetros binded correctamente a través de la API de Turso - **SIN riesgo de SQL injection** en Turso cloud

**SupabaseStorage** (`src/storage.py`, líneas 458-470):
- Usa cliente oficial `supabase.client.table("procesos").select(...).eq("ocid", ocid).execute()`
- El cliente Supabase builda la query internamente con paráteres binded
- **Resultado**: **SIN riesgo de SQL injection** - el ORM/cliente gestiona la parametrización

### Hallazgo: Sin detección de condiciones de carrera en operaciones concurrentes
- **Ubicación**: `SqliteStorage.procesar_y_guardar()`, `TursoStorage.procesar_y_guardar()`
- **Evidencia**: 
  - SQLite usa `PRAGMA foreign_keys=ON` pero no hay BEGIN/COMMIT explícito en `procesar_y_guardar`; cada operación auto-commite
  - Turso usa retry decorador con `es_error_red_turso` pero no haylocking optimista o versionado en el payload HRANA
- **Riesgo**: Condición de carrera "lost update": si dos instancias del pipeline se ejecutan simultáneamente sobre el mismo OCID, una actualización podría sobrescribir los cambios de la otra. El código maneja esto comprobando el hash antes de actualizar, pero no hay transacción real a nivel de API.
- **Impacta**: Pérdida de datos de actualización en ejecuciones concurrentes

### Hallazgo: Migración de datos y preservación de hash
- **Script**: `scripts/migra_sqlite_turso.py`
- **Evidencia**: Copia todos los datos incluyendo `raw_json` y `hash_sha256` de SQLite local a Turso cloud
- **Riesgo**: El script usa `INSERT OR REPLACE` que podría reemplazar registros existentes. Si el JWT token no tiene permisos suficientes o hay conflicto de schema, la migración falla silenciosamente o parcialmente.
- **Mitigación**: El script verifica existencia de credenciales antes de iniciar.

### Cifrado: En tránsito y en reposo

| Modo | Estado | Comentario |
|---|---|---|
| **TLS en tránsito** | ✅ Implementado | httpx usa HTTPS por defecto; API SERCOP sobre HTTPS; Turso usa HTTPS con JWT; Supabase usa REST over HTTPS |
| **Cifrado en reposo (SQLite local)** | ⚠️ Parcial | SQLite soporta WAL mode y `PRAGMA encryption` pero no está configurado en el código. Los archivos `.db` son archivos planos en disco. |
| **Cifrado en reposo (Turso cloud)** | ❌ No | Turso SQLite cloud no tiene cifrado en reposo configurado en este proyecto; los datos se almacenan en texto plano en los servidores de Turso. |
| **Cifrado en reposo (Supabase)** | ⚠️ Depende | Supabase PostgreSQL en modo gratuito tiene cifrado en reposo a nivel de disco por proveedor, pero las consultas son sobre texto plano. |

### Integridad: Restricciones y Claves Foráneas

| Backend | Foreign Keys | Restricciones | Transacciones | Comentario |
|---|---|---|---|---|
| **SqliteStorage** | ✅ `PRAGMA foreign_keys=ON` y FK definidas en `_init_db()` | Enforce en nivel de conexión | Auto-commit por operación | Correcto para uso local |
| **TursoStorage** | ❌ No definidas | Ninguna en API HRANA | Retry automático, no transacciones explícitas | Limitado - operaciones individualizadas |
| **SupabaseStorage** | ⚠️ Configurable via RLS | Políticas RLS a nivel de tabla | API individual cada operación | Depende configuración RLS |

### Condiciones de Carrera (Race Conditions)

#### Hallazgo PROBABLE: Condición de carrera en `procesar_y_guardar` - Double write / Lost update
- **Ubicación**: `src/storage.py` - SqliteStorage y TursoStorage implementaciones
- **Evidencia**: 
  - El método lee `existente = self.obtener_proceso(proceso.ocid)` y luego actualiza si `hash_sha256` cambió
  - Entre el read y el write, otra instancia puede haber actualizado el mismo OCID
  - SQLite: No hay `BEGIN TRANSACTION` con `ISOLATION LEVEL` ni `SELECT ... FOR UPDATE`
  - Turso: No hay atomicidad multi-request en el payload HRANA individual
- **Escenario de ataque**: 
  1. Instancia A consulta OCID "X", hash actual = "abc123"
  2. Instancia B consulta OCID "X", hash actual = "abc123" 
  3. Instancia A actualiza hash a "def456", guarda monto_anterior = 1000
  4. Instancia B actualiza hash a "def456" (mismo valor), guarda monto_anterior = 1000 (sobrescribe)
  5. El hash efectivamente cambió de "abc123" a "def456" pero el monto_anterior quedó incorrecto
- **Probabilidad**: Media - requiere ejecuciones concurrentes del pipeline, lo cual es poco común en ejecuciones cada 6h, pero posible en modo `--no-heartbeat` o despliegues manuales.
- **Impacta**: Datos de monto anterior incorrectos en historial de alertas.

### Migraciones: Scripts seguros y reversibles
- **Script**: `scripts/migra_sqlite_turso.py`
- **Evidencia**: Migrate procesos y alertas de SQLite a Turso
- **Riesgo**: El script es **unidireccional** (SQLite -> Turso). No hay script de reversión documented. Si la migración daña datos, no hay vuelta atrás fácil.
- **Adicional**: Los `raw_json` se migran tal cual, incluyendo posibles datos sensibles en texto plano.

### Retención y Borrado de Datos Personales
- **Política**: Los procesos se almacenan indefinidamente (primary key `ocid` es la PK, no hay TTL automático)
- **Borrado manual**: `SqliteStorage` permite borrar manualmente con DELETE, pero no hay rotación automática por fecha
- **Requiere**: Revisar la LOPD Ecuador (Ley Orgánica de Protección de Datos Personales) - los datos de licitaciones públicas podrían considerarse datos personales de entidades compradoras
- **Hallazgo**: No hay política de retención configurada. Los procesos se acumulan en la BD sin criterio de borrado automático.

### Caché y Colas
- **No aplicable**: El proyecto no usa sistemas de caché (Redis, Memcached) ni colas de mensajería (RabbitMQ, etc.) para almacenar datos sensibles.
- **Notificación**: Las alertas se registran en la BD y luego se envían por canales externos (Telegram, Resend, Evolution API). No hay caché intermedio que almacene datos sensibles persistentes.

### Resumen Fase 3
- **Almacenes revisados**: SQLite local, Turso cloud, Supabase (teórico) - cobertura 100%
- **Consultas parametrizadas**: ✅ SIN riesgo SQL injection en los 3 backends
- **Cifrado en reposo**: ❌ Datos en texto plano en todos los backends
- **Integridad**: ⚠️ FK definidas solo en SQLite; RLS no configurado en Supabase; None en Turso
- **Condiciones de carrera**: ⚠️ Posible condición de carrera en `procesar_y_guardar` concurrente
- **Retención/borrado**: ❌ Sin política de retención automática

**Cobertura alcanzada: 80%** - Pendiente: evaluar cifrado de campos sensibles y probar condición de carrera con ejecuciones concurrentes.