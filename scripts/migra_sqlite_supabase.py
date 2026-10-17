"""
Script de migración: SQLite local -> Supabase (PostgreSQL).
Transfiere el historial completo de procesos, hashes de deduplicación y alertas
para que la puesta en producción no re-emita alertas viejas.
"""

import sys
import os
import sqlite3
import json
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

load_dotenv()

# Asegurar que el directorio raíz del proyecto esté en sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sercop.migracion")

def migrar(sqlite_path: str = "data/sercop.db", batch_size: int = 50):
    if not os.path.exists(sqlite_path):
        logger.error(f"Base de datos SQLite no encontrada en {sqlite_path}")
        return

    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    supabase_key = os.getenv("SUPABASE_KEY", "").strip()

    if not supabase_url or not supabase_key:
        logger.error("Debe definir SUPABASE_URL y SUPABASE_KEY en .env para ejecutar la migración.")
        return

    from supabase import create_client
    supabase = create_client(supabase_url, supabase_key)
    logger.info(f"Conectado a Supabase: {supabase_url}")

    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row

    # 1. Migrar tabla 'procesos'
    cursor = conn.execute("SELECT * FROM procesos")
    procesos_rows = cursor.fetchall()
    logger.info(f"Total procesos encontrados en SQLite: {len(procesos_rows)}")

    lote_procesos: List[Dict[str, Any]] = []
    total_migrados_procesos = 0

    for r in procesos_rows:
        raw_val = r["raw_json"]
        parsed_json = None
        if raw_val:
            try:
                parsed_json = json.loads(raw_val)
            except Exception:
                parsed_json = {}

        lote_procesos.append({
            "ocid": r["ocid"],
            "hash_sha256": r["hash_sha256"],
            "title": r["title"],
            "buyer": r["buyer"],
            "region": r["region"],
            "amount": float(r["amount"]) if r["amount"] is not None else 0.0,
            "method": r["method"],
            "first_seen": r["first_seen"],
            "last_seen": r["last_seen"],
            "raw_json": parsed_json
        })

        if len(lote_procesos) >= batch_size:
            supabase.table("procesos").upsert(lote_procesos).execute()
            total_migrados_procesos += len(lote_procesos)
            logger.info(f"  Procesos migrados: {total_migrados_procesos}/{len(procesos_rows)}")
            lote_procesos = []

    if lote_procesos:
        supabase.table("procesos").upsert(lote_procesos).execute()
        total_migrados_procesos += len(lote_procesos)
        logger.info(f"  Procesos migrados: {total_migrados_procesos}/{len(procesos_rows)}")

    # 2. Migrar tabla 'alertas'
    cursor = conn.execute("SELECT * FROM alertas")
    alertas_rows = cursor.fetchall()
    logger.info(f"Total alertas encontradas en SQLite: {len(alertas_rows)}")

    lote_alertas: List[Dict[str, Any]] = []
    total_migradas_alertas = 0

    for r in alertas_rows:
        lote_alertas.append({
            "ocid": r["ocid"],
            "rubro": r["rubro"],
            "keywords": r["keywords"],
            "amount": float(r["amount"]) if r["amount"] is not None else 0.0,
            "precio_anterior": float(r["precio_anterior"]) if r["precio_anterior"] is not None else None,
            "variacion_pct": float(r["variacion_pct"]) if r["variacion_pct"] is not None else None,
            "buyer": r["buyer"],
            "region": r["region"],
            "enviado_notificacion": bool(r["enviado_notificacion"]),
            "fecha_alerta": r["fecha_alerta"]
        })

        if len(lote_alertas) >= batch_size:
            supabase.table("alertas").insert(lote_alertas).execute()
            total_migradas_alertas += len(lote_alertas)
            logger.info(f"  Alertas migradas: {total_migradas_alertas}/{len(alertas_rows)}")
            lote_alertas = []

    if lote_alertas:
        supabase.table("alertas").insert(lote_alertas).execute()
        total_migradas_alertas += len(lote_alertas)
        logger.info(f"  Alertas migradas: {total_migradas_alertas}/{len(alertas_rows)}")

    conn.close()
    logger.info("Migración completada con éxito.")

if __name__ == "__main__":
    db = sys.argv[1] if len(sys.argv) > 1 else "data/sercop.db"
    migrar(sqlite_path=db)
