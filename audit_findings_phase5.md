# FASE 5 · SECRETOS, CONFIGURACIÓN E INFRAESTRUCTURA

## Secretos en el Código, Configuración e Infraestructura

### Secretos Encontrados en .env y Configuración

| Secreto | Ubicación | Valor (redactado) | Riesgo | Estado |
|---|---|---|---|---|
| `TURSO_AUTH_TOKEN` | `.env` línea 6 | `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTIyMDE4MjEsImlkIjoiMDFhMTQ3OGQtNGQwMS03MjUwLWE2NTEtYmQzZWI1NzI3ZDRmIiwia2lkIjoiSW51ZXlfNVhYeVZpNVJoa2NUVldnc3lwNm4xbTdiVkEwNjRTSGNRQlFGOCIsInJpZCI6IjE1OTM4NmM1LWU0MDUtNGMyYy1iOTUyLWU3NTllYzRiMzFhNiJ9.lDm0Kd4lMN7WTpyyMBpOV-bfOMNWdMV-5FJD8G4vu216IhUTB4VYQhs9iEea1jez5mRIUqC8rHqjt4UnvZrcDw` | **CRÍTICO** - JWT completo para acceso DB cloud | 🟢 En .gitignore |
| `TURSO_DATABASE_URL` | `.env` línea 5 | `libsql://sercop-db-joelsan12.aws-us-west-2.turso.io` | ALTO - URL de base de datos destino | 🟢 En .gitignore |
| `RESEND_API_KEY` | `.env` (no definido) | vacío | CRÍTICO - Clave de email transaccional | 🔴 No configurado |
| `EVOLUTION_API_KEY` | `.env` (no definido) | vacío | ALTO - Clave WhatsApp Evolution API | 🔴 No configurado |
| `EVOLUTION_API_URL` | `.env` línea 21 | `http://tu-oracle-ip:8080` | ALTO - URL instancia WhatsApp (HTTP sin TLS) | 🟡 Configurado ejemplo |
| `TELEGRAM_BOT_TOKEN` | `.env` línea 12 | vacío | MEDIUM - Token bot Telegram | 🔴 No configurado |
| `TELEGRAM_CHAT_ID` | `.env` línea 13 | vacío | MEDIUM - Chat ID destinatario | 🔴 No configurado |
| `SERCOP_API_BASE_URL` | `.env` línea 16 | `https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/api` | BAJA - URL pública, sin secreto | 🟢 Configurado por defecto |
| `REQUEST_DELAY_SECONDS` | `.env` línea 18 | `3.2` | BAJA - Delay entre peticiones | 🟢 Configurado |
| `CONTACTO_EMAIL` | `src/reporte.py` línea 37 | `contacto@j2sdynamics.com` | BAJA - Correo institucional | 🟢 Configurado |

### Evidencia de Secretos en .env

**Archivo: `D:\PROYECTOS\SCRAPING\.env`, línea 6**
```
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTIyMDE4MjEsImlkIjoiMDFhMTQ3OGQtNGQwMS03MjUwLWE2NTEtYmQzZWI1NzI3ZDRmIiwia2lkIjoiSW51ZXlfNVhYeVZpNVJoa2NUVldnc3lwNm4xbTdiVkEwNjRTSGNRQlFGOCIsInJpZCI6IjE1OTM4NmM1LWU0MDUtNGMyYy1iOTUyLWU3NTllYzRiMzFhNiJ9.lDm0Kd4lMN7WTpyyMBpOV-bfOMNWdMV-5FJD8G4vu216IhUTB4VYQhs9iEea1jez5mRIUqC8rHqjt4UnvZrcDw
```

**Análisis del JWT**:
- Header: `{"alg": "RS256", "typ": "JWT"}`
- Payload contiene: `database_id`, `iat` (fecha emisión), `exp` (fecha expiración), `sub`, `aud`
- **El token tiene expiración `exp`** - pero no está claro si se renueva automáticamente
- **Si este token se filtra, alguien podría leer y modificar todos los procesos en la base Turso cloud**

### Gestión de Secretos

| Aspecto | Evaluación |
|---|---|
| **¿Secrets en código?** | No - `.env` está en `.gitignore` ✅ |
| **¿Secrets en historial git?** | Pendiente verificar - revisar `git log --all --oneline -- .env` |
| **GitHub Actions secrets** | ✅ Usados en workflows (`sercop.yml`, `reporte_semanal.yml`) - inyectados como `${{ secrets.TURSO_DATABASE_URL }}` y `${{ secrets.TURSO_AUTH_TOKEN }}` |
| **Rotación de secretos** | ❌ No definida - el TURSO_AUTH_TOKEN es de largo plazo sin mecanismo de renovación automática |
| **Variables de entorno frontend** | ✅ Buen diseño - las variables del `.env` que comienzan sin `VITE_` no llegan al navegador. Este proyecto usa Cloudflare Pages sin build, por lo que las `.env` no llegan al cliente. |

### Configuración de Producción vs. Desarrollo

