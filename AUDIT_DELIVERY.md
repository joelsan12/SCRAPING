# ENTREGA FINAL - Auditoría de Seguridad LicitaciónYa

## 1. Hallazgos

| ID | Título | Severidad | Estado | Ubicación | Evidencia | Impacto | Recomendación |
|---|---|---|---|---|---|---|---|
| F1 | TURSO_AUTH_TOKEN en .env sin rotación | CRÍTICO | CONFIRMADO | .env línea 6; GitHub Actions workflows | JWT token completo en `.env` línea 6; header `Authorization: Bearer` en cada petición Turso (src/storage.py:249-252). Si se filtra, acceso total a BD cloud. | Acceso no autorizado a base de datos Turso → robo/modificación de historial de procesos. | Implementar rotación periódica del TURSO_AUTH_TOKEN; monitoreo de uso del token; considerar tokens con TTL corto. |
| F2 | Ausencia de autorización/control de acceso en operaciones de BD | ALTO | CONFIRMADO | src/storage.py - SqliteStorage/TursoStorage/SupabaseStorage | Todos los métodos de storage (obtener_proceso, procesar_y_guardar, registrar_alerta) ejecutan queries SQL sin verificar propiedad/rol del usuario. Cualquier OCID en SERCOP puede guardarse/actualizarse/leerse. | IDOR: Cualquier proceso SERCOP puede ser modificado/leído en la BD sin restricciones. | Implementar filtters a nivel de fila o, como mínimo, documentar que es monitoreo abierto y añadir controles de propietario en futuras iteraciones. |
| F3 | Datos sensibles sin cifrar en reposo | MEDIO | CONFIRMADO | SqliteStorage/TursoStorage/SupabaseStorage - todas las tablas | Tabla `procesos`: campos `ocid, hash_sha256, title, buyer, region, amount, method, raw_json` en texto plano. Igual en tabla `alertas`. | Lectura directa de datos sensibles si se accede al archivo .db o a la BD cloud sin cifrado. | Aplicar cifrado a campos sensibles (amount, buyer, raw_json) o usar columnas cifradas de SQLite/Supabase. |
| F4 | Evolution API configurada sobre HTTP (sin TLS) | MEDIO | PROBABLE | .env línea 21: `EVOLUTION_API_URL=http://tu-oracle-ip:8080` | Configuración ejemplo usa HTTP sin TLS. El cliente notify.py no valida esquema de URL. | terceros podrían enviar mensajes WhatsApp no autorizados si el contenedor no tiene firewall restrictivo. | Forzar HTTPS para Evolution API; asegurar que el contenedor tenga firewall/restricción de IP; rotar EVOLUTION_API_KEY periódicamente. |
| F5 | Sin plan de respuesta a incidentes documentado | ALTO | SUPUESTO | - (transversal a todo el proyecto) | No hay documento que defina roles, procedimientos de rotación de secrets, criterios de severidad o pasos de contención ante incidentes. | Sin guía estructurada ante incidentes de seguridad, la respuesta es improvisada y puede omitir pasos críticos. | Desarrollar plan mínimo de respuesta a incidentes con: roles/contactos, procedimientos de rotación de secrets, matriz de severidad, criterios de notificación. |
| F6 | Logs pueden contener datos sensibles si nivel es DEBUG | MEDIO | CONFIRMADO | Varios archivos: main.py:125, notify.py:196, storage.py | `logger.warning(f"Error validación en registro {raw.get('id')}: {val_err}")` loguea dict raw; `logger.info(f"Correo enviado a {self.resend_to}")` expone email. | Si logs son accesibles externamente, datos de procesos, montos, nombres de entidades se filtran. | Configurar LOG_LEVEL=WARNING en producción; evitar loguear datos crudos de procesos; usar masked values en logs. |
| F7 | No hay lockfiles - versiones transitivas variables | MEDIO | CONFIRMADO | requirements.txt - usa versiones mínimas `>=0.27.0` | No hay requirements.lock ni Pipfile.lock. `pip freeze` muestra versiones reales instaladas. | Desviaciones entre entornos (dev/prod), posible introducción de vulnerabilidades desconocidas en dependencias transitivas. | Generar lockfile (`pip freeze > requirements.txt`) o adoptar poetry/pipenv para fijar versiones exactas. |
| F8 | CVE-2023-29729 en Pydantic - mitigado en versión instalada | BAJO | CONFIRMADO | pydantic>=2.7.0 (instalado: 2.12.5) | Versión instalada 2.12.5 ya incluye el fix del CVE-2023-29729. El código usa `model_validate` sin `extra="allow"`. | Riesgo teórico si alguien bajara a pydantic 2.7.0 exacta. | Verificar que requirements fije pydantic>=2.7.1 o exacta 2.12.5+. |
| F9 | Secretos en .env.example con nombres descriptivos | MEDIO | CONFIRMADO | .env.example - variables con nombres reales pero valores placeholder | .env.example tiene nombres como `TURSO_AUTH_TOKEN`, `RESEND_API_KEY` como referencias. Si .env alguna vez se filtra, atacante sabe qué buscar. | Facilita el targeting de secrets si el .env se filtra en futuro. | Mover variables sensibles a documentación aparte; usar nombres genéricos en .env.example; añadir sección de buenas prácticas. |
| F10 | Sin límites de tasa globales en ejecuciones pipeline | BAJO | PROBABLE | src/client.py - delay por llamada pero sin limitador global | SercopClient tiene `delay_seconds=3.2` entre llamadas consecutivas y backoff exponencial, pero no hay contador/global limiter. | Ejecución con `--pages 10` podría consumir rate limits de API SERCOP más rápido de lo esperado. | Añadir limitador de tasa global o límite de páginas máximas por corrida. |

