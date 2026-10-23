# LicitaciónYa — Monitoreo Inteligente de Compras Públicas (SERCOP Ecuador)
## Propuesta de Servicio B2B | Inteligencia Comercial y Alertas Tempranas

---

### 1. El Problema del Sector
Las empresas proveedoras de ferretería, materiales de construcción y suministros industriales en Ecuador pierden entre el **35% y el 60% de las oportunidades de contratación pública** debido a tres fallas estructurales del monitoreo manual:

1. **Llegada tardía:** El portal de SERCOP publica cientos de procesos diarios con plazos muy estrechos (a menudo 3 a 5 días para presentar ofertas o formular preguntas). Monitorear de forma esporádica garantiza enterarse cuando ya no hay tiempo para cotizar.
2. **Costo y distracción operativa:** Asignar a un asistente o vendedor a buscar licitaciones manualmente cuesta entre **$550 y $750 USD mensuales** (salario básico sectorial + beneficios IESS), consume horas de trabajo productivo y depende del criterio subjetivo de búsqueda humana.
3. **Pérdida en el "ruido":** Buscar términos genéricos en el buscador oficial devuelve miles de procesos irrelevantes (limpieza, papelería, servicios legales) donde se camuflan las compras reales de cemento, acero, tubería o maquinaria.

---

### 2. La Solución: LicitaciónYa
**LicitaciónYa** es un servicio gestionado de vigilancia automatizada que audita continuamente el sistema oficial de compras públicas de Ecuador (SERCOP), filtra quirúrgicamente las licitaciones relevantes para su catálogo comercial y le notifica automáticamente con clasificación explícita de fase (convocatoria abierta / adjudicada).

```
┌─────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│  SERCOP Datos Abiertos  │ ──> │  Motor de Filtrado     │ ──> │  Canales Ejecutivos    │
│  Monitoreo cada 6 horas │     │  30+ Keywords + Montos │     │  WhatsApp + Email xlsx │
└─────────────────────────┘     └────────────────────────┘     └────────────────────────┘
```

#### Entregables del Servicio:
* **Alertas Automatizadas por WhatsApp y Telegram:** Detección y notificación automatizada ante cada nuevo corte liberado por SERCOP (auditoría continua cada 6 horas). Cada alerta clasifica explícitamente el estado del proceso:
  * **🟢 Convocatoria Abierta:** Procesos en concurso o pliegos donde la entidad estatal aún no ha seleccionado proveedor, permitiendo preparar ofertas y contactar a la entidad.
  * **⚪ Adjudicación Reciente:** Inteligencia competitiva de precios finales y oferentes ganadores para monitorear a la competencia y conocer la demanda real en su zona.
  * Incluye presupuesto referencial en USD, entidad compradora, palabras clave detectadas y enlace hipervinculado directo al pliego oficial.
* **Reporte Ejecutivo Semanal en Excel (.xlsx):** Todos los lunes a las **8:00 AM**, recibe en su correo electrónico una matriz gerencial organizada en dos hojas:
  * **Oportunidades Semanales:** Listado de licitaciones vigentes con código de proceso, entidad contratante, descripción, monto formateado en USD y enlace hipervinculado directo al pliego.
  * **Resumen Geográfico:** Agrupación por provincias para coordinar la logística de entrega de su equipo de ventas.
* **Calibración a Medida:** Ajuste exacto a sus líneas comerciales (cemento, acero corrugado, perfiles estructurales, PVC, pintura industrial, herramientas, generadores, etc.) y a su cobertura geográfica de despacho mediante el [Anexo de Configuración](anexo_configuracion.md).

---

### 3. Modelo Comercial y Precios

| Concepto | Inversión (USD) | Detalle |
| :--- | :---: | :--- |
| **Calibración y Setup Inicial** | **$0.00** *(bonificado 100%)* | Configuración del catálogo de búsqueda (hasta 30 términos técnicos), umbrales presupuestarios, filtros provinciales e integración de canales (WhatsApp / Email). |
| **Suscripción Mensual** | **$80.00** */ mes + IVA* | Operación ininterrumpida 24/7, monitoreo cada 6 horas, alertas automatizadas ilimitadas en cada ciclo de monitoreo de 6 horas y entrega de reportes semanales sin permanencia mínima. |

> **Facturación Formal:** Todos los valores se emiten con Factura Electrónica autorizada por el SRI (válida como gasto deducible para su empresa).

#### Garantía de Piloto Sin Riesgo (15 Días Gratis)
Para demostrar la efectividad del sistema antes de cualquier desembolso:
* Le configuramos un **piloto de prueba durante 15 días calendario sin costo alguno**.
* Recibirá alertas reales y dos reportes ejecutivos de lunes.
* Si al finalizar el periodo el servicio no le generó al menos 2 oportunidades claras de cotización, no paga absolutamente nada y cancelamos el monitoreo.

#### Garantía de Continuidad Técnica (SLA)
El portal SERCOP y sus APIs actualizan esquemas periódicamente. Nuestro equipo técnico asume la responsabilidad total de mantenimiento: si la plataforma estatal cambia o presenta intermitencias, actualizamos nuestros conectores en menos de **24 horas hábiles** sin costo extra para el cliente.

---

### 4. Checklist para Demostración en Vivo (10 Minutos)

Para presentar el servicio a un tomador de decisiones (Gerente General, Director Comercial):

1. **Apertura (2 min):** *"¿Cuántas licitaciones de cemento o varilla se publicaron en Guayas y Pichincha en los últimos 7 días? Déjame mostrarte la lista exacta en 30 segundos."*
2. **Ejecución en vivo (3 min):** Ejecutar el pipeline de extracción frente al cliente:
   ```bash
   python -m src.main --rubro ferreteria_construccion --pages 1
   ```
   Mostrar la detección automatizada y el despacho de la alerta en WhatsApp con su etiqueta de fase (🟢 Abierta o ⚪ Adjudicada).
3. **Apertura del Excel Ejecutivo (3 min):** Abrir en pantalla el archivo generado (`downloads/Reporte_SERCOP_Semana_XX_YYYY.xlsx`) mostrando procesos reales detectados en el año 2026:
   * *CELEC EP (Termopichincha):* Materiales de ferretería por **$1,750,208.57 USD** (Pichincha).
   * *Empresa Eléctrica Ambato (EEASA):* Mantenimiento de obras civiles en subestaciones por **$115,753.64 USD** (Tungurahua).
   * *CNEL EP:* Mantenimiento de líneas y redes de distribución por **$785,783.20 USD** (Guayas).
   * *EPMMOP (Quito):* Tapa con cerco de hierro dúctil por **$97,324.98 USD** (Pichincha).
4. **Cierre de Piloto (2 min):** *"Permíteme conectar el número de WhatsApp de tu gerente de ventas y tu correo. Te activo las 2 semanas de prueba gratis hoy mismo."*
