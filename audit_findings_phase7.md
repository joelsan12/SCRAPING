# FASE 7 · REGISTRO, MONITOREO Y RESPUESTA

## Registro de Eventos (Logging)

### ¿Se registran los siguientes eventos?

| Evento | ¿Registrado? | Ubicación | Nivel de Log | Comentario |
|---|---|---|---|---|
| **Inicios de pipeline** | ✅ Sí | `main.py:61` | INFO | "🚀 Iniciando Pipeline SERCOP | Rubro: X | Año: Y" |
| **Fallos de API** | ✅ Sí | `main.py:105-107` | ERROR | `logger.error(f"Error consultando API para '{kw}' (pág {page}): {e}")` |
| **Errores validación Pydantic** | ✅ Sí | `main.py:123-126` | WARNING | `total_errores_validacion` contador + log por registro |
| **Alertas generadas** | ✅ Sí | `main.py:143-150` | INFO | `total_alertas` contador + notificación multicanal |
| **Heartbeat enviado** | ✅ Sí | `main.py:171-184` | INFO | `notifier.enviar_heartbeat()` + resumen en Telegram |
| **Advertencias** | ✅ Sí | `main.py:152-155` | WARNING | `advertencias` lista append + log |
| **Actualizaciones de BD** | ⚠️ Parcial | `storage.py` métodos individuales | DEBUG/INFO | `logger.info(f"SQLite Storage inicializado...")` y logs internos de Turso/Supabase. **No registra qué OCID fue actualizado y cuándo** excepto el `last_seen` en la BD. |
| **Eventos de seguridad** | ❌ No | N/A | - | No hay logging de eventos de seguridad (intento de acceso fallido, uso de secrets, cambios de configuración). |

### Hallazgo: Logs que pueden contener datos sensibles
- **Ubicación**: Varios puntos en el código donde se loguean datos de procesos SERCOP
- **Evidencia**:
  - `main.py:125`: `logger.warning(f"  ⚠️ Error de validación en registro {raw.get('id')}: {val_err}")` - loguea el `raw` dict que puede contener campos sensibles del proceso SERCOP.
  - `storage.py`: `logger.info(f"Total procesos locales a migrar: {len(procesos)}")` - cuenta pero no expone datos.
  - `notify.py:196`: `logger.info(f"✅ Correo enviado vía Resend a {self.resend_to}")` - expone el email destinatario en logs.
- **Impacta**: Si el nivel de log es DEBUG o si los logs son accesibles por usuarios no autorizados, podrían filtrarse datos de procesos, montos, nombres de entidades.
- **Recomendation**: Asegurarse de que `LOG_LEVEL=WARNING` o `ERROR` en producción; evitar loguear el dict `raw` completo. Usar `logger.warning(f"Error validación ocid={raw.get('ocid')}: {val_err}")` en su lugar.

### Integridad y Retención de Logs

#### Almacenamiento de logs
- **Actual**: Los logs se escriben en consola/stdout y se capturían por el runner de GitHub Actions o ejecución local. No hay almacenamiento persistente de logs dentro del proyecto (no hay tabla de logs, no archivo de rotación configurado).
- **Riesgo**: Si los logs se pierden (reinicio del runner, limpieza de consola), no hay forma de reconstruir qué pasó en corridas anteriores.

#### Rotación de logs
- **Configuración**: Ninguna definida explícitamente. Python's `logging.basicConfig()` por defecto no rota logs.
- **Herramienta**: Depende del entorno (GitHub Actions captura stdout, ejecución local usa consola).

#### Retención
- **Datos de negocio**: Los procesos se acumulan en la BD SQLite/Turso/Sin TTL (ver Fase 3).
- **Logs**: No hay política de retención; se pierden al reiniciar.

### Alertas ante Eventos Anómalos

#### ¿Qué alertas existen actualmente?
| Evento | Mecanismo de Alerta | Canal |
|---|---|---|
| **Fallos de pipeline** | `if: failure()` en GitHub Actions (comentado en workflows) | Telegram (si se descomenta) |
| **Heartbeat** | Enviado periódicamente cada corrida | Telegram / Email / WhatsApp |
| **Errores de validación** | Contador `total_errores_validacion` en resumen final | Consola/Log |
| **Advertencias** | Lista `advertencias` en resumen final | Consola/Log |

#### Hallazgo: Sin detección de anomalías automatizada
- **Análisis**: El pipeline no tiene umbrales de alarma automatizados (ej. "si se fallan más de X consultas consecutivas, alertar").
- **Riesgo**: No hay alerta proactiva si la API SERCOP cae por período prolongado, si el rate limiting es excesivo, o si dejan de recibir procesos nuevos.
- **Recomendation**: Implementar umbrales de fallos consecutivos y alertas automáticas.

