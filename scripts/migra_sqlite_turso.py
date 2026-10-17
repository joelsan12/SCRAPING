"""
Script de migración: SQLite local -> Turso Cloud.
Copia todo el historial de procesos y alertas locales a tu base de datos Turso
para mantener el histórico y evitar re-alertar procesos ya conocidos.
"""

import sys
import os
import sqlite3
import json
import logging
from dotenv import load_dotenv

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

load_dotenv()

# Asegurar que el directorio raíz del proyecto esté en sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.storage import TursoStorage

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sercop.migracion_turso")

def migrar(sqlite_path: str = "data/sercop.db"):
    if not os.path.exists(sqlite_path):
        logger.error(f"Base de datos SQLite local no encontrada en {sqlite_path}")
        return

    turso_url = os.getenv("TURSO_DATABASE_URL")
    turso_token = os.getenv("TURSO_AUTH_TOKEN")

    if not turso_url or not turso_token:
        logger.error("Debe definir TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en .env")
        return

    turso = TursoStorage(database_url=turso_url, auth_token=turso_token)
    logger.info("Conexión con Turso Cloud establecida.")

    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row

    # 1. Migrar tabla 'procesos'
    cursor = conn.execute("SELECT * FROM procesos")
    procesos = cursor.fetchall()
    logger.info(f"Total procesos locales a migrar: {len(procesos)}")

    for p in procesos:
        sql = """
        INSERT OR REPLACE INTO procesos (ocid, hash_sha256, title, buyer, region, amount, method, first_seen, last_seen, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        turso._execute(sql, [
            p["ocid"],
            p["hash_sha256"],
            p["title"],
            p["buyer"],
            p["region"],
            p["amount"],
            p["method"],
            p["first_seen"],
            p["last_seen"],
            p["raw_json"]
        ])

    # 2. Migrar tabla 'alertas'
    cursor = conn.execute("SELECT * FROM alertas")
    alertas = cursor.fetchall()
    logger.info(f"Total alertas locales a migrar: {len(alertas)}")

    for a in alertas:
        sql = """
        INSERT INTO alertas (ocid, rubro, keywords, amount, precio_anterior, variacion_pct, buyer, region, enviado_notificacion, fecha_alerta)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        turso._execute(sql, [
            a["ocid"],
            a["rubro"],
            a["keywords"],
            a["amount"],
            a["precio_anterior"],
            a["variacion_pct"],
            a["buyer"],
            a["region"],
            a["enviado_notificacion"],
            a["fecha_alerta"]
        ])

    conn.close()
    logger.info("Migración a Turso Cloud completada con éxito.")

if __name__ == "__main__":
    db = sys.argv[1] if len(sys.argv) > 1 else "data/sercop.db"
    migrar(sqlite_path=db)
