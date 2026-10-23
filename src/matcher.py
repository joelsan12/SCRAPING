"""
Motor de coincidencia (Matcher) por rubro y palabras clave.
Evalúa procesos de SERCOP contra perfiles configurados en YAML,
aplicando filtros de monto, región y expresiones normalizadas.

Soporte Híbrido: Firestore (cloud) -> YAML (local).
Si hay configuración de Firestore activa, sus filtros sobrescriben
el catálogo base. Si falla la red o no hay datos, usa YAML.
"""

import os
import yaml
import logging
import httpx
from typing import Dict, List, Optional
from src.models import ProcesoSercop, AlertaMatch
from src.transform import normalizar_texto, calcular_hash_proceso, calcular_diff_precio

logger = logging.getLogger("sercop.matcher")

# --- Configuración Firestore ---
# Intenta cargar FIREBASE_PROJECT_ID del entorno. Si no está definido,
# el matcher funcionará con YAML puro (modo seguro).
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
# Endpoint base para Firestore REST API (v1)
FIRESTORE_BASE_URL = "https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents"


class Matcher:
    def __init__(self, config_path: str = "config/rubros.yaml", project_id_firestore: Optional[str] = None):
        self.config_path = config_path
        # Si no se pasa project_id_firestore por parámetro, usar el del entorno
        self.project_id = project_id_firestore or os.getenv("FIREBASE_PROJECT_ID")
        self.rubros = self._cargar_config()

    def _obtener_filtros_firestore(self):
        """Intenta leer filtros CPC desde Firestore REST API."""
        if not self.project_id:
            return None

        # Documento de ejemplo: /users/user_01
        # En producción, esto sería dinámico según el usuario logueado.
        document_path = f"users/user_01"
        url = f"{FIRESTORE_BASE_URL}/projects/{self.project_id}/databases/(default)/documents/{document_path}?key=dummy"

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    fields = data.get("documents", [{}])[0].get("fields", {})
                    keywords = self._leer_lista(fields.get("cpcFilters", {}).get("keywords"))
                    monto_minimo = self._leer_numero(fields.get("cpcFilters", {}).get("monto_minimo"))
                    regiones = self._leer_lista(fields.get("cpcFilters", {}).get("regiones"))

                    if keywords or monto_minimo or regiones:
                        logger.info("Filtros cargados desde Firestore")
                        return {
                            "keywords": keywords or [],
                            "monto_minimo": monto_minimo or 0.0,
                            "regiones": regiones or [],
                        }
                # Si no es 200, cae en retorno None al final
        except Exception as e:
            logger.debug(f"Error accediendo Firestore: {e}, usaré YAML")

        return None

    @staticmethod
    def _leer_lista(valor) -> List:
        if isinstance(valor, list):
            return [str(v).lower() for v in valor]
        return []

    @staticmethod
    def _leer_numero(valor) -> float:
        try:
            return float(valor)
        except (TypeError, ValueError):
            return 0.0

    def _cargar_config(self) -> Dict:
        """Cargar configuración híbrida: Firestore primero, fallback YAML."""
        # 1. Intentar cargar filtros desde Firestore
        if self.project_id:
            filtros_firestore = self._obtener_filtros_firestore()
            if filtros_firestore:
                # Cargar YAML tradicional y sobreecribir sus filtros con los de Firestore
                if not os.path.exists(self.config_path):
                    raise FileNotFoundError(f"Archivo de configuración no encontrado: {self.config_path}")

                with open(self.config_path, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    rubros = data.get("rubros", {})

                    # Tomar el primer rubro del YAML (ej. 'ferreteria_construccion')
                    # y sustituir sus filtros con los de Firestore
                    if rubros:
                        primer_rubro_key = list(rubros.keys())[0]
                        rubro_base = rubros[primer_rubro_key]
                        # Crear perfil híbrido: nombre indica que viene de Firestore
                        rubros[primer_rubro_key] = {
                            "nombre": "Filtros Descentralizados (Firestore)",
                            "monto_minimo": filtros_firestore["monto_minimo"],
                            "regiones_interes": filtros_firestore["regiones"],
                            "keywords": filtros_firestore["keywords"],
                        }
                        logger.info("Configuración híbrida activada: YAML base + filtros Firestore")
                        return rubros

        # 2. Fallback: Cargar YAML tradicional (sin Firestore)
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
        # Intentar obtener perfil: primero el "default" híbrido si existe,
        # sino el rubro correspondiente del YAML
        perfil = self.rubros.get("default") or self.rubros.get(rubro_key)

        if not perfil:
            # Si no hubo híbrido (ni project_id ni Firestore con datos), cargar YAML tradicional
            if not os.path.exists(self.config_path):
                raise FileNotFoundError(f"Archivo de configuración no encontrado: {self.config_path}")

            with open(self.config_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                # Buscar el rubro por la clave proporcionada (ej. 'ferreteria_construccion')
                perfil = data.get("rubros", {}).get(rubro_key)

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
        keywords_base = list(perfil.get("keywords", []))

        for kw in keywords_base:
            kw_norm = normalizar_texto(kw, sin_tildes=True)
            if kw_norm in texto_norm:
                keywords_detectadas.append(kw)

        if not keywords_detectadas:
            return None

        # 3. Calcular hash y variación de precio si hubo versión anterior
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