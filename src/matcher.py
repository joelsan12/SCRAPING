"""
Motor de coincidencia (Matcher) por rubro y palabras clave.
Evalúa procesos de SERCOP contra perfiles configurados en YAML,
aplicando filtros de monto, región y expresiones normalizadas.
"""

import os
import yaml
import logging
from typing import Dict, List, Optional
from src.models import ProcesoSercop, AlertaMatch
from src.transform import normalizar_texto, calcular_hash_proceso, calcular_diff_precio

logger = logging.getLogger("sercop.matcher")

class Matcher:
    def __init__(self, config_path: str = "config/rubros.yaml"):
        self.config_path = config_path
        self.rubros = self._cargar_config()

    def _cargar_config(self) -> Dict:
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Archivo de configuración no encontrado: {self.config_path}")
            
        with open(self.config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data.get("rubros", {})

    def evaluar_proceso(
        self,
        proceso: ProcesoSercop,
        rubro_key: str,
        monto_anterior: Optional[float] = None
    ) -> Optional[AlertaMatch]:
        """
        Evalúa si un proceso cumple las condiciones de un rubro particular.
        Retorna una instancia de AlertaMatch si coincide, o None.
        """
        perfil = self.rubros.get(rubro_key)
        if not perfil:
            logger.warning(f"Rubro '{rubro_key}' no definido en configuración.")
            return None

        # 1. Filtro de monto mínimo
        monto_minimo = float(perfil.get("monto_minimo", 0.0))
        if proceso.amount < monto_minimo:
            return None

        # 2. Filtro de regiones de interés (si está configurado)
        regiones_filtro = [r.upper() for r in perfil.get("regiones_interes", [])]
        if regiones_filtro:
            region_proceso = (proceso.region or "").upper()
            if not any(rf in region_proceso for rf in regiones_filtro):
                return None

        # 3. Normalizar textos para matching sin diacríticos
        texto_analizar = f"{proceso.title} {proceso.description or ''}"
        texto_norm = normalizar_texto(texto_analizar, sin_tildes=True)

        keywords_detectadas = []
        for kw in perfil.get("keywords", []):
            kw_norm = normalizar_texto(kw, sin_tildes=True)
            if kw_norm in texto_norm:
                keywords_detectadas.append(kw)

        if not keywords_detectadas:
            return None

        # 4. Calcular hash y variación de precio si hubo versión anterior
        hash_actual = calcular_hash_proceso(proceso)
        p_ant, var_pct = calcular_diff_precio(proceso.amount, monto_anterior)

        return AlertaMatch(
            ocid=proceso.ocid,
            rubro=perfil.get("nombre", rubro_key),
            fase=proceso.fase,
            title=proceso.title,
            description=proceso.description or "",
            buyer=proceso.buyer or "Entidad Pública",
            region=proceso.region or "Ecuador",
            amount=proceso.amount,
            precio_anterior=p_ant,
            variacion_pct=var_pct,
            keywords_detectadas=keywords_detectadas,
            fecha_proceso=proceso.date,
            hash_proceso=hash_actual,
            url_portal=proceso.url_portal,
        )
