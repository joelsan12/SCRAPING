"""
Script de sondeo empírico para la API OCDS de SERCOP (Ecuador).
Prueba parámetros válidos, verifica límites de tasa (429) y analiza
la estructura real de los datos devueltos por search_ocds y record.
"""

import sys
import time
import json
import httpx
from datetime import datetime, timedelta

# Asegurar compatibilidad UTF-8 en Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")


BASE_URL = "https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/api"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
}

def probar_endpoint(nombre_prueba: str, endpoint: str, params: dict, pausa: float = 3.0):
    print(f"\n{'='*70}")
    print(f"🔬 Prueba: {nombre_prueba}")
    print(f"URL: {BASE_URL}/{endpoint}")
    print(f"Parámetros: {json.dumps(params, ensure_ascii=False)}")
    print(f"{'='*70}")
    
    t0 = time.time()
    try:
        with httpx.Client(timeout=15.0, headers=HEADERS) as client:
            resp = client.get(f"{BASE_URL}/{endpoint}", params=params)
            elapsed = time.time() - t0
            
            print(f"Status Code: {resp.status_code} ({elapsed:.2f}s)")
            print(f"Headers clave: Content-Type={resp.headers.get('content-type')}, Retry-After={resp.headers.get('retry-after')}")
            
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    if isinstance(data, dict):
                        print(f"Claves principales del JSON: {list(data.keys())}")
                        # Ver conteo o resultados
                        for k, v in data.items():
                            if isinstance(v, list):
                                print(f"  - Lista '{k}': {len(v)} elementos")
                                if v:
                                    print(f"  - Estructura del primer elemento: {list(v[0].keys()) if isinstance(v[0], dict) else type(v[0])}")
                                    print(f"  - Muestra del 1er elemento: {json.dumps(v[0], indent=2, ensure_ascii=False)[:350]}...")
                            elif not isinstance(v, (dict, list)):
                                print(f"  - {k}: {v}")
                    elif isinstance(data, list):
                        print(f"Respuesta es una lista de {len(data)} elementos")
                        if data:
                            print(f"Campos del 1er elemento: {list(data[0].keys()) if isinstance(data[0], dict) else type(data[0])}")
                            print(f"Muestra: {json.dumps(data[0], indent=2, ensure_ascii=False)[:350]}...")
                except Exception as e:
                    print(f"Error parseando JSON: {e}")
                    print(f"Snippet respuesta texto: {resp.text[:300]}")
            elif resp.status_code == 429:
                print("⚠️ RATE LIMIT DETECTADO (HTTP 429). El servidor exige pausas mayores.")
            else:
                print(f"Respuesta no esperada: {resp.status_code}")
                print(resp.text[:300])
                
    except Exception as exc:
        print(f"Error en la petición: {exc}")
        
    print(f"Pausa de seguridad de {pausa}s...")
    time.sleep(pausa)

def main():
    print("Iniciando sondeo empírico de SERCOP API...")
    
    # 1. Consulta básica sin filtros
    probar_endpoint(
        nombre_prueba="1. Consulta genérica search_ocds",
        endpoint="search_ocds",
        params={},
        pausa=3.5
    )
    
    # 2. Búsqueda por texto (tender_title o q)
    probar_endpoint(
        nombre_prueba="2. Filtro por palabra clave (cemento)",
        endpoint="search_ocds",
        params={"tender_title": "cemento"},
        pausa=3.5
    )

    # 3. Búsqueda por parámetro q general
    probar_endpoint(
        nombre_prueba="3. Filtro por parámetro q=cemento",
        endpoint="search_ocds",
        params={"q": "cemento"},
        pausa=3.5
    )
    
    # 4. Filtro por fechas
    hoy = datetime.now()
    hace_3_dias = hoy - timedelta(days=3)
    probar_endpoint(
        nombre_prueba="4. Filtro por rango de fechas recientes",
        endpoint="search_ocds",
        params={
            "date_from": hace_3_dias.strftime("%Y-%m-%d"),
            "date_to": hoy.strftime("%Y-%m-%d"),
            "tender_title": "construccion"
        },
        pausa=3.5
    )

    # 5. Obtener un registro detallado de ejemplo (record)
    # ocid de prueba típico ecuatoriano si está disponible
    probar_endpoint(
        nombre_prueba="5. Detalle de proceso (record)",
        endpoint="record",
        params={"ocid": "ocds-5wno2d-RE-EEQ-001-2024"},
        pausa=2.0
    )

if __name__ == "__main__":
    main()
