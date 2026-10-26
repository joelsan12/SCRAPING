"""
Módulo de Notificación Multicanal:
- Telegram Bot API (Alertas inmediatas y heartbeats)
- Resend REST API (Email HTML profesional + adjuntos Excel)
- Evolution API (WhatsApp con texto y documentos)
- Modo Simulación transparente si no hay credenciales configuradas
"""

import os
import logging
import base64
import html
from typing import Optional, List, Dict, Any
import httpx
from src.models import AlertaMatch

logger = logging.getLogger("sercop.notify")

class Notifier:
    def __init__(
        self,
        bot_token: Optional[str] = None,
        chat_id: Optional[str] = None,
        resend_api_key: Optional[str] = None,
        resend_to_email: Optional[str] = None,
        resend_from_email: Optional[str] = None,
        evolution_url: Optional[str] = None,
        evolution_key: Optional[str] = None,
        evolution_instance: Optional[str] = None,
        evolution_target: Optional[str] = None,
    ):
        # 1. Telegram
        self.bot_token = bot_token or os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
        self.chat_id = chat_id or os.getenv("TELEGRAM_CHAT_ID", "").strip()
        self.telegram_activo = bool(self.bot_token and self.chat_id)

        # 2. Resend (Email)
        self.resend_api_key = resend_api_key or os.getenv("RESEND_API_KEY", "").strip()
        self.resend_to = resend_to_email or os.getenv("RESEND_TO_EMAIL", "").strip()
        self.resend_from = resend_from_email or os.getenv("RESEND_FROM_EMAIL", "SERCOP Alertas <onboarding@resend.dev>").strip()
        self.email_activo = bool(self.resend_api_key and self.resend_to)

        # 3. Evolution API (WhatsApp)
        self.evolution_url = (evolution_url or os.getenv("EVOLUTION_API_URL", "")).rstrip("/")
        self.evolution_key = evolution_key or os.getenv("EVOLUTION_API_KEY", "").strip()
        self.evolution_instance = evolution_instance or os.getenv("EVOLUTION_INSTANCE_NAME", "").strip()
        self.evolution_target = evolution_target or os.getenv("EVOLUTION_TARGET_NUMBER", "").strip()
        self.whatsapp_activo = bool(self.evolution_url and self.evolution_key and self.evolution_instance and self.evolution_target)

        # Si ningún canal externo está configurado, opera en simulación
        self.modo_simulacion = not (self.telegram_activo or self.email_activo or self.whatsapp_activo)
        if self.modo_simulacion:
            logger.info("ℹ️ Sin canales externos configurados: Notificador en MODO SIMULACIÓN (consola).")

    # ==========================================
    # Formateo de Mensajes
    # ==========================================
    def formatear_mensaje_texto(self, alerta: AlertaMatch) -> str:
        """Formato en Markdown/Texto limpio para Telegram y WhatsApp."""
        variacion_str = ""
        if alerta.variacion_pct is not None:
            signo = "+" if alerta.variacion_pct > 0 else ""
            variacion_str = f" _(Variación: {signo}{alerta.variacion_pct:.1f}% vs previo)_"

        # Escape HTML para prevenir posible XSS en clientes de mensajería
        title_escaped = html.escape(alerta.title)
        desc_escaped = html.escape(alerta.description) if alerta.description else ""
        buyer_escaped = html.escape(alerta.buyer)
        rubro_escaped = html.escape(alerta.rubro)

        keywords_str = ", ".join(f"#{kw.replace(' ', '_')}" for kw in alerta.keywords_detectadas)
        monto_str = f"${alerta.amount:,.2f}"
        desc_corta = desc_escaped[:250] + ("..." if len(desc_escaped) > 250 else "")
        fase_tag = "🟢 *FASE: CONVOCATORIA ABIERTA*" if alerta.fase.upper() == "ABIERTA" else "⚪ *FASE: ADJUDICADA*"

        return (
            f"🚨 *NUEVA OPORTUNIDAD SERCOP*\n"
            f"{fase_tag}\n"
            f"🏷️ *Rubro:* {rubro_escaped}\n"
            f"🏢 *Entidad:* {buyer_escaped}\n"
            f"📍 *Región:* {alerta.region}\n"
            f"💵 *Presupuesto:* `{monto_str}`{variacion_str}\n"
            f"🎯 *Keywords:* {keywords_str}\n\n"
            f"📋 *Objeto:*\n_{desc_corta}_\n\n"
            f"🔗 [Ver pliego oficial en SERCOP]({alerta.url_portal})"
        )

    def formatear_alerta_html(self, alerta: AlertaMatch) -> str:
        """Plantilla HTML profesional para envíos por correo con Resend."""
        es_abierta = alerta.fase.upper() == "ABIERTA"
        fase_bg = "#E8F8F5" if es_abierta else "#F2F4F4"
        fase_color = "#117864" if es_abierta else "#566573"
        fase_lbl = "🟢 CONVOCATORIA ABIERTA" if es_abierta else "⚪ PROCESO ADJUDICADO"
        fase_badge = f'<span style="background-color:{fase_bg};color:{fase_color};padding:4px 10px;border-radius:4px;font-weight:bold;font-size:12px;display:inline-block;margin-top:6px;">{fase_lbl}</span>'

        keywords_tags = " ".join(
            f'<span style="background-color:#EBF5FB;color:#1A5276;padding:3px 8px;border-radius:4px;font-size:12px;margin-right:5px;">{html.escape(kw)}</span>'
            for kw in alerta.keywords_detectadas
        )
        return f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f7f9fa; margin: 0; padding: 20px;">
            <div style="max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 1px solid #e1e4e8;">
                <div style="background-color: #1F4E79; color: #ffffff; padding: 18px 24px;">
                    <h2 style="margin: 0; font-size: 20px;">🚨 Nueva Oportunidad de Compra Pública</h2>
                    <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Rubro: {html.escape(alerta.rubro)}</p>
                    {fase_badge}
                </div>
                <div style="padding: 24px;">
                    <div style="margin-bottom: 16px;">
                        <span style="font-size: 12px; text-transform: uppercase; color: #666; font-weight: bold;">Entidad Contratante</span>
                        <div style="font-size: 16px; color: #111; font-weight: bold; margin-top: 4px;">{html.escape(alerta.buyer)} ({html.escape(alerta.region)})</div>
                    </div>
                    <div style="margin-bottom: 16px; background-color: #f8fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #1F4E79;">
                        <span style="font-size: 12px; text-transform: uppercase; color: #666; font-weight: bold;">Presupuesto Referencial</span>
                        <div style="font-size: 22px; color: #2E7D32; font-weight: bold; margin-top: 4px;">${alerta.amount:,.2f} USD</div>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <span style="font-size: 12px; text-transform: uppercase; color: #666; font-weight: bold;">Palabras Clave Detectadas</span>
                        <div style="margin-top: 6px;">{keywords_tags}</div>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <span style="font-size: 12px; text-transform: uppercase; color: #666; font-weight: bold;">Objeto del Proceso</span>
                        <p style="font-size: 14px; color: #444; line-height: 1.5; margin-top: 6px;">{html.escape(alerta.description) if alerta.description else html.escape(alerta.title)}</p>
                    </div>
                    <div style="text-align: center;">
                        <a href="{html.escape(alerta.url_portal, quote=True)}" style="background-color: #1F4E79; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Ver Pliego Oficial en SERCOP</a>
                    </div>
                </div>
                <div style="background-color: #f1f3f5; padding: 12px 24px; text-align: center; font-size: 12px; color: #777;">
                    SERCOP Intelligence as a Service &bull; Monitoreo Automatizado de Compras Públicas
                </div>
            </div>
        </body>
        </html>
        """

    # ==========================================
    # Canales de Envío
    # ==========================================
    def _enviar_telegram(self, texto: str) -> bool:
        if not self.telegram_activo:
            return False
        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": texto,
            "parse_mode": "Markdown",
            "disable_web_page_preview": True,
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                r = client.post(url, json=payload)
                return r.status_code == 200
        except Exception as e:
            logger.error(f"Fallo enviando a Telegram: {e}")
            return False

    def _enviar_telegram_documento(self, filepath: str, caption: str) -> bool:
        if not self.telegram_activo:
            return False
        url = f"https://api.telegram.org/bot{self.bot_token}/sendDocument"
        try:
            with open(filepath, "rb") as f:
                files = {"document": (os.path.basename(filepath), f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
                data = {"chat_id": self.chat_id, "caption": caption, "parse_mode": "Markdown"}
                with httpx.Client(timeout=25.0) as client:
                    r = client.post(url, data=data, files=files)
                    return r.status_code == 200
        except Exception as e:
            logger.error(f"Fallo enviando documento a Telegram: {e}")
            return False

    @staticmethod
    def _enmascarar_correo(correo: str) -> str:
        """Enmascara la dirección de correo para prevenir fuga de datos sensibles en logs."""
        if not correo or "@" not in correo:
            return "***"
        usuario, dominio = correo.split("@", 1)
        if len(usuario) <= 2:
            return f"*@{dominio}"
        return f"{usuario[:2]}***@{dominio}"

    def _enviar_email_resend(
        self,
        asunto: str,
        html_contenido: str,
        adjuntos: Optional[List[Dict[str, str]]] = None
    ) -> bool:
        if not self.email_activo:
            return False
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {self.resend_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": self.resend_from,
            "to": [self.resend_to],
            "subject": asunto,
            "html": html_contenido,
        }
        if adjuntos:
            payload["attachments"] = adjuntos

        try:
            with httpx.Client(timeout=15.0) as client:
                r = client.post(url, json=payload, headers=headers)
                if r.status_code in (200, 201):
                    logger.info(f"✅ Correo enviado vía Resend a {self._enmascarar_correo(self.resend_to)}")
                    return True
                else:
                    logger.error(f"Fallo Resend ({r.status_code}): {r.text}")
                    return False
        except Exception as e:
            logger.error(f"Excepción en Resend API: {e}")
            return False

    def _enviar_whatsapp_texto(self, texto: str) -> bool:
        if not self.whatsapp_activo:
            return False
        endpoint = f"{self.evolution_url}/message/sendText/{self.evolution_instance}"
        headers = {"apikey": self.evolution_key, "Content-Type": "application/json"}
        payload = {"number": self.evolution_target, "text": texto}
        try:
            with httpx.Client(timeout=10.0) as client:
                r = client.post(endpoint, json=payload, headers=headers)
                return r.status_code in (200, 201)
        except Exception as e:
            logger.error(f"Fallo en Evolution API (WhatsApp): {e}")
            return False

    def _enviar_whatsapp_media(self, filepath: str, caption: str) -> bool:
        if not self.whatsapp_activo:
            return False
        endpoint = f"{self.evolution_url}/message/sendMedia/{self.evolution_instance}"
        headers = {"apikey": self.evolution_key, "Content-Type": "application/json"}
        try:
            with open(filepath, "rb") as f:
                b64_content = base64.b64encode(f.read()).decode("utf-8")

            payload = {
                "number": self.evolution_target,
                "media": b64_content,
                "fileName": os.path.basename(filepath),
                "caption": caption,
                "mediatype": "document"
            }
            with httpx.Client(timeout=25.0) as client:
                r = client.post(endpoint, json=payload, headers=headers)
                return r.status_code in (200, 201)
        except Exception as e:
            logger.error(f"Fallo enviando media WhatsApp: {e}")
            return False

    # ==========================================
    # Métodos Públicos
    # ==========================================
    def enviar_alerta(self, alerta: AlertaMatch) -> bool:
        """Despacha la alerta a los canales activos (Telegram, WhatsApp, Email)."""
        texto = self.formatear_mensaje_texto(alerta)

        if self.modo_simulacion:
            print("\n" + "🔔" * 25 + " ALERTA SIMULADA " + "🔔" * 25)
            print(texto)
            print("=" * 66 + "\n")
            return True

        enviado_algún_canal = False
        if self.telegram_activo and self._enviar_telegram(texto):
            enviado_algún_canal = True
        if self.whatsapp_activo and self._enviar_whatsapp_texto(texto):
            enviado_algún_canal = True
        if self.email_activo:
            asunto = f"🚨 Oportunidad SERCOP: {alerta.buyer[:35]} (${alerta.amount:,.0f} USD)"
            html = self.formatear_alerta_html(alerta)
            if self._enviar_email_resend(asunto, html):
                enviado_algún_canal = True

        return enviado_algún_canal

    def enviar_heartbeat(
        self,
        rubro: str,
        total_analizados: int,
        nuevos: int,
        alertas: int,
        errores: int,
        duracion_segundos: float,
        backend_nombre: str = "sqlite",
        advertencias: Optional[list] = None,
        keywords_ciclo: Optional[str] = None,
        alertas_abiertas: int = 0,
        alertas_adjudicadas: int = 0,
    ) -> bool:
        """Envía el reporte de salud de la corrida periódica."""
        estado_icono = "✅" if errores == 0 else "⚠️"
        desglose_alertas = f"`{alertas}`"
        if alertas > 0:
            desglose_alertas += f" (🟢 Abiertas: `{alertas_abiertas}` | ⚪ Adjudicadas: `{alertas_adjudicadas}`)"

        msg = (
            f"{estado_icono} *HEARTBEAT PIPELINE SERCOP*\n"
            f"🏷️ *Rubro:* `{rubro}`\n"
            f"⏱️ *Duración:* `{duracion_segundos:.1f}s`\n"
            f"📊 *Analizados:* `{total_analizados}`\n"
            f"🆕 *Nuevos/Modificados:* `{nuevos}`\n"
            f"🚨 *Alertas emitidas:* {desglose_alertas}\n"
            f"❌ *Errores validación:* `{errores}`\n"
            f"🗄️ *Backend:* `{backend_nombre}`"
        )
        if keywords_ciclo:
            msg += f"\n🎯 *Keywords ciclo:* `{keywords_ciclo}`"
        if advertencias:
            msg += "\n\n⚠️ *Advertencias:*\n" + "\n".join(f"• {adv}" for adv in advertencias)

        if self.modo_simulacion:
            print("\n" + "🔔" * 25 + " HEARTBEAT SIMULADO " + "🔔" * 25)
            print(msg)
            print("=" * 66 + "\n")
            return True

        # Heartbeat se envía primariamente a Telegram (canal de monitoreo del dev)
        if self.telegram_activo:
            return self._enviar_telegram(msg)
        return False

    def enviar_reporte_semanal(
        self,
        filepath: str,
        total_procesos: int,
        monto_total: float,
        rubro: str
    ) -> bool:
        """Despacha el archivo Excel semanal vía Email, WhatsApp y Telegram."""
        nombre_archivo = os.path.basename(filepath)
        caption = (
            f"📊 *REPORTE SEMANAL DE COMPRAS PÚBLICAS*\n"
            f"🏷️ *Rubro:* {rubro}\n"
            f"📋 *Oportunidades:* {total_procesos}\n"
            f"💰 *Monto Acumulado:* `${monto_total:,.2f} USD`\n\n"
            f"Adjunto se encuentra el consolidado en Excel con los enlaces oficiales a cada pliego."
        )

        if self.modo_simulacion:
            print("\n" + "📁" * 25 + " REPORTE EXCEL SEMANAL " + "📁" * 25)
            print(caption)
            print(f"Archivo generado: {filepath} ({os.path.getsize(filepath):,} bytes)")
            print("=" * 66 + "\n")
            return True

        exito = False
        # 1. Telegram
        if self.telegram_activo and self._enviar_telegram_documento(filepath, caption):
            exito = True

        # 2. WhatsApp
        if self.whatsapp_activo and self._enviar_whatsapp_media(filepath, caption):
            exito = True

        # 3. Email con adjunto
        if self.email_activo:
            with open(filepath, "rb") as f:
                b64_data = base64.b64encode(f.read()).decode("utf-8")
            adjunto = [{"filename": nombre_archivo, "content": b64_data}]
            asunto = f"📊 Reporte Semanal SERCOP: {total_procesos} oportunidades (${monto_total:,.0f} USD)"
            html = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #1F4E79;">Reporte Semanal de Compras Públicas - SERCOP</h2>
                <p>Estimado cliente,</p>
                <p>Adjunto encontrará el informe consolidado de licitaciones detectadas durante los últimos 7 días para el rubro <b>{rubro}</b>.</p>
                <ul>
                    <li><b>Total Oportunidades:</b> {total_procesos}</li>
                    <li><b>Monto Total Estimado:</b> ${monto_total:,.2f} USD</li>
                </ul>
                <p>El archivo Excel adjunto incluye el desglose por entidad, provincia, monto y el enlace directo al portal para descargar los pliegos.</p>
            </div>
            """
            if self._enviar_email_resend(asunto, html, adjunto):
                exito = True

        return exito
