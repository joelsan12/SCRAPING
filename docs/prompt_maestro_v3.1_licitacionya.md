# Prompt Maestro v3.1 — LicitaciónYa

**Estado:** Fases 0, 1 y 2 prellenadas. Fases 3-5 no iniciadas.
**Fecha:** 25/10/2026
**Alcance de esta entrega:** landing comercial y portal de clientes. El pipeline SERCOP se trata como dependencia funcional, no como superficie de diseño.
**Regla de avance:** no se implementa nada hasta recibir `APRUEBO FASE 2`.

---

## 0. Contrato de trabajo

Este documento aplica el Prompt Maestro v3.1 al proyecto LicitaciónYa. No reemplaza la conversación: la ordena.

### Etiquetas

- `REQUISITO`: lo pidió el negocio o está en un documento del repo. No implica que esté implementado.
- `HECHO`: verificado en código, configuración, archivo o ejecución. Incluye ruta y línea cuando aplica.
- `SUPUESTO`: no está confirmado. Tiene impacto y forma de validación.
- `NO VERIFICADO`: no se pudo comprobar en esta sesión. No es un aprobado.
- `RIESGO`: hallazgo que puede afectar dinero, confianza, seguridad, legalidad o la tarea principal.
- `PROPUESTA`: decisión de diseño pendiente de aprobación.

### Reglas

1. No se inventan usuarios, métricas, testimonios, logos, permisos ni reglas de negocio.
2. Un `HECHO` exige evidencia reproducible. Lo que solo dice un documento es `REQUISITO`, no `HECHO`.
3. Máximo 5 preguntas bloqueantes por fase. Lo no bloqueante se asume y se registra.
4. No se avanza de fase sin `APRUEBO FASE X`.
5. No se toca autenticación, permisos, contratos de API, validaciones, datos ni configuración sin autorización escrita.
6. `NO VERIFICADO` exige método, responsable y siguiente paso.
7. Las decisiones visuales de Fase 2 son `PROPUESTA` hasta aprobación.
8. No se declara terminado nada que tenga un blocker abierto.

### Puertas

| Fase | Artefacto | Gate |
|---|---|---|
| 0 | Ficha, baseline y listas de cambio | `APRUEBO FASE 0` |
| 1 | Diagnóstico landing y portal | `APRUEBO FASE 1` |
| 2 | Dirección de arte y sistema visual | `APRUEBO FASE 2` |
| 3 | Sistema de diseño y comportamiento | `APRUEBO FASE 3` |
| 4 | Implementación por incrementos | `APRUEBO FASE 4` |
| 5 | Auditoría y entrega final | `APRUEBO CIERRE` |

---

## 1. Fase 0 — Encabezado, baseline y control de cambios

### 1.1 Ficha de encuadre

| Campo | Valor | Etiqueta / fuente |
|---|---|---|
| Proyecto / marca | LicitaciónYa Ecuador | `HECHO` — `landing/index.html`, footer; `README.md` |
| Prestador | J2S Dynamics, RUC 0941822801001, Guayaquil, Ecuador | `HECHO` — `landing/index.html` línea 1032; `landing/portal.html` línea 249 |
| Tipo principal | Landing B2B de conversión + portal SaaS de cliente | `HECHO` — estructura del repo |
| Superficies secundarias | Pipeline SERCOP, alertas WhatsApp/Telegram, reporte Excel, API Cloudflare Pages Functions | `HECHO` — `README.md`, `functions/api/`, `src/` |
| Estado | Existente, con deploy canónico declarado en `https://licitacionya.pages.dev` | `HECHO` — canonical en `landing/index.html` línea 13; `SUPUESTO` que el deploy actual coincide con el repo |
| Stack | HTML/CSS/JS estático; build Node; Cloudflare Pages + Functions; Turso; Supabase schema; Python; Resend; Evolution API; Telegram; GitHub Actions | `HECHO` — `package.json`, `wrangler.jsonc`, `functions/`, `src/`, `supabase/schema.sql` |
| Comandos | `npm run build`, `npm run dev`, `npm run dev:pages`, `npm test`, `python -m src.main --rubro ferreteria_construccion --pages 1`, `python -m src.reporte --rubro ferreteria_construccion --demo` | `HECHO` — `package.json`, `README.md` |
| Entregable de esta sesión | Fases 0-2 completas; sin implementación | `REQUISITO` — alcance acordado |
| Usuario primario | Gerente general o director comercial de distribuidores de ferretería, materiales de construcción y suministros industriales en Ecuador | `REQUISITO` — `docs/propuesta_comercial.md` líneas 6-11 y 59; `docs/guion_venta.md` línea 66 |
| Usuario secundario | Asistente o vendedor que busca licitaciones y revisa WhatsApp/Excel | `SUPUESTO` — no hay evidencia de quién opera el día a día |
| Decisión principal | Landing: iniciar el piloto de 15 días. Portal: decidir qué oportunidad revisar y cotizar | `HECHO` — CTA del landing; `SUPUESTO` — tarea real del portal |
| Métrica de “mejor” | Landing: tasa de activación de piloto. Portal: primera oportunidad relevante revisada. Negocio: 5 pilotos por semana y 2-3 conversiones | `REQUISITO` — `docs/tarifas.md` líneas 64-71; `NO VERIFICADO` — línea base |
| Restricciones | Ecuador, USD, IVA, español, UTC-5 (ECT), LOPDP, LOSNCP, OCDS; móvil para WhatsApp; escritorio para Excel | `REQUISITO` — landing, docs y contrato; `SUPUESTO` — tarifa de IVA vigente del 15 % |
| Capacidades de esta sesión | Leer código, ejecutar tests, medir archivos, levantar servidor local; sin navegador interactivo, sin credenciales de producción, sin analytics | `HECHO` — tests ejecutados; `NO VERIFICADO` — capturas, LCP y producción |
| Deploy actual | No verificado contra el repo | `NO VERIFICADO` — requiere acceso a Cloudflare Pages o URL publicada |

### 1.2 Baseline medido

| Elemento | Valor | Etiqueta |
|---|---|---|
| Tests | 11 pasan en 1.30 s (`npm test`) | `HECHO` — ejecución del 25/10/2026 |
| Peso total de `landing/` | 547.202 bytes en 64 archivos; incluye muestras `.xlsx`, `og-image.png` y fuentes | `HECHO` — medición con `Get-ChildItem` |
| CSS | 112.673 bytes en 17 archivos | `HECHO` — medición |
| JS | 40.001 bytes en 12 archivos | `HECHO` — medición |
| HTML landing | 1.263 líneas; generado desde `landing/sections/` | `HECHO` — `index.html`; `scripts/build_landing.js` |
| Portal | 255 líneas de HTML; 310 líneas de `portal.js` | `HECHO` — archivos |
| Build | No ejecutado para no reescribir `index.html` durante esta fase | `NO VERIFICADO` |
| Lighthouse / LCP / CLS / INP | No medidos | `NO VERIFICADO` — requiere navegador o Lighthouse |
| Analytics | No se encontró gtag, GTM, Plausible, Matomo, PostHog, Hotjar, Clarity ni píxeles | `HECHO` — búsqueda en `landing/` |
| Documentación vs código | `README.md` dice 9 tests; hay 11. `docs/checklist_lanzamiento.md` dice 6 botones `wa.me`; no hay ninguno en el HTML actual | `HECHO` — código y medición |

### 1.3 Control de cambios

#### PUEDE CAMBIAR

- Composición, orden de secciones, jerarquía y copy no normativo de `landing/index.html` y `landing/sections/*.html`.
- Tokens visuales, tipografía, espaciado, radios, sombras y movimiento en `landing/css/*`.
- Componentes de presentación y comportamiento visual en `landing/js/*`, sin alterar contratos de API.
- Presentación del portal en `landing/portal.html` y `landing/css/portal.css`.
- Etiquetas de navegación, mockups de WhatsApp/Excel, tablas comparativas y calculadora ROI.
- Tipografías y pesos, con presupuesto de rendimiento y justificación.
- Documentos de diseño y QA en `docs/`.

#### DEBE PRESERVARSE

- Contratos de `/api/register` y `/api/client`: campos, códigos de estado y forma de respuesta.
- Validaciones: RUC de 13 dígitos, provincia 1-24 o 30, WhatsApp de al menos 9 dígitos, email, últimos 4 dígitos.
- Oferta: 15 días de prueba, USD 80 + IVA al mes, sin setup, sin permanencia mínima, factura SRI.
- Textos legales y enlaces: LOPDP, LOSNCP, OCDS, “no representa oficialmente al SERCOP”.
- Pipeline: `src/main.py`, `src/matcher.py`, `src/notify.py`, `config/rubros.yaml` y sus reglas de negocio.
- Modelo de datos: `procesos`, `alertas`, `leads`.
- Horarios: monitoreo cada 6 horas y reporte lunes 08:00 ECT.
- SEO: canonical, Open Graph, Twitter Card y JSON-LD, salvo autorización.
- Scripts de `package.json` y flujo de build.

#### REQUIERE AUTORIZACIÓN

- Mecanismo de autenticación, sesión, cierre de sesión, CORS, rate limiting, RLS y almacenamiento de PII.
- Persistencia de keywords y filtros por cliente; arquitectura multi-tenant; umbrales y cobertura geográfica por cliente.
- Precio, prueba, garantía, términos comerciales y cualquier claim numérico.
- Analítica, cookies, píxeles o herramientas de terceros.
- Dependencias nuevas, familias tipográficas nuevas, cambios de build o de despliegue.
- Estructura de URLs, dominio canónico y redirecciones.
- `functions/*`, `supabase/*`, `src/*`, `.github/workflows/*`, `.env` y secretos.

### 1.4 Preguntas bloqueantes de Fase 0

1. ¿El deploy de producción ejecuta exactamente este repo, incluidos `functions/api/client.js` y `functions/api/register.js`?
2. ¿La promesa comercial es “alerta cada 6 horas” o “alerta en menos de 15 minutos”? No se pueden sostener las dos.
3. ¿La calibración por cliente —keywords, provincia, monto— está en el alcance de esta fase o se mantiene el perfil global?
4. ¿Se autoriza revisar autenticación, sesión, CORS, RLS y PII? Sin esa autorización, el portal no se puede considerar seguro y la Fase 4 se limita a la capa visual.
5. ¿La conversión principal es el formulario de piloto o una conversación por WhatsApp? El código y la documentación no coinciden.

---

## 2. Fase 1 — Diagnóstico: landing

### 2.1 Usuario y contexto

- `REQUISITO` El comprador objetivo es el gerente general o director comercial de empresas proveedoras de ferretería, construcción y suministros industriales en Ecuador (`docs/propuesta_comercial.md` líneas 6-11 y 59; `docs/guion_venta.md` línea 66).
- `SUPUESTO` La persona que realmente busca, filtra y decide es un asistente o vendedor, no el gerente. Los documentos hablan del gerente como comprador, pero no describen al operador diario.
- `HECHO` La landing se dirige a gerentes y promete “usted no entra a ninguna página” (`docs/guion_venta.md` línea 33), pero el CTA principal abre un formulario y un portal (`landing/index.html` líneas 177-183 y 1145-1257). Es una contradicción de experiencia que hay que resolver.
- `SUPUESTO` El uso es mixto: móvil desde WhatsApp para enterarse y escritorio para revisar el Excel y decidir. No hay analítica que lo confirme.
- `SUPUESTO` La frecuencia de visita a la landing es baja: una vez durante la consideración, no a diario.

### 2.2 Tarea principal y decisión

- `REQUISITO` La tarea es entender el servicio y activar el piloto de 15 días (`landing/index.html` líneas 171-187 y 834-895).
- `HECHO` El CTA principal abre un modal con empresa, RUC, rubro, WhatsApp y email; el formulario valida RUC de 13 dígitos y provincia 1-24/30 (`landing/js/modal.js` líneas 97-135; `functions/api/register.js` líneas 28-52).
- `HECHO` No hay CTA `wa.me` en el HTML actual; la búsqueda en `landing/` no devuelve coincidencias. El `README.md` y `docs/checklist_lanzamiento.md` dicen que hay 6 botones de WhatsApp, pero están desactualizados.
- `HECHO` El modal muestra “Piloto Activado con Éxito” aunque `/api/register` falle o no esté disponible (`landing/js/modal.js` líneas 171-223). El registro se guarda en `localStorage` y el usuario cree que quedó activo.
- `SUPUESTO` Pedir RUC y cinco campos en el primer contacto puede reducir la conversión frente a un CTA de WhatsApp o un formulario de dos pasos. No hay prueba A/B.
- `PROPUESTA` Decidir una sola acción primaria: “Iniciar piloto” con formulario corto o “Hablar por WhatsApp” con calificación previa. No ambas compitiendo.

### 2.3 Información necesaria para decidir

- `REQUISITO` El usuario necesita saber qué se monitorea, cada cuánto, qué recibe, cuánto cuesta, qué pasa después del piloto y con qué base legal se hace (`landing/index.html`: hero, precios, FAQ; `docs/propuesta_comercial.md`).
- `HECHO` La landing muestra: cada 6 horas, 24 provincias, hasta 30 keywords, USD 80 + IVA, 15 días gratis, factura SRI, estándar OCDS y ejemplos de procesos.
- `HECHO` El enlace “Ver pliego” del radar es `href="#"` (`landing/index.html` línea 274). Los demás “Ver pliego” son texto o celdas de mockup sin enlace. La promesa de trazabilidad no se puede comprobar desde la landing.
- `HECHO` No hay timestamp de última actualización. “Actualizado cada 6h” y “Radar Activo 24/7” son etiquetas estáticas (`landing/index.html` líneas 227-230; footer líneas 1026-1029).
- `NO VERIFICADO` Los procesos de ejemplo —CELEC EP, EEASA, CNEL EP, EPMMOP— no tienen enlace, fecha de consulta ni estado actual en la landing. No se puede afirmar que sigan vigentes.
- `HECHO` La tabla de Excel se presenta como “Código Real” (`landing/index.html` línea 564), pero no ofrece enlace ni fuente verificable.

### 2.4 Reglas de negocio

- `REQUISITO` Precio de USD 80 + IVA al mes, sin setup, sin permanencia, 15 días gratis, dos reportes y factura electrónica SRI (`landing/index.html` líneas 826-895; `docs/propuesta_comercial.md` líneas 37-53).
- `REQUISITO` Cobertura nacional de 24 provincias, hasta 30 keywords y filtros por provincia o cantón (`landing/index.html`; `docs/anexo_configuracion.md` líneas 15-50).
- `REQUISITO` Alertas por WhatsApp y Telegram, más un Excel consolidado los lunes a las 08:00 (`landing/index.html`; `README.md`).
- `HECHO` El pipeline actual usa un solo perfil global en `config/rubros.yaml`: un rubro, 30+ keywords, `monto_minimo: 500` y `regiones_interes: []` (todas). Rota 8 keywords por ciclo y despacha a un solo `EVOLUTION_TARGET_NUMBER` (`src/main.py` líneas 70-88; `src/notify.py` líneas 42-47; `config/rubros.yaml` líneas 1-40).
- `HECHO` `docs/tarifas.md` reconoce que la arquitectura multi-cliente (S5) no está construida y que la web debe mantener el Plan Estándar (`docs/tarifas.md` líneas 4 y 20-27).
- `RIESGO CRÍTICO` La landing promete calibración por cliente, hasta 30 keywords y filtros geográficos, pero el portal guarda las keywords solo en `localStorage` y no las envía al pipeline (`landing/js/portal.js` líneas 232-240 y 299-308). La promesa supera la capacidad actual.
- `RIESGO` La landing afirma “menos de 15 min” de tiempo promedio de alerta (`landing/index.html` líneas 340-343), pero el ciclo es cada 6 horas. No se puede garantizar 15 minutos desde la publicación.
- `NO VERIFICADO` “+4.200 licitaciones al mes”, “+USD 18,5 M”, “12 horas ahorradas por semana” y “68 % / 58 de 111 procesos” no tienen fuente, consulta ni fecha en el repo (`landing/index.html` líneas 330-347; `docs/guion_venta.md` línea 41).
- `RIESGO` La landing califica el riesgo de perder pliegos como “Nulo” (`landing/index.html` líneas 656-659). Es una promesa absoluta que no se puede sostener.
- `HECHO` La documentación comercial y el producto divergen: `README.md` y `docs/checklist_lanzamiento.md` describen botones de WhatsApp que ya no existen; el CTA actual es un formulario.

### 2.5 Roles y permisos

- `HECHO` La landing es pública, sin autenticación (`landing/index.html`).
- `HECHO` El portal autentica con RUC y últimos 4 dígitos del WhatsApp; no hay roles ni sesión de servidor; el cliente se guarda en `localStorage` (`landing/js/portal.js` líneas 84-136 y 299-308).
- `HECHO` `/api/client` devuelve empresa, RUC, WhatsApp, email, rubro, plan y estado; permite CORS `*` y no muestra rate limiting (`functions/api/client.js` líneas 6-15 y 53-115).
- `HECHO` `supabase/schema.sql` habilita RLS pero define políticas `USING (true)` y `WITH CHECK (true)` para `procesos` y `alertas` (`supabase/schema.sql` líneas 43-58). Si se usa con anon key, no hay aislamiento.
- `SUPUESTO` Hay un solo usuario por empresa. No hay evidencia de necesidad de roles separados para gerencia, ventas o facturación.
- `RIESGO` El “secreto” de acceso son los últimos 4 dígitos del WhatsApp y se envía en claro en el correo de bienvenida (`functions/api/register.js` líneas 185-188). Es un dato débil y reutilizable.

### 2.6 Métrica de éxito

- `REQUISITO` El objetivo comercial es 5 pilotos activos por semana y 2-3 conversiones, con MRR inicial de USD 160-240 (`docs/tarifas.md` líneas 64-71).
- `PROPUESTA` La métrica principal de la landing debe ser activación de piloto: formulario completado y confirmado por el backend, dividido por visitantes únicos.
- `PROPUESTA` Métricas secundarias: costo por piloto, activación a primera alerta, retención a 15 días, LCP móvil y peso de página.
- `NO VERIFICADO` No hay analytics ni línea base de conversión, rebote, LCP o peso. Cualquier afirmación de “mejor” hoy es opinión.

### 2.7 Problemas actuales

1. **Promesa vs capacidad.** Keywords por cliente, cobertura geográfica y cadencia de 15 minutos no están respaldadas por el pipeline actual.
2. **Prueba social y datos sin fuente.** Cuatro cifras grandes y una tabla “Código Real” sin enlace, fecha ni consulta.
3. **Enlaces muertos.** El “Ver pliego” del radar no lleva a ningún sitio.
4. **Falso positivo de registro.** El modal muestra éxito aunque la API falle; el usuario queda sin servicio y sin saberlo.
5. **Autenticación y PII.** RUC + 4 dígitos, CORS abierto, `localStorage` y RLS abierto son riesgos de seguridad, no detalles visuales.
6. **Inconsistencia de marca.** Landing claro y corporativo; portal oscuro y “dark luxury”. Parecen dos productos.
7. **Patrones genéricos.** Hero partido, franja de 4 KPIs idénticos, 3 tarjetas de pasos, pills, CTA con gradiente verde y tarjetas con iconos. No diferencian a LicitaciónYa de un SaaS cualquiera.
8. **CTA diluido.** “Probar gratis”, “Portal Clientes”, “Calcular ROI” y los anclajes de navegación compiten en la misma pantalla.
9. **Formulario largo.** RUC obligatorio y cinco campos antes de demostrar valor.
10. **Documentación desactualizada.** Tests, CTAs y estilo descritos en README/checklist no coinciden con el código.

### 2.8 Requisitos no funcionales

- `REQUISITO` Móvil primero para el tráfico que llega desde WhatsApp; CTA visible sin scroll a 360 × 800.
- `REQUISITO` Accesibilidad WCAG 2.2 AA: foco visible, teclado, etiquetas, errores, contraste, zoom 200 % y reflow a 320 px.
- `PROPUESTA` Presupuesto de landing: LCP ≤ 2,5 s (objetivo 2,0 s en móvil), CLS ≤ 0,1, INP ≤ 200 ms, JS inicial ≤ 100 KB gzip, peso total ≤ 500 KB sin descargas, máximo 2 familias y 4 pesos.
- `HECHO` Las fuentes son autoalojadas y no hay dependencias externas visibles en el HTML (`landing/css/fonts.css`; `landing/index.html`).
- `HECHO` El CSS y el JS están modularizados; el build ensambla secciones (`scripts/build_landing.js`).
- `NO VERIFICADO` LCP, CLS, INP, peso transferido real, comportamiento en 3G/4G y rendimiento del portal.
- `REQUISITO` Legal: LOPDP, LOSNCP, OCDS, no representar oficialmente al SERCOP.
- `REQUISITO` Idioma español Ecuador; moneda USD; fechas y horas consistentes; zona horaria ECT.

### 2.9 Fuera de alcance de esta fase

- Nuevos planes, precios o garantías.
- Implementación multi-tenant o cambios de pipeline.
- Pasarela de pagos, facturación automática o CRM.
- Nuevo sistema de autenticación.
- Rediseño de la marca desde cero.
- Asesoría legal o validación de cumplimiento.

### 2.10 Matriz de requisitos, supuestos y riesgos

| ID | Tipo | Enunciado | Evidencia | Estado |
|---|---|---|---|---|
| R1 | Requisito | La landing debe explicar el servicio y permitir iniciar el piloto | `landing/index.html` | Implementado, no probado con usuarios |
| R2 | Requisito | Debe mostrar precio, prueba, cancelación y facturación | `landing/index.html` | Implementado |
| R3 | Requisito | Debe mostrar fuente, fecha y enlace al pliego | Copy y mockups | Parcial: enlaces muertos |
| R4 | Requisito | Debe ser usable en móvil y accesible | Prompt y WCAG | No verificado |
| R5 | Requisito | Debe haber alertas cada 6 h y Excel lunes 8 AM | `README.md`, workflows | Implementado según docs; no verificado en producción |
| R6 | Requisito | Hasta 30 keywords y filtros por provincia | Landing y anexo | No implementado por cliente |
| R7 | Requisito | RUC, WhatsApp y email válidos | `functions/api/register.js` | Implementado |
| R8 | Requisito | Legalidad LOPDP/LOSNCP/OCDS | Landing y docs | Textos presentes; no validados legalmente |
| S1 | Supuesto | El gerente es el operador diario | Docs | No confirmado |
| S2 | Supuesto | El formulario convierte mejor que WhatsApp | Ninguna | No confirmado |
| S3 | Supuesto | La calibración por cliente está en alcance | Docs comerciales | No confirmado; el código no la tiene |
| S4 | Supuesto | La landing se visita desde móvil | Ninguna | No confirmado |
| S5 | Supuesto | Producción coincide con el repo | Deploy canonical | No confirmado |
| S6 | Supuesto | El IVA vigente es 15 % | `docs/tarifas.md` | No confirmado con contabilidad |
| S7 | Supuesto | Hay datos reales para reemplazar las cifras | Pipeline | No confirmado |

### 2.11 Preguntas bloqueantes de la landing

1. ¿La promesa es 6 horas o menos de 15 minutos?
2. ¿La conversión principal es el formulario o WhatsApp?
3. ¿Qué cifras se pueden publicar con fuente y fecha, y cuáles se retiran?
4. ¿La calibración por cliente se implementará ahora o se retira de la promesa?
5. ¿Se autoriza cambiar el flujo de registro para que no muestre éxito si la API falla?

### 2.12 Criterio de aceptación de Fase 1 — landing

- [x] Usuario, tarea, decisión y contexto identificados.
- [x] Reglas de negocio y permisos documentados.
- [x] Métrica de éxito propuesta y línea base marcada como no verificada.
- [x] Problemas actuales con evidencia.
- [x] Requisitos no funcionales y fuera de alcance.
- [x] Supuestos y riesgos con validación.
- [ ] Las 5 preguntas bloqueantes respondidas o aceptadas como riesgo.

---

## 3. Fase 1 — Diagnóstico: portal de clientes

### 3.1 Usuario y contexto

- `REQUISITO` El portal se presenta como “Panel de administración y gestión de alertas SERCOP para clientes corporativos” (`landing/portal.html` líneas 6-7).
- `SUPUESTO` El usuario es el gerente o administrador que contrató el piloto; no hay evidencia de un rol de analista o de facturación.
- `SUPUESTO` El uso principal es semanal, para revisar el reporte y ajustar canales; diario durante una convocatoria activa. No hay analítica.
- `SUPUESTO` Se usa en escritorio para revisar y en móvil para consultas rápidas.

### 3.2 Tarea principal y decisión

- `HECHO` El portal actual permite: iniciar sesión, ver empresa/RUC/rubro/plan/días restantes, editar WhatsApp y email, activar canales, agregar o quitar keywords y descargar dos Excel de muestra (`landing/portal.html` líneas 46-242).
- `HECHO` No hay lista de oportunidades, historial de alertas, detalle de proceso, enlace al pliego, filtros ni acciones de triage. La tarea principal del producto —decidir a qué licitación responder— no está en el portal.
- `SUPUESTO` Si el portal es solo configuración y la tarea ocurre en WhatsApp/Excel, no debería llamarse “Panel de Radar” ni “dashboard”. Hay que decidir si se convierte en radar o se reposiciona como “Configuración de cuenta”.
- `PROPUESTA` Si el portal conserva el nombre de radar, la pantalla de inicio debe ser la lista de oportunidades, no los ajustes.

### 3.3 Información necesaria

- `HECHO` El portal muestra empresa, RUC, rubro, plan, días restantes, canales, keywords y reportes de muestra.
- `HECHO` No muestra última ejecución del pipeline, próxima ejecución, estado de entrega, errores, oportunidades nuevas ni fuente de datos.
- `HECHO` “Radar Activo (24/7)” es un indicador estático; no lee el estado real del pipeline (`landing/portal.html` líneas 32-35).
- `HECHO` “Semana 44” está escrita a mano (`landing/portal.html` línea 198). Puede quedar obsoleta en cualquier momento.
- `HECHO` Los reportes son muestras etiquetadas como ejemplo; es correcto. Pero no hay reporte real del cliente ni historial de entregas.
- `HECHO` No hay estado de cuenta, facturas, método de pago ni opción de cancelar.

### 3.4 Reglas de negocio