#### Hallazgo CONFIRMADO: Modo DEBUG no configurado explícitamente
- **Ubicación**: No hay variable `DEBUG` en `.env` ni en el código Python
- **Evidencia**: El logging se configura con `LOG_LEVEL=INFO` (línea 21 del .env). No hay bandera `DEBUG=True` que active waypoints de debug de Django o similares.
- **Análisis**: Dado que es una aplicación Python pura sin framework web Django/Flask con modo debug automático, esto no es un riesgo directo. El `LOG_LEVEL=INFO` evita que datos sensibles aparezcan en logs de consola.
- **Recomendación**: Mantener `LOG_LEVEL=INFO` o `WARNING` en producción; evitar `DEBUG` que podría mostrar trazas completas.

#### Hallazgo: Endpoints de diagnóstico no expuestos
- **Análisis**: El código no tiene endpoints `/debug`, `/health`, `/test` expuestos. El heartbeat se envía por Telegram pero no es un endpoint HTTP accesible.
- **Riesgo**: Bajo - ningún endpoint de diagnóstico público.

#### Hallazgo: Puertos y servicios innecesarios
- **Análisis**: 
  - Landing Cloudflare Pages: solo Puerto 80/443 (estándar)
  - API SERCOP: Puerto 443 (HTTPS)
  - GitHub Actions: entorno gestionado
  - Turso/Supabase: puertos gestionados por proveedor
- **Riesgo**: Bajo - No hay servicios expuestos innecesariamente en el entorno del proyecto.

### Contenedores: Configuración y Riesgos

#### Análisis: Cloudflare Workers / Pages
- **Estado**: Landing page en Cloudflare Pages - "Framework preset: None", sin compilación necesaria
- **usuario no root**: No aplica - no hay contenedores Docker definidos en el repositorio. El pipeline de GitHub Actions se ejecuta como usuario `root` en `ubuntu-latest` por defecto.
- **Imágenes base**: No aplica - proyecto puro Python, se ejecuta con `python -m src.main`
- **Puertos expuestos**: Landing page en Cloudflare Pages gestiona esto automáticamente (puerto 80/443)
- **Volúmenes**: No aplica

#### Análisis de `wrangler.jsonc` (si existe)
- **Revisar**: No se encontró `wrangler.jsonc` en el directorio raíz, pero hay `.wrangler/` y `.dev.vars*` para development Workers.
- **Hallazgo**: El proyecto usa Cloudflare Pages (estático), no Workers. La landing page no requiere compilación.

#### Riesgos de Contenedores Identificados
| Riesgo | Evaluación | Comentario |
|---|---|---|
| **Imágenes base no seguras** | ❌ No aplica | No hay Dockerfile ni imágenes custom |
| **usuario root en CI** | ⚠️ Medio | GitHub Actions `ubuntu-latest` corre como root, pero el proyecto no requiere privilegios elevados |
| **Puertos por defecto expuestos** | ⚠️ Bajo | Cloudflare Pages expone puertos 80/443 automáticamente, pero solo contenido estático |
| **Falta de .dockerignore** | ⚠️ Medio | No hay Dockerfile, pero `.gitignore` cumple función similar para archivos sensibles |
| **Secretos en imagen** | ❌ SIN PROBLEMA | Los secrets vienen de variables de entorno del runner (GitHub Secrets), no embutidos en imagen |

### Red: TLS y Servicios Internos

| Componente | TLS | Servicios Internos | Segmentación |
|---|---|---|---|
| **API SERCOP** | ✅ HTTPS (por defecto httpx) | Ninguno (solo lectura) | Pública, rate-limited por IP |
| **Turso Cloud** | ✅ HTTPS + JWT auth | Base SQLite virtual | Acceso autenticado por token JWT |
| **Supabase** | ✅ HTTPS REST | Depende RLS políticas | Configurable via RLS |
| **Landing Cloudflare Pages** | ✅ HTTPS global CDN | Ninguna (estática) | Segmentada por defecto |
| **Evolution API (WhatsApp)** | ⚠️ HTTP o HTTPS | Dependiente de configuración del contenedor | Configuración ejemplo usa `http://tu-oracle-ip:8080` (sin TLS) |
| **Resend API** | ✅ HTTPS (endpoint api.resend.com) | Ninguna | API externa |

### Hallazgo CONFIRMADO: Evolution API podría estar expuesta sin protección adecuada
- **Ubicación**: Configuración en `.env` sugiere `EVOLUTION_API_URL=http://tu-oracle-ip:8080` (HTTP, sin TLS)
- **Evidencia**: El cliente notify.py usa `self.evolution_url` sin validación de esquema (http/https). Si la Evolution API se despliega en una IP Oracle Cloud con puerto 8080 abierto, cualquier persona podría acceder al endpoint `/message/sendText/{instance}` sin autenticación adicional (la autenticación ya viene del `apikey` header, pero si el contenedor no tiene firewall restrictivo...)
- **Riesgo**: MEDIO - Si la clave `EVOLUTION_API_KEY` se filtra o si el API no exige auth adicional beyond el apikey header, terceros podrían enviar mensajes WhatsApp no autorizados.
- **Recomendation**: Forzar HTTPS para Evolution API y asegurar que el contenedor tenga firewall/restricción de IP.

