"""
Punto de entrada principal (Orquestador CLI) para el Pipeline SERCOP.
Ejecuta el flujo completo:
1. Ingesta (SercopClient + HTTPX + Tenacity)
2. Validación tipada (Pydantic v2)
3. Hashing y Diff (Transform)
4. Persistencia Dual (SQLite WAL o Supabase PostgreSQL)
5. Alertas de negocio (Notifier Telegram / Consola)
6. Heartbeat y telemetría de salud operativa
"""

import sys
import os
import time
import argparse
import logging
from datetime import datetime, timezone
from typing import List, Optional
from dotenv import load_dotenv

# Forzar codificación UTF-8 para consola en Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

load_dotenv()

from src.client import SercopClient
from src.models import ProcesoSercop
from src.transform import calcular_hash_proceso
from src.storage import get_storage
from src.matcher import Matcher
from src.notify import Notifier

def configurar_logging(nivel_str: str = "INFO"):
    nivel = getattr(logging, nivel_str.upper(), logging.INFO)
    logging.basicConfig(
        level=nivel,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

def ejecutar_pipeline(
    rubro_key: str = "ferreteria_construccion",
    year: Optional[int] = None,
    max_pages: int = 1,
    keywords_busqueda: Optional[List[str]] = None,
    batch_size: int = 8,
    ciclo: Optional[int] = None,
    storage_backend: Optional[str] = None,
    db_path: Optional[str] = None,
    enviar_heartbeat: bool = True
):
    logger = logging.getLogger("sercop.pipeline")
    tiempo_inicio = time.time()

    # 1. Año dinámico: si no se especifica, toma el año en curso
    año_actual = datetime.now().year
    año_objetivo = year if year else año_actual
    
    logger.info(f"🚀 Iniciando Pipeline SERCOP | Rubro: {rubro_key} | Año objetivo: {año_objetivo}")

    # 2. Instanciar componentes
    client = SercopClient()
    backend_seleccionado = storage_backend or os.getenv("STORAGE_BACKEND", "sqlite")
    storage = get_storage(backend=backend_seleccionado, db_path=db_path)
    matcher = Matcher()
    notifier = Notifier()

    # Si no se pasan keywords específicas de consulta, aplicamos rotación por ciclo horario
    perfil = matcher.rubros.get(rubro_key, {})
    todas_keywords = perfil.get("keywords", ["cemento", "acero", "pintura"])

    if keywords_busqueda:
        info_ciclo = f"Manual ({len(keywords_busqueda)} términos)"
    else:
        # Rotación inteligente: divide las keywords en 4 ciclos diarios según la hora UTC (cada 6h)
        hora_utc = datetime.now(timezone.utc).hour
        ciclo_idx = (hora_utc // 6) if ciclo is None else ciclo
        total_kw = len(todas_keywords)
        inicio = (ciclo_idx * batch_size) % total_kw
        fin = inicio + batch_size
        keywords_busqueda = todas_keywords[inicio:fin]
        if len(keywords_busqueda) < batch_size and total_kw > batch_size:
            keywords_busqueda += todas_keywords[: (batch_size - len(keywords_busqueda))]
        info_ciclo = f"Ciclo {ciclo_idx + 1}/4 ({len(keywords_busqueda)}/{total_kw} términos)"

    logger.info(f"📋 Keywords asignadas ({info_ciclo}): {', '.join(keywords_busqueda)}")

    total_procesados = 0
    total_nuevos_o_cambiados = 0
    total_alertas = 0
    total_errores_validacion = 0
    advertencias = []

    for kw in keywords_busqueda:
        logger.info(f"\n🔍 Buscando procesos con término: '{kw}'...")
        registros_kw = 0

        for page in range(1, max_pages + 1):
            try:
                resp = client.search_ocds(year=año_objetivo, search=kw, page=page)
            except Exception as e:
                logger.error(f"Error consultando API para '{kw}' (pág {page}): {e}")
                advertencias.append(f"Fallo en API para '{kw}': {e}")
                break

            items_raw = resp.get("data", [])
            total_disponibles = resp.get("total", 0)
            registros_kw += len(items_raw)
            logger.info(f"  Página {page}: {len(items_raw)} registros obtenidos (Total servidor: {total_disponibles})")

            if not items_raw:
                break

            for raw in items_raw:
                total_procesados += 1
                try:
                    # 3. Validación estricta con Pydantic v2
                    proceso = ProcesoSercop.model_validate(raw)
                except Exception as val_err:
                    total_errores_validacion += 1
                    logger.warning(f"  ⚠️ Error de validación en registro {raw.get('id')}: {val_err}")
                    continue

                # 4. Hash determinista
                hash_sha = calcular_hash_proceso(proceso)

                # 5. Persistencia y detección de diffs
                hubo_cambio, monto_anterior = storage.procesar_y_guardar(proceso, hash_sha)

                if hubo_cambio:
                    total_nuevos_o_cambiados += 1
                    # 6. Evaluación de coincidencia con el rubro
                    alerta = matcher.evaluar_proceso(
                        proceso=proceso,
                        rubro_key=rubro_key,
                        monto_anterior=monto_anterior
                    )

                    if alerta:
                        total_alertas += 1
                        enviado = notifier.enviar_alerta(alerta)
                        storage.registrar_alerta(alerta, enviado=enviado)

        if registros_kw == 0:
            msg_adv = f"Término '{kw}' devolvió 0 registros en año {año_objetivo}"
            logger.warning(f"  ⚠️ {msg_adv}")
            advertencias.append(msg_adv)

    duracion = time.time() - tiempo_inicio

    print("\n" + "=" * 55)
    print("📊 RESUMEN DE EJECUCIÓN DEL PIPELINE")
    print(f"Año consultado: {año_objetivo}")
    print(f"Backend persistencia: {backend_seleccionado}")
    print(f"Total registros analizados: {total_procesados}")
    print(f"Registros nuevos o con cambios: {total_nuevos_o_cambiados}")
    print(f"Alertas de negocio disparadas: {total_alertas}")
    print(f"Errores de validación Pydantic: {total_errores_validacion}")
    print(f"Duración total: {duracion:.2f}s")
    print("=" * 55)

    # 7. Disparar Heartbeat de salud operativa
    if enviar_heartbeat:
        notifier.enviar_heartbeat(
            rubro=rubro_key,
            total_analizados=total_procesados,
            nuevos=total_nuevos_o_cambiados,
            alertas=total_alertas,
            errores=total_errores_validacion,
            duracion_segundos=duracion,
            backend_nombre=backend_seleccionado,
            advertencias=advertencias if advertencias else None,
            keywords_ciclo=info_ciclo
        )

def main():
    parser = argparse.ArgumentParser(description="Pipeline de Extracción y Monitoreo SERCOP (Ecuador)")
    parser.add_argument("--rubro", default="ferreteria_construccion", help="Clave del rubro en config/rubros.yaml")
    parser.add_argument("--year", type=int, default=None, help="Año a consultar (por defecto calcula el año actual)")
    parser.add_argument("--pages", type=int, default=1, help="Número de páginas a descargar por keyword")
    parser.add_argument("--keywords", nargs="+", help="Lista personalizada de keywords para búsqueda en servidor")
    parser.add_argument("--batch-size", type=int, default=8, help="Número de keywords por corrida en rotación automática")
    parser.add_argument("--ciclo", type=int, default=None, help="Índice de ciclo (0 a 3). Por defecto calculado según hora UTC")
    parser.add_argument("--backend", default=None, choices=["sqlite", "turso", "supabase"], help="Backend de persistencia")
    parser.add_argument("--db", default=None, help="Ruta personalizada a la base SQLite")
    parser.add_argument("--no-heartbeat", action="store_true", help="Desactiva el envío del mensaje de heartbeat")
    parser.add_argument("--log", default="INFO", help="Nivel de logging (DEBUG, INFO, WARNING)")

    args = parser.parse_args()
    configurar_logging(args.log)

    ejecutar_pipeline(
        rubro_key=args.rubro,
        year=args.year,
        max_pages=args.pages,
        keywords_busqueda=args.keywords,
        batch_size=args.batch_size,
        ciclo=args.ciclo,
        storage_backend=args.backend,
        db_path=args.db,
        enviar_heartbeat=not args.no_heartbeat
    )

if __name__ == "__main__":
    main()
