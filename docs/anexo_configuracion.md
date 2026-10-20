# Anexo 1: Parámetros Técnicos de Configuración del Servicio "LicitaciónYa"
## Documento Vinculado al Contrato de Prestación de Servicios (Cláusula 1.2)

---

### Datos del Cliente
* **Razón Social:** `[NOMBRE DE LA EMPRESA O RAZÓN SOCIAL]`
* **RUC:** `[NÚMERO DE RUC]`
* **Contacto Técnico / Comercial:** `[NOMBRE Y APELLIDO]`
* **Cargo:** `[GERENTE GENERAL / JEFE DE VENTAS]`
* **Fecha de Configuración:** `[DD/MM/AAAA]`

---

### 1. Rubro Comercial y Catálogo de Búsqueda
Especifique hasta 30 términos técnicos, nombres comerciales o palabras clave de los productos que comercializa su empresa. El motor auditará el título, objeto y especificaciones del proceso:

| # | Palabra Clave / Término Técnico | Variantes o Sinónimos Relevantes |
| :-: | :--- | :--- |
| **1** | Cemento | Tipo Portland, Tipo Selvalegre, Rocafuerte, Chimborazo |
| **2** | Varilla corrugada | Acero corrugado, varilla sismorresistente, alambrón |
| **3** | Pintura de alto tráfico | Esmalte sintético, pintura vial, anticorrosivo, epóxica |
| **4** | Tubería PVC | Tubería presión, alcantarillado PVC, accesorios PVC |
| **5** | Generador eléctrico | Grupo electrógeno, planta eléctrica diésel |
| **6** | [Personalizado 1] | |
| **7** | [Personalizado 2] | |
| **8** | [Personalizado 3] | |
| **9** | [Personalizado 4] | |
| **10** | [Personalizado 5] | |
| *(hasta 30)* | | |

---

### 2. Filtros Financieros y Geográficos

#### 2.1 Umbral Presupuestario Mínimo
* **Monto mínimo referencial para disparar alerta:** `$ [EJ: 5,000.00]` USD
  *(Los procesos con presupuesto inferior a este umbral se omiten para evitar ruido en su canal corporativo).*

#### 2.2 Cobertura Geográfica de Despacho
Marque con una `X` las provincias donde su empresa tiene capacidad operativa de cotización y entrega:

- [ ] **Nacional (Todas las provincias)**
- [ ] **Pichincha** (Quito, Rumiñahui, Mejía)
- [ ] **Guayas** (Guayaquil, Samborondón, Durán)
- [ ] **Azuay** (Cuenca)
- [ ] **Tungurahua** (Ambato)
- [ ] **Manabí** (Portoviejo, Manta)
- [ ] **El Oro** (Machala)
- [ ] **Otras provincias específicas:** `[DETALLAR AQUÍ]`

---

### 3. Configuración de Canales de Despacho

#### 3.1 Canal de Alertas Automatizadas (WhatsApp / Telegram)
* **Canal preferente:** `[ WhatsApp / Telegram ]`
* **Número(s) celular para recepción (con código de país):**
  * Principal: `+593 [99 999 9999]` — Titular: `[Nombre y Cargo]`
  * Secundario (opcional): `+593 [99 999 9999]` — Titular: `[Nombre y Cargo]`

#### 3.2 Canal de Reporte Ejecutivo Semanal (.xlsx)
* **Día y hora de entrega:** Todos los lunes a las **08:00 AM**
* **Correos electrónicos destinatarios:**
  * Correo 1 (Gerencia): `[gerencia@empresa.com]`
  * Correo 2 (Ventas/Licitaciones): `[licitaciones@empresa.com]`

---

### 4. Clasificación de Fases Deseadas
El motor de LicitaciónYa etiqueta automáticamente cada proceso detectado. Indique qué tipo de notificaciones desea recibir:

* **[ X ] 🟢 Convocatorias Abiertas:** Procesos en fase de concurso o pliegos donde el Estado aún no ha adjudicado proveedor.
* **[ X ] ⚪ Adjudicaciones e Inteligencia de Precios:** Procesos donde ya se seleccionó ganador, para monitorear precios adjudicados a competidores y entidades con demanda recurrente.

---

### Firma de Conformidad Técnica

___________________________________________
**Por EL CLIENTE**
Firma del Representante o Responsable
C.I. / RUC:
