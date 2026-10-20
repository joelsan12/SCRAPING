# Runbook de Lanzamiento y Operación Comercial: LicitaciónYa

Este documento establece el procedimiento estándar de puesta en marcha operativa previo al contacto con clientes y prospectos. Siga las fases en orden secuencial.

---

## Fase 1: Verificación del Cron y CI/CD en GitHub Actions (~5 min)

1. **Acceso al repositorio:**
   * Ingrese a `https://github.com/joelsan12/SCRAPING/actions`.
2. **Habilitación de workflows:**
   * En repositorios privados nuevos, GitHub Actions puede requerir habilitación explícita.
   * Si los flujos aparecen deshabilitados: Vaya a **Settings → Actions → General → Actions permissions** y seleccione *"Allow all actions and reusable workflows"*.
3. **Disparo manual de prueba (Dry-run en CI):**
   * En la pestaña **Actions**, seleccione el flujo **"Pipeline SERCOP Monitor (Turso Cloud)"**.
   * Haga clic en **Run workflow** (rama `main`) para ejecutar una corrida manual.
4. **Verificación de Secrets:**
   * Ingrese a **Settings → Secrets and variables → Actions → Repository secrets**.
   * Confirme la presencia de:
     * `TURSO_DATABASE_URL` (requerido para persistencia)
     * `TURSO_AUTH_TOKEN` (requerido para autenticación con Turso)
     * `TELEGRAM_BOT_TOKEN` *(opcional, al activar canal Telegram)*
     * `TELEGRAM_CHAT_ID` *(opcional, al activar canal Telegram)*
5. **Criterio de éxito:**
   * Run con estado `Success` (check verde) en la pestaña Actions.

---

## Fase 2: Publicación de la Landing Page en Cloudflare Pages (~10 min)

La landing page se despliega en Cloudflare Pages mediante carga directa de archivos (drag & drop), evitando exponer el repositorio privado.

1. **Ingreso a Cloudflare:**
   * Inicie sesión en [dash.cloudflare.com](https://dash.cloudflare.com/) (cuenta gratuita).
2. **Crear proyecto Pages:**
   * En el menú lateral, diríjase a **Workers & Pages → Create application → Pages → Upload assets**.
3. **Configuración del número de WhatsApp (Paso previo al despliegue):**
   * En `landing/index.html`, busque `593999999999` y reemplácelo por su número corporativo real de WhatsApp (ej. `593987654321`) para activar los 6 botones de contacto directo.
4. **Carga de archivos:**
   * Nombre del proyecto: `licitacionya`.
   * Arrastre o seleccione el contenido completo de la carpeta local `landing/` (debe incluir `index.html`, `404.html`, `robots.txt`, `favicon.svg`, `og-image.png`, `fonts/`, `css/` y `js/`).
   * Haga clic en **Deploy site**.
5. **Validación en móvil y escritorio:**
   * La URL pública asignada será `https://licitacionya.pages.dev`.
   * Abra la URL desde su teléfono móvil.
   * Haga clic en los botones de llamada a la acción (CTA) de WhatsApp (`wa.me/593...`) y confirme que abren un chat directo con el texto predefinido.

---

## Fase 3: Canal Email y Notificaciones (Estrategia Operativa)

* **Resend en plan gratuito:** Permite despachar correos desde `onboarding@resend.dev` hacia el correo registrado del titular. Para despachar correos hacia dominios de terceros se requiere validar registros DNS (SPF, DKIM) de un dominio corporativo.
* **Recomendación para los primeros pilotos:**
  * Iniciar el piloto de 15 días comunicando alertas por **WhatsApp y Telegram** (los canales ejecutivos de mayor tasa de lectura en Ecuador).
  * Enviar el consolidado semanal de Excel como archivo adjunto por WhatsApp o desde su correo corporativo personal.
  * Habilitar Resend automatizado con dominio propio una vez que el primer cliente formalice su suscripción.

---

## Fase 4: Simulación de Venta Local (Dry-Run Técnico) (~5 min)

Antes de enviar el primer mensaje a un tomador de decisiones:

1. **Probar extracción en consola:**
   ```bash
   python -m src.main --rubro ferreteria_construccion --pages 1
   ```
   * Verifique que el resumen en consola identifique procesos y etiquete la fase correctamente (`🟢 ABIERTA` / `⚪ ADJUDICADA`).

2. **Generar el reporte Excel de muestra:**
   ```bash
   python -m src.reporte --rubro ferreteria_construccion --demo
   ```
   * Ubique el archivo generado en `downloads/Reporte_SERCOP_Semana_XX_YYYY.xlsx`.
   * Ábralo y confirme que contenga las 2 hojas:
     * **Oportunidades Semanales** (con enlaces oficiales y montos formateados en USD).
     * **Resumen por Región** (agrupación provincial).
   * Verifique los contratos de muestra para su pitch:
     * *Cuerpo de Ingenieros del Ejército:* **$994,289.69 USD** (Pichincha)
     * *Empresa Eléctrica Ambato (EEASA):* **$732,152.96 USD** (Tungurahua)
     * *CNEL EP:* **$350,393.12 USD** (Guayas)
     * *Municipio de Rumiñahui:* **$286,062.01 USD** (Pichincha)

---

## Fase 5: Despliegue Comercial (Prospectos 1 al 5)

1. **Selección de contactos:**
   * Abra `docs/lista_prospectos.md` y seleccione los primeros 5 prospectos.
   * Verifique por RUC / nombre comercial en el portal SRI la razón social del prospecto antes del contacto.
2. **Envío del primer mensaje:**
   * Envíe el **Mensaje 1** de `docs/guion_venta.md` vía WhatsApp al Gerente General o Director Comercial, adjuntando el archivo Excel generado en la Fase 4.
3. **Respuesta y Onboarding:**
   * Ante el interés del cliente, utilice la plantilla `docs/anexo_configuracion.md` para registrar sus palabras clave y provincias de interés.
   * Active su monitoreo en el servidor.