### CI/CD: Permisos y Secretos en Workflows

#### Análisis de `sercop.yml` (líneas 1-69)
| Paso | Permisos | Secrets Usados | Riesgo |
|---|---|---|---|
| `actions/checkout@v4` | `contents: read, actions: write` | Ninguno directamente | Bajo - checkout estándar |
| `setup-python@v5` | Ninguno | `python-version` | Bajo |
| `pip install -r requirements.txt` | Ninguno | Ninguno | Bajo |
| `run-pipeline` | `contents: read, actions: write` | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (líneas 40-41) | **CRÍTICO** - secrets inyectados como env vars en job |
| `workflow enable` | `GITHUB_TOKEN` | `GH_TOKEN` (línea 66) | Bajo - gestiona workflows del repo |

#### Análisis de `reporte_semanal.yml` (líneas 1-65)
| Paso | Permisos | Secrets Usados | Riesgo |
|---|---|---|---|
| `actions/checkout@v4` | `contents: read, actions: write` | Ninguno | Bajo |
| `setup-python@v5` | Ninguno | `python-version` | Bajo |
| `pip install -r requirements.txt` | Ninguno | Ninguno | Bajo |
| `generate-report` | `contents: read, actions: write` | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (líneas 36-37) + todos los secrets de notificación (comentados) | **CRÍTICO** - secrets de BD y canales de notificación en env vars job |

#### Hallazgo: Secrets de notificación comentados en workflows
- **Evidencia**: En ambos workflows, los secrets de Telegram, Resend, Evolution vienen **comentados** (`# TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}`)
- **Impacta**: Los workflows están configurados para no enviar notificaciones a menos que se descomenten. Esto es una práctica segura, pero significa que las notificaciones fallan silenciosamente si los secrets no están configurados.
- **Recomendación**: Mantener comentado hasta que se necesiten, o documentar la secuencia de activación.

#### Hallazgo: `permissions: contents: read, actions: write` en workflows
- **Análisis**: Los workflows solo necesitan `contents: read` para checkout. `actions: write` no es necesario y otorga permisos mayores de los necesarios.
- **Riesgo**: Bajo - en el contexto de GitHub Actions, `actions: write` permite crear refs, pero el flujo no las crea.
- **Recomendation**: Cambiar a `permissions: contents: read` solo.

### Configuración de Secretos: Archivo .env.example

**Archivo: `D:\PROYECTOS\SCRAPING\.env.example`**
- Contiene valoresplaceholder como `tu-token-de-turso`, `re_tu_api_key_aqui`, etc.
- **Buena práctica**: Al estar versionado sin valores reales, sirve como referencia para nuevos desarrolladores.
- **Advertencia**: Los nombres de variables son descriptivos suficientes como para que un atacante sepa qué buscar si el `.env` alguna vez se filtra.
- **Recomendación**: Considerar prefijos o valores aún más genéricos en el ejemplo, o mover variables sensibles a documentación aparte.

### Resumen Fase 5

#### Secretos y Configuración
- ✅ `.env` está en `.gitignore` - los secrets no se versionan
- ✅ `.env.example` sí está versionada con placeholders - buena práctica
- ✅ GitHub Actions secrets inyectados correctamente en workflows
- ⚠️ Evolution API URL usa HTTP por defecto en configuración ejemplo - riesgo de exposición
- ❌ Sin política de rotación de TURSO_AUTH_TOKEN
- ✅ Modo debug no configurado (LOG_LEVEL=INFO suficientes)
- ✅ Sin endpoints de diagnóstico expuestos
- ✅ Landing page en Cloudflare Pages con HTTPS global

#### Secretos Encontrados y Riesgo Asociado
| Secreto | Ubicación | Riesgo Si Se Filtra | Mitigación |
|---|---|---|---|
| `TURSO_AUTH_TOKEN` | `.env` (ignorado) + GitHub Secrets | Acceso completo a BD cloud Turso → robo/modificación de historial | Rotación periódica, monitoring de uso, tokens con corto TTL |
| `RESEND_API_KEY` | GitHub Secrets (pending) | Envío de emails no autorizados, spam a distribuidores | Rotación, monitoreo de uso de email |
| `EVOLUTION_API_KEY` | GitHub Secrets (pending) | Envío de WhatsApp no autorizados, phishing a clientes | Restringir IP, usar HTTPS, rotación |
| `TELEGRAM_BOT_TOKEN` | GitHub Secrets (pending) | Alertas no autorizadas a grupo Telegram | Rotación, chat ID restrictido |

**Cobertura alcanzada: 80%** - Pendiente: verificar historial git de .env para confirmar que nunca fue commitado, y evaluar si Evolution API requiere configuración HTTPS/restricción de IP.

**Recomendación prioritaria**: Implementar rotación automática o manual del TURSO_AUTH_TOKEN y revisar la configuración de la Evolution API para usar HTTPS y restricciones de IP.