- `REQUISITO` Hasta 30 keywords, canales WhatsApp/email, reporte lunes 08:00, plan USD 80 + IVA y piloto de 15 días (`landing/portal.html`; `docs/propuesta_comercial.md`).
- `HECHO` El botón “+ Agregar” no impone el límite de 30 (`landing/js/portal.js` líneas 280-296); el texto “Hasta 30 términos” es solo informativo (`landing/portal.html` línea 161).
- `HECHO` No hay validación de duplicados case-insensitive; solo compara la cadena exacta con `includes`.
- `HECHO` Los cambios de canales y keywords se guardan en `localStorage` (`landing/js/portal.js` líneas 232-240 y 299-308). No existe endpoint de actualización y el pipeline no lee esos datos.
- `RIESGO CRÍTICO` El cliente cree que calibra su radar, pero no cambia nada en el servidor. Es una promesa de producto incumplida, no un detalle de UI.
- `HECHO` El plan y los días restantes se calculan a partir de `created_at` (`functions/api/client.js` líneas 106-110). No hay lógica de pago, renovación o cancelación.
- `HECHO` El portal no tiene roles, auditoría, rate limiting, recuperación de acceso ni sesión de servidor. “Cerrar sesión” solo borra `localStorage` (`landing/js/portal.js` líneas 146-153).
- `HECHO` `/api/client` autentica con RUC + 4 dígitos, devuelve PII y permite CORS `*` (`functions/api/client.js` líneas 6-15 y 53-115).
- `HECHO` Si `/api/client` falla, el frontend cae a `localStorage` y permite entrar con datos locales (`landing/js/portal.js` líneas 41-57 y 84-136).
- `HECHO` `/api/register` responde éxito aunque Turso o Resend fallen (`functions/api/register.js` líneas 138-145, 225-228 y 230-234).
- `HECHO` `supabase/schema.sql` deja RLS abierto (`supabase/schema.sql` líneas 43-58). `SUPUESTO` que producción usa Turso, no Supabase; hay que confirmarlo.

### 3.5 Roles y permisos

- `HECHO` No hay roles. Todos los usuarios de una empresa ven y editan todo.
- `HECHO` No hay panel de administrador interno; la operación se hace por CLI y base de datos.
- `SUPUESTO` Se necesita al menos un rol “propietario” y otro “analista” si el equipo comercial va a revisar oportunidades.
- `RIESGO` Sin roles ni auditoría no se puede saber quién cambió canales, keywords o datos de la cuenta.
- `RIESGO` El acceso depende de un secreto débil y reutilizable; no hay segundo factor ni recuperación segura.

### 3.6 Métrica de éxito

- `PROPUESTA` Activación: primer inicio de sesión en 24 horas.
- `PROPUESTA` Valor: primera oportunidad revisada, primer reporte descargado, primera calibración guardada en servidor.
- `PROPUESTA` Retención: uso en la semana 2 y conversión al día 15.
- `PROPUESTA` Operación: porcentaje de clientes con canales válidos, alertas entregadas, errores de envío y tickets de soporte.
- `NO VERIFICADO` No hay línea base ni instrumentación.

### 3.7 Problemas actuales

1. **No es un radar.** Es una pantalla de configuración sin oportunidades, historial ni triage.
2. **Persistencia falsa.** Las keywords y canales se guardan solo en el navegador; el pipeline no los recibe.
3. **Estado falso.** “Radar Activo 24/7” no refleja la última ejecución ni los errores.
4. **Fecha hardcodeada.** “Semana 44” quedará obsoleta.
5. **Autenticación débil.** RUC + 4 dígitos, sin rate limit, sin sesión de servidor, con PII en `localStorage`.
6. **Sin roles ni auditoría.** No se puede operar con equipos.
7. **Sin estados.** No hay carga, vacío, error, sin permisos ni sin conexión.
8. **Inconsistencia visual.** Portal oscuro y landing clara; dos lenguajes.
9. **Sin facturación.** El plan se muestra, pero no hay facturas, renovación ni cancelación.
10. **Sin soporte contextual.** Solo un correo en el footer.

### 3.8 Requisitos no funcionales

- `REQUISITO` Seguridad: sesión, rate limiting, autorización por rol, auditoría, minimización de PII y transporte seguro.
- `REQUISITO` Accesibilidad WCAG 2.2 AA: foco, teclado, etiquetas, errores, contraste, zoom y reflow.
- `PROPUESTA` Rendimiento del portal: JS inicial ≤ 170 KB gzip, tabla de 1.000 filas sin bloquear, skeleton en lugar de spinner.
- `PROPUESTA` Responsive: mesa de trabajo en escritorio; lista y detalle a pantalla completa en móvil; filtros en hoja inferior.
- `NO VERIFICADO` Comportamiento real en móvil, teclado y lector de pantalla.

### 3.9 Fuera de alcance de esta fase

- Implementar autenticación nueva o multi-tenant.
- Construir el radar de oportunidades.
- Integrar pagos, facturación o CRM.
- Rediseñar el pipeline.
- Añadir roles sin definición de negocio.

### 3.10 Matriz de requisitos, supuestos y riesgos

| ID | Tipo | Enunciado | Evidencia | Estado |
|---|---|---|---|---|
| R9 | Requisito | El cliente debe calibrar keywords y canales | Portal | Parcial: solo `localStorage` |
| R10 | Requisito | El cliente debe ver oportunidades y su estado | Producto | No implementado |
| R11 | Requisito | El cliente debe descargar reportes reales | Portal | Solo muestras |
| R12 | Requisito | El acceso debe ser seguro y auditable | Portal/API | No cumple |
| R13 | Requisito | Debe haber roles y permisos | Producto | No implementado |
| S8 | Supuesto | Un usuario por empresa | Código | No confirmado |
| S9 | Supuesto | El portal se usa semanalmente | Ninguna | No confirmado |
| S10 | Supuesto | Producción usa Turso, no Supabase | Repo | No confirmado |
| S11 | Supuesto | El cliente acepta RUC + 4 dígitos | Código | No validado con usuarios |

### 3.11 Preguntas bloqueantes del portal

1. ¿El portal debe ser un radar operativo con lista, detalle y triage, o solo configuración?
2. ¿Se autoriza cambiar autenticación, sesión, CORS, RLS y almacenamiento de PII?
3. ¿La calibración por cliente se implementará en backend o se retira de la promesa?
4. ¿Qué roles existen y qué puede ver cada uno?
5. ¿El portal se usará en móvil? ¿Qué tarea debe poder completar en 360 px?

### 3.12 Criterio de aceptación de Fase 1 — portal

- [x] Usuario, tarea, decisión y contexto identificados.
- [x] Reglas de negocio, persistencia y permisos documentados.
- [x] Métrica de éxito propuesta y línea base marcada como no verificada.
- [x] Problemas actuales con evidencia.
- [x] Requisitos no funcionales y fuera de alcance.
- [x] Supuestos y riesgos con validación.
- [ ] Las 5 preguntas bloqueantes respondidas o aceptadas como riesgo.

---

## 4. Fase 2 — Dirección de arte

> Las decisiones de esta sección son `PROPUESTA` hasta que las apruebes. Los `HECHO` son los tokens, fuentes y piezas existentes.

### 4.1 Personalidad y emoción

**Tres adjetivos:** precisa, sobria, vigilante.

- **Precisa:** cada cifra tiene código, fuente y fecha. No hay números decorativos.
- **Sobria:** el dato ocupa el espacio; el adorno no.
- **Vigilante:** el sistema mira por el cliente, no duerme y no exagera.

**Emoción buscada en los primeros 5 segundos:** control sereno con urgencia contenida. El usuario debe pensar “esto me muestra lo que importa y puedo actuar ahora”, no “qué dashboard tan bonito” ni “me están vendiendo humo”.

### 4.2 Referencias y anti-referencias

