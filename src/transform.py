"""
Módulo de transformación, normalización y cálculo de hash diff.
Garantiza:
- Normalización Unicode (NFKC) y limpieza de cadenas.
- Hashing criptográfico SHA-256 de campos clave para evitar alertas duplicadas.
- Cálculo de variaciones porcentuales de montos (diffs).
"""

import unicodedata
import hashlib
from typing import Tuple, Optional
from src.models import ProcesoSercop

def normalizar_texto(texto: Optional[str], sin_tildes: bool = False) -> str:
    """
    Normaliza una cadena a NFKC, elimina espacios redundantes y pasa a minúsculas.
    Si sin_tildes es True, remueve diacríticos para búsquedas flexibles.
    """
    if not texto:
        return ""
    
    # 1. NFKC estándar
    normalizado = unicodedata.normalize("NFKC", str(texto)).strip().lower()
    
    # 2. Remover acentos si se requiere para matching de keywords
    if sin_tildes:
        nfkd = unicodedata.normalize("NFKD", normalizado)
        normalizado = "".join(c for c in nfkd if not unicodedata.combining(c))
        
    # 3. Colapsar espacios múltiples
    return " ".join(normalizado.split())

def calcular_hash_proceso(proceso: ProcesoSercop) -> str:
    """
    Calcula un hash SHA-256 determinista a partir de los campos clave del proceso.
    Si el proveedor, monto o descripción cambian en una actualización, el hash cambia.
    """
    ocid_norm = normalizar_texto(proceso.ocid)
    title_norm = normalizar_texto(proceso.title)
    buyer_norm = normalizar_texto(proceso.buyer)
    monto_formateado = f"{proceso.amount:.2f}"
    method_norm = normalizar_texto(proceso.method)
    
    # Construcción de payload canónico
    payload = f"{ocid_norm}|{title_norm}|{buyer_norm}|{monto_formateado}|{method_norm}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def calcular_diff_precio(monto_actual: float, monto_anterior: Optional[float]) -> Tuple[Optional[float], Optional[float]]:
    """
    Calcula el precio anterior y la variación porcentual entre dos versiones.
    Retorna (precio_anterior, variacion_pct).
    """
    if monto_anterior is None:
        return None, None
    
    if monto_anterior == 0.0:
        variacion = 0.0 if monto_actual == 0.0 else 100.0
        return monto_anterior, variacion
        
    variacion = ((monto_actual - monto_anterior) / monto_anterior) * 100.0
    return monto_anterior, round(variacion, 2)
