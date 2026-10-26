# 📋 LicitaciónYa — Mejoras Pendientes y Roadmap Técnico

**Fecha de Creación:** 24 de octubre de 2026  
**Última Actualización:** 25 de octubre de 2026 (Post-auditoría integral y validación de pipeline en producción)  
**Estado del Proyecto:** Pipeline operativo MVP, base de datos Turso Cloud sincronizada, validación comercial en curso  

---

## 📊 1. Estado Actual del Proyecto

| Categoría | Estado | Comentario |
| :--- | :---: | :--- |
| **Pipeline de Extracción** | 🟢 Operativo | Extrae datos SERCOP cada 6h, sincroniza en Turso Cloud, 0 errores Pydantic. |
| **Generador de Reportes** | 🟢 Operativo | 335 procesos leídos, 240 oportunidades filtradas, **$36,791,227.24 USD** acumulado. |
| **Suite de Pruebas** | 🟢 11/11 passing | Sin regresiones tras el fix de deserialización de `raw_json`. |
| **Modo "Silencioso"** | 🟡 Documentado | GitHub Actions extrae y guarda en Turso; notificaciones automáticas (WhatsApp/Telegram) comentadas para fase de pilotos. |
| **Seguridad (F1 - F10)** | 🟢 Mitigado | Token Turso rotado, logs sanitizados con masking y `html.escape()`, `requirements.txt` fijado con tags exactos. |
| **Modelo Comercial** | 🟡 En Prospección | Reporte Excel Semana 43 generado en `downloads/`. Listo para validación de pricing ($80/mes) con primeros 5 prospectos. |

---

## 🐛 2. Registro de Bugs y Correcciones

| ID | Prioridad | Componente | Descripción | Estado |
| :---: | :---: | :--- | :--- | :---: |
| **BUG-001** | 🔴 Alto | `src/reporte.py` | **Desempaquetado de `raw_json`:** `ProcesoSercop.model_validate(p)` fallaba silenciosamente porque los atributos `id` y `year` venían dentro de `raw_json`. **Solución:** Desempaquetado explícito con fallbacks seguros. `11/11 passed`. | 🟢 Corregido |
| **BUG-002** | 🟡 Medio | `src/notify.py` / workflows | **Pipeline en modo "silencioso":** GitHub Actions guarda en Turso pero no despacha alertas automáticas. **Decisión:** Mantener silencioso para pilotos iniciales (entrega manual de Excel) y descomentar al confirmar clientes. | 🟡 Documentado |
| **BUG-003** | 🟡 Medio | `src/main.py` | **Fuga de datos en logs:** Se logueaban diccionarios crudos en fallos de validación. **Solución:** Loguear únicamente `ocid`, aplicar `html.escape()` y enmascaramiento de emails (`u***@dominio.com`). | 🟢 Corregido |
| **BUG-004** | 🟢 Bajo | `wrangler.jsonc` | **Compatibilidad Cloudflare Pages:** Propiedad `"assets"` causaba error en Pages. **Solución:** Reemplazado por `"pages_build_output_dir": "landing"`. Despliegue 100% exitoso. | 🟢 Corregido |

---

## 🛠️ 3. Mejoras de Código y Funcionalidad Pendientes

| ID | Prioridad | Componente | Descripción y Justificación | Esfuerzo Estimado |
| :---: | :---: | :--- | :--- | :---: |
| **IMP-001** | 🔴 Alto | `src/client.py` & `src/models.py` | **Despiece Estructurado de Ítems (Vía OCDS `/record`):** Consumir `tender.items` y `awards.items` en JSON nativo para obtener descripción, cantidad, unidad, CPC y precio unitario sin fragilidad de PDFs. | 2 a 3 días |
| **IMP-002** | 🟡 Medio | `src/scrapers/` (nuevo) | **Scraper de Pliegos PDF (Fallback TDR):** Parser con `pdfplumber` reservado como respaldo para procesos de obra compleja donde el ítem OCDS sea genérico y los TDRs estén en PDF adjunto. | 2 a 3 semanas |
| **IMP-003** | 🔴 Alto | `src/main.py` / `src/reporte.py` | **Integración PAC SERCOP (Plan Anual de Contratación):** Ingesta del dataset anual de compras planificadas para generar el módulo de *"Oportunidades Futuras (Proyección a 90 días)"*. | 3 a 4 semanas |
| **IMP-004** | 🟡 Medio | `src/matcher.py` / nuevo módulo | **Integración Catastro SRI RUC:** Validación de razón social, estado tributario y actividad económica de entidades y oferentes mediante API pública / catastro mensual del SRI. | 2 semanas |
| **IMP-005** | 🟡 Medio | `src/notify.py` / workflows | **Activación de Canales Automatizados:** Descomentar y parametrizar credenciales de Telegram Bot y Evolution API (WhatsApp) al cerrar los primeros 3 clientes pagos. | 1 semana |
| **IMP-006** | 🟢 Bajo | `scripts/` | **Scripts de Mantenimiento:** Herramientas de automatización: `rotar_turso_token.py`, `backup_turso.py` y `check_pipeline_health.py`. | 3 a 5 días |

