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
**LicitaciónYa** es un servicio gestionado de vigilancia automatizada que audita continuamente el sistema oficial de compras públicas de Ecuador (SERCOP), filtra quirúrgicamente las licitaciones relevantes para su catálogo comercial y le notifica en tiempo real.

```
┌─────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│  SERCOP Datos Abiertos  │ ──> │  Motor de Filtrado     │ ──> │  Canales Ejecutivos    │
│  Monitoreo cada 6 horas │     │  30+ Keywords + Montos │     │  WhatsApp + Email xlsx │
└─────────────────────────┘     └────────────────────────┘     └────────────────────────┘
```

#### Entregables del Servicio:
* **Alertas Inmediatas por WhatsApp y Telegram:** Apenas una entidad contratante (Ministerio, Municipio, Empresa Pública, Prefectura o Empresa Eléctrica) publica una compra que coincida con sus productos y supere su presupuesto mínimo, usted recibe un mensaje directo con el enlace oficial, presupuesto referencial y fecha de cierre.
* **Reporte Ejecutivo Semanal en Excel (.xlsx):** Todos los lunes a las **8:00 AM**, recibe en su correo electrónico una matriz gerencial organizada en dos hojas:
  * **Oportunidades Semanales:** Listado de licitaciones vigentes con código de proceso, entidad contratante, descripción, monto formateado en USD y enlace hipervinculado directo al pliego.
  * **Resumen Geográfico:** Agrupación por provincias para coordinar la logística de entrega de su equipo de ventas.
* **Calibración a Medida:** Ajuste exacto a sus líneas comerciales (cemento, acero corrugado, perfiles estructurales, PVC, pintura industrial, herramientas, generadores, etc.) y a su cobertura geográfica de despacho.

---

### 3. Modelo Comercial y Precios

| Concepto | Inversión (USD) | Detalle |
| :--- | :---: | :--- |
| **Setup y Calibración Inicial** | **$200.00** *(pago único)* | Configuración del catálogo de búsqueda (hasta 30 términos técnicos), umbrales presupuestarios, filtros provinciales e integración de canales (WhatsApp / Email). |
| **Suscripción Mensual** | **$80.00** */ mes* | Operación ininterrumpida 24/7, monitoreo cada 6 horas, alertas instantáneas ilimitadas y entrega de reportes semanales. |

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
   Mostrar la detección instantánea y el disparo de la alerta en WhatsApp.
3. **Apertura del Excel Ejecutivo (3 min):** Abrir en pantalla el archivo generado (`reportes/reporte_semanal_...xlsx`) mostrando contratos millonarios reales recientemente detectados:
   * *Cuerpo de Ingenieros del Ejército:* Materiales de construcción por **$994,289.69 USD**.
   * *Municipio de Rumiñahui:* Cemento y asfalto por **$286,400.00 USD**.
   * *CNEL EP:* Ferretería eléctrica por **$154,200.00 USD**.
4. **Cierre de Piloto (2 min):** *"Permíteme conectar el número de WhatsApp de tu gerente de ventas y tu correo. Te activo las 2 semanas de prueba gratis hoy mismo."*