| Referencia | Principio que se extrae | Lo que NO se copia |
|---|---|---|
| Bloomberg Terminal | Densidad con jerarquía; mono para identificadores; color solo cuando significa estado | La estética oscura de terminal, el ruido visual y la jerga financiera |
| Stripe Dashboard / Docs | B2B complejo vuelto legible; divulgación progresiva; tablas, estados vacíos y microcopy preciso | Gradientes, ilustraciones y el tono de “startup” |
| GOV.UK Design System | Lenguaje llano, formularios accesibles, resumen de errores, una tarea por pantalla | La estética administrativa y la ausencia de marca |
| The Economist / FT (observación editorial) | Autoridad por atribución de fuente, anotación de datos y ritmo de lectura | El papel salmón, la tipografía de periódico y el tono de opinión |

**Anti-referencias:**

- Landing SaaS genérica: hero centrado, gradiente, tres tarjetas de iconos.
- Dashboard cripto/fintech: neón, glassmorphism, cifras sin contexto.
- Portal gubernamental: densidad sin jerarquía, lenguaje burocrático.
- “Dark luxury” como piel: oscuro porque suena premium, no porque el dato lo necesite.
- Dashboard de logística con 12 tarjetas KPI idénticas.

### 4.3 Lo que esta marca NO es

- No es el portal oficial del SERCOP ni representa al Estado.
- No es un producto de “IA” que adivina o garantiza adjudicaciones.
- No es un dashboard para explorar datos sin una decisión.
- No es una fintech, una cripto ni un producto de inversión.
- No es un diario de noticias ni un data dump.
- No es una consultoría legal.
- No es una landing de tres tarjetas con iconos.
- No es “dark luxury” sin función.

### 4.4 Principios de diseño

1. **El dato primero.** Cada sección se ancla en un registro real o en un conteo verificable. Si no hay dato, se dice “sin datos verificados”, no se rellena.
2. **El color es estado, no decoración.** Verde = convocatoria abierta; ámbar = plazo que aprieta; gris = adjudicada; rojo = error; azul = fuente/enlace. La acción primaria va en tinta, no en verde.
3. **La procedencia se ve.** Código de proceso, entidad, monto, provincia, enlace al pliego y última verificación. Sin eso, la ficha no se publica.
4. **Densidad por tarea.** Landing editorial y de baja densidad; portal denso, de tabla y detalle. No se usa el mismo layout para vender y para operar.
5. **Una acción primaria por pantalla.** Landing: iniciar piloto. Portal: revisar oportunidad. Lo demás es secundario y visualmente subordinado.
6. **El movimiento significa estado.** Nada de barridos de radar, carruseles automáticos ni pulsos infinitos. Solo transiciones de 120-180 ms.
7. **La marca no grita.** Sin “revolucionario”, “potencia”, “IA” ni signos de exclamación. La confianza viene de la precisión.
8. **Móvil primero para WhatsApp.** El CTA se ve a 360 × 800 sin scroll; la ficha se apila; los targets son de 44 px.

### 4.5 Paleta y contraste

La landing actual es clara y corporativa (`landing/css/tokens.css` líneas 6-43); el portal es oscuro (`landing/css/portal.css` líneas 6-12). La propuesta no es elegir uno y borrar el otro: es definir **papel + panel de radar**.

| Token | Hex | Uso | Contraste verificado |
|---|---|---|---|
| `--paper` | `#F7F5EF` | Fondo principal de landing y páginas de lectura | Tinta `#0E2238`: 14,76:1 |
| `--surface` | `#FFFFFF` | Tablas, fichas, formularios | Tinta: 16,10:1 |
| `--ink` | `#0E2238` | Texto principal, CTA primaria | Sobre papel: 14,76:1 |
| `--muted` | `#475569` | Texto secundario, metadatos | Sobre papel: 6,95:1 |
| `--line` | `#D6D3C8` | Divisores decorativos | No usar como borde esencial |
| `--input-border` | `#64748B` | Bordes de inputs y controles | Sobre blanco: 4,76:1 |
| `--source` | `#1D4ED8` | Enlaces, fuente, foco | Sobre papel: 6,15:1 |
| `--open` | `#047857` | Convocatoria abierta | Sobre papel: 5,03:1; blanco sobre verde: 5,48:1 |
| `--awarded` | `#475569` | Adjudicada | Sobre papel: 6,95:1 |
| `--closing` | `#92400E` | Plazo próximo | Sobre papel: 6,50:1 |
| `--risk` | `#B91C1C` | Error, riesgo | Sobre papel: 5,93:1 |
| `--radar-bg` | `#0B1424` | Panel de radar, cabecera de datos | Texto `#F8FAFC`: 17,61:1 |
| `--radar-accent` | `#38BDF8` | Enlaces y datos dentro del panel | Sobre `#0B1424`: 8,60:1 |
| `--radar-open` | `#10B981` | Estado abierto dentro del panel | Sobre `#0B1424`: 7,26:1 |

**Decisiones:**

- **Verde no es el CTA.** Hoy el botón principal es verde (`landing/css/components/hero.css` línea 136) y el verde también significa “convocatoria abierta”. Eso crea ambigüedad. La CTA primaria pasa a tinta `#0E2238` con texto blanco; el verde queda reservado para estado.
- **Papel, no blanco puro.** El fondo `#F7F5EF` evoca expediente y reduce el brillo; el blanco puro queda para superficies de datos.
- **Panel de radar oscuro.** El portal puede seguir siendo una “sala de radar” oscura, pero el landing no se vuelve dark. El panel oscuro es un componente de datos, no la piel de toda la página.
- **Sin glassmorphism.** `backdrop-filter` en navbar y portal (`landing/css/components/navbar.css` línea 11; `landing/css/portal.css` línea 28) se retira o se limita a una cabecera sólida. Ahorra rendimiento y evita el look de plantilla.

### 4.6 Tipografía

**Familias:** conservar Plus Jakarta Sans para UI y titulares, y JetBrains Mono para identificadores, montos y fechas. No añadir una tercera familia.

- `HECHO` Ambas están autoalojadas (`landing/css/fonts.css`).
- `HECHO` Los tokens ya las declaran (`landing/css/tokens.css` líneas 46-47).
- **Razón:** una sans humanista y geométrica para lectura; una mono para datos que deben alinearse y parecer verificables. La autoridad viene de la estructura y la fuente, no de una serif de moda.
- **Rendimiento:** subset latin y latin-ext; pesos 400, 600, 700 y 800 para Jakarta; 400 y 600 para JetBrains; `font-display: swap`; precargar solo los dos archivos latin que se usan above the fold. `fonts.css` declara más subsets y pesos de los necesarios; se puede reducir sin cambiar la voz.

