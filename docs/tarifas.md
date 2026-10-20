# Hoja Táctica Interna de Tarifas y Precios (Tactic Sheet)
## Estrategia Comercial de Negociación por WhatsApp — LicitaciónYa Ecuador
> **DOCUMENTO CONFIDENCIAL PARA USO INTERNO EXCLUSIVO DEL EQUIPO COMERCIAL**  
> **REGLA DE ORO:** Estos 3 planes se utilizan **exclusivamente como herramienta de conversación telefónica / WhatsApp** para anclaje y rescate de ventas. **NO PUBLICAR EN LA LANDING PAGE** hasta que la arquitectura multi-cliente (S5) esté construida y probada en producción. La web mantiene de forma coherente el **Plan Estándar B2B ($80/mes + $200 setup)**.

---

### 1. Estructura de Precios Interna (3 Niveles)

| Nivel | Plan Comercial | Cuota Setup (Única) | Suscripción Mensual | Destinatarios | Alcance de Keywords | Canales de Despacho | Rol en Negociación |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Básico** | **Plan Esencial** | **$150 USD** | **$49 USD / mes** | 1 contacto | Hasta 10 keywords / 1 provincia | Matriz Excel semanal + Canal Telegram / Email | **Salvavidas** (Evita perder al prospecto con poco presupuesto) |
| **Estándar ⭐** | **Plan Profesional B2B** *(Público en Web)* | **$200 USD** | **$80 USD / mes** | 1 número directo | Hasta 30 keywords / Cobertura provincial | Alertas WhatsApp cada 6h + Matriz Excel lunes 8 AM | **Núcleo de Negocio** (Máxima rentabilidad operativa concierge) |
| **Avanzado** | **Plan Corporativo** | **$350 USD** | **$149 USD / mes** | Hasta 3 números | Hasta 60 keywords / Nacional completa | WhatsApp multi-agente + Excel semanal + Soporte prioritario | **Anclaje Psicológico** (Hace ver $80 como una ganga) |

*Todos los valores son más IVA según normativa del SRI (15% en Ecuador). Factura electrónica deducible al 100%.*

---

### 2. Por Qué No Publicar los 3 Planes en la Landing Hoy (Realidad Técnica)

1. **Plan $49 ("resumen diario 1 vez al día"):** Hoy el workflow de GitHub corre cada 6 horas globalmente. Prometer cadencia diaria independiente por cliente requeriría un cron diferenciado por cliente que hoy no existe.
2. **Plan $49 ("10 keywords / 1 provincia"):** Hoy existe un archivo `rubros.yaml` centralizado. La parametrización multi-tenant por cliente se construye en S5 cuando tengamos clientes pagando.
3. **Plan $149 ("múltiples números de WhatsApp"):** El envío actual despacha al canal configurado de forma unitaria. Enviar a 3 destinatarios simultáneos de forma segmentada requiere cola de mensajería multi-destino.
4. **Plan $149 ("histórico de adjudicaciones de competencia"):** Los datos brutos están en Turso libSQL, pero la plantilla analítica comparativa no está paquetizada como producto autónomo.

> **Conclusión Estratégica:** Prometer 3 columnas en la web hoy violaría el principio de veracidad técnica de S4.2. La web muestra el Plan Estándar ($80 + $200), respaldado al 100% por nuestra infraestructura actual.

---

### 3. Tácticas de Conversación en WhatsApp

#### Táctica A: El Anclaje de Valor ($149 &rarr; $80)
Cuando el prospecto pregunte precios en la primera llamada o mensaje de WhatsApp:

> *"Nuestros clientes corporativos con múltiples equipos de ventas contratan el plan integral de $149/mes. Sin embargo, para empresas que necesitan monitorear de forma quirúrgica su rubro específico en ferretería o materiales, diseñamos el **Plan Estándar B2B a solo $80/mes**, que te da alertas en menos de 15 minutos a tu WhatsApp y la matriz consolidada de los lunes."*

**Efecto:** El gerente compara mentalmente contra $149 (e incluso contra los $500/mes de un asistente junior) y $80 le parece sumamente accesible.

---

#### Táctica B: El Salvavidas / Downgrade ($80 &rarr; $49)
Si el prospecto muestra interés real tras la prueba gratis de 15 días pero frena la compra diciendo que *"el presupuesto de este trimestre está ajustado"*, se activa el guion de rescate:

> *"Estimado [Nombre], entiendo completamente la situación de flujo comercial de este mes. No quiero que dejen de ver las licitaciones grandes del Cuerpo de Ingenieros o los GADs por un tema presupuestario.*  
>  
> *Te propongo algo excepcional: te puedo habilitar nuestro **Plan Esencial a $49/mes**, cubriendo tus 10 productos estrella y tu provincia principal, entregándote la matriz ejecutiva en Excel todos los lunes y las alertas vía Telegram/Email. Con un solo contrato de $10,000 que ganes, el servicio se paga solo por más de 15 años.*  
>  
> *¿Te parece si cerramos con esa opción y en 3 meses cuando cierren la primera licitación evaluamos subir al plan completo?"*

**Efecto:** Rescatas una venta de $49/mes ($588/año) con cero churn, manteniendo el margen concierge intacto.

---

#### Táctica C: La Cláusula Flexible en el Contrato
El contrato de servicio (`docs/contrato_servicio.md`) y los términos en web (`landing/legal/terminos.html`) ya cuentan con la redacción flexible unificada:

> *"Las tarifas aplicables se regirán según el Plan Comercial vigente, seleccionado por EL CLIENTE en su Propuesta Comercial o Anexo de Onboarding, siendo el Plan Estándar B2B: configuración inicial de USD 200.00 única y suscripción mensual de USD 80.00 más impuestos de ley."*

**Ventaja:** Si negocias $49 o descuentas el setup a $100 para cerrar a un cliente clave, **no necesitas modificar el contrato marco**. Solo colocas el valor acordado en el Anexo de Onboarding y el contrato sigue siendo 100% válido.

---

### 4. KPI Operativo de Esta Semana

* **Objetivo de la semana:** NO es cobrar de inmediato, sino lograr que **5 gerentes de empresas proveedoras del Estado digan:**  
  *"Sí, configúrame la prueba gratis de 15 días con mis palabras clave."*
* Con 5 pilotos activos de 15 días:
  * Conversión esperada al cierre: 2 a 3 clientes pagando ($160 - $240/mes MRR inicial).
  * Menos de 20 minutos semanales de atención concierge.
  * Flujo positivo inmediato frente a costos de infraestructura ($0 - $3 USD/mes).
