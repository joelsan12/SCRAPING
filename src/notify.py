"""
Módulo de Notificación y Alertas (Telegram + Consola + Stub WhatsApp).
Formatea mensajes ejecutivos para gerentes comerciales y contratistas.
"""

import os
import logging
import httpx
from typing import Optional
from src.models import AlertaMatch

logger = logging.getLogger("sercop.notify")

class Notifier:
    def __init__(
        self,
        bot_token: Optional[str] = None,
        chat_id: Optional[str] = None
    ):
        self.bot_token = bot_token or os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
        self.chat_id = chat_id or os.getenv("TELEGRAM_CHAT_ID", "").strip()
        self.modo_simulacion = not bool(self.bot_token and self.chat_id)

        if self.modo_simulacion:
            logger.info("ℹ️ Telegram no configurado: Notificador operando en MODO SIMULACIÓN (impresión en consola).")

    def formatear_mensaje_telegram(self, alerta: AlertaMatch) -> str:
        """Genera el mensaje estructurado en Markdown para Telegram."""
        variacion_str = ""
        if alerta.variacion_pct is not None:
            signo = "+" if alerta.variacion_pct > 0 else ""
            variacion_str = f" _(Variación: {signo}{alerta.variacion_pct:.1f}% vs previo)_"

        keywords_str = ", ".join(f"#{kw.replace(' ', '_')}" for kw in alerta.keywords_detectadas)
        monto_str = f"${alerta.amount:,.2f}"

        desc_corta = alerta.description[:250] + ("..." if len(alerta.description) > 250 else "")

        return (
            f"🚨 *NUEVA OPORTUNIDAD SERCOP*\n"
            f"🏷️ *Rubro:* {alerta.rubro}\n"
            f"🏢 *Entidad:* {alerta.buyer}\n"
            f"📍 *Región:* {alerta.region}\n"
            f"💵 *Presupuesto:* `{monto_str}`{variacion_str}\n"
            f"🎯 *Keywords:* {keywords_str}\n\n"
            f"📋 *Objeto:*\n_{desc_corta}_\n\n"
            f"🔗 [Ver pliego oficial en SERCOP]({alerta.url_portal})"
        )

    def _enviar_texto(self, texto: str) -> bool:
        """Envía un mensaje de texto a Telegram o lo imprime en consola si está en modo simulación."""
        if self.modo_simulacion:
            print("\n" + "🔔" * 25 + " MENSAJE SIMULADO " + "🔔" * 25)
            print(texto)
            print("=" * 66 + "\n")
            return True

        telegram_url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": texto,
            "parse_mode": "Markdown",
            "disable_web_page_preview": True,
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(telegram_url, json=payload)
                if resp.status_code == 200:
                    return True
                else:
                    logger.error(f"❌ Error enviando mensaje a Telegram ({resp.status_code}): {resp.text}")
                    return False
        except Exception as e:
            logger.error(f"❌ Excepción conectando con Telegram API: {e}")
            return False

    def enviar_alerta(self, alerta: AlertaMatch) -> bool:
        """Envía la alerta al canal de Telegram configurado."""
        mensaje = self.formatear_mensaje_telegram(alerta)
        enviado = self._enviar_texto(mensaje)
        if enviado and not self.modo_simulacion:
            logger.info(f"✅ Alerta enviada con éxito a Telegram para proceso {alerta.ocid}")
        return enviado

    def enviar_heartbeat(
        self,
        rubro: str,
        total_analizados: int,
        nuevos: int,
        alertas: int,
        errores: int,
        duracion_segundos: float,
        backend_nombre: str = "sqlite",
        advertencias: Optional[list] = None
    ) -> bool:
        """
        Envía un reporte de salud y telemetría de la corrida del pipeline.
        Permite al operador saber que el cron corrió exitosamente.
        """
        estado_icono = "✅" if errores == 0 else "⚠️"
        msg = (
            f"{estado_icono} *HEARTBEAT PIPELINE SERCOP*\n"
            f"🏷️ *Rubro:* `{rubro}`\n"
            f"⏱️ *Duración:* `{duracion_segundos:.1f}s`\n"
            f"📊 *Analizados:* `{total_analizados}`\n"
            f"🆕 *Nuevos/Modificados:* `{nuevos}`\n"
            f"🚨 *Alertas emitidas:* `{alertas}`\n"
            f"❌ *Errores validación:* `{errores}`\n"
            f"🗄️ *Backend:* `{backend_nombre}`"
        )
        if advertencias:
            msg += "\n\n⚠️ *Advertencias:*\n" + "\n".join(f"• {adv}" for adv in advertencias)

        return self._enviar_texto(msg)

    def enviar_whatsapp_stub(self, alerta: AlertaMatch) -> bool:
        """
        Stub preparado para integración con Evolution API o Meta Cloud API (Fase 3).
        """
        logger.info(f"Stub WhatsApp: Alerta {alerta.ocid} encolada para envío.")
        return True
