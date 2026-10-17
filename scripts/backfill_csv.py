"""
Script de Backfill y Carga Histórica.
Permite importar datasets de compras públicas (CSV o JSON)
a la base SQLite local para tener histórico y demostraciones inmediatas.
"""

import sys
import os
import csv
import json
import logging
from typing import Optional
from dotenv import load_dotenv

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

load_dotenv()

from src.models import ProcesoSercop
from src.transform import calcular_hash_proceso
from src.storage import Storage
from src.matcher import Matcher

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sercop.backfill")

def backfill_desde_csv(csv_path: str, rubro_key: str = "ferreteria_construccion"):
    if not os.path.exists(csv_path):
        logger.error(f"Archivo CSV no encontrado: {csv_path}")
        return

    storage = Storage()
    matcher = Matcher()
    
    total_leidos = 0
    total_guardados = 0
    total_matches = 0

    with open(csv_path, mode="r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_leidos += 1
            try:
                # Mapeo flexible de columnas comunes de SERCOP en CSV
                proceso_dict = {
                    "id": row.get("id") or row.get("ocid") or f"csv-{total_leidos}",
                    "ocid": row.get("ocid") or row.get("id"),
                    "year": int(row.get("year", 2024)),
                    "month": int(row.get("month", 1)) if row.get("month") else None,
                    "method": row.get("method", "direct"),
                    "internal_type": row.get("internal_type", ""),
                    "locality": row.get("locality", ""),
                    "region": row.get("region", ""),
                    "suppliers": row.get("suppliers", ""),
                    "buyer": row.get("buyer", ""),
                    "amount": row.get("amount", 0.0),
                    "budget": row.get("budget", 0.0),
                    "date": row.get("date", ""),
                    "title": row.get("title", ""),
                    "description": row.get("description", ""),
                }
                
                proceso = ProcesoSercop.model_validate(proceso_dict)
                h = calcular_hash_proceso(proceso)
                hubo_cambio, _ = storage.procesar_y_guardar(proceso, h)
                
                if hubo_cambio:
                    total_guardados += 1
                    alerta = matcher.evaluar_proceso(proceso, rubro_key)
                    if alerta:
                        total_matches += 1
                        storage.registrar_alerta(alerta, enviado=False)
                        
            except Exception as e:
                logger.warning(f"Error procesando fila {total_leidos}: {e}")
                continue

    logger.info(f"Backfill finalizado. Filas leídas: {total_leidos} | Guardados: {total_guardados} | Alertas encontradas: {total_matches}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        backfill_desde_csv(sys.argv[1])
    else:
        print("Uso: python scripts/backfill_csv.py <ruta_archivo.csv>")