---

## 📚 4. Documentación Pendiente

| ID | Prioridad | Archivo Objetivo | Contenido Requerido | Estado |
| :---: | :---: | :--- | :--- | :---: |
| **DOC-001** | 🔴 Alto | `AUDIT_DELIVERY.md` | Formalización del cierre de auditoría con F1-F10 mitigados y aprobación MVP. | 🟢 Completado |
| **DOC-002** | 🔴 Alto | `docs/operational_runbook.md` | **Runbook Operativo:** Ejecución manual del pipeline, despacho semanal de Excel, procedimiento de rotación de tokens y protocolo ante incidentes. | 🟡 Pendiente |
| **DOC-003** | 🟡 Medio | `docs/guion_venta.md` | Actualización con la propuesta de valor cuantitativa ($36.7M USD, 240 oportunidades) y manejo de objeciones. | 🟡 Pendiente |
| **DOC-004** | 🟢 Bajo | `README.md` | Actualización del diagrama de arquitectura de 4 capas, badges de CI/CD y guía de despliegue local. | 🟡 Pendiente |

---

## 🔒 5. Seguridad y Mantenimiento

| ID | Prioridad | Componente | Procedimiento / Acción Requerida | Frecuencia / Próxima Fecha |
| :---: | :---: | :--- | :--- | :---: |
| **SEC-001** | 🔴 Crítico | `TURSO_AUTH_TOKEN` | Rotar token JWT en dashboard de Turso, actualizar `.env` local y secrets de GitHub Actions (`TURSO_AUTH_TOKEN`). Invalidar token previo. | Cada 30-45 días (Próximo: 24 nov 2026) |
| **SEC-002** | 🟡 Medio | SSL Evolution API | Configurar Caddy / Nginx con Let's Encrypt para forzar HTTPS en el puerto 8080 del contenedor de WhatsApp en VPS. | Al activar primer cliente WhatsApp |
| **SEC-003** | 🟢 Bajo | Dependencias | Ejecutar `pip-audit` y verificar parches de seguridad sobre dependencias fijadas en `requirements.txt`. | Cada 90 días |
| **SEC-004** | 🟢 Bajo | Auditoría de Secretos | Verificar historial git, sanitización de `.env.example` y estado de variables de entorno cifradas. | Cada 90 días |

---

## 📈 6. Roadmap Comercial y de Producto

```mermaid
timeline
    title Hoja de Ruta de Producto LicitaciónYa
    section Fase 1 : Actual (Semanas 1-2)
        Prospección Comercial : Contactar 5 prospectos con Guion WhatsApp
        Entrega de Valor : Despacho manual Reporte Semana 43 en Excel
        Piloto Gratuito : Activar 3 pilotos de 15 días
    section Fase 2 : Enriquecimiento (Semanas 3-4)
        Despiece OCDS : Integrar tender.items JSON nativo
        Precios Unitarios : APU preliminar y cálculo de volumen
        Despiece en Alertas : Telegram / Email / Excel enriquecido
    section Fase 3 : Predictivo (Semanas 5-8)
        Módulo PAC SERCOP : Oportunidades proyectadas a 90 días
        Inteligencia Competencia : RUC ganadores y márgenes de descuento
        Validación SRI : Razón social y régimen tributario
    section Fase 4 : Escala (Semanas 9+)
        Portal Interactivo : Buscador web autenticado en Cloudflare
        Despacho Automatizado : Evolution API WhatsApp con SSL
        Tier Enterprise : Monitoreo multi-rubro y reportes a medida
```

---

## 📦 7. Checklist de Lanzamiento Comercial (Próximos Pasos Inmediatos)

- [x] Ejecutar suite de pruebas: `python -m pytest tests/test_sercop.py -q` (11 passed).
- [x] Sincronizar ramas en GitHub: `main` y `master` actualizados.
- [x] Generar reporte semanal consolidado: `downloads/Reporte_SERCOP_Semana_43_2026.xlsx`.
- [x] Cierre formal de auditoría en `AUDIT_DELIVERY.md`.
- [ ] **Acción 1:** Contactar a los primeros 3 prospectos de `docs/lista_prospectos.md` (ej. Disensa Guayas, Ferretera Silva Ambato, El Cóndor Cuenca).
- [ ] **Acción 2:** Entregar el reporte Excel filtrado y ofrecer los 15 días de piloto sin costo.
- [ ] **Acción 3:** Redactar `docs/operational_runbook.md` para estandarizar la operación semanal.