| Rol | Tamaño / línea | Peso | Uso |
|---|---|---|---|
| Display | 56 / 1,05 | 800 | Hero, una sola vez |
| H1 | 40-56 / 1,1 | 800 | Titular de página |
| H2 | 28-36 / 1,2 | 700 | Secciones |
| H3 | 20 / 1,3 | 700 | Fichas y subsecciones |
| Body | 16 / 1,55 | 400 | Texto |
| Small | 14 / 1,45 | 400 | Metadatos |
| Data | 13 / 1,4 | 400 / 700 | Códigos, montos, fechas |
| Label | 11 / 1,2 | 700 | Etiquetas en mayúsculas, con `0.08em` |

- Montos y cantidades: `font-variant-numeric: tabular-nums`.
- Formato de moneda: definir uno solo. Propuesta: `Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })` y sufijo `USD` cuando haya espacio. No mezclar `$1,750,208.57` con `$1.750.208,57`.
- Fechas: `DD/MM/AAAA HH:mm ECT`; no `10:14 AM` en la landing si el portal usa 24 h.

### 4.7 Forma, densidad y movimiento

- **Radios:** 4 px para chips y etiquetas, 6 px para botones e inputs, 10 px para fichas, `9999` solo para estado. Hoy hay 6/10/14/full (`landing/css/tokens.css` líneas 59-62); se reduce para parecer expediente, no app de consumo.
- **Bordes:** 1 px; sin sombras en superficies de datos. Sombra solo en modal, dropdown y drawer.
- **Densidad landing:** secciones de 96 px en escritorio y 64 px en móvil; contenedor máximo 1200 px; 12 columnas; 24 px de gutter.
- **Densidad portal:** contenedor máximo 1440 px; filas de 44 px; panel de detalle de 360-420 px; filtros en riel izquierdo.
- **Movimiento:** 120 ms para hover/foco, 180 ms para paneles; `ease-out`; sin animaciones infinitas; `prefers-reduced-motion` desactiva pulsos y transiciones no esenciales.
- **Iconos:** solo funcionales —fuente, enlace externo, alerta, filtro, descarga, estado—; no iconos de relleno en tarjetas.

### 4.8 Elemento firma: la ficha de expediente

La marca no se distingue por un gradiente ni por un logo animado. Se distingue por **cómo presenta un proceso**.

```
┌──────────────────────────────────────────────────────────┐
│ ▌ ABIERTA    SIE-CELECEP-2026-04070-238940              │
│   CELEC EP — Termopichincha · Pichincha                  │
│   Adquisición de materiales de ferretería                │
│   USD 1.750.208,57                    Ver pliego ↗       │
│   Verificado: 13/08/2026 14:00 ECT                       │
└──────────────────────────────────────────────────────────┘
```

**Anatomía:**

1. Barra de estado de 3 px a la izquierda: verde abierta, ámbar por vencer, gris adjudicada.
2. Código de proceso en JetBrains Mono, primero en la jerarquía.
3. Entidad y provincia.
4. Objeto en dos líneas máximo.
5. Monto alineado a la derecha, tabular, con `USD`.
6. Enlace real al pliego y fecha de verificación.
7. Keywords detectadas como texto secundario, no como pills de colores.

**Pruebas que debe pasar:**

- A 320 px se apila: estado + código, entidad, objeto, monto, enlace, fecha.
- Sin color se entiende: el estado se escribe, no solo se colorea.
- Sin animación se entiende.
- Se reutiliza en el hero del landing, en la alerta de WhatsApp, en la fila del portal y en las columnas del Excel.

### 4.9 Composición

#### Landing

- **Cabecera:** logo, 4 anclas máximo (“Cómo funciona”, “Rubros”, “Precio”, “Preguntas”), CTA “Iniciar piloto” y enlace secundario “Portal clientes”. Hoy hay 6 anclas, dos CTAs y un botón de portal (`landing/index.html` líneas 128-147); sobra navegación.
- **Hero asimétrico 7/5:** a la izquierda, titular y subtítulo concretos, CTA y una línea de confianza con fuente y fecha; a la derecha, panel de radar oscuro con una ficha real. Nada de tres pills flotantes.
- **Franja de datos vivos:** reemplaza los 4 KPIs idénticos (`landing/index.html` líneas 326-351) por “Última corrida: [fecha] · Procesos auditados: [n] · Oportunidades abiertas: [n] · Fuente: SERCOP OCDS”. Si no hay datos, se muestra “Sin datos verificados”.
- **Qué recibe:** una alerta de WhatsApp y un Excel, etiquetados como ejemplo, con enlace y fecha. No usar “Código Real” sin fuente.
- **Cómo decide:** línea de tiempo de 3 pasos, no tres tarjetas con iconos.
- **Cobertura y rubros:** tabla o tabs funcionales, no tarjetas de iconos.
- **Precio y piloto:** una sola tarjeta, con qué incluye, qué pasa al día 15 y cómo cancelar.
- **Prueba:** procesos reales con enlace, o “piloto en curso”. No logos ni testimonios inventados.
- **FAQ:** 6-8 preguntas, incluyendo seguridad, fuente, cancelación, cobertura y qué pasa si SERCOP falla.
- **Cierre:** la misma CTA primaria, sin nueva oferta.
- **Footer:** datos de la empresa, soporte, estado de última actualización, legal.

#### Portal

- **Barra superior:** empresa, plan, “Última sincronización: [fecha]”, cierre de sesión.
- **Inicio “Radar”:** filtros por estado, provincia, monto y keyword; lista de fichas; detalle en drawer o panel derecho. Esta es la pantalla que falta.
- **“Calibración”:** keywords, provincias, monto mínimo, fases deseadas; guardado en servidor con confirmación y auditoría.
- **“Canales”:** WhatsApp, email, toggles; validación y estado de entrega.
- **“Reportes”:** entregas reales, muestras etiquetadas, historial.
- **“Cuenta”:** plan, facturas, método de pago, cancelación, soporte.
- **Estados:**
  - Carga: skeleton de filas, no spinner de pantalla completa.
  - Vacío: “Aún no hay procesos en su radar. Próxima corrida: [fecha]. Le avisaremos a [canal].” con acción “Revisar calibración”.
  - Error: “No pudimos actualizar su radar. Última sincronización: [fecha]. Reintentar.”
  - Sin permisos: “Su rol no permite editar canales. Contacte al administrador.”
  - Éxito: confirmación en línea con fecha y hora, no un toast que desaparece.
  - Sin conexión: banner persistente y datos de la última sincronización.
- **Estado real del radar:** “Activo” solo si la última corrida fue hace menos de 8 h; “Demorado” en ámbar si fue entre 8 y 24 h; “Sin actualizar” en rojo si supera 24 h. Reemplaza el “Radar Activo 24/7” estático.
- **Móvil:** lista a pantalla completa, detalle a pantalla completa, filtros en hoja inferior, CTA fija de “Revisar” o “Descartar”.

### 4.10 Tono de voz y copy

**Principios:** directo, verificable, sin hype. Frases cortas. Verbos concretos: detectar, filtrar, verificar, avisar, decidir, cotizar. Nada de “potencia”, “revoluciona”, “transforma”, “sinergia”, “IA” ni “líder”.