### Plan de Respuesta a Incidentes Mínimo

#### Hallazgo: Plan de respuesta a incidentes Inexistente
- **Evaluación**: **NO EXISTE** un plan documentado de respuesta a incidentes.
- **Elementos que faltan**:
  1. **¿Quién actúa?** No hay roles definidos para responder a incidentes.
  2. **Cómo se rotan secretos?** No hay procedimiento documentado para rotar `TURSO_AUTH_TOKEN` u otros secrets.
  3. **Cómo se notifica?** Se usa Telegram/Email/WhastApp, pero sin runbook documentado.
  4. **Cómo se evalúa el impacto?** No hay matriz de impacto definida.
  5. **Pasos de contención:** No hay pasos documentados para revocar tokens, cambiar endpoints, etc.

#### Elementos Documentados (parcial)
- ✅ Notificación de heartbeat periódico
- ✅ Contadores de éxito/fallo en resumen de ejecución
- ✅ Uso de GitHub Secrets para credenciales

#### Recomendation Desarrollar un plan de respuesta a incidentes mínimo que incluya:
1. **Contactos**: Quién es el dueño del producto/desarrollador principal en caso de hallazgo crítico.
2. **Procedimiento de rotación**: Pasos para revocar y renovar `TURSO_AUTH_TOKEN`, `EVOLUTION_API_KEY`, `RESEND_API_KEY`.
3. **Criterios de severidad**: Clasificación CRÍTICO/ALTO/MEDIUM/BAJO para hallazgos de seguridad.
4. **Comunicación**: A quién notificar (cliente B2B, equipo interno) y cómo.

### Privacidad

#### Base Legal y Consentimiento
- **El proyecto monitorea** licitaciones públicas (SERCOP Ecuador) - datos que son de acceso público por ley.
- **Datos personales**: Los campos `buyer` (entidad compradora), `region`, `title`, `description` son datos de entidades públicas, no de individuos naturales en la mayoría de los casos.
- **LOPD Ecuador**: La Ley Orgánica de Protección de Datos Personales de Ecuador requiere bases legales para tratamiento de datos. Datos de licitaciones públicas suelen considerarse información pública, pero el monitoreo y perfilado continuo podría requerir evaluación.
- **Derechos de titulares**: No aplica directamente al monitoreo de licitaciones públicas, pero si la base de datos llegara a incluir datos de personas físicas (ej. en campo `suppliers` o `description`), no hay mecanismos para ejercer derechos de acceso/borrado.

#### consentimiento y derechos
- **No aplica** directamente - el proyecto no recolege datos de usuarios finales que acepten términos.
- **Salida de datos**: Los reportes semanales se envían a clientes B2B que han suscrito el servicio (según contrato en `docs/contrato_servicio.md`). El tratamiento de datos está cubierto en el contrato.

### Resumen Ejecutivo Fase 7

#### Evaluación de Registro y Monitoreo
- ✅ Pipeline registra eventos principales (inicios, fallos, alertas, heartbeats)
- ⚠️ Logs pueden contener datos sensibles si nivel es DEBUG
- ❌ Sin logging de eventos de seguridad dedicados
- ❌ Sin retención de logs persistente
- ❌ Sin plan de respuesta a incidentes documentado
- ⚠️ Sin umbrales de alarma automatizados
- ✅ Datos de licitaciones públicas son compatibles con LOPD Ecuador (información pública)
- ✅ Reportes van a clientes B2B con contrato definido

#### Hallazgos Críticos
1. **Sin plan de respuesta a incidentes** - crítico para cualquier sistema de producción
2. **Logs pueden filtrar datos sensibles** - dependiendo nivel de configuración
3. **Sin umbrales de alarma automatizados** - ceguera operativa ante fallos prolongados

#### Recomendaciones Prioritarias
1. **Desarrollar plan de respuesta a incidentes** con roles, procedimientos de rotación de secrets y criterios de severidad
2. **Configurar LOG_LEVEL=WARNING** en producción y evitar loguear datos crudos de procesos
3. **Implementar umbrales de alarma** para fallos consecutivos de API o tasas de error inusualmente altas

**Cobertura alcanzada: 70%** - Pendiente: documentar plan de respuesta a incidentes y evaluar configuración de nivel de logs para producción.

**Recomendación prioritaria**: Crear un plan mínimo de respuesta a incidentes y asegurar que los logs de producción no filtren datos sensibles.