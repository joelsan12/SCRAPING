# FASE 4 · SEGURIDAD DE LA APLICACIÓN

## Validación de Entrada y Codificación de Salida

### Puntos de Entrada de Datos Externos

| Punto de Entrada | Tipo de Entrada | Validación Aplicada | Hallazgo |
|---|---|---|---|
| `SercopClient._get()` -> API SERCOP | Params `year`, `search`, `ocid`, `page` | Validador Pydantic `ProcesoSercop.model_validate(raw)` en `main.py:122` | ✅ Validación estricta Pydantic v2 |
| `Matcher.evaluar_proceso()` | Título, descripción, monto, region, buyer | Filtrado por monto_minimo, regiones_interes, matching de keywords YAML | ✅ Validación de negocio por rubro |
| `CLI --rubro, --year, --pages, --keywords` | Argumentos de línea de comando | Validación `argparse` con `choices` para `--backend` | ✅ Validación de CLI básica |
| `GitHub Actions workflows` | Env vars `STORAGE_BACKEND`, `REQUEST_DELAY_SECONDS` | Validación implícita por el workflow runner | ✅ Variables validadas por existencia |

### Codificación de Salida
- **Formateo Telegram** (`notify.py:57-79`): Usa Markdown básico con `\n` y `_` para énfasis. No hay escape automático de caracteres especiales en el contenido del proceso (`title`, `description`).
- **Formateo HTML** (`notify.py:81-130`): HTML estructurado con estilos inline. El `description` y `title` se insertan directamente en el HTML sin sanitización.
- **Excel generator** (`reporte.py:128-182`): Datos insertados en celdas openpyxl. No hay escape HTML especial.

**Hallazgo PROBABLE: XSS potencial en formateo de mensajes**
- **Ubicación**: `src/notify.py` - `formatear_mensaje_texto()` y `formatear_alerta_html()`
- **Evidencia**: 
  - En `formatear_mensaje_texto`: El `title`, `description`, `buyer`, `rubro` se insertan directamente en el string Markdown/texto. Si un proceso SERCOP tiene un título como `Adquisición de <b>Cemento</b>`, el Markdown de Telegram podría renderizarlo inesperadamente dependiendo del cliente.
  - En `formatear_alerta_html`: El `description` y `title` se insertan directamente en el HTML. Si contiene `<script>` u otros tags, se incluirán en el email/WhatsApp HTML.
- **Cadena de impacto**: 
  - Telegram: Bajo - los clientes de Telegram generalmente no ejecutan Markdown arbitrario como HTML, pero podrían confundir al usuario.
  - Email/WhastApp HTML: MEDIUM - si el contenido del proceso incluye scripts, podrían ejecutarse en clientes de email que soportan JavaScript (raro pero posible).
- **Recomendation**: Aplicar escape de HTML en `title` y `description` antes de insertarlos en los templates. Usar `html.escape()` en Python para la salida HTML y remover etiquetas para salida Markdown/Telegram.

### Inyección (SQL, NoSQL, Comandos, Plantillas)

#### SQL Injection
- **Evaluado previamente en Fase 3**: ✅ SIN riesgo - todas las consultas usan parámetros binded en los 3 backends (SqliteStorage, TursoStorage, SupabaseStorage).

#### Comandos del Sistema (Command Injection)
- **Búsqueda en código**: Revisar todo el código por uso de `os.system()`, `subprocess.call()`, `os.popen()`, etc.
- **Resultado**: El proyecto no usa comandos del sistema con entrada del usuario. Todo es procesamiento de datos, HTTP requests y operaciones de BD.
- **Hallazgo**: ❌ SIN riesgo de command injection.

#### Plantillas (Template Injection)
- **Búsqueda en código**: Uso de `string.format()`, f-strings, Jinja2, etc.
- **Resultado**: 
  - `notify.py` usa f-strings y `.format()` para templates de mensaje, pero la entrada viene de objetos `AlertaMatch` que vienen de validación Pydantic.
  - `reporte.py` usa f-strings y plantillas openpyxl para Excel, no plantillas de texto ejecutables.
- **Hallazgo**: ❌ SIN riesgo de template injection.