**Ejemplos:**

- H1 actual: “Sepa de cada licitación SERCOP antes que su competencia”.
  - Problema: “cada” promete más de lo que el filtro puede entregar.
  - Propuesta: “Las licitaciones de su rubro que importan, antes de que cierre el plazo.”
- Subhead actual: “Auditoría algorítmica continua de compras públicas cada 6 horas…”
  - Propuesta: “Auditamos la API oficial del SERCOP cada 6 horas. Recibe una ficha con código, entidad, monto, provincia y enlace al pliego; y un Excel cada lunes a las 8:00.”
- CTA actual: “Comenzar Prueba Gratuita (15 Días)”.
  - Propuesta: “Iniciar piloto de 15 días”.
- Confianza: “Datos oficiales OCDS · Última corrida: 25/10/2026 14:00 ECT · Sin tarjeta”.
- Precio: “USD 80 + IVA al mes. Sin setup. Sin permanencia.”
- Error de RUC: “El RUC debe tener 13 dígitos. Verifíquelo en su factura o en el SRI.”
- Vacío del portal: “Aún no hay procesos en su radar. La próxima corrida es a las 18:00 ECT. Le avisaremos a su WhatsApp.”

**Reglas de evidencia en copy:**

- Cada número lleva fuente y fecha, o se retira.
- Cada ejemplo lleva enlace al pliego y fecha de verificación, o se etiqueta “ejemplo ilustrativo”.
- No se usan testimonios, logos, certificaciones ni cifras de mercado sin autorización y evidencia.

### 4.11 Qué se conserva, qué se retira y qué se prueba

**Conservar:**

- Metáfora del radar y el logo.
- Casos de proceso reales, si se verifican.
- Previews de WhatsApp y Excel, si se etiquetan como ejemplo.
- Transparencia de precio y FAQ.
- Enlaces legales y aviso de no representación oficial.
- Plus Jakarta Sans + JetBrains Mono.

**Retirar o reemplazar:**

- Franja de 4 KPIs con cifras sin fuente (`landing/index.html` líneas 330-347).
- Franja tricolor amarillo/azul/rojo de la navbar (`landing/css/components/navbar.css` líneas 24-26); no aporta significado de marca.
- CTA verde con gradiente (`landing/css/components/hero.css` línea 136); el verde pasa a estado.
- “Radar Activo 24/7” estático (`landing/portal.html` líneas 32-35).
- “Semana 44” hardcodeada (`landing/portal.html` línea 198).
- “Riesgo nulo” (`landing/index.html` líneas 656-659).
- “Código Real” sin enlace (`landing/index.html` línea 564).
- Glassmorphism y `backdrop-filter` decorativo.
- Exceso de pills, iconos de relleno y tarjetas idénticas.

**Probar:**

- CTA visible a 360 × 800 sin scroll.
- Ficha a 320 px.
- Contraste de todos los pares texto/fondo.
- Navegación solo con teclado y foco visible.
- `prefers-reduced-motion`.
- LCP y peso con caché fría y throttling móvil.
- Formulario: error, éxito real, fallo de API y reintento.
- Portal: login, carga, vacío, error, sin permisos y sin conexión.

### 4.12 Criterio de aceptación de Fase 2

- [x] Tres adjetivos y emoción buscada.
- [x] Referencias y anti-referencias con principio extraído.
- [x] “Lo que la marca NO es”.
- [x] Paleta con razón funcional y contraste calculado.
- [x] Tipografía con razón y escala.
- [x] Forma, densidad, radios, elevación y movimiento.
- [x] Elemento firma con anatomía y prueba a 320 px.
- [x] Composición de landing y portal.
- [x] Tono de voz y ejemplos de copy.
- [x] Lista de qué se conserva, retira y prueba.
- [ ] Dirección aprobada por el usuario.
- [ ] Decisiones de la sección 5 resueltas.

---

## 5. Decisiones que necesito de ti

| # | Decisión | Opción recomendada | Impacto si no se resuelve |
|---|---|---|---|
| D1 | Cadencia que se comunica | 6 horas; retirar “<15 min” | Claim falso y pérdida de confianza |
| D2 | Acción principal del landing | Formulario corto “Iniciar piloto”, WhatsApp como secundario | CTA diluido y conversión impredecible |
| D3 | Alcance del portal | Radar con lista y detalle; configuración como pestaña | El portal sigue siendo una pantalla de ajustes |
| D4 | Calibración por cliente | Implementar persistencia en backend o retirar la promesa | Promesa comercial sin respaldo |
| D5 | Autenticación | Migrar a OTP/magic link con sesión de servidor | Riesgo de seguridad y PII |
| D6 | Sistema visual | Papel + panel de radar oscuro; landing claro, portal oscuro coherente | Dos marcas distintas |
| D7 | Cifras de la landing | Reemplazar por conteos reales con fecha o retirar | Claims no verificables |
| D8 | Tipografía | Mantener Plus Jakarta Sans + JetBrains Mono | Más peso y una voz menos propia |

---

## 6. Estado de la entrega

| Elemento | Estado | Evidencia |
|---|---|---|
| Ficha de encuadre | Completa | Sección 1.1 |
| Baseline de tests | Medido | 11 passed en 1.30 s |
| Baseline de rendimiento | No verificado | Sin navegador/Lighthouse |
| Diagnóstico landing | Completo | Sección 2 |
| Diagnóstico portal | Completo | Sección 3 |
| Dirección de arte | Propuesta | Sección 4 |
| Implementación | No iniciada | Fase 4 bloqueada |
| Riesgos críticos abiertos | 5 | Claims, persistencia, auth, RLS, falso éxito |
| Supuestos abiertos | 11 | Secciones 2.10 y 3.10 |

### Riesgos críticos abiertos

1. **Promesa de calibración por cliente sin backend multi-tenant.** Afecta la promesa central y la retención.
2. **Contradicción de cadencia:** 6 horas vs “<15 min”. Afecta la credibilidad.
3. **Persistencia falsa en el portal:** keywords y canales solo en `localStorage`. Afecta la confianza y la operación.
4. **Falso positivo de registro:** el modal muestra éxito aunque la API falle. Afecta la activación y el soporte.
5. **Autenticación y PII débiles:** RUC + 4 dígitos, CORS `*`, RLS abierto, `localStorage`. Afecta seguridad y cumplimiento.

---

## 7. Próximo paso

Si apruebas la dirección, la Fase 3 debe producir:

1. Tokens definitivos en `landing/css/tokens.css` y un espejo para el portal.
2. Inventario de componentes con estados: ficha, tabla, filtros, drawer, formulario, alerta, estado vacío, error y sin permisos.
3. Flujo completo del landing: visita → CTA → formulario → éxito real → portal.
4. Flujo completo del portal: login → radar → detalle → acción → calibración guardada.
5. Reglas responsive y de accesibilidad escritas.
6. Presupuesto de rendimiento y método de medición.

No se implementa nada de esto hasta `APRUEBO FASE 2`.