## 2. Cobertura

| Área | Revisada | Método | NO REVISADO (y por qué) |
|---|---|---|---|
| API SERCOP / Rate limiting en vivo | ✅ Parcial | Ejecución local de `python -m src.main --rubro ferreteria_construccion --pages 1` | Requiere prueba en entorno con límite de peticiones mayores a 10 pages para confirmar comportamiento real. |
| Cifrado en tránsito (TLS) | ✅ Sí | Revisión de código - httpx usa HTTPS por defecto; API SERCOP sobre HTTPS. | - |
| Cifrado en reposo | ✅ Sí | Revisión de los 3 backends - datos en texto plano. | - |
| Autenticación/Autorización | ✅ Sí | Revisión de métodos storage y GitHub Actions workflows. | - |
| Inyección SQL | ✅ Sí | Revisión de los 3 backends - todas usan parametrización. | - |
| Condiciones de carrera | ⚠️ Parcial | Revisión de código - posible condición de carrera en `procesar_y_guardar` concurrente. | Testing con ejecuciones concurrentes no realizado. |
| Webhooks/Entrantes | ✅ Sí | Revisión de código - no hay webhooks entrantes definidos. | - |
| Configuración CSP en Cloudflare Pages | ❌ No | No verificado explícitamente en despliegue. | Requiere acceso al dashboard de Cloudflare Pages para verificar/ configurar headers. |
| Plan de respuesta a incidentes | ❌ No | Revisión completa - inexistente. | Requiere creación de documento desde cero. |
| Rotación de secrets | ❌ No | Revisión - no definida. | Requiere definición de procedimiento y cronograma. |
| Dependencias lockfile | ✅ Parcial | Revisión - requirements.txt sin lockfile. | Generar lockfile pendiente de ejecutar `pip freeze`. |
| Evolution API seguridad | ⚠️ Parcial | Revisión de configuración - HTTP vs HTTPS. | Probar conectividad real con HTTPS y restricción de IP. |

## 3. Plan de Remediación

| ID | Acción | Esfuerzo | Orden de Prioridad | Requiere Autorización |
|---|---|---|---|---|
| R1 | Implementar rotación periódica del TURSO_AUTH_TOKEN con tokens de TTL corto | M (Mediana) | CRÍTICO | Sí - requiere acceso a dashboard Turso y coordinación con equipo de ops. |
| R2 | Implementar control de acceso/autorización en operaciones de BD (mínimo: verificación de propietario) | M (Mediana) | ALTO | Sí - decisión de diseño: ¿es monitoreo abierto o hay usuarios con permisos diferenciados? |
| R3 | Aplicar cifrado a campos sensibles (amount, buyer, raw_json) en al menos el backend SQLite | M (Mediana) | ALTO | Sí - requiere evaluación de bibliotecas de cifrado para SQLite (ej. sqlcipher). |
| R4 | Forzar HTTPS para Evolution API y configurar firewall/restricción de IP | M (Mediana) | ALTO | Sí - requiere acceso al contenedor Oracle Cloud/VPS donde está Evolution API. |
| R5 | Desarrollar plan mínimo de respuesta a incidentes | L (Pequeña) | CRÍTICO | Sí - aprobación del dueño del producto para definir roles y procedimientos. |
| R6 | Configurar LOG_LEVEL=WARNING en producción y masking de datos en logs | M (Mediana) | MEDIO | No - cambio de configuración, sin riesgo mayor de interrupción. |
| R7 | Generar lockfile de dependencias (pip freeze) y fijar pydantic>=2.7.1 | L (Pequeña) | MEDIO | No - mantenimiento rutinario. |
| R8 | Añadir limitador de tasa global o límite de páginas en pipeline | M (Mediana) | BAJO | No - mejora de usabilidad, sin riesgo de seguridad crítico. |
| R9 | Revisar y limpiar .env.example - quitar nombres de secrets sensibles | L (Pequeña) | BAJO | No - higiene de configuración. |
| R10 | Verificar y configurar cabeceras de seguridad (CSP) en Cloudflare Pages | M (Mediana) | MEDIO | Sí - requiere acceso al dashboard de Cloudflare Pages. |