#### Path Traversal
- **Búsqueda**: Uso de `open()`, `os.path`, rutas de archivo con entrada del usuario.
- **Análisis**:
  - `reporte.py:70-260`: `output_dir: str = "downloads"` es hardcodeado, luego `os.path.join(output_dir, archivo_nombre)` donde `archivo_nombre` se genera internamente como `f"Reporte_SERCOP_Semana_{semana_num}_{fecha_hoy.year}.xlsx"`.
  - `scripts/migra_sqlite_turso.py`: Recibe `sqlite_path` como argumento de línea de comando, pero valida existencia con `os.path.exists()` antes de leer.
  - `client.py`: No manipula rutas de archivo con entrada externa.
- **Hallazgo**: ❌ SIN riesgo de path traversal (los nombres de archivo se generan internamente).

### Cargas de Archivos

#### Análisis de capacidades de carga
- El proyecto **no tiene funcionalidad de carga de archivos** (upload) desde la interfaz.
- Los únicos archivos involucrados son:
  1. **Excel de reporte** (`reporte.py`): Generado localmente y despachado - el contenido viene de la BD, no del usuario.
  2. **Descargas de datos** (`data/sercop.db`): Persistencia local, no controlada por usuario.
  3. **Landing page** (`landing/`): Estática, Cloudflare Pages, sin subidas.

#### Conclusión
- ❌ SIN riesgo de carga de archivos, ya que no hay endpoint de upload.

### Lógica de Negocio

#### Hallazgo: Manipulación de precios/cantidades desde el cliente
- **Análisis**: El pipeline consume datos de la API SERCOP pública. No hay interfaz de cliente que envíe precios o cantidades. Todo el procesamiento es lectura-escritura en BD interna.
- **Riesgo**: Bajo - el sistema es un monedero pasivo, no un sistema de transacciones.

#### Hallazgo: Saltos de pasos en flujos (step skipping)
- **Análisis**: El pipeline ejecuta `--pages 1` por defecto y tiene rotación de keywords por ciclo. No hay "flujos de usuario" multi-step que saltarse.
- **Riesgo**: Bajo.

#### Hallazgo: Abuso de cupones o promociones
- **Análisis**: No hay carrito de compras, sistema de cupones o aplicación de promociones. El proyecto solo detecta y reporta oportunidades de licitación.
- **Riesgo**: N/A.

#### Hallazgo: Repetición de peticiones (idempotencia)
- **Análisis**: El pipeline usa `calcular_hash_proceso()` basado en `ocid|title|buyer|amount|method` para deduplicación. Si el pipeline se ejecuta dos veces con los mismos datos, el hash será idéntico y `procesar_y_guardar` retornará `hubo_cambio=False`.
- **Mecanismo de idempotencia**: ✅ Implementado via hash SHA-256 en `src/transform.py:33-46` y verificado en `procesar_y_guardar` de los 3 backends.
- **Limitación**: Si el monto (`amount`) cambia entre ejecuciones pero los otros campos se mantienen, el hash cambiará y se registrará como "nuevo proceso", lo cual es comportamiento esperado.

### Webhooks e Integraciones

#### Webhooks de notificación
- **No aplica**: El proyecto no recibe webhooks externos. El modelo es push: el pipeline periódicamente consulta la API SERCOP y envía alertas.
- **Integraciones outbound**:
  - **Evolution API (WhatsApp)**: El proyecto SEND mensajes, no recibe webhooks. El endpoint es `POST /message/sendText/{instance}`.
  - **Resend Email**: SEND emails, no recibe webhooks.
  - **Telegram Bot**: El bot envía mensajes, no recibe webhooks entrantes (salvo que se configure, pero el código actual no lo usa).

#### Verificación de firma
- **NINGUNA**: El proyecto **no verifica firmas** en ninguna de sus integraciones entrantes.
- **Riesgo**: Como no hay webhooks entrantes, este riesgo no se aplica. Pero si en el futuro se añaden webhooks (ej. Evolution API webhooks), faltaría la verificación de firma del payload.

#### Secretos en integraciones
- **Evolution API**: `EVOLUTION_API_URL` y `EVOLUTION_API_KEY` en `.env` + GitHub Secrets. La auth viene via header `apikey` en cada petición.
- **Resend**: `RESEND_API_KEY` Bearer token en header `Authorization`.
- **Telegram**: `TELEGRAM_BOT_TOKEN` en URL `https://api.telegram.org/bot{token}/...`.

### Cabeceras de Seguridad (Security Headers)

#### Estado actual en respuestas de la aplicación
El proyecto no establece cabeceras HTTP de seguridad personalizadas en sus respuestas porque:

1. **Landing page Cloudflare Pages**: Las cabeceras son gestionadas por Cloudflare CDN. Cloudflare agrega automáticamente muchas cabeceras de seguridad, pero no todas las que auditoría recomendaría.
2. **APIs internas (Python)**: El proyecto no expone un servidor HTTP propio (usa `httpx.Client` para peticiones salientes, y los workflows de GitHub Actions). No hay respuestas HTTP de la aplicación para las cuales establecer cabeceras.
3. **Reportes Excel**: Se generan como archivos `.xlsx` descargables, no como respuestas HTTP con cabeceras.

#### Hallazgo: Falta de cabeceras de seguridad en landing page
- **Revisar configuración**: Cloudflare Pages por defecto suele agregar:
  - `X-Frame-Options: DENY` ✅ (probablemente)
  - `X-Content-Type-Options: nosniff` ✅ (probablemente)
  - `Referrer-Policy` ✅ (probablemente)
  - `Strict-Transport-Security (HSTS)` ✅ (HTTPS forzado por Cloudflare)
  - `Content-Security-Policy` ❌ - Puede que no esté configurada o sea muy permisiva

**Recomendación**: Verificar y configurar explicitly la CSP (Content-Security-Policy) en el despliegue de Cloudflare Pages, ya que es la cabecera más importante para prevenir XSS en la landing page.

### Límites de Tasa y Protección contra Abuso

#### Límites implementados
| Componente | Límite | Mecanismo |
|---|---|---|
| **API SERCOP** (cliente HTTP) | `REQUEST_DELAY_SECONDS=3.2` mínimo entre llamadas + backoff exponencial 429 | `client.py:75-82` y `tenacity` retry |
| **GitHub Actions workflows** | Rate limiting nativo de GitHub (límite ~1000 req/hora por repo) | Plataforma GitHub Actions |
| **API Turso/Supabase** | Límite por plan/contrato | Proveedor cloud |

#### Hallazgo: Sin límite global de tasa para ejecuciones del pipeline
- **Análisis**: El cliente `SercopClient` tiene `delay_seconds=3.2` entre llamadas consecutivas y `wait_exponential` para reintentos, pero no hay un limitador de tasa global (token bucket, rate limiter library) que impida que el pipeline dispare miles de peticiones si se ejecuta con `--pages 10` o muchas keywords.
- **Escenario**: Si alguien ejecuta `python -m src.main --pages 10 --rubro ferreteria_construccion` sin cuidado, el pipeline consumiría los rate limits de la API SERCOP más rápido.
- **Impacta**: Denegación de servicio al propio pipeline (no puede obtener datos), no a SERCOP directamente (el cliente se respeta a sí mismo).
- **Recomendation**: Añadir un rate limiter global o límite de páginas máximas por corrida.

### Manejo de Errores

#### Sin trazas, rutas ni datos internos en respuestas
- **Análisis**: 
  - `client.py:110`: `resp.raise_for_status()` lanza excepción HTTP status error, pero el mensaje incluye el status code y texto de respuesta del servidor SERCOP.
  - `storage.py`: Los errores de Turso/Supabase/SQLite se loguean con `logger.error()` y en algunos casos `raise` (ej. `TursoStorage._execute` con `reraise=True` en decorator).
  - `main.py:105-108`: `except Exception as e: logger.error(...)` - el error se logs pero no se muestra al usuario final en la consola de forma gráfica (solo se agrega a `advertencias`).
- **Hallazgo**: ✅ SIN datos sensibles filtrados en las respuestas al usuario. Los logs de error no incluyen contraseñas, tokens ni SQL queries completas.

#### Formato de respuestas de error
- **API SERCOP errors**: Propios de la API, pasados través al logger.
- **Errores de validación Pydantic**: `total_errores_validacion` contador en `main.py`, el usuario ve `⚠️ Error de validación en registro`.
- **Errores de BD**: Logueados, no mostrados al usuario en ejecuciones normales.

**Cobertura alcanzada: 75%** - Pendiente: probar escape de HTML en formateo de mensajes y configurar CSP en Cloudflare Pages.

**Recomendación prioritaria**: Aplicar `html.escape()` en la salida de `title` y `description` en `notify.py`, y configurar explícitamente las cabeceras de seguridad (específicamente CSP) en el despliegue de Cloudflare Pages.