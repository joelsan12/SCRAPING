"""
Auditoría Empírica de Datos de SERCOP (Ecuador) - Fase Pre-Venta S4.1
Analiza:
1. Frescura de los datos (diferencia entre fecha del proceso más reciente y hoy).
2. Proporción de procesos Abiertos (en postulación) vs Adjudicados (proveedor asignado).
3. Incidencia de campos nulos (title, description, method).
4. Desglose por internal_type y modalidades.
5. Verificación profunda mediante 'record' de OCDS (tender.status, tenderPeriod, contracts).
"""

import sys
import os
import time
import json
import argparse
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from collections import Counter

# Forzar codificación UTF-8 en consola Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from src.client import SercopClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("sercop.auditoria")

def auditar_datos(
    year: int = 2026,
    keywords: Optional[List[str]] = None,
    max_pages_per_kw: int = 5,
    sample_records_count: int = 15,
    output_file: str = "downloads/auditoria_datos.json"
) -> Dict[str, Any]:
    client = SercopClient()
    os.makedirs(os.path.dirname(output_file) or ".", exist_ok=True)
    
    if not keywords:
        keywords = ["cemento", "construccion", "ferreteria", "acero", "pintura", "tubería"]
        
    logger.info(f"🚀 Iniciando Auditoría Pre-Venta SERCOP | Año: {year} | Keywords: {keywords}")

    todos_los_procesos: List[Dict[str, Any]] = []
    ocids_vistos = set()

    for kw in keywords:
        logger.info(f"🔎 Muestreando término '{kw}' (hasta {max_pages_per_kw} páginas)...")
        for page in range(1, max_pages_per_kw + 1):
            try:
                resp = client.search_ocds(year=year, search=kw, page=page)
            except Exception as e:
                logger.error(f"Error consultando '{kw}' pág {page}: {e}")
                break

            items = resp.get("data", [])
            if not items:
                break

            nuevos = 0
            for item in items:
                ocid = item.get("ocid") or str(item.get("id"))
                if ocid not in ocids_vistos:
                    ocids_vistos.add(ocid)
                    todos_los_procesos.append(item)
                    nuevos += 1
            
            logger.info(f"  Pág {page}: {len(items)} items ({nuevos} únicos añadidos). Total acumulado: {len(todos_los_procesos)}")
            
            if len(todos_los_procesos) >= 250:
                break
        if len(todos_los_procesos) >= 250:
            break

    total_muestra = len(todos_los_procesos)
    logger.info(f"\n📊 Total de procesos únicos recolectados para análisis: {total_muestra}")

    if total_muestra == 0:
        logger.warning(f"No se obtuvieron registros en search_ocds para año {year}. Intentando con año anterior...")
        year_alt = year - 1
        return auditar_datos(
            year=year_alt,
            keywords=keywords,
            max_pages_per_kw=max_pages_per_kw,
            sample_records_count=sample_records_count,
            output_file=output_file
        )

    # 1. Análisis de Campos Nulos
    nulos_title = sum(1 for p in todos_los_procesos if not p.get("title") or str(p.get("title")).strip() == "")
    nulos_description = sum(1 for p in todos_los_procesos if not p.get("description") or str(p.get("description")).strip() == "")
    nulos_method = sum(1 for p in todos_los_procesos if not p.get("method") or str(p.get("method")).strip() == "")
    monto_cero = sum(1 for p in todos_los_procesos if not p.get("amount") or float(p.get("amount") or 0) == 0.0)

    # 2. Análisis de Proveedores y Fase (search_ocds)
    # En search_ocds, si 'suppliers' está presente y no vacío, indica adjudicación asignada
    adjudicados = []
    abiertos = []
    for p in todos_los_procesos:
        supp = p.get("suppliers")
        if supp and str(supp).strip() not in ("", "None", "null", "[]"):
            adjudicados.append(p)
        else:
            abiertos.append(p)

    # 3. Análisis de Fechas y Frescura
    fechas_validas = []
    for p in todos_los_procesos:
        d_str = p.get("date")
        if d_str:
            try:
                # Formatos comunes: YYYY-MM-DD o ISO
                d_clean = d_str[:10]
                dt = datetime.strptime(d_clean, "%Y-%m-%d")
                fechas_validas.append((dt, d_str, p.get("ocid")))
            except Exception:
                pass

    fechas_validas.sort(key=lambda x: x[0], reverse=True)
    hoy = datetime.now()
    fecha_mas_reciente = fechas_validas[0][0] if fechas_validas else None
    fecha_mas_antigua = fechas_validas[-1][0] if fechas_validas else None
    dias_retraso = (hoy - fecha_mas_reciente).days if fecha_mas_reciente else None

    # 4. Desglose por internal_type y method
    counter_type = Counter(str(p.get("internal_type") or "NO_ESPECIFICADO") for p in todos_los_procesos)
    counter_method = Counter(str(p.get("method") or "NO_ESPECIFICADO") for p in todos_los_procesos)

    # 5. Muestreo Profundo con 'record'
    logger.info(f"\n🔬 Realizando muestreo detallado de {sample_records_count} procesos mediante 'record'...")
    muestra_candidatos = (abiertos[:10] + adjudicados[:10])[:sample_records_count]
    records_auditados = []

    for idx, cand in enumerate(muestra_candidatos, 1):
        ocid = cand.get("ocid")
        if not ocid:
            continue
        try:
            logger.info(f"  [{idx}/{len(muestra_candidatos)}] Consultando record para {ocid}...")
            rec_resp = client.get_record(ocid=ocid)
            
            # Analizar release o record compilado
            releases = rec_resp.get("releases", [])
            compiled = rec_resp.get("compiledRelease", {})
            rel = releases[0] if releases else (compiled if compiled else rec_resp)

            tender = rel.get("tender", {})
            awards = rel.get("awards", [])
            contracts = rel.get("contracts", [])
            parties = rel.get("parties", [])

            t_status = tender.get("status")
            t_period = tender.get("tenderPeriod", {})
            t_end_date = t_period.get("endDate")
            
            records_auditados.append({
                "ocid": ocid,
                "suppliers_in_search": bool(cand.get("suppliers")),
                "tender_status": t_status,
                "tender_end_date": t_end_date,
                "awards_count": len(awards),
                "contracts_count": len(contracts),
                "has_contracts": bool(contracts),
                "parties_count": len(parties)
            })
        except Exception as err:
            logger.warning(f"  Error obteniendo record {ocid}: {err}")

    # Análisis de estados de tender en record
    tender_statuses = Counter(r.get("tender_status") or "no_status" for r in records_auditados)

    resumen = {
        "fecha_auditoria": hoy.isoformat(),
        "año_consultado": year,
        "total_procesos_analizados": total_muestra,
        "frescura": {
            "fecha_mas_reciente": fecha_mas_reciente.strftime("%Y-%m-%d") if fecha_mas_reciente else None,
            "fecha_mas_antigua": fecha_mas_antigua.strftime("%Y-%m-%d") if fecha_mas_antigua else None,
            "dias_diferencia_con_hoy": dias_retraso,
        },
        "clasificacion_fase": {
            "abiertos_sin_proveedor": len(abiertos),
            "pct_abiertos": round((len(abiertos) / total_muestra) * 100, 2) if total_muestra else 0,
            "adjudicados_con_proveedor": len(adjudicados),
            "pct_adjudicados": round((len(adjudicados) / total_muestra) * 100, 2) if total_muestra else 0,
        },
        "campos_nulos": {
            "nulos_title": nulos_title,
            "pct_nulos_title": round((nulos_title / total_muestra) * 100, 2) if total_muestra else 0,
            "nulos_description": nulos_description,
            "pct_nulos_description": round((nulos_description / total_muestra) * 100, 2) if total_muestra else 0,
            "nulos_method": nulos_method,
            "pct_nulos_method": round((nulos_method / total_muestra) * 100, 2) if total_muestra else 0,
            "monto_cero": monto_cero,
            "pct_monto_cero": round((monto_cero / total_muestra) * 100, 2) if total_muestra else 0,
        },
        "top_internal_types": dict(counter_type.most_common(8)),
        "top_methods": dict(counter_method.most_common(8)),
        "detalle_records_auditados": records_auditados,
        "conteo_tender_status_en_records": dict(tender_statuses)
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(resumen, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 70)
    print("📊 REPORTE DE AUDITORÍA EMPÍRICA PRE-VENTA (SERCOP OCDS)")
    print("=" * 70)
    print(f"Año analizado:               {year}")
    print(f"Total registros analizados:  {total_muestra}")
    print(f"Fecha más reciente:          {resumen['frescura']['fecha_mas_reciente']} (Retraso: {dias_retraso} días respecto a hoy)")
    print(f"Procesos Abiertos (sin adj): {resumen['clasificacion_fase']['abiertos_sin_proveedor']} ({resumen['clasificacion_fase']['pct_abiertos']}%)")
    print(f"Procesos Adjudicados:        {resumen['clasificacion_fase']['adjudicados_con_proveedor']} ({resumen['clasificacion_fase']['pct_adjudicados']}%)")
    print("-" * 70)
    print(f"Registros con Title nulo:    {nulos_title} ({resumen['campos_nulos']['pct_nulos_title']}%)")
    print(f"Registros con Desc nula:     {nulos_description} ({resumen['campos_nulos']['pct_nulos_description']}%)")
    print(f"Registros con Monto 0:       {monto_cero} ({resumen['campos_nulos']['pct_monto_cero']}%)")
    print("-" * 70)
    print("Top Modalidades (internal_type):")
    for it, cnt in counter_type.most_common(5):
        print(f"  • {it}: {cnt}")
    print("-" * 70)
    print(f"Muestra de Records detallados ({len(records_auditados)} consultados):")
    for st, cnt in tender_statuses.items():
        print(f"  • tender.status '{st}': {cnt}")
    print(f"\n📁 Resultados completos guardados en: {output_file}")
    print("=" * 70)

    return resumen

def main():
    parser = argparse.ArgumentParser(description="Auditoría empírica de datos SERCOP")
    parser.add_argument("--year", type=int, default=datetime.now().year)
    parser.add_argument("--pages", type=int, default=4)
    parser.add_argument("--records", type=int, default=12)
    parser.add_argument("--output", default="downloads/auditoria_datos.json")
    args = parser.parse_args()

    auditar_datos(
        year=args.year,
        max_pages_per_kw=args.pages,
        sample_records_count=args.records,
        output_file=args.output
    )

if __name__ == "__main__":
    main()
