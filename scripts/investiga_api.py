"""
Investigación profunda de la API OCDS de SERCOP:
1. Consultar CKAN API para ver recursos y documentación del dataset de SERCOP
2. Probar parámetros de search_ocds con años 2023, 2024, 2025
3. Respetar Retry-After si ocurre 429
"""

import sys
import time
import json
import httpx

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json",
}

def consultar(url: str, params: dict = None, nombre: str = ""):
    print(f"\n--- {nombre} ---")
    print(f"GET {url} | Params: {params}")
    try:
        with httpx.Client(timeout=20.0, headers=HEADERS) as client:
            resp = client.get(url, params=params)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 429:
                retry_after = int(resp.headers.get("Retry-After", 12))
                print(f"Rate limited (429)! Esperando {retry_after + 2}s...")
                time.sleep(retry_after + 2)
                resp = client.get(url, params=params)
                print(f"Reintento Status: {resp.status_code}")
            
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, dict):
                    print(f"Keys: {list(data.keys())}")
                    if "total" in data:
                        print(f"Total: {data.get('total')}, Page: {data.get('page')}, Pages: {data.get('pages')}")
                    if "data" in data and isinstance(data["data"], list):
                        print(f"data count: {len(data['data'])}")
                        if len(data["data"]) > 0:
                            print(f"1er elemento keys: {list(data['data'][0].keys())}")
                            print(f"Ejemplo 1er elemento:\n{json.dumps(data['data'][0], indent=2, ensure_ascii=False)[:600]}")
                    elif "result" in data:
                        print(f"CKAN result keys: {list(data['result'].keys())}")
                return data
            else:
                print(f"Error {resp.status_code}: {resp.text[:300]}")
    except Exception as e:
        print(f"Excepción: {e}")
    return None

def main():
    # 1. Consultar CKAN para ver el paquete de SERCOP
    ckan_url = "https://datosabiertos.gob.ec/api/3/action/package_search"
    consultar(ckan_url, {"q": "SERCOP"}, "Búsqueda paquete SERCOP en CKAN")
    time.sleep(3)

    # 2. Probar search_ocds con año 2024
    api_url = "https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/api/search_ocds"
    consultar(api_url, {"year": 2024}, "Prueba year=2024")
    time.sleep(3)

    # 3. Probar search_ocds con rango de fechas 2024
    consultar(api_url, {"date_from": "2024-01-01", "date_to": "2024-01-15"}, "Prueba date_from/to 2024")
    time.sleep(3)

    # 4. Probar búsqueda sin parámetros pero con page=1
    consultar(api_url, {"page": 1}, "Prueba page=1")
    time.sleep(3)

if __name__ == "__main__":
    main()
