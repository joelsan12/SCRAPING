# Plan Mínimo de Respuesta a Incidentes de Seguridad (IRP)
## Plataforma LicitaciónYa — Intelligence as a Service (SERCOP Ecuador)

---

### 1. Objetivo y Alcance
Este runbook establece el protocolo estándar ante incidentes de ciberseguridad, compromiso de credenciales, fallos en canales de mensajería o indisponibilidad crítica en los pipelines de **LicitaciónYa**. Aplica a los componentes de infraestructura (Turso Cloud, Cloudflare Pages, GitHub Actions, Evolution API, Resend y Telegram).

---

### 2. Matriz de Clasificación de Severidad (SLA)

| Nivel | Definición | Impacto Operativo | Tiempo Máximo de Respuesta (SLA) |
| :--- | :--- | :--- | :--- |
| **P1 - Crítico** | Fuga confirmada de `TURSO_AUTH_TOKEN`, compromiso del repositorio o alteración de base de datos cloud. | Acceso no autorizado total a datos de procesos y clientes. | **< 30 minutos** |
| **P2 - Alto** | Fuga o abuso de `EVOLUTION_API_KEY`, envío de spam no autorizado por WhatsApp o caída completa del cron GitHub Actions > 12h. | Afectación directa de canales de entrega y riesgo reputacional B2B. | **< 2 horas** |
| **P3 - Medio** | Saturación de cuota en Resend, bloqueo HTTP 429 persistente contra SERCOP o fallo en generación de reporte semanal. | Retraso en entrega de alertas o consolidado Excel. | **< 6 horas** |
| **P4 - Bajo** | Alerta con caracteres especiales no sanitizados, anomalías menores en logs o inconsistencias de formato. | Estético o cosmético, sin riesgo de integridad ni confidencialidad. | **< 24 horas** |

---

### 3. Roles y Cadena de Mando

* **Comandante del Incidente (Lead):** Responsable de coordinar la remediación, declarar el estado de emergencia y autorizar la rotación de credenciales.
* **Ingeniero de Operaciones (Ops):** Ejecuta la rotación de secrets en GitHub Actions, Turso CLI y servidores VPS/Oracle.
* **Oficial de Comunicación B2B:** Redacta y notifica a los clientes comerciales afectados en caso de impacto en la entrega de sus alertas o datos.

---

### 4. Protocolos de Contención Inmediata

#### A. Protocolo de Rotación de TURSO_AUTH_TOKEN (Incidente P1)
Ante sospecha de exposición del JWT de base de datos:
1. **Acceder a la terminal con Turso CLI configurado:**
   ```bash
   turso auth login
   ```
2. **Generar un nuevo token de producción (con caducidad controlada, ej. 30 días):**
   ```bash
   turso db tokens create sercop-db-joelsan12 --expiration 30d
   ```
3. **Actualizar inmediatamente los repositorios:**
   * Actualizar `.env` local en la máquina de producción.
   * En GitHub: **Settings → Secrets and variables → Actions → Repository secrets → `TURSO_AUTH_TOKEN`**.
4. **Revocar todos los tokens anteriores:**
   ```bash
   turso db tokens invalidate sercop-db-joelsan12
   ```
5. **Verificar persistencia:** Ejecutar corrida de prueba manual del workflow en GitHub Actions para validar conexión exitosa.

---

#### B. Protocolo de Contención Evolution API / WhatsApp (Incidente P2)
Ante sospecha de mensajes indebidos o compromiso de la clave de instancia:
1. **Bloqueo inmediato de red:** Apagar el contenedor Docker o cerrar el puerto en el firewall de Oracle Cloud / VPS:
   ```bash
   docker stop evolution_api
   # o restringir el puerto mediante iptables / firewall de seguridad del VPS
   ```
2. **Regenerar API Key:** Modificar la variable `AUTHENTICATION_API_KEY` en el archivo `.env` del servidor donde corre Evolution API.
3. **Reiniciar servicio sobre HTTPS:** Asegurar que el dominio corporativo apunte vía proxy inverso (Nginx / Caddy con TLS) y actualizar `EVOLUTION_API_URL` a esquema `https://`.
4. **Actualizar secrets:** Actualizar `EVOLUTION_API_KEY` en el `.env` del pipeline y GitHub Actions secrets.

---

#### C. Protocolo de Rotación Resend Email (Incidente P2/P3)
1. Iniciar sesión en [resend.com/api-keys](https://resend.com/api-keys).
2. Crear nueva clave API con permisos restrictivos (`Sending access only`).
3. Actualizar `RESEND_API_KEY` en GitHub Secrets y `.env`.
4. Borrar la API Key comprometida del panel de Resend.

---

### 5. Notificación y Cumplimiento LOPD Ecuador
* La información recopilada por el pipeline proviene del portal público de contratación pública (SERCOP) bajo estándar internacional OCDS, por lo que los procesos en sí son datos públicos.
* Si el incidente involucra información de contacto de los prospectos o clientes suscritos (RUC, teléfono corporativo, nombres comerciales):
  1. Identificar la lista exacta de clientes afectados.
  2. Notificar formalmente en un plazo no mayor a **72 horas** detallando la naturaleza del incidente, medidas correctivas adoptadas y ausencia de impacto en sus cuentas bancarias o sistemas internos.

---

### 6. Análisis Post-Mortem y Mejora Continua
Tras superar el incidente, el equipo debe completar una minuta que incluya:
* **Línea de tiempo detallada:** Minuto a minuto desde la detección hasta la resolución.
* **Causa raíz:** Vector de ataque o error humano.
* **Acciones preventivas adoptadas:** Modificaciones en código, ajustes de firewall o actualización de dependencias.
* **Actualización del Runbook:** Incorporar lecciones aprendidas al presente documento.
