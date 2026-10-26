# FASE 1 · RECONOCIMIENTO Y MODELO DE AMENAZAS

## Inventario de Componentes

### Componentes del Sistema
- **SercopClient**: Cliente HTTPX con Tenacity para backoff exponencial contra API SERCOP
- **Pydantic v2 modelos**: ProcesoSercop, ItemProceso, AlertaMatch
- **Storage backends**: SqliteStorage (local), TursoStorage (cloud SQLite), SupabaseStorage (PostgreSQL)
- **Matcher**: Motor de coincidencia por rubro y palabras clave (config YAML + Firestore opcional)
- **Notifier**: Notificaciones multicanal (Telegram, Resend email, Evolution API/WhatsApp)
- **Reporte**: Generador Excel semanal con openpyxl
- **CLI principal**: main.py con rotación determinista de keywords por ciclo horario

### Puntos de Entrada
| Punto de Entrada | Descripción |
|---|---|
| `GET /search_ocds` | Consulta listado de procesos por año y keyword |
| `GET /record` | Obtiene detalle de un proceso por OCID |
| `python -m src.main` | Ejecución CLI con argumentos --rubro, --year, --pages, --keywords |
| `GitHub Actions workflows` | Pipeline cada 6h y reporte weekly (ejecución automatizada) |
| `Landing page` | Cloudflare Pages, contenido estático público |

### Integraciones Externas
- **API SERCOP** (Ecuador): `https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/api` - pública, sin autenticación HTTP, rate-limited por IP
- **Telegram Bot API**: Opcional, para alertas inmediatas y heartbeats
- **Resend API**: Opcional, para emails transaccionales con HTML
- **Evolution API**: Opcional, para WhatsApp con texto y documentos
- **Cloudflare Pages**: Landing page hosting

### Datos Sensibles que Maneja
- Montos económicos de procesos licitación (valores en USD)
- Nombres de entidades compradoras (`buyer`)
- Fechas y regiones de procesos
- URLs oficiales de pliegos (públicas pero asociadas a datos)
- **Tokens de API críticos**:
  - `TURSO_AUTH_TOKEN`: JWT de autenticación para base de datos cloud (¡está en .env!)
  - `RESEND_API_KEY`: Clave API de email transaccional
  - `EVOLUTION_API_KEY`: Clave de instancia WhatsApp
  - `TELEGRAM_BOT_TOKEN`: Token de bot de Telegram
  - `EVOLUTION_TARGET_NUMBER`: Número de teléfono objetivo (puede ser dato sensible)

### Roles y Niveles de Acceso
| Rol | Acceso | Crítico |
|---|---|---|
| Usuario CLI | Ejecuta pipeline, ve consola de salida | Media |
| GitHub Actions | Ejecución automática con secrets del repo | CRÍTICO |
| Distribuidores B2B | Reciben alertas WhatsApp/Email | Alta |
| Visitantes landing page | Solo lectura, contenido público | Baja |

### Actores de Amenaza Plausibles
1. **Usuario malicioso**: Intercepción de datos en tránsito (API SERCOP sin cifrado end-to-end garantizado más allá de TLS de Cloudflare)
2. **Cuenta comprometida**: Uso de secrets filtrados (TURSO_AUTH_TOKEN en .env no versionado)
3. **Insider**: Acceso a bases de datos con credenciales en .env, manipulación de keywords
4. **Bot**: Sobrecarga de API SERCOP sin respetar rate limits (hay backoff pero sin límite global)

### 5 Escenarios de Abuso Más Dañinos
1. **Filtro de palabras clave manipulado** → alertas no disparan para rubros rentables → pérdida económica para distribuidores
2. **Sustitución de TURSO_AUTH_TOKEN** → acceso no autorizado a base de datos cloud → robo/modificación de historial de procesos
3. **Inyección en parámetros API SERCOP** → retorno de datos falsos o errores del lado del servidor → alertas fantasma
4. **Falsificación de alertas WhatsApp/Email** → phishing a distribuidores con enlaces maliciosos → daño reputacional
5. **Filtro de monto_minimo omitido** → alertas de procesos ínfimos → ruido operativo, alertas ignoradas por clientes

### Superficie Expuesta a Internet vs. Interna
| Superficie | Exposición | Comentario |
|---|---|---|
| Landing page Cloudflare Pages | Pública | Contenido marketing, sin datos sensibles |
| API SERCOP | Pública | Sin auth HTTP, solo rate-limit por IP |
| GitHub Actions workflows | Protegidos por secrets repo | Requieren acceso al repo |
| Turso Cloud database | Semi-privada | Acceso con JWT token en header Authorization |
| Supabase (si config) | Variable | Depende de configuración RLS |
| Evolution API / WhatsApp | Semi-privada | Richi IP + auth token en headers |
| Resend email | Semi-privada | Auth con Bearer token API |

## Datos Sensibles y Ubicación

| Dato | Donde Vive | Nivel de Sensibilidad |
|---|---|---|
| TURSO_AUTH_TOKEN | `.env` (ignorado por .gitignore) + GitHub Secrets | **CRÍTICO** - JWT para DB access |
| RESEND_API_KEY | `.env` + GitHub Secrets | CRÍTICO - Email delivery |
| EVOLUTION_API_KEY/URL | `.env` + GitHub Secrets | ALTO - WhatsApp access |
| TELEGRAM_BOT_TOKEN/CHAT_ID | `.env` + GitHub Secrets | MEDIUM - Messaging |
| Números de teléfono (EVOLUTION_TARGET) | `.env` | MEDIUM - Datos personales |
| Montos de procesos | SQLite / Turso / Supabase | BAJA - Datos públicos SERCOP |
| Nombres de entidades | SQLite / Turso / Supabase | BAJA - Públicos SERCOP |
| Keywords/rubs configurables | `config/rubros.yaml` | BAJA - Configuración de negocio |

## Cobertura de Fase 1
- [x] Inventario de componentes documentado
- [x] Flujos de datos identificados
- [x] Roles y niveles de acceso mapeados
- [x] Actores de amenaza y escenarios de abuso definidos
- [x] Superficie expuesta clasificada
- [ ] Escenario: Validación en vivo de rate limiting en API SERCOP (pending - requiere ejecución real)

**Cobertura alcanzada: 85%** - Pendiente probar escenarios de abuso en entorno local restringido.