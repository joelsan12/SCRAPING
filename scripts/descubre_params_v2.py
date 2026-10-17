"""
Descubrimiento de parámetros con el filtro obligatorio 'year':
1. Probar años recientes: 2024, 2025
2. Probar parámetros adicionales: month, page, q, tender_title, description, search
3. Probar endpoint record con el ocid real obtenido
"""

import sys
import time
import json
import httpx

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

BASE_URL = "https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/api"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json",
}

def consultar(endpoint: str, params: dict, nombre: str):
    print(f"\n==========================================")
    print(f"🔬 {nombre}")
    print(f"GET {BASE_URL}/{endpoint} | Params: {params}")
    try:
        with httpx.Client(timeout=20.0, headers=HEADERS) as client:
            resp = client.get(f"{BASE_URL}/{endpoint}", params=params)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 429:
                retry_after = int(resp.headers.get("Retry-After", 12))
                print(f"⚠️ 429 Rate Limit. Esperando {retry_after + 2}s...")
                time.sleep(retry_after + 2)
                resp = client.get(f"{BASE_URL}/{endpoint}", params=params)
                print(f"Reintento Status: {resp.status_code}")
                
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, dict):
                    if "total" in data:
                        print(f"Total: {data.get('total')}, Page: {data.get('page')}, Pages: {data.get('pages')}")
                    if "data" in data and isinstance(data["data"], list):
                        print(f"data count: {len(data['data'])}")
                        for idx, item in enumerate(data["data"][:3]):
                            print(f"  [{idx+1}] {item.get('ocid')} | {item.get('title')} | {item.get('amount')} | {item.get('date')}")
                    elif "releases" in data or "records" in data or "ocid" in data:
                        print(f"Record Keys: {list(data.keys())}")
                        if "releases" in data and data["releases"]:
                            rel = data["releases"][0]
                            print(f"  Release Keys: {list(rel.keys())}")
                            if "tender" in rel:
                                print(f"  Tender Keys: {list(rel['tender'].keys())}")
                return data
            else:
                print(f"Error {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"Excepción: {e}")
    finally:
        time.sleep(3.5)

def main():
    # 1. Probar año 2025
    consultar("search_ocds", {"year": 2025}, "Prueba year=2025")
    
    # 2. Probar year=2024 con month=10
    consultar("search_ocds", {"year": 2024, "month": 10}, "Prueba year=2024, month=10")
    
    # 3. Probar búsqueda de texto: search=cemento
    consultar("search_ocds", {"year": 2024, "search": "cemento"}, "Prueba search=cemento con year=2024")
    
    # 4. Probar búsqueda de texto: tender_title=cemento
    consultar("search_ocds", {"year": 2024, "tender_title": "cemento"}, "Prueba tender_title=cemento con year=2024")
    
    # 5. Probar record con el ocid descubierto
    ocid = "ocds-5wno2w-CE-20240002563993-2711"
    consultar("record", {"ocid": ocid}, f"Detalle de proceso (record) para {ocid}")

if __name__ == "__main__":
    main()