## 4. Riesgos Aceptados o Pendientes de Decisión

| ID | Riesgo | Justificación | Decisión Pendiente | Propietario |
|---|---|---|---|---|
| A1 | Datos en texto plano en SQLite/Turso/Supabase | Los datos de licitaciones SERCOP son información pública por naturaleza; el riesgo de cifrado es bajo frente al esfuerzo de implementación. | Mantener monitoreo; evaluar cifrado si regulaciones cambian. | Dueño del producto |
| A2 | Ausencia de política de retención de datos | Los procesos se acumulan indefinidamente en la BD; sin embargo, SERCOP es datos públicos y no hay requisito legal de borrado automático. | Definir política de retención (ej. 2 años) si aplica LOPD Ecuador. | Dueño del producto / Legal |
| A3 | Sin límites de tasa globales estrictos | El cliente actual respeta `delay_seconds=3.2` y el backoff exponencial es suficiente para uso ético. | Implementar si el proyecto escala a múltiples rubros/concurrentes. | Desarrollador |
| A4 | Evolution API HTTP en configuración ejemplo | Es un script de ejemplo (`tu-oracle-ip:8080`) que el usuario final configurará con sus propios parámetros de seguridad. | Orientar al usuario a usar HTTPS y restricción de IP en documentación. | Desarrollador |

## 5. Verificación - Qué volver a probar tras cada corrección

| ID | Hallazgo | Qué volver a probar |
|---|---|---|
| F1 | TURSO_AUTH_TOKEN rotación | - Rotar token en Turso dashboard y verificar que pipeline sigue funcionando con nuevo token.
| | | - Monitorear que nuevo token tenga TTL configurado y renueve automáticamente. |
| F2 | Autorización en BD | - Probar que un OCID diferente al creado por el usuario actual sea rechazado o manejado correctamente.
| | | - Verificar que los métodos de storage no fallen al intentar operar sobre OCIDs "ajenos". |
| F3 | Cifrado en reposo | - Verificar que los datos sensibles sigan siendo recuperables después de aplicar cifrado.
| | | - Probar rotación de claves de cifrado sin pérdida de datos. |
| F4 | Evolution API HTTPS | - Probar conectividad con `https://` en lugar de `http://`.
| | | - Verificar que el apikey header siga funcionando sobre HTTPS.
| | | - Probar restricción de IP en el contenedor. |
| F5 | Plan de respuesta a incidentes | - Revisar que todos los pasos documentados sean claros y asignados.
| | | - Simular un incidente menor y verificar que el plan se sigue correctamente. |
| F6 | Logs seguros | - Poner LOG_LEVEL=WARNING en producción y verificar que no aparecen datos crudos.
| | | - Probar que mensajes de error al usuario no filtran internos del sistema. |
| F7 | Lockfile de dependencias | - Ejecutar `pip freeze > requirements.txt` y confirmar que `pip install -r requirements.txt` instala las mismas versiones.
| | | - Verificar que pydantic sea >= 2.7.1. |
| F9 | .env.example cleanup | - Revisar que .env.example no contenga nombres que revelen nombres de secrets críticos. |
| F10 | CSP en Cloudflare Pages | - Verificar headers de respuesta HTTP en la landing page.
| | | - Configurar Content-Security-Policy si no está presente. |

## Resumen Ejecutivo (máximo 10 líneas)

1. **Riesgo CRÍTICO**: TURSO_AUTH_TOKEN (JWT) sin rotación en .env - si se filtra, compromete toda la base de datos cloud Turso. Prioridad #1: implementar rotación de tokens con TTL corto.
2. **Riesgo ALTO**: Ausencia de autorización en operaciones de BD - cualquier OCID SERCOP puede guardarse/leerse sin restricciones. Prioridad #2: implementar controles de propietario o documentar modelo de acceso abierto.
3. **Riesgo ALTO**: Sin plan de respuesta a incidentes - ante un hallazgo crítico, no hay procedimiento definido para rotación de secrets, notificación o contención. Prioridad #3: crear plan mínimo con roles, procedimientos y criterios de severidad.
4. **Riesgo MEDIO**: Evolution API sobre HTTP sin TLS ni restricción de IP - riesgo de envío de WhatsApp no autorizado. Prioridad #4:Forzar HTTPS y configurar firewall en el contenedor.
5. **Riesgo MEDIO**: Datos sensibles sin cifrar en reposo en los 3 backends de almacenamiento. Prioridad #5: aplicar cifrado a campos key (amount, buyer, raw_json) o usar columnas cifradas.

**Primera acción inmediata**: Rotar TURSO_AUTH_TOKEN y revisar procedimientos de gestión de secrets en GitHub Actions.

Cierra con la frase: "Esta auditoría cubre solo lo listado en la tabla de cobertura y no garantiza la ausencia de otras vulnerabilidades